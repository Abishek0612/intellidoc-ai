import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { TextSelection } from "@tiptap/pm/state";
import { Fragment, Slice } from "@tiptap/pm/model";

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

    return [
      new Plugin({
        key: AutoPageBreakPlugin,

        props: {
          handleKeyDown(view, event) {
            if (!options.enabled) return false;

            if (event.key === "Backspace" || event.key === "Delete")
              return false;
            if (event.ctrlKey || event.metaKey || event.altKey) return false;

            const { state } = view;
            const { selection, doc, schema } = state;

            if (!selection.empty || !schema.nodes.pageBreak) return false;

            const $pos = selection.$anchor;
            const pos = $pos.pos;

            const pageBreaks: Array<{ pos: number; textBefore: number }> = [];
            let textBeforePos = 0;
            let currentPageTextStart = 0;

            doc.descendants((node, nodePos) => {
              if (node.type.name === "pageBreak") {
                pageBreaks.push({
                  pos: nodePos,
                  textBefore: textBeforePos,
                });
                currentPageTextStart = textBeforePos;
              }
              if (node.isText) {
                textBeforePos += node.text.length;
              }
            });

            let currentPage = 1;
            for (const pageBreak of pageBreaks) {
              if (pos > pageBreak.pos) {
                currentPage++;
                currentPageTextStart = pageBreak.pos + 1;
              }
            }

            const currentPageContent = doc.slice(currentPageTextStart, pos);

            let lineCount = 1;
            let charCount = 0;
            currentPageContent.content.forEach((node) => {
              if (node.isBlock) {
                lineCount++;
                charCount = 0;
              } else if (node.isText) {
                charCount += node.text.length;
                lineCount += Math.floor(charCount / 80);
              }
            });

            const isAtPageLimit = lineCount >= MAX_LINES_PER_PAGE - 1;

            const coords = view.coordsAtPos(pos);
            const editorRect = view.dom.getBoundingClientRect();
            const relativeY = coords.bottom - editorRect.top;
            const pageBottom =
              currentPage * PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
            const distanceFromBottom = pageBottom - relativeY;

            const shouldBreak =
              isAtPageLimit || distanceFromBottom < LINE_HEIGHT;

            if (
              shouldBreak &&
              (event.key === "Enter" || event.key.length === 1)
            ) {
              event.preventDefault();
              event.stopPropagation();

              const { tr } = state;

              const $insertPos = doc.resolve(
                Math.min(pos, doc.content.size - 1)
              );
              let insertPos = pos;

              if ($insertPos.parent.type.name === "paragraph") {
                const parentOffset = $insertPos.parentOffset;
                const parent = $insertPos.parent;

                if (parentOffset < parent.content.size) {
                  const before = parent.cut(0, parentOffset);
                  const after = parent.cut(parentOffset);

                  const beforePara = schema.nodes.paragraph.create(
                    null,
                    before.content
                  );
                  const pageBreak = schema.nodes.pageBreak.create();
                  const afterPara = schema.nodes.paragraph.create(
                    null,
                    after.content
                  );

                  const parentStart = $insertPos.before();
                  const parentEnd = $insertPos.after();

                  const fragment = Fragment.fromArray([
                    beforePara,
                    pageBreak,
                    afterPara,
                  ]);

                  const transaction = tr
                    .replaceRange(
                      parentStart,
                      parentEnd,
                      new Slice(fragment, 0, 0)
                    )
                    .setSelection(
                      TextSelection.create(
                        tr.doc,
                        parentStart + beforePara.nodeSize + 2
                      )
                    );

                  view.dispatch(transaction);

                  setTimeout(() => {
                    const scrollContainer = view.dom.closest(
                      ".editor-scroll-container"
                    );
                    if (scrollContainer) {
                      const newPageTop = currentPage * PAGE_HEIGHT;
                      scrollContainer.scrollTo({
                        top: newPageTop,
                        behavior: "smooth",
                      });
                    }

                    if (event.key.length === 1) {
                      document.execCommand("insertText", false, event.key);
                    }

                    view.focus();
                  }, 50);

                  return true;
                } else {
                  insertPos = $insertPos.after();
                }
              }

              const pageBreak = schema.nodes.pageBreak.create();
              const paragraph = schema.nodes.paragraph.create();

              const transaction = tr
                .insert(insertPos, Fragment.fromArray([pageBreak, paragraph]))
                .setSelection(TextSelection.create(tr.doc, insertPos + 2));

              view.dispatch(transaction);

              setTimeout(() => {
                const scrollContainer = view.dom.closest(
                  ".editor-scroll-container"
                );
                if (scrollContainer) {
                  const newPageTop = currentPage * PAGE_HEIGHT;
                  scrollContainer.scrollTo({
                    top: newPageTop,
                    behavior: "smooth",
                  });
                }

                if (event.key.length === 1) {
                  document.execCommand("insertText", false, event.key);
                }

                view.focus();
              }, 50);

              return true;
            }

            return false;
          },

          handleTextInput(view, from, to, text) {
            if (!options.enabled) return false;

            const { state } = view;
            const { doc, schema } = state;

            if (!schema.nodes.pageBreak) return false;

            const coords = view.coordsAtPos(from);
            const editorRect = view.dom.getBoundingClientRect();
            const relativeY = coords.bottom - editorRect.top;

            let currentPage = 1;
            const pageBreaks: number[] = [];
            doc.descendants((node, pos) => {
              if (node.type.name === "pageBreak") {
                pageBreaks.push(pos);
              }
            });

            for (const breakPos of pageBreaks) {
              if (from > breakPos) currentPage++;
            }

            const pageBottom =
              currentPage * PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
            const distanceFromBottom = pageBottom - relativeY;

            if (distanceFromBottom < LINE_HEIGHT) {
              const $from = doc.resolve(from);
              const { tr } = state;

              const insertPos = $from.after();
              const pageBreak = schema.nodes.pageBreak.create();
              const paragraph = schema.nodes.paragraph.create(
                null,
                schema.text(text)
              );

              const transaction = tr
                .insert(insertPos, Fragment.fromArray([pageBreak, paragraph]))
                .setSelection(
                  TextSelection.create(tr.doc, insertPos + 2 + text.length)
                );

              view.dispatch(transaction);

              setTimeout(() => {
                const scrollContainer = view.dom.closest(
                  ".editor-scroll-container"
                );
                if (scrollContainer) {
                  const newPageTop = currentPage * PAGE_HEIGHT;
                  scrollContainer.scrollTo({
                    top: newPageTop,
                    behavior: "smooth",
                  });
                }
                view.focus();
              }, 50);

              return true;
            }

            return false;
          },
        },

        appendTransaction(transactions, oldState, newState) {
          if (!options.enabled) return null;

          const docChanged = transactions.some((tr) => tr.docChanged);
          if (!docChanged) return null;

          const { selection, doc, schema } = newState;
          if (!schema.nodes.pageBreak) return null;

          const pageBreaks: number[] = [];
          doc.descendants((node, pos) => {
            if (node.type.name === "pageBreak") {
              pageBreaks.push(pos);
            }
          });

          let currentPage = 1;
          let pageStartPos = 0;
          const pos = selection.$anchor.pos;

          for (let i = 0; i < pageBreaks.length; i++) {
            if (pos > pageBreaks[i]) {
              currentPage++;
              pageStartPos = pageBreaks[i] + 1;
            }
          }

          const pageContent = doc.slice(
            pageStartPos,
            Math.min(pos + 100, doc.content.size)
          );
          let estimatedHeight = 0;

          pageContent.content.forEach((node) => {
            if (node.isBlock) {
              estimatedHeight += LINE_HEIGHT;
              if (node.isText) {
                const lines = Math.ceil(node.text.length / 80);
                estimatedHeight += (lines - 1) * LINE_HEIGHT;
              }
            }
          });

          if (
            estimatedHeight > USABLE_HEIGHT &&
            selection.$anchor.parent.content.size > 0
          ) {
            const { tr } = newState;
            const insertPos = selection.$anchor.after();

            if (insertPos < doc.content.size) {
              const pageBreak = schema.nodes.pageBreak.create();
              const paragraph = schema.nodes.paragraph.create();

              return tr
                .insert(insertPos, Fragment.fromArray([pageBreak, paragraph]))
                .setSelection(TextSelection.create(tr.doc, insertPos + 2));
            }
          }

          return null;
        },

        view(editorView) {
          let preventOverflow: (() => void) | null = null;

          preventOverflow = () => {
            const { state } = editorView;
            const { selection, doc } = state;

            if (!selection.empty) return;

            const pos = selection.$anchor.pos;
            const coords = editorView.coordsAtPos(pos);
            const editorRect = editorView.dom.getBoundingClientRect();
            const relativeY = coords.bottom - editorRect.top;

            const pageBreaks: number[] = [];
            doc.descendants((node, nodePos) => {
              if (node.type.name === "pageBreak") {
                pageBreaks.push(nodePos);
              }
            });

            let currentPage = 1;
            for (const breakPos of pageBreaks) {
              if (pos > breakPos) currentPage++;
            }

            const pageBottom =
              currentPage * PAGE_HEIGHT - FOOTER_HEIGHT - MARGIN_BOTTOM;
            const isOverflowing = relativeY > pageBottom;

            if (isOverflowing) {
              const { tr, schema } = state;
              const $pos = doc.resolve(pos);
              const insertPos = $pos.before();

              if (schema.nodes.pageBreak && insertPos > 0) {
                const pageBreak = schema.nodes.pageBreak.create();
                const paragraph = schema.nodes.paragraph.create();

                const transaction = tr
                  .insert(insertPos, Fragment.fromArray([pageBreak, paragraph]))
                  .setSelection(TextSelection.create(tr.doc, insertPos + 2));

                editorView.dispatch(transaction);

                setTimeout(() => {
                  const scrollContainer = editorView.dom.closest(
                    ".editor-scroll-container"
                  );
                  if (scrollContainer) {
                    scrollContainer.scrollTo({
                      top: currentPage * PAGE_HEIGHT,
                      behavior: "smooth",
                    });
                  }
                }, 50);
              }
            }
          };

          const observer = new MutationObserver(() => {
            requestAnimationFrame(preventOverflow!);
          });

          observer.observe(editorView.dom, {
            childList: true,
            subtree: true,
            characterData: true,
          });

          return {
            update() {
              preventOverflow && preventOverflow();
            },

            destroy() {
              observer.disconnect();
            },
          };
        },
      }),
    ];
  },
});
