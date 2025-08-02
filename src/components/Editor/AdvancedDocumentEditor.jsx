import React, { useState, useEffect } from "react";
import { useEditor, EditorContent } from "@tiptap/react";
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
import { Extension } from "@tiptap/core";
import { useApp } from "../../context/AppContext";
import { usePagination } from "../../hooks/usePagination";
import { PageBreak } from "../../extensions/PageBreakExtension";
import Toolbar from "./Toolbar";
import DocumentSelector from "./DocumentSelector";
import PageContainer from "./PageContainer";
import {
  generateDocumentId,
  getWordCount,
  getCharacterCount,
  createDocumentPreview,
} from "../../utils/documentUtils";
import { toast } from "react-toastify";
import "../../styles/editor.css";

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
            parseHTML: (element) => {
              const fontSize = element.style.fontSize;
              return fontSize ? fontSize.replace(/['"]+/g, "") : null;
            },
            renderHTML: (attributes) => {
              if (!attributes.fontSize) {
                return {};
              }
              return {
                style: `font-size: ${attributes.fontSize}`,
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
        (fontSize) =>
        ({ commands }) => {
          return commands.setMark("textStyle", { fontSize });
        },
      unsetFontSize:
        () =>
        ({ commands }) => {
          return commands.setMark("textStyle", { fontSize: null });
        },
    };
  },
});

const AdvancedDocumentEditor = () => {
  const { state, dispatch } = useApp();
  const [currentDocument, setCurrentDocument] = useState(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [title, setTitle] = useState("");
  const [lastSaved, setLastSaved] = useState(null);

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        strike: false,
      }),
      TextStyle,
      FontSize,
      FontFamily.configure({
        types: ["textStyle"],
      }),
      Color,
      Underline,
      Extension.create({
        name: "customStrike",
        addCommands() {
          return {
            toggleStrike:
              () =>
              ({ commands }) => {
                return commands.toggleMark("strike");
              },
          };
        },
      }),
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
        placeholder: ({ node }) => {
          if (node.type.name === "heading") {
            return "Enter heading...";
          }
          return "Start writing your document...";
        },
        considerAnyAsEmpty: true,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    content: "",
    editorProps: {
      attributes: {
        class: "mx-auto focus:outline-none min-h-full p-3 sm:p-6",
      },
    },
    onUpdate: () => {
      if (currentDocument) {
        const content = editor.getHTML();
        setCurrentDocument((prev) => ({
          ...prev,
          content: content,
          lastModified: new Date().toISOString(),
          wordCount: getWordCount(content),
          characterCount: getCharacterCount(content),
          preview: createDocumentPreview(content),
        }));
      }
    },
    onCreate: ({ editor }) => {
      editor.commands.focus();
    },
  });

  const { pages, totalPages } = usePagination(editor);

  useEffect(() => {
    if (
      state.pageContent &&
      (state.pageContent.type === "document" ||
        state.pageContent.type === "legal-document")
    ) {
      loadDocument(state.pageContent);
      dispatch({ type: "CLEAR_PAGE_CONTENT" });
    } else {
      loadLastDocument();
    }
  }, [state.pageContent, dispatch]);

  const loadLastDocument = () => {
    const saved = localStorage.getItem("editorDocuments");
    if (saved) {
      const documents = JSON.parse(saved);
      if (documents.length > 0) {
        const lastDoc = documents[documents.length - 1];
        loadDocument(lastDoc);
      } else {
        createNewDocument();
      }
    } else {
      createNewDocument();
    }
  };

  const loadDocument = (doc) => {
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
  };

  const createNewDocument = () => {
    const newDoc = {
      id: generateDocumentId(),
      title: "Untitled Document",
      content: "",
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
  };

  const saveDocument = () => {
    if (!currentDocument || !editor) return;

    const content = editor.getHTML();
    const updatedDoc = {
      ...currentDocument,
      title: title || "Untitled Document",
      content: content,
      lastModified: new Date().toISOString(),
      wordCount: getWordCount(content),
      characterCount: getCharacterCount(content),
      preview: createDocumentPreview(content),
    };

    const saved = localStorage.getItem("editorDocuments");
    let documents = saved ? JSON.parse(saved) : [];

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

    const savedDocument = {
      id: updatedDoc.id,
      title: updatedDoc.title,
      type: "legal-document",
      content: updatedDoc.content,
      wordCount: updatedDoc.wordCount,
      savedAt: updatedDoc.lastModified,
      lastModified: updatedDoc.lastModified,
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
    });
  };

  const handleDocumentSelect = (doc) => {
    loadDocument(doc);
    setShowDocumentSelector(false);
  };

  const getStats = () => {
    if (!currentDocument) return { words: 0, characters: 0 };
    return {
      words: currentDocument.wordCount || 0,
      characters: currentDocument.characterCount || 0,
    };
  };

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
        {/* Header */}
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
              <span>Page 1 of {totalPages}</span>
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

        <div className="flex-1 overflow-y-auto p-2 sm:p-4 lg:p-8">
          <div className="flex justify-center">
            <div className="w-full max-w-4xl">
              <PageContainer
                pageNumber={1}
                totalPages={totalPages}
                documentTitle={title}
              >
                <EditorContent editor={editor} />
              </PageContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDocumentEditor;
