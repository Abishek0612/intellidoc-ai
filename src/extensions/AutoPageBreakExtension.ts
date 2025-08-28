import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";
import { Fragment } from "@tiptap/pm/model";

const AutoPageBreakPlugin = new PluginKey("autoPageBreak");

export const AutoPageBreak = Extension.create({
  name: "autoPageBreak",

  addOptions() {
    return {
      pageHeight: 1123,
      contentHeight: 947,
      enabled: true,
      headerHeight: 40,
      footerHeight: 36,
      marginTop: 76,
      marginBottom: 76,
    };
  },

  addProseMirrorPlugins() {
    const options = this.options;
    const PAGE_HEIGHT = 1123;
    const HEADER_HEIGHT = 40;
    const FOOTER_HEIGHT = 36;
    const MARGIN_TOP = 76;
    const MARGIN_BOTTOM = 76;
    const USABLE_HEIGHT =
      PAGE_HEIGHT - HEADER_HEIGHT - FOOTER_HEIGHT - MARGIN_TOP - MARGIN_BOTTOM;
    const LINE_HEIGHT = 24;
    const MAX_LINES_PER_PAGE = Math.floor(USABLE_HEIGHT / LINE_HEIGHT);

    const checkIfAtPageEnd = (view: any, pos: number): boolean => {
      try {
        const rect = view.coordsAtPos(pos);
        const editorRect = view.dom.getBoundingClientRect();
        const relativeY = rect.bottom - editorRect.top;

        const currentPageNumber = Math.floor(relativeY / PAGE_HEIGHT) + 1;
        const positionInPage = relativeY % PAGE_HEIGHT;
        const pageContentBottom = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;

        return positionInPage >= pageContentBottom - LINE_HEIGHT;
      } catch (error) {
        return false;
      }
    };

    const insertAutomaticPageBreak = (view: any, pos: number): void => {
      const { state, dispatch } = view;
      const { schema } = state;

      if (!schema.nodes.pageBreak) return;

      const autoPageBreak = schema.nodes.pageBreak.create({
        type: "automatic",
      });
      const tr = state.tr.insert(pos, autoPageBreak);

      dispatch(tr.setSelection(TextSelection.create(tr.doc, pos + 1)));

      setTimeout(() => {
        const scrollContainer = view.dom.closest(".editor-scroll-container");
        if (scrollContainer) {
          try {
            const rect = view.coordsAtPos(pos);
            const editorRect = view.dom.getBoundingClientRect();
            const relativeY = rect.bottom - editorRect.top;
            const currentPageNumber = Math.floor(relativeY / PAGE_HEIGHT) + 1;

            scrollContainer.scrollTo({
              top: currentPageNumber * PAGE_HEIGHT,
              behavior: "smooth",
            });
          } catch (error) {
            console.log("Scroll error:", error);
          }
        }
      }, 100);
    };

    const estimateNodeHeight = (node: any): number => {
      if (node.type.name === "paragraph") {
        const textLength = node.textContent.length;
        const lines = Math.max(1, Math.ceil(textLength / 80));
        return lines * LINE_HEIGHT;
      } else if (node.type.name === "heading") {
        return LINE_HEIGHT * 1.5;
      }
      return LINE_HEIGHT;
    };

    const getNodePosition = (pos: number): { y: number } | null => {
      try {
        return { y: pos * 0.5 };
      } catch (e) {
        return null;
      }
    };

    return [
      new Plugin({
        key: AutoPageBreakPlugin,

        props: {
          handleKeyDown(view, event) {
            if (!options.enabled) return false;

            const { state } = view;
            const { selection, doc, schema } = state;

            if (
              [
                "ArrowUp",
                "ArrowDown",
                "ArrowLeft",
                "ArrowRight",
                "Home",
                "End",
                "PageUp",
                "PageDown",
              ].includes(event.key)
            ) {
              return false;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) return false;

            if (selection.empty) {
              const $pos = selection.$anchor;
              const pos = $pos.pos;

              let foundAutoBreak = false;
              let autoBreakPos = -1;

              doc.descendants((node, nodePos) => {
                if (
                  node.type.name === "pageBreak" &&
                  node.attrs.type === "automatic"
                ) {
                  if (nodePos < pos && pos <= nodePos + node.nodeSize + 10) {
                    autoBreakPos = nodePos;
                    foundAutoBreak = true;
                  }
                }
              });

              if (foundAutoBreak) {
                if (event.key === "Backspace" && pos <= autoBreakPos + 2) {
                  event.preventDefault();
                  const tr = state.tr.delete(autoBreakPos, autoBreakPos + 1);
                  view.dispatch(tr);
                  return true;
                }

                if (event.key.length === 1 || event.key === "Enter") {
                  event.preventDefault();
                  return true;
                }
              }
            }

            if (!selection.empty || !schema.nodes.pageBreak) return false;

            const shouldInsertAutoBreak = checkIfAtPageEnd(
              view,
              selection.$anchor.pos
            );

            if (
              shouldInsertAutoBreak &&
              (event.key === "Enter" || event.key.length === 1)
            ) {
              event.preventDefault();
              insertAutomaticPageBreak(view, selection.$anchor.pos);
              return true;
            }

            return false;
          },

          handleTextInput(view, from, to, text) {
            if (!options.enabled) return false;

            const { state } = view;
            const { doc } = state;

            let beforePos = from - 1;
            if (beforePos >= 0) {
              const beforeNode = doc.nodeAt(beforePos);
              if (
                beforeNode &&
                beforeNode.type.name === "pageBreak" &&
                beforeNode.attrs.type === "automatic"
              ) {
                return true;
              }
            }

            const shouldInsertAutoBreak = checkIfAtPageEnd(view, from);
            if (shouldInsertAutoBreak) {
              setTimeout(() => {
                insertAutomaticPageBreak(view, from);
              }, 10);
              return true;
            }

            return false;
          },
        },

        appendTransaction(transactions, oldState, newState) {
          if (!options.enabled) return null;

          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          const { doc, schema } = newState;
          if (!schema.nodes.pageBreak) return null;

          let needsUpdate = false;
          let tr = newState.tr;
          let offset = 0;

          doc.descendants((node, pos) => {
            if (node.isBlock && node.type.name !== "pageBreak") {
              try {
                const nodeEnd = pos + node.nodeSize;
                const nextNode = doc.nodeAt(nodeEnd);

                if (nextNode && nextNode.type.name !== "pageBreak") {
                  const estimatedHeight = estimateNodeHeight(node);
                  const currentPosition = getNodePosition(pos + offset);

                  if (
                    currentPosition &&
                    currentPosition.y + estimatedHeight > USABLE_HEIGHT
                  ) {
                    const autoPageBreak = schema.nodes.pageBreak.create({
                      type: "automatic",
                    });
                    tr = tr.insert(pos + node.nodeSize + offset, autoPageBreak);
                    offset += autoPageBreak.nodeSize;
                    needsUpdate = true;
                  }
                }
              } catch (e) {
                // Skip if position calculation fails
              }
            }
          });

          return needsUpdate ? tr : null;
        },
      }),
    ];
  },
});
