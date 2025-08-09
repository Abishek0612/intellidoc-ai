import { Extension, type CommandProps } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { DecorationSet } from "@tiptap/pm/view";

const AutoPageBreakPlugin = new PluginKey("autoPageBreak");

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    autoPageBreak: {
      enableAutoPageBreak: () => ReturnType;

      disableAutoPageBreak: () => ReturnType;

      checkPageOverflow: () => ReturnType;
    };
  }
}

export const AutoPageBreak = Extension.create<{
  pageHeight: number;
  contentHeight: number;
  enabled: boolean;
}>({
  name: "autoPageBreak",

  addOptions() {
    return {
      pageHeight: 1123,
      contentHeight: 971,
      enabled: false,
    };
  },

  addProseMirrorPlugins() {
    const ext = this;

    const findPageBreakPosition = (view: any, maxHeight: number) => {
      const { doc } = view.state;
      let currentHeight = 0;
      let position = 0;
      let foundPosition = false;

      doc.descendants((node: any, pos: number) => {
        if (foundPosition) return false;

        if (node.type.name === "pageBreak") {
          return true;
        }

        const dom = view.nodeDOM(pos) as HTMLElement | null;
        if (dom && (dom as any).offsetHeight) {
          currentHeight += (dom as any).offsetHeight;
          if (currentHeight > maxHeight) {
            position = pos;
            foundPosition = true;
            return false;
          }
        }
        return true;
      });

      return foundPosition ? position : 0;
    };

    const hasRecentPageBreak = (view: any, position: number) => {
      const { doc } = view.state;
      let hasPageBreak = false;

      doc.nodesBetween(
        Math.max(0, position - 100),
        Math.min(doc.content.size, position + 100),
        (node) => {
          if (node.type.name === "pageBreak") {
            hasPageBreak = true;
            return false;
          }
        }
      );

      return hasPageBreak;
    };

    return [
      new Plugin({
        key: AutoPageBreakPlugin,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, decorationSet) {
            return decorationSet.map(tr.mapping, tr.doc);
          },
        },
        view: (view) => {
          let timeoutId: number | null = null;
          let lastCheckTime = 0;
          let insertionCount = 0;

          const checkPageOverflow = () => {
            const now = Date.now();
            if (now - lastCheckTime < 2000) return;
            if (now - lastCheckTime > 10000) {
              insertionCount = 0;
            }
            lastCheckTime = now;

            if (insertionCount >= 3) return;

            if (!ext.options.enabled) return;

            const { contentHeight } = ext.options;
            const editorElement = view.dom as HTMLElement;
            const currentHeight = editorElement.scrollHeight;

            if (currentHeight > contentHeight) {
              const pageBreakPosition = findPageBreakPosition(
                view,
                contentHeight
              );

              if (
                pageBreakPosition > 0 &&
                !hasRecentPageBreak(view, pageBreakPosition)
              ) {
                try {
                  const schema = view.state.schema;
                  if (schema.nodes.pageBreak) {
                    const tr = view.state.tr.insert(
                      pageBreakPosition,
                      schema.nodes.pageBreak.create()
                    );
                    view.dispatch(tr);
                    insertionCount++;
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
              timeoutId = window.setTimeout(checkPageOverflow, 1000);
            },
            destroy: () => {
              if (timeoutId) clearTimeout(timeoutId);
            },
          };
        },
        props: {
          decorations(state) {
            return this.getState(state);
          },
        },
      }),
    ];
  },

  addGlobalAttributes() {
    return [
      {
        types: ["paragraph", "heading"],
        attributes: {
          pageNumber: {
            default: 1,
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      enableAutoPageBreak: () => (_: CommandProps) => {
        this.options.enabled = true;
        return true;
      },

      disableAutoPageBreak: () => (_: CommandProps) => {
        this.options.enabled = false;
        return true;
      },

      checkPageOverflow:
        () =>
        ({ editor, view }: CommandProps) => {
          if (!view) return false;

          const { contentHeight } = this.options;
          const editorElement = view.dom as HTMLElement;
          const currentHeight = editorElement.scrollHeight;

          if (currentHeight <= contentHeight) return false;

          const findPageBreakPosition = (view: any, maxHeight: number) => {
            const { doc } = view.state;
            let currentHeight = 0;
            let position = 0;

            doc.descendants((node: any, pos: number) => {
              if (node.type.name === "pageBreak") return true;

              const dom = view.nodeDOM(pos) as HTMLElement | null;
              if (dom && (dom as any).offsetHeight) {
                currentHeight += (dom as any).offsetHeight;
                if (currentHeight > maxHeight) {
                  position = pos;
                  return false;
                }
              }
              return true;
            });

            return position;
          };

          const pageBreakPosition = findPageBreakPosition(view, contentHeight);
          if (pageBreakPosition > 0) {
            return editor
              .chain()
              .focus()
              .insertContentAt(pageBreakPosition, { type: "pageBreak" })
              .run();
          }

          return false;
        },
    };
  },
});
