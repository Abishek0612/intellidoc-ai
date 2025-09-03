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

      const emptyParagraph = schema.nodes.paragraph.create();

      let tr = state.tr.insert(pos, autoPageBreak);
      tr = tr.insert(pos + autoPageBreak.nodeSize, emptyParagraph);

      const newCursorPos = pos + autoPageBreak.nodeSize + 1;

      for (let i = 0; i < 6; i++) {
        const extraPara = schema.nodes.paragraph.create();
        tr = tr.insert(tr.doc.content.size, extraPara);
      }

      tr = tr.setSelection(TextSelection.create(tr.doc, newCursorPos));
      dispatch(tr);

      setTimeout(() => {
        const currentState = view.state;
        const finalCursorPos = Math.min(
          newCursorPos,
          currentState.doc.content.size - 1
        );

        if (finalCursorPos > 0) {
          const finalTr = currentState.tr.setSelection(
            TextSelection.create(currentState.doc, finalCursorPos)
          );
          view.dispatch(finalTr);
        }

        view.focus();

        setTimeout(() => {
          const scrollContainer = view.dom.closest(".editor-scroll-container");
          if (scrollContainer) {
            const currentPage = Math.floor(pos / USABLE_HEIGHT);
            const nextPageTop = (currentPage + 1) * (PAGE_HEIGHT + 24);
            scrollContainer.scrollTo({
              top: nextPageTop,
              behavior: "smooth",
            });
          }
        }, 100);
      }, 50);

      return true;
    };

    const isPositionInRestrictedArea = (doc: any, pos: number): boolean => {
      if (pos <= 0) return false;

      let isRestricted = false;
      let searchStart = Math.max(0, pos - 30);
      let searchEnd = Math.min(doc.content.size, pos + 10);

      doc.nodesBetween(searchStart, searchEnd, (node: any, nodePos: number) => {
        if (node.type.name === "pageBreak" && node.attrs.type === "automatic") {
          const breakStart = nodePos;
          const breakEnd = nodePos + node.nodeSize;

          if (pos >= breakStart - 5 && pos <= breakEnd + 5) {
            isRestricted = true;
            return false;
          }
        }
      });

      return isRestricted;
    };

    const findNextValidPosition = (doc: any, currentPos: number): number => {
      let validPos = currentPos;
      let searchStart = currentPos;

      doc.nodesBetween(
        searchStart,
        doc.content.size,
        (node: any, nodePos: number) => {
          if (node.type.name === "paragraph") {
            const paragraphStart = nodePos;
            let isAfterAutoBreak = false;

            doc.nodesBetween(
              Math.max(0, paragraphStart - 20),
              paragraphStart,
              (prevNode: any) => {
                if (
                  prevNode.type.name === "pageBreak" &&
                  prevNode.attrs.type === "automatic"
                ) {
                  isAfterAutoBreak = true;
                  return false;
                }
              }
            );

            if (isAfterAutoBreak && paragraphStart > currentPos) {
              validPos = paragraphStart + 1;
              return false;
            }
          }
        }
      );

      return Math.min(validPos, doc.content.size - 1);
    };

    const moveToNextPage = (view: any, currentPos: number): boolean => {
      const { state } = view;
      const nextPos = findNextValidPosition(state.doc, currentPos);

      if (nextPos !== currentPos && nextPos > 0) {
        const tr = state.tr.setSelection(
          TextSelection.create(state.doc, nextPos)
        );
        view.dispatch(tr);
        view.focus();
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

            if (isPositionInRestrictedArea(state.doc, pos)) {
              event.preventDefault();

              if (event.key === "Backspace" || event.key === "Delete") {
                let autoBreakPos = -1;
                state.doc.nodesBetween(
                  Math.max(0, pos - 30),
                  Math.min(state.doc.content.size, pos + 10),
                  (node: any, nodePos: number) => {
                    if (
                      node.type.name === "pageBreak" &&
                      node.attrs.type === "automatic"
                    ) {
                      autoBreakPos = nodePos;
                      return false;
                    }
                  }
                );

                if (autoBreakPos !== -1) {
                  const node = state.doc.nodeAt(autoBreakPos);
                  if (node) {
                    const tr = state.tr.delete(
                      autoBreakPos,
                      autoBreakPos + node.nodeSize
                    );
                    view.dispatch(tr);
                    return true;
                  }
                }
              } else {
                moveToNextPage(view, pos);
              }
              return true;
            }

            const shouldInsertBreak = checkIfAtPageEnd(view, pos);

            if (
              shouldInsertBreak &&
              (event.key === "Enter" || event.key.length === 1)
            ) {
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

            const { state } = view;

            if (isPositionInRestrictedArea(state.doc, from)) {
              setTimeout(() => moveToNextPage(view, from), 10);
              return true;
            }

            if (
              checkIfAtPageEnd(view, from) &&
              !hasAutoBreakNearPosition(state.doc, from)
            ) {
              setTimeout(() => insertAutomaticPageBreak(view, from), 10);
              return true;
            }

            return false;
          },

          handleClick(view, pos, event) {
            const clickPos = view.posAtCoords({
              left: event.clientX,
              top: event.clientY,
            })?.pos;

            if (
              clickPos &&
              isPositionInRestrictedArea(view.state.doc, clickPos)
            ) {
              event.preventDefault();
              setTimeout(() => moveToNextPage(view, clickPos), 10);
              return true;
            }

            return false;
          },
        },

        view(editorView) {
          let checkTimeout: number | null = null;

          const checkCursorPosition = () => {
            if (checkTimeout) clearTimeout(checkTimeout);

            checkTimeout = window.setTimeout(() => {
              const { state } = editorView;
              const pos = state.selection.from;

              if (isPositionInRestrictedArea(state.doc, pos)) {
                moveToNextPage(editorView, pos);
              }
            }, 100);
          };

          const observer = new MutationObserver(checkCursorPosition);
          observer.observe(editorView.dom, {
            childList: true,
            subtree: true,
            characterData: true,
          });

          editorView.dom.addEventListener("focusin", checkCursorPosition);
          editorView.dom.addEventListener("click", checkCursorPosition);

          return {
            destroy() {
              observer.disconnect();
              if (checkTimeout) clearTimeout(checkTimeout);
              editorView.dom.removeEventListener(
                "focusin",
                checkCursorPosition
              );
              editorView.dom.removeEventListener("click", checkCursorPosition);
            },
          };
        },
      }),
    ];
  },
});
