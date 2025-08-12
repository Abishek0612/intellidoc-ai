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
import { useApp } from "../../context/AppContext";
import { usePagination } from "../../hooks/usePagination";
import { PageBreak } from "../../extensions/PageBreakExtension";
import { AutoPageBreak } from "../../extensions/AutoPageBreakExtension";
import Toolbar from "./Toolbar";
import DocumentSelector from "./DocumentSelector";
import Ruler from "./Ruler";
import { Document } from "../../types";
import {
  generateDocumentId,
  getWordCount,
  getCharacterCount,
  createDocumentPreview,
} from "../../utils/documentUtils";
import { toast } from "react-toastify";
import "../../styles/editor.css";
import { EditableHeader } from "../../extensions/EditableHeaderExtension";
import { EditableFooter } from "../../extensions/EditableFooterExtension";
import { Edit3, Check, X, Sliders } from "lucide-react";

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
    return { types: ["textStyle"] };
  },
  addGlobalAttributes() {
    return [
      {
        types: this.options.types,
        attributes: {
          fontSize: {
            default: null,
            parseHTML: (el: HTMLElement) =>
              el.style.fontSize?.replace(/['"]+/g, "") || null,
            renderHTML: (attrs: { fontSize?: string }) =>
              attrs.fontSize
                ? { style: `font-size:${attrs.fontSize} !important` }
                : {},
          },
        },
      },
    ];
  },
  addCommands() {
    return {
      setFontSize:
        (fontSize: string) =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize }).run(),
      unsetFontSize:
        () =>
        ({ chain }) =>
          chain().setMark("textStyle", { fontSize: null }).run(),
    };
  },
});

const Watermark: React.FC<{
  text?: string;
  opacity?: number;
  visible?: boolean;
  watermarkData?: {
    enabled: boolean;
    text?: string;
    opacity?: number;
  };
}> = ({
  text = "This is a watermark",
  opacity = 0.08,
  visible = false,
  watermarkData,
}) => {
  const finalText = watermarkData?.text || text;
  const finalOpacity = watermarkData?.opacity || opacity;
  const isVisible = visible || (watermarkData?.enabled && visible);

  if (!isVisible) return null;

  return (
    <div
      className="document-watermark"
      style={{
        position: "absolute",
        top: "50%",
        left: "50%",
        transform: "translate(-50%,-50%) rotate(-45deg)",
        fontSize: "48px",
        fontWeight: "300",
        color: "#999",
        opacity: finalOpacity,
        pointerEvents: "none",
        userSelect: "none",
        zIndex: 0,
        fontFamily: "Arial, sans-serif",
        whiteSpace: "nowrap",
        letterSpacing: "6px",
      }}
    >
      {finalText}
    </div>
  );
};

const LiveStats: React.FC<{
  words: number;
  characters: number;
  currentPage: number;
  totalPages: number;
}> = ({ words, characters, currentPage, totalPages }) => {
  const [t, setT] = useState(new Date());
  useEffect(
    () => setT(new Date()),
    [words, characters, currentPage, totalPages]
  );
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
        <span>Updated {t.toLocaleTimeString()}</span>
      </div>
    </div>
  );
};

const WatermarkEditor: React.FC<{
  visible: boolean;
  text: string;
  opacity: number;
  watermarkEnabled: boolean;
  onTextChange: (text: string) => void;
  onOpacityChange: (opacity: number) => void;
  onSave: (wasEnabled: boolean) => void;
  onClose: () => void;
}> = ({
  visible,
  text,
  opacity,
  watermarkEnabled,
  onTextChange,
  onOpacityChange,
  onSave,
  onClose,
}) => {
  const [localText, setLocalText] = useState(text);
  const [localOpacity, setLocalOpacity] = useState(opacity);

  useEffect(() => {
    setLocalText(text);
    setLocalOpacity(opacity);
  }, [text, opacity]);

  const handleSave = () => {
    onTextChange(localText);
    onOpacityChange(localOpacity);
    onSave(watermarkEnabled);
    onClose();
  };

  const handleCancel = () => {
    setLocalText(text);
    setLocalOpacity(opacity);
    onClose();
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 w-96 shadow-xl">
        <h3 className="text-lg font-semibold mb-4">Edit Watermark</h3>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Watermark Text
            </label>
            <input
              type="text"
              value={localText}
              onChange={(e) => setLocalText(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter watermark text"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Opacity: {Math.round(localOpacity * 100)}%
            </label>
            <input
              type="range"
              min="0.02"
              max="0.3"
              step="0.01"
              value={localOpacity}
              onChange={(e) => setLocalOpacity(parseFloat(e.target.value))}
              className="w-full"
            />
          </div>

          <div className="bg-gray-100 p-4 rounded-lg relative overflow-hidden">
            <div className="text-xs text-gray-600 mb-2">Preview:</div>
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                transform: "translate(-50%, -50%) rotate(-45deg)",
                fontSize: "16px",
                fontWeight: "300",
                color: "#999",
                opacity: localOpacity,
                pointerEvents: "none",
                userSelect: "none",
                whiteSpace: "nowrap",
                letterSpacing: "2px",
              }}
            >
              {localText}
            </div>
            <div className="h-16"></div>
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <button
            onClick={handleCancel}
            className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors"
          >
            Save
          </button>
        </div>
      </div>
    </div>
  );
};

