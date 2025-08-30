import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";

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

    const hasAutoBreakNearPosition = (
      doc: any,
      pos: number,
      range: number = 50
    ): boolean => {
      let found = false;
      doc.nodesBetween(
        Math.max(0, pos - range),
        Math.min(doc.content.size, pos + range),
        (node: any) => {
          if (
            node.type.name === "pageBreak" &&
            node.attrs.type === "automatic"
          ) {
            found = true;
            return false;
          }
        }
      );
      return found;
    };

    const getPageNumberFromPosition = (view: any, pos: number): number => {
      try {
        const rect = view.coordsAtPos(pos);
        const editorRect = view.dom.getBoundingClientRect();
        const relativeY = rect.bottom - editorRect.top;
        return Math.floor(relativeY / PAGE_HEIGHT) + 1;
      } catch (error) {
        return 1;
      }
    };

    const checkIfAtPageEnd = (view: any, pos: number): boolean => {
      try {
        const rect = view.coordsAtPos(pos);
        const editorRect = view.dom.getBoundingClientRect();
        const relativeY = rect.bottom - editorRect.top;
        const positionInPage = relativeY % PAGE_HEIGHT;
        const pageContentBottom = PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
        return positionInPage >= pageContentBottom - LINE_HEIGHT * 2;
      } catch (error) {
        return false;
      }
    };

    const insertAutomaticPageBreak = (view: any, pos: number): boolean => {
      const { state, dispatch } = view;
      const { schema, doc } = state;

      if (!schema.nodes.pageBreak) return false;

      if (hasAutoBreakNearPosition(doc, pos)) {
        return false;
      }

      const autoPageBreak = schema.nodes.pageBreak.create({
        type: "automatic",
      });

      const paragraph = schema.nodes.paragraph.create();

      let tr = state.tr.insert(pos, autoPageBreak);
      tr = tr.insert(pos + autoPageBreak.nodeSize, paragraph);

      const extraParagraphs = 30;
      for (let i = 0; i < extraParagraphs; i++) {
        const emptyPara = schema.nodes.paragraph.create();
        tr = tr.insert(tr.doc.content.size, emptyPara);
      }

      const newCursorPos = pos + autoPageBreak.nodeSize + 1;
      tr = tr.setSelection(TextSelection.create(tr.doc, newCursorPos));

      dispatch(tr);

      setTimeout(() => {
        const newState = view.state;
        const cursorTr = newState.tr.setSelection(
          TextSelection.create(newState.doc, newCursorPos)
        );
        view.dispatch(cursorTr);
        view.focus();

        const scrollContainer = view.dom.closest(".editor-scroll-container");
        if (scrollContainer) {
          const currentPage = getPageNumberFromPosition(view, pos);
          const nextPageTop = currentPage * PAGE_HEIGHT;
          scrollContainer.scrollTo({
            top: nextPageTop,
            behavior: "smooth",
          });
        }

        const proseMirrorElement = view.dom as HTMLElement;
        if (proseMirrorElement) {
          const newHeight = Math.max(
            proseMirrorElement.scrollHeight,
            (currentPage + 1) * PAGE_HEIGHT
          );
          proseMirrorElement.style.minHeight = `${newHeight}px`;
        }
      }, 100);

      return true;
    };

    const isPositionAfterAutoBreak = (doc: any, pos: number): boolean => {
      if (pos <= 0) return false;

      let foundAutoBreak = false;
      let checkPos = pos - 1;

      while (checkPos >= 0 && checkPos >= pos - 5) {
        const node = doc.nodeAt(checkPos);
        if (
          node &&
          node.type.name === "pageBreak" &&
          node.attrs.type === "automatic"
        ) {
          foundAutoBreak = true;
          break;
        }
        checkPos--;
      }

      return foundAutoBreak;
    };

    const isInCompletedPage = (view: any, pos: number): boolean => {
      const { doc } = view.state;
      let autoBreakPos = -1;

      doc.nodesBetween(
        Math.max(0, pos - 100),
        pos,
        (node: any, nodePos: number) => {
          if (
            node.type.name === "pageBreak" &&
            node.attrs.type === "automatic"
          ) {
            autoBreakPos = nodePos;
          }
        }
      );

      if (autoBreakPos !== -1 && pos <= autoBreakPos + 2) {
        return true;
      }

      return false;
    };

    return [
      new Plugin({
        key: AutoPageBreakPlugin,

        props: {
          handleKeyDown(view, event) {
            if (!options.enabled) return false;

            const { state } = view;
            const { selection, schema } = state;

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
                "Tab",
              ].includes(event.key)
            ) {
              return false;
            }

            if (event.ctrlKey || event.metaKey || event.altKey) return false;

            if (!selection.empty || !schema.nodes.pageBreak) return false;

            const pos = selection.$anchor.pos;

            if (isInCompletedPage(view, pos)) {
              if (event.key === "Enter" || event.key.length === 1) {
                event.preventDefault();

                const { doc } = state;
                doc.nodesBetween(
                  pos,
                  Math.min(doc.content.size, pos + 100),
                  (node: any, nodePos: number) => {
                    if (node.type.name === "paragraph" && nodePos > pos) {
                      const tr = state.tr.setSelection(
                        TextSelection.create(state.doc, nodePos + 1)
                      );
                      view.dispatch(tr);
                      view.focus();
                      return false;
                    }
                  }
                );

                return true;
              }

              if (event.key === "Backspace") {
                event.preventDefault();
                const { doc } = state;
                let autoBreakPos = -1;

                for (
                  let checkPos = pos - 1;
                  checkPos >= 0 && checkPos >= pos - 5;
                  checkPos--
                ) {
                  const node = doc.nodeAt(checkPos);
                  if (
                    node &&
                    node.type.name === "pageBreak" &&
                    node.attrs.type === "automatic"
                  ) {
                    autoBreakPos = checkPos;
                    break;
                  }
                }

                if (autoBreakPos !== -1) {
                  const node = doc.nodeAt(autoBreakPos);
                  if (node) {
                    const tr = state.tr.delete(
                      autoBreakPos,
                      autoBreakPos + node.nodeSize
                    );
                    view.dispatch(tr);
                    return true;
                  }
                }
              }

              return false;
            }

            const shouldInsertAutoBreak = checkIfAtPageEnd(view, pos);

            if (shouldInsertAutoBreak && event.key === "Enter") {
              if (!hasAutoBreakNearPosition(state.doc, pos)) {
                event.preventDefault();
                insertAutomaticPageBreak(view, pos);
                return true;
              }
            }

            return false;
          },

          handleTextInput(view, from, to, text) {
            if (!options.enabled) return false;

            if (isInCompletedPage(view, from)) {
              const { state } = view;
              const { doc } = state;

              doc.nodesBetween(
                from,
                Math.min(doc.content.size, from + 100),
                (node: any, nodePos: number) => {
                  if (node.type.name === "paragraph" && nodePos > from) {
                    setTimeout(() => {
                      const tr = state.tr.setSelection(
                        TextSelection.create(state.doc, nodePos + 1)
                      );
                      view.dispatch(tr);
                      view.focus();
                    }, 0);
                    return false;
                  }
                }
              );

              return true;
            }

            const shouldInsertAutoBreak = checkIfAtPageEnd(view, from);

            if (
              shouldInsertAutoBreak &&
              !hasAutoBreakNearPosition(view.state.doc, from)
            ) {
              setTimeout(() => {
                insertAutomaticPageBreak(view, from);
              }, 10);
              return true;
            }

            return false;
          },
        },

        appendTransaction(transactions, oldState, newState) {
          return null;
        },
      }),
    ];
  },
});
