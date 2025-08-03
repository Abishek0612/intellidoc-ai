import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useEditor, EditorContent, Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import TextAlign from "@tiptap/extension-text-align";
import Color from "@tiptap/extension-color";
import TextStyle from "@tiptap/extension-text-style";
import FontFamily from "@tiptap/extension-font-family";
import Placeholder from "@tiptap/extension-placeholder";
import { Extension, RawCommands } from "@tiptap/core";
import { useApp } from "../../context/AppContext";
import { usePagination } from "../../hooks/usePagination";
import { PageBreak } from "../../extensions/PageBreakExtension";
import Toolbar from "./Toolbar";
import DocumentSelector from "./DocumentSelector";
import { Document } from "../../types";
import {
  generateDocumentId,
  getWordCount,
  getCharacterCount,
  createDocumentPreview,
} from "../../utils/documentUtils";
import { toast } from "react-toastify";
import "../../styles/editor.css";

declare module "@tiptap/core" {
  interface Commands<ReturnType> {
    fontSize: {
      setFontSize: (fontSize: string) => ReturnType;
      unsetFontSize: () => ReturnType;
    };
  }
}

const FontSize = Extension.create({
  name: "fontSize",

  addOptions() {
    return {
      types: ["textStyle"],
    };
  },

  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (element: HTMLElement) => {
              return element.style.fontSize?.replace(/['"]+/g, "") || null;
            },
            renderHTML: (attributes: { fontSize?: string }) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize} !important`,
              };
            },
          },
        },
      },
    ];
  },

  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize }).run();
        },
      unsetFontSize:
        () =>
        ({ chain }) => {
          return chain().setMark("textStyle", { fontSize: null }).run();
        },
    };
  },
});

const AdvancedDocumentEditor: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [title, setTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        heading: {
          levels: [1, 2, 3, 4, 5, 6],
        },
      }),
      TextStyle,
      FontSize,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Color.configure({
        types: ["textStyle"],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({
        types: ["heading", "paragraph"],
      }),
      PageBreak,
      Placeholder.configure({
        placeholder: ({ node }: { node: any }) => {
          if (node.type.name === "heading") {
            return "Enter heading...";
          }
          return "Start writing your document...";
        },
        considerAnyAsEmpty: true,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    []
  );

  const editor = useEditor({
    extensions,
    content: "",
    editorProps: {
      attributes: {
        class: "ProseMirror",
      },
    },
    onUpdate: useCallback(() => {
      if (currentDocument && editor) {
        const content = editor.getHTML();
        setCurrentDocument((prev) =>
          prev
            ? {
                ...prev,
                content: content,
                lastModified: new Date().toISOString(),
                wordCount: getWordCount(content),
                characterCount: getCharacterCount(content),
                preview: createDocumentPreview(content),
              }
            : null
        );
      }
    }, [currentDocument]),
    onCreate: useCallback(({ editor }: { editor: Editor }) => {
      editor.commands.focus();
    }, []),
  });

  const { currentPage, totalPages, scrollContainerRef } = usePagination(editor);

  const loadDocument = useCallback(
    (doc: Document) => {
      setCurrentDocument(doc);
      setTitle(doc.title);
      if (editor) {
        if (
          doc.content &&
          doc.content.trim() !== "" &&
          doc.content !== "<p></p>"
        ) {
          editor.commands.setContent(doc.content);
        } else {
          editor.commands.setContent("");
        }
      }
      setLastSaved(doc.lastModified);
    },
    [editor]
  );

  const createNewDocument = useCallback(() => {
    const newDoc: Document = {
      id: generateDocumentId(),
      title: "Untitled Document",
      content: "",
      type: "document",
      created: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      wordCount: 0,
      characterCount: 0,
      preview: "",
    };

    setCurrentDocument(newDoc);
    setTitle(newDoc.title);
    if (editor) {
      editor.commands.setContent("");
      editor.commands.focus();
    }
    setLastSaved(null);
  }, [editor]);

  const saveDocument = useCallback(() => {
    if (!currentDocument || !editor) return;

    const content = editor.getHTML();
    const updatedDoc: Document = {
      ...currentDocument,
      title: title || "Untitled Document",
      content: content,
      lastModified: new Date().toISOString(),
      wordCount: getWordCount(content),
      characterCount: getCharacterCount(content),
      preview: createDocumentPreview(content),
    };

    const saved = localStorage.getItem("editorDocuments");
    let documents: Document[] = saved ? JSON.parse(saved) : [];

    const existingIndex = documents.findIndex(
      (doc) => doc.id === updatedDoc.id
    );
    if (existingIndex !== -1) {
      documents[existingIndex] = updatedDoc;
    } else {
      documents.push(updatedDoc);
    }

    localStorage.setItem("editorDocuments", JSON.stringify(documents));
    setCurrentDocument(updatedDoc);
    setLastSaved(updatedDoc.lastModified);

    const savedDocument: Document = {
      ...updatedDoc,
      type: "legal-document",
      savedAt: updatedDoc.lastModified,
    };

    dispatch({ type: "SAVE_DOCUMENT", payload: savedDocument });

    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        type: "document",
        title: updatedDoc.title,
        content: updatedDoc.content,
        documentId: updatedDoc.id,
      },
    });

    toast.success("Document saved successfully!", {
      position: window.innerWidth < 768 ? "top-center" : "top-right",
      toastId: "save-success",
    });
  }, [currentDocument, editor, title, dispatch]);

  const handleDocumentSelect = useCallback(
    (doc: Document) => {
      loadDocument(doc);
      setShowDocumentSelector(false);
    },
    [loadDocument]
  );

  const getStats = useCallback(() => {
    if (!currentDocument) return { words: 0, characters: 0 };
    return {
      words: currentDocument.wordCount || 0,
      characters: currentDocument.characterCount || 0,
    };
  }, [currentDocument]);

  useEffect(() => {
    if (
      state.pageContent &&
      (state.pageContent.type === "document" ||
        state.pageContent.type === "legal-document")
    ) {
      loadDocument(state.pageContent);
      dispatch({ type: "CLEAR_PAGE_CONTENT" });
    } else {
      const saved = localStorage.getItem("editorDocuments");
      if (saved) {
        const documents: Document[] = JSON.parse(saved);
        if (documents.length > 0) {
          const lastDoc = documents[documents.length - 1];
          loadDocument(lastDoc);
        } else {
          createNewDocument();
        }
      } else {
        createNewDocument();
      }
    }
  }, [state.pageContent, dispatch, loadDocument, createNewDocument]);

  const stats = getStats();

  return (
    <div className="flex-1 flex h-full bg-gray-50 overflow-hidden">
      {showDocumentSelector && (
        <div className="hidden lg:block">
          <DocumentSelector
            onDocumentSelect={handleDocumentSelect}
            onNewDocument={() => {
              createNewDocument();
              setShowDocumentSelector(false);
            }}
          />
        </div>
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <div className="bg-white border-b border-gray-200 p-2 sm:p-4 flex-shrink-0">
          <div className="flex items-center justify-between mb-2 sm:mb-0">
            <div className="flex items-center gap-2 sm:gap-4 min-w-0 flex-1">
              <button
                onClick={() => setShowDocumentSelector(!showDocumentSelector)}
                className="hidden lg:block px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm transition-colors flex-shrink-0"
              >
                {showDocumentSelector ? "Hide Documents" : "Show Documents"}
              </button>

              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-base sm:text-xl font-bold border-none outline-none bg-transparent min-w-0 flex-1"
                placeholder="Document Title"
              />
            </div>
          </div>

          <div className="flex items-center justify-between text-xs sm:text-sm text-gray-600 mt-2 lg:mt-0">
            <div className="flex items-center gap-2 sm:gap-4">
              <span>{stats.words} words</span>
              <span className="hidden sm:inline">
                {stats.characters} characters
              </span>
              <span>
                Page {currentPage} of {totalPages}
              </span>
              <button
                onClick={() => editor?.chain().focus().insertPageBreak().run()}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600"
              >
                Page Break
              </button>
            </div>
            {lastSaved && (
              <span className="hidden md:inline text-xs">
                Last saved: {new Date(lastSaved).toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        <Toolbar
          editor={editor}
          onSave={saveDocument}
          content={editor?.getHTML() || ""}
          title={title}
        />

        <div
          ref={scrollContainerRef}
          className="editor-scroll-container flex-1 overflow-y-auto"
        >
          <div className="page-stack">
            {Array.from({ length: totalPages }).map((_, i) => (
              <div key={i} className="page-visual-bg" />
            ))}
            <div className="editor-overlay">
              <EditorContent editor={editor} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDocumentEditor;