const PAGE_WIDTH = 794;
const PAGE_HEIGHT = 1123;
const HEADER_H = 40;
const FOOTER_H = 36;
const PAGE_GAP = 24;
const DEFAULT_MARGIN = 76;

const AdvancedDocumentEditor: React.FC = () => {
  const { state, dispatch } = useApp();
  const [currentDocument, setCurrentDocument] = useState<Document | null>(null);
  const [showDocumentSelector, setShowDocumentSelector] = useState(false);
  const [title, setTitle] = useState("");
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [showWatermark, setShowWatermark] = useState(false);
  const [showRulers, setShowRulers] = useState(false);
  const [watermarkText, setWatermarkText] = useState("This is a watermark");
  const [watermarkOpacity, setWatermarkOpacity] = useState(0.08);
  const [showWatermarkEditor, setShowWatermarkEditor] = useState(false);
  const [margins, setMargins] = useState({
    left: DEFAULT_MARGIN,
    right: DEFAULT_MARGIN,
    top: DEFAULT_MARGIN,
    bottom: DEFAULT_MARGIN,
  });

  useEffect(() => {
    const savedWatermarkSettings = localStorage.getItem("watermarkSettings");
    if (savedWatermarkSettings) {
      try {
        const settings = JSON.parse(savedWatermarkSettings);
        setWatermarkText(settings.text || "This is a watermark");
        setWatermarkOpacity(settings.opacity || 0.08);
      } catch (error) {
        console.error("Error loading watermark settings:", error);
      }
    }
  }, []);

  const saveWatermarkSettings = useCallback((text: string, opacity: number) => {
    const settings = { text, opacity };
    localStorage.setItem("watermarkSettings", JSON.stringify(settings));
  }, []);

  const extensions = useMemo(
    () => [
      StarterKit.configure({ heading: { levels: [1, 2, 3, 4, 5, 6] } }),
      TextStyle,
      FontSize,
      FontFamily.configure({ types: ["textStyle"] }),
      Color.configure({ types: ["textStyle"] }),
      Underline,
      Link.configure({ openOnClick: false }),
      Image,
      Table.configure({ resizable: true }),
      TableRow,
      TableHeader,
      TableCell,
      TextAlign.configure({ types: ["heading", "paragraph"] }),
      PageBreak,
      AutoPageBreak.configure({
        pageHeight: PAGE_HEIGHT - margins.top - margins.bottom,
        contentHeight:
          PAGE_HEIGHT - HEADER_H - FOOTER_H - margins.top - margins.bottom,
        enabled: true,
      }),
      EditableHeader,
      EditableFooter,
      Placeholder.configure({
        placeholder: ({ node }: { node: any }) =>
          node.type.name === "heading"
            ? "Enter heading..."
            : "Start writing your document...",
        considerAnyAsEmpty: true,
        emptyEditorClass: "is-editor-empty",
      }),
    ],
    [margins]
  );
  const editor = useEditor({
    extensions,
    content: "",
    editorProps: { attributes: { class: "ProseMirror" } },
    onUpdate: ({ editor }) => {
      setCurrentDocument((prevDoc) => {
        if (!prevDoc) return null;
        const content = editor.getHTML();
        return {
          ...prevDoc,
          content,
          lastModified: new Date().toISOString(),
          wordCount: getWordCount(content),
          characterCount: getCharacterCount(content),
          preview: createDocumentPreview(content),
        };
      });
    },
    onCreate: useCallback(
      ({ editor }: { editor: Editor }) => {
        editor.commands.focus();

        setTimeout(() => {
          const proseMirrorElement = editor.view.dom as HTMLElement;

          if (proseMirrorElement) {
            proseMirrorElement.style.paddingLeft = `${margins.left}px`;
            proseMirrorElement.style.paddingRight = `${margins.right}px`;
            proseMirrorElement.style.paddingTop = `${margins.top + HEADER_H}px`;
            proseMirrorElement.style.paddingBottom = `${
              margins.bottom + FOOTER_H
            }px`;
          }
        }, 100);
      },
      [margins]
    ),
  });

  const applyMargins = useCallback(
    (newMargins: typeof margins) => {
      if (editor) {
        const proseMirrorElement = editor.view.dom as HTMLElement;

        if (proseMirrorElement) {
          proseMirrorElement.style.paddingLeft = `${newMargins.left}px`;
          proseMirrorElement.style.paddingRight = `${newMargins.right}px`;
          proseMirrorElement.style.paddingTop = `${
            newMargins.top + HEADER_H
          }px`;
          proseMirrorElement.style.paddingBottom = `${
            newMargins.bottom + FOOTER_H
          }px`;
        }
      }
    },
    [editor]
  );

  const handleMarginsChange = useCallback(
    (newMargins: typeof margins) => {
      setMargins(newMargins);
      applyMargins(newMargins);
    },
    [applyMargins]
  );

  useEffect(() => {
    applyMargins(margins);
  }, [editor, margins, applyMargins]);

  const { currentPage, totalPages, scrollContainerRef } = usePagination(editor);

  const loadDocument = useCallback(
    (doc: Document) => {
      setCurrentDocument(doc);
      setTitle(doc.title);

      if (doc.watermark) {
        setShowWatermark(doc.watermark.enabled);
        setWatermarkText(doc.watermark.text || watermarkText);
        setWatermarkOpacity(doc.watermark.opacity || watermarkOpacity);
      } else {
        setShowWatermark(false);
      }

      if (doc.rulers !== undefined) {
        setShowRulers(doc.rulers);
      }

      if (doc.margins) {
        setMargins(doc.margins);
      } else {
        setMargins({
          left: DEFAULT_MARGIN,
          right: DEFAULT_MARGIN,
          top: DEFAULT_MARGIN,
          bottom: DEFAULT_MARGIN,
        });
      }

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
    [editor, watermarkText, watermarkOpacity]
  );

  const saveDocument = useCallback(() => {
    if (!currentDocument || !editor) return;
    const content = editor.getHTML();
    const updatedDoc: Document = {
      ...currentDocument,
      title: title || "Untitled Document",
      content,
      lastModified: new Date().toISOString(),
      wordCount: getWordCount(content),
      characterCount: getCharacterCount(content),
      preview: createDocumentPreview(content),
      watermark: {
        enabled: showWatermark,
        text: watermarkText,
        opacity: watermarkOpacity,
      },
      rulers: showRulers,
      margins: margins,
    };

    const saved = localStorage.getItem("editorDocuments");
    let documents: Document[] = saved ? JSON.parse(saved) : [];
    const idx = documents.findIndex((d) => d.id === updatedDoc.id);
    if (idx !== -1) documents[idx] = updatedDoc;
    else documents.push(updatedDoc);
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

    toast.success(
      `Document saved with ${showWatermark ? "watermark" : "no watermark"}!`,
      {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
        toastId: "save-success",
      }
    );
  }, [
    currentDocument,
    editor,
    title,
    dispatch,
    showWatermark,
    watermarkText,
    watermarkOpacity,
    showRulers,
    margins,
  ]);

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
      watermark: {
        enabled: false,
        text: watermarkText,
        opacity: watermarkOpacity,
      },
      rulers: false,
      margins: {
        left: DEFAULT_MARGIN,
        right: DEFAULT_MARGIN,
        top: DEFAULT_MARGIN,
        bottom: DEFAULT_MARGIN,
      },
    };
    setCurrentDocument(newDoc);
    setTitle(newDoc.title);
    setShowWatermark(false);
    setShowRulers(false);
    setMargins({
      left: DEFAULT_MARGIN,
      right: DEFAULT_MARGIN,
      top: DEFAULT_MARGIN,
      bottom: DEFAULT_MARGIN,
    });
    if (editor) {
      editor.commands.setContent("");
      setTimeout(() => {
        editor.commands.focus("start");
      }, 100);
    }
    setLastSaved(null);
  }, [editor, watermarkText, watermarkOpacity]);

  const handleDocumentSelect = useCallback(
    (doc: Document) => {
      loadDocument(doc);
      setShowDocumentSelector(false);
    },
    [loadDocument]
  );

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
        const docs: Document[] = JSON.parse(saved);
        if (docs.length > 0) loadDocument(docs[docs.length - 1]);
        else createNewDocument();
      } else {
        createNewDocument();
      }
    }
  }, [state.pageContent, dispatch, loadDocument, createNewDocument]);

  const handleWatermarkTextChange = useCallback(
    (text: string) => {
      setWatermarkText(text);
      saveWatermarkSettings(text, watermarkOpacity);
    },
    [watermarkOpacity, saveWatermarkSettings]
  );

  const handleWatermarkOpacityChange = useCallback(
    (opacity: number) => {
      setWatermarkOpacity(opacity);
      saveWatermarkSettings(watermarkText, opacity);
    },
    [watermarkText, saveWatermarkSettings]
  );

  const handleWatermarkSave = useCallback((wasEnabled: boolean) => {
    setShowWatermark(true);
    if (!wasEnabled) {
      toast.success("Watermark enabled!", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
        autoClose: 2000,
      });
    }
  }, []);

  const handleOpenWatermarkEditor = useCallback(() => {
    setShowWatermarkEditor(true);
  }, []);

  const stats = {
    words: currentDocument?.wordCount || 0,
    characters: currentDocument?.characterCount || 0,
  };

  const visualHeight = useMemo(() => {
    if (totalPages === 1) {
      return PAGE_HEIGHT;
    }
    return PAGE_HEIGHT * totalPages + PAGE_GAP * (totalPages - 1);
  }, [totalPages]);

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
              <div className="flex items-center gap-1">
                <button
                  onClick={() => {
                    setShowWatermark(!showWatermark);
                    toast.info(
                      !showWatermark
                        ? "Watermark enabled"
                        : "Watermark disabled",
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
                  Watermark {currentDocument?.watermark?.enabled ? "✓" : ""}
                </button>
                <button
                  onClick={handleOpenWatermarkEditor}
                  className="p-1 text-gray-500 hover:text-gray-700 transition-colors"
                  title="Edit watermark"
                >
                  <Edit3 className="w-3 h-3" />
                </button>
              </div>
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
                Rulers {currentDocument?.rulers ? "✓" : ""}
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
              <div
                className="ruler-overlay"
                style={{ position: "absolute", top: 0, left: 0, zIndex: 20 }}
              >
                <Ruler
                  width={PAGE_WIDTH}
                  height={visualHeight}
                  marginLeft={margins.left}
                  marginRight={margins.right}
                  marginTop={margins.top}
                  marginBottom={margins.bottom}
                  onMarginsChange={handleMarginsChange}
                />
              </div>
            )}
            <div
              className="page-container"
              style={{
                marginLeft: showRulers ? "30px" : "0",
                marginTop: showRulers ? "30px" : "0",
              }}
            >
              <div className="page-stack" style={{ width: PAGE_WIDTH }}>
                {Array.from({ length: totalPages }).map((_, i) => (
                  <div
                    key={i}
                    className="page-visual-bg"
                    style={{ width: PAGE_WIDTH, height: PAGE_HEIGHT }}
                  >
                    <Watermark
                      visible={showWatermark}
                      watermarkData={{
                        enabled: showWatermark,
                        text: watermarkText,
                        opacity: watermarkOpacity,
                      }}
                    />
                    <div className="page-header">
                      <div className="flex justify-between items-center px-4 py-2 text-xs text-gray-500 border-b border-gray-200">
                        <span className="font-medium truncate">
                          {title || "Untitled Document"}
                        </span>
                        <span>Page {i + 1}</span>
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

                <div
                  className="editor-overlay"
                  style={{ width: PAGE_WIDTH, height: visualHeight }}
                >
                  <EditorContent editor={editor} />
                </div>

                {Array.from({ length: Math.max(0, totalPages - 1) }).map(
                  (_, i) => (
                    <div
                      key={`gap-${i}`}
                      className="page-gap-mask"
                      style={{
                        top: (i + 1) * PAGE_HEIGHT + i * PAGE_GAP,
                        width: PAGE_WIDTH,
                        height: PAGE_GAP,
                      }}
                    />
                  )
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <WatermarkEditor
        visible={showWatermarkEditor}
        text={watermarkText}
        opacity={watermarkOpacity}
        watermarkEnabled={showWatermark}
        onTextChange={handleWatermarkTextChange}
        onOpacityChange={handleWatermarkOpacityChange}
        onSave={handleWatermarkSave}
        onClose={() => setShowWatermarkEditor(false)}
      />
    </div>
  );
};

export default AdvancedDocumentEditor;
