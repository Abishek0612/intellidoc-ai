import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Selection } from "@tiptap/pm/state";

const AutoPageBreakPlugin = new PluginKey("autoPageBreak");

export const AutoPageBreak = Extension.create({
  name: "autoPageBreak",

  addOptions() {
    return {
      pageHeight: 1123,
      contentHeight: 947,
      enabled: true,
    };
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: AutoPageBreakPlugin,

        view: (view) => {
          let timeoutId: number | null = null;
          let lastContentLength = 0;

          const checkForPageBreak = () => {
            if (!this.options.enabled) return;

            const { doc, selection } = view.state;
            const currentContentLength = doc.textContent.length;

            if (currentContentLength <= lastContentLength) {
              lastContentLength = currentContentLength;
              return;
            }
            lastContentLength = currentContentLength;

            const editorElement = view.dom as HTMLElement;
            const contentHeight = editorElement.scrollHeight - 228;

            if (contentHeight > this.options.contentHeight) {
              const targetHeight = this.options.contentHeight;
              let insertPos = 0;
              let accumulatedHeight = 0;

              doc.descendants((node, pos) => {
                if (accumulatedHeight >= targetHeight * 0.9) {
                  insertPos = pos;
                  return false;
                }

                if (node.type.name === "paragraph") {
                  accumulatedHeight += 20;
                } else if (node.type.name === "heading") {
                  accumulatedHeight += 30;
                }

                return accumulatedHeight < targetHeight;
              });

              if (insertPos > 0) {
                try {
                  const schema = view.state.schema;
                  if (schema.nodes.pageBreak) {
                    const transaction = view.state.tr
                      .insert(insertPos, schema.nodes.pageBreak.create())
                      .setSelection(
                        Selection.near(view.state.doc.resolve(insertPos + 1))
                      );

                    view.dispatch(transaction);

                    setTimeout(() => {
                      view.focus();
                      const newPos = insertPos + 1;
                      const $pos = view.state.doc.resolve(newPos);
                      const newSelection = Selection.near($pos);
                      view.dispatch(view.state.tr.setSelection(newSelection));
                    }, 100);
                  }
                } catch (error) {
                  console.warn("Auto page break insertion failed:", error);
                }
              }
            }
          };

          return {
            update: () => {
              if (timeoutId) clearTimeout(timeoutId);
              timeoutId = window.setTimeout(checkForPageBreak, 300);
            },
            destroy: () => {
              if (timeoutId) clearTimeout(timeoutId);
            },
          };
        },
      }),
    ];
  },
});
