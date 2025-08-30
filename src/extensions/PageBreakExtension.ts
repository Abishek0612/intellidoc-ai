import { Node, mergeAttributes } from "@tiptap/core";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    pageBreak: {
      insertPageBreak: () => ReturnType;
      insertManualPageBreak: () => ReturnType;
    };
  }
}

export const PageBreak = Node.create({
  name: "pageBreak",

  group: "block",

  atom: true,

  addAttributes() {
    return {
      type: {
        default: "manual",
        parseHTML: (element) =>
          element.getAttribute("data-break-type") || "manual",
        renderHTML: (attributes) => {
          return {
            "data-break-type": attributes.type,
          };
        },
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
        getAttrs: (element) => ({
          type: element.getAttribute("data-break-type") || "manual",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes, node }) {
    const breakType = node.attrs.type || "manual";
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "page-break",
        "data-break-type": breakType,
        class: `page-break page-break-${breakType}`,
        contenteditable: "false",
      }),
    ];
  },

  addCommands() {
    return {
      insertPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent([
            {
              type: this.name,
              attrs: { type: "manual" },
            },
            {
              type: "paragraph",
            },
          ]);
        },
      insertManualPageBreak:
        () =>
        ({ commands }) => {
          return commands.insertContent([
            {
              type: this.name,
              attrs: { type: "manual" },
            },
            {
              type: "paragraph",
            },
          ]);
        },
    };
  },
});
