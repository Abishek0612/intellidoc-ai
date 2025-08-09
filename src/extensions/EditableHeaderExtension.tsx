import React from "react";
import { Node, mergeAttributes, type CommandProps } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editableHeader: {
      insertHeader: (attributes?: Record<string, any>) => ReturnType;
      updateHeader: (attributes: Record<string, any>) => ReturnType;
    };
  }
}

interface HeaderNodeViewProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
}

const HeaderNodeView: React.FC<HeaderNodeViewProps> = ({
  node,
  updateAttributes,
}) => {
  return (
    <NodeViewWrapper className="editable-header-wrapper">
      <div className="editable-header-content">
        <div className="header-left">
          <NodeViewContent
            className="header-text"
            data-placeholder="Document Title"
          />
        </div>
        <div className="header-right">
          <span className="page-number">Page {node.attrs.pageNumber || 1}</span>
        </div>
      </div>
    </NodeViewWrapper>
  );
};

export const EditableHeader = Node.create({
  name: "editableHeader",

  group: "block",

  content: "inline*",

  isolating: true,

  addAttributes() {
    return {
      pageNumber: {
        default: 1,
        renderHTML: (attributes) => ({
          "data-page-number": attributes.pageNumber,
        }),
        parseHTML: (element) =>
          parseInt(element.getAttribute("data-page-number") || "1"),
      },
      documentTitle: {
        default: "",
        renderHTML: (attributes) => ({
          "data-document-title": attributes.documentTitle,
        }),
        parseHTML: (element) =>
          element.getAttribute("data-document-title") || "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="editable-header"]',
        getAttrs: (element) => ({
          pageNumber: parseInt(
            (element as HTMLElement).getAttribute("data-page-number") || "1"
          ),
          documentTitle:
            (element as HTMLElement).getAttribute("data-document-title") || "",
        }),
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "editable-header",
        class: "editable-header-wrapper",
      }),
      [
        "div",
        { class: "editable-header-content" },
        [
          "div",
          { class: "header-left" },
          ["span", { class: "header-text" }, 0],
        ],
        [
          "div",
          { class: "header-right" },
          [
            "span",
            { class: "page-number" },
            `Page ${HTMLAttributes["data-page-number"] || 1}`,
          ],
        ],
      ],
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HeaderNodeView);
  },

  addCommands() {
    return {
      insertHeader:
        (attributes = {}) =>
        ({ commands }: CommandProps) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },

      updateHeader:
        (attributes: Record<string, any>) =>
        ({ commands }: CommandProps) => {
          return commands.updateAttributes(this.name, attributes);
        },
    };
  },
});
