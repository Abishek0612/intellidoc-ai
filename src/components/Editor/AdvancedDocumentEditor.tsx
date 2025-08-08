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
import { Extension } from "@tiptap/core";
import { Plugin, PluginKey } from "@tiptap/pm/state";
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

const Watermark: React.FC<{
  text?: string;
  opacity?: number;
  visible?: boolean;
}> = ({ text = "LEGAL DRAFT", opacity = 0.08, visible = false }) => {
  if (!visible) return null;

  return (
    <div
      className="document-watermark"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%) rotate(-45deg)",
        fontSize: "48px",
        fontWeight: "300",
        color: "#999999",
        opacity: opacity,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 2,
        fontFamily: "Arial, sans-serif",
        whiteSpace: "nowrap",
        letterSpacing: "6px",
      }}
    >
      {text}
    </div>
  );
};

const Ruler: React.FC<{
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  visible?: boolean;
}> = ({
  width,
  height,
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  visible = true,
}) => {
  if (!visible) return null;

  const generateMarks = (length: number, vertical = false) => {
    const marks = [];
    const increment = 20;

    for (let i = 0; i <= length; i += increment) {
      const isMajor = i % 100 === 0;
      marks.push(
        <div
          key={i}
          className={`absolute bg-gray-400 ${
            vertical ? "ruler-vertical" : "ruler-horizontal"
          }`}
          style={{
            [vertical ? "top" : "left"]: `${i}px`,
            [vertical ? "height" : "width"]: isMajor ? "15px" : "8px",
            [vertical ? "width" : "height"]: "1px",
          }}
        />
      );

      if (isMajor && i > 0) {
        marks.push(
          <div
            key={`label-${i}`}
            className="absolute text-xs text-gray-600"
            style={{
              [vertical ? "top" : "left"]: `${i - 10}px`,
              [vertical ? "left" : "top"]: vertical ? "2px" : "16px",
              fontSize: "10px",
            }}
          >
            {Math.round(i / 3.78)}
          </div>
        );
      }
    }
    return marks;
  };

  return (
    <div className="ruler-container">
      <div
        className="absolute top-0 left-0 bg-gray-100 border-b border-gray-300 ruler-horizontal"
        style={{ width: `${width}px`, height: "25px", zIndex: 10 }}
      >
        {generateMarks(width)}
        <div
          className="absolute top-0 bg-blue-400 opacity-70"
          style={{
            left: `${marginLeft}px`,
            width: "2px",
            height: "25px",
          }}
        />
        <div
          className="absolute top-0 bg-blue-400 opacity-70"
          style={{
            left: `${width - marginRight}px`,
            width: "2px",
            height: "25px",
          }}
        />
      </div>

      <div
        className="absolute top-0 left-0 bg-gray-100 border-r border-gray-300 ruler-vertical"
        style={{ width: "25px", height: `${height}px`, zIndex: 10 }}
      >
        {generateMarks(height, true)}
        <div
          className="absolute left-0 bg-blue-400 opacity-70"
          style={{
            top: `${marginTop}px`,
            width: "25px",
            height: "2px",
          }}
        />
        <div
          className="absolute left-0 bg-blue-400 opacity-70"
          style={{
            top: `${height - marginBottom}px`,
            width: "25px",
            height: "2px",
          }}
        />
      </div>

      <div
        className="absolute border border-dashed border-blue-400 opacity-30 pointer-events-none margin-guide"
        style={{
          left: `${marginLeft + 25}px`,
          top: `${marginTop + 25}px`,
          width: `${width - marginLeft - marginRight - 25}px`,
          height: `${height - marginTop - marginBottom - 25}px`,
          zIndex: 5,
        }}
      />
    </div>
  );
};

const LiveStats: React.FC<{
  words: number;
  characters: number;
  currentPage: number;
  totalPages: number;
}> = ({ words, characters, currentPage, totalPages }) => {
  const [updateTime, setUpdateTime] = useState(new Date());

  useEffect(() => {
    setUpdateTime(new Date());
  }, [words, characters, currentPage, totalPages]);

  return (
    <div className="flex items-center gap-2 lg:gap-4 text-xs lg:text-sm text-gray-600">
      <div className="flex items-center gap-1">
        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
        <span className="font-medium">{words}</span>
        <span className="hidden sm:inline">words</span>
        <span className="sm:hidden">w</span>
      </div>
      <div className="hidden sm:flex items-center gap-1">
        <span className="font-medium">{characters}</span>
        <span>characters</span>
      </div>
      <div className="flex items-center gap-1">
        <span className="font-medium">Page {currentPage}</span>
        <span>of {totalPages}</span>
      </div>
      <div className="hidden lg:flex items-center gap-1 text-xs text-gray-500">
        <span>Updated {updateTime.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

const AdvancedDocumentEditor: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [title, setTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showRulers, setShowRulers] = useState(false);

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
              <LiveStats
                words={stats.words}
                characters={stats.characters}
                currentPage={currentPage}
                totalPages={totalPages}
              />
              <button
                onClick={() => editor?.chain().focus().insertPageBreak().run()}
                className="px-2 py-1 bg-blue-500 text-white rounded text-xs hover:bg-blue-600 transition-colors"
              >
                Page Break
              </button>
              <button
                onClick={() => {
                  setShowWatermark(!showWatermark);
                  toast.info(
                    !showWatermark ? "Watermark enabled" : "Watermark disabled",
                    {
                      position:
                        window.innerWidth < 768 ? "top-center" : "top-right",
                      autoClose: 2000,
                    }
                  );
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  showWatermark
                    ? "bg-green-500 text-white hover:bg-green-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Watermark
              </button>
              <button
                onClick={() => {
                  setShowRulers(!showRulers);
                  toast.info(
                    !showRulers ? "Rulers enabled" : "Rulers disabled",
                    {
                      position:
                        window.innerWidth < 768 ? "top-center" : "top-right",
                      autoClose: 2000,
                    }
                  );
                }}
                className={`px-2 py-1 rounded text-xs transition-colors ${
                  showRulers
                    ? "bg-blue-500 text-white hover:bg-blue-600"
                    : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                }`}
              >
                Rulers
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
          <div className="editor-workspace">
            {showRulers && (
              <Ruler
                width={794}
                height={Math.max(1123, 1123 * totalPages)}
                marginLeft={76}
                marginRight={76}
                marginTop={76}
                marginBottom={76}
                visible={showRulers}
              />
            )}

            <div
              className="page-container"
              style={{
                marginLeft: showRulers ? "25px" : "0",
                marginTop: showRulers ? "25px" : "0",
              }}
            >
              <div className="page-stack">
                {Array.from({ length: Math.max(1, totalPages) }).map((_, i) => (
                  <div key={i} className="page-visual-bg">
                    <Watermark
                      text="LEGAL DRAFT"
                      opacity={0.08}
                      visible={showWatermark}
                    />
                    <div className="page-header">
                      <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                        <span className="font-medium truncate">
                          {title || "Untitled Document"}
                        </span>
                        <span>
                          Page {i + 1} of {Math.max(1, totalPages)}
                        </span>
                      </div>
                    </div>
                    <div className="page-footer">
                      <div className="absolute bottom-0 left-0 right-0 flex justify-between items-center px-4 py-2 text-xs text-gray-500 border-t border-gray-200">
                        <span>{new Date().toLocaleDateString()}</span>
                        <span>Page {i + 1}</span>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="editor-overlay">
                  <EditorContent editor={editor} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdvancedDocumentEditor;
