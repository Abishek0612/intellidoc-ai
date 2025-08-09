import React from "react";
import { Node, mergeAttributes } from "@tiptap/core";
import {
  ReactNodeViewRenderer,
  NodeViewWrapper,
  NodeViewContent,
} from "@tiptap/react";

interface HeaderNodeViewProps {
  node: any;
  updateAttributes: (attrs: any) => void;
  deleteNode: () => void;
}

const HeaderNodeView: React.FC<HeaderNodeViewProps> = ({ node }) => {
  return (
    <NodeViewWrapper className="editable-header">
      <div
        className="header-content"
        style={{
          position: "absolute",
          top: "0",
          left: "0",
          right: "0",
          height: "40px",
          background: "#ffffff",
          border: "1px solid #e5e7eb",
          padding: "8px 16px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          fontSize: "12px",
          color: "#6b7280",
          zIndex: 10,
        }}
      >
        <NodeViewContent className="header-left" />
        <div className="header-right">Page {node.attrs.pageNumber || 1}</div>
      </div>
    </NodeViewWrapper>
  );
};

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    editableHeader: {
      setHeader: (attributes?: {
        pageNumber?: number;
        documentTitle?: string;
      }) => ReturnType;
    };
  }
}

export const EditableHeader = Node.create({
  name: "editableHeader",

  group: "block",

  content: "inline*",

  addAttributes() {
    return {
      pageNumber: {
        default: 1,
      },
      documentTitle: {
        default: "",
      },
    };
  },

  parseHTML() {
    return [
      {
        tag: 'div[data-type="editable-header"]',
      },
    ];
  },

  renderHTML({ HTMLAttributes }) {
    return [
      "div",
      mergeAttributes(HTMLAttributes, {
        "data-type": "editable-header",
        class: "editable-header",
      }),
      0,
    ];
  },

  addNodeView() {
    return ReactNodeViewRenderer(HeaderNodeView);
  },

  addCommands() {
    return {
      setHeader:
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
