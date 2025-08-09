import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

interface FooterNodeViewProps {
  node: any;
  updateAttributes: (attrs: any) => void;
}

const FooterNodeView: React.FC<FooterNodeViewProps> = ({ node }) => {
  return (
    <NodeViewWrapper className="editable-footer">
      <div
        className="footer-content"
        style={{
          position: "absolute",
          bottom: "0",
          left: "0",
          right: "0",
          height: "36px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          padding: "6px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#6b7280",
          zIndex: 10,
        }}
      >
        <NodeViewContent className="footer-left" />
        <div className="footer-right">Page {node.attrs.pageNumber || 1}</div>
      </div>
    </NodeViewWrapper>
  );
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editableFooter: {
      setFooter: (attributes?: { pageNumber?: number }) => ReturnType;
    };
  }
}

export const EditableFooter = Node.create({
  name: "editableFooter",

  group: "block",

  content: "inline*",

  addAttributes() {
    return {
      pageNumber: {
        default: 1,
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="editable-footer"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "editable-footer",
        class: "editable-footer",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(FooterNodeView);
  },

  addCommands() {
    return {
      setFooter:
        (attributes = {}) =>
        ({ commands }) => {
          return commands.insertContent({
            type: this.name,
            attrs: attributes,
          });
        },
    };
  },
});
