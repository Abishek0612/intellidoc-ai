import { Node, mergeAttributes } from "@tiptap/core";

export const PageBreak = Node.create({
  name: "pageBreak",

  group: "block",

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        class: "page-break",
        style:
          "page-break-before: always; break-before: page; height: 0; border: none; margin: 0;",
      }),
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
          });
        },
    };
  },
});
