import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
import { Decoration, DecorationSet } from "@tiptap/pm/view";

const AutoPageBreakPlugin = new PluginKey("autoPageBreak");

export const AutoPageBreak = Extension.create({
  name: "autoPageBreak",

  addProseMirrorPlugins() {
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
        view() {
          return {
            update: (view) => {
              this.checkAndInsertPageBreaks(view);
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

  addOptions() {
    return {
      pageHeight: 1123, // A4 height in pixels
      contentHeight: 971, // A4 height minus margins
    };
  },

  addCommands() {
    return {
      checkPageOverflow:
        () =>
        ({ editor, view }) => {
          const { pageHeight, contentHeight } = this.options;
          const editorElement = view.dom;
          const currentHeight = editorElement.scrollHeight;

          if (currentHeight > contentHeight) {
            // Calculate where to insert page break
            const pageBreakPosition = this.findPageBreakPosition(
              view,
              contentHeight
            );
            if (pageBreakPosition > 0) {
              return editor
                .chain()
                .focus()
                .insertContentAt(pageBreakPosition, {
                  type: "pageBreak",
                })
                .run();
            }
          }
          return false;
        },
    };
  },

  findPageBreakPosition(view, maxHeight) {
    const { doc } = view.state;
    let currentHeight = 0;
    let position = 0;

    doc.descendants((node, pos) => {
      const dom = view.nodeDOM(pos);
      if (dom && dom.offsetHeight) {
        currentHeight += dom.offsetHeight;
        if (currentHeight > maxHeight) {
          position = pos;
          return false;
        }
      }
    });

    return position;
  },
});
