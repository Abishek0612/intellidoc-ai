import React, { useEffect, useRef, useState } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Palette,
  Underline,
  Search,
  Copy,
  RotateCw,
  Plus,
  X,
  Save,
} from "lucide-react";
import { useGemini } from "../../hooks/useGemini";
import { useApp } from "../../context/AppContext";
import { toast } from "react-toastify";

interface SimpleTextModalProps {
  editor: Editor | null;
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

const SimpleTextModal: React.FC<SimpleTextModalProps> = ({
  editor,
  visible,
  position,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);
  const [showReplaceInput, setShowReplaceInput] = useState(false);
  const [showAddInput, setShowAddInput] = useState(false);
  const [showResearchResults, setShowResearchResults] = useState(false);
  const [replaceText, setReplaceText] = useState("");
  const [addText, setAddText] = useState("");
  const [isResearching, setIsResearching] = useState(false);
  const [researchQuery, setResearchQuery] = useState("");
  const [researchResults, setResearchResults] = useState("");
  const { generate } = useGemini();
  const { dispatch } = useApp();

  const getSelectedText = () => {
    if (!editor) return "";
    const { from, to } = editor.state.selection;
    return editor.state.doc.textBetween(from, to);
  };

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
        resetModal();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [visible, onClose]);

  const resetModal = () => {
    setShowReplaceInput(false);
    setShowAddInput(false);
    setShowResearchResults(false);
    setReplaceText("");
    setAddText("");
    setResearchQuery("");
    setResearchResults("");
  };

  const handleResearch = async () => {
    const selectedText = getSelectedText();
    if (!selectedText.trim()) {
      toast.warning("Please select text to research");
      return;
    }

    setIsResearching(true);
    setResearchQuery(selectedText.trim());
    setShowResearchResults(true);
    setShowReplaceInput(false);
    setShowAddInput(false);

    try {
      const prompt = `Research and provide comprehensive information about: ${selectedText.trim()}. Include key facts, recent developments, and practical insights.`;
      const response = await generate(prompt, { maxTokens: 500 });
      setResearchResults(response);
    } catch (error) {
      toast.error("Research failed. Please try again.");
      setShowResearchResults(false);
    } finally {
      setIsResearching(false);
    }
  };

  const handleSaveResearch = () => {
    if (!researchResults.trim()) {
      toast.warning("No research results to save");
      return;
    }

    const researchDocument = {
      title: `Research: ${researchQuery}`,
      type: "research" as const,
      query: researchQuery,
      result: researchResults,
      content: researchResults,
      wordCount: researchResults.split(" ").length,
      created: new Date().toISOString(),
      characterCount: researchResults.length,
      preview: researchResults.substring(0, 150),
    };

    dispatch({
      type: "SAVE_DOCUMENT",
      payload: {
        ...researchDocument,
        id: Date.now().toString(),
        lastModified: new Date().toISOString(),
      },
    });

    toast.success("Research saved as document!");
  };

  const handleCopyResearch = async () => {
    if (!researchResults.trim()) {
      toast.warning("No research results to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(researchResults);
      toast.success("Research results copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy research results");
    }
  };

  const handleCopy = async () => {
    const selectedText = getSelectedText();
    if (!selectedText.trim()) {
      toast.warning("Please select text to copy");
      return;
    }

    try {
      await navigator.clipboard.writeText(selectedText);
      toast.success("Text copied to clipboard!");
    } catch (error) {
      toast.error("Failed to copy text");
    }
  };

  const handleReplace = () => {
    const selectedText = getSelectedText();
    if (!selectedText.trim()) {
      toast.warning("Please select text to replace");
      return;
    }
    setReplaceText(selectedText);
    setShowReplaceInput(true);
    setShowAddInput(false);
  };

  const executeReplace = () => {
    if (!editor || !replaceText.trim()) return;

    const { from, to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .deleteRange({ from, to })
      .insertContent(replaceText)
      .run();

    toast.success("Text replaced successfully!");
    onClose();
    resetModal();
  };

  const handleAdd = () => {
    setShowAddInput(true);
    setShowReplaceInput(false);
  };

  const executeAdd = () => {
    if (!editor || !addText.trim()) return;

    const { to } = editor.state.selection;
    editor
      .chain()
      .focus()
      .setTextSelection(to)
      .insertContent(` ${addText} `)
      .run();

    toast.success("Text added successfully!");
    onClose();
    resetModal();
  };

  const handleBackToMain = () => {
    setShowResearchResults(false);
    setShowReplaceInput(false);
    setShowAddInput(false);
  };

  if (!visible || !editor) return null;

  const selectedText = getSelectedText();
  const isExpanded = showResearchResults || showReplaceInput || showAddInput;

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: position.y - (isExpanded ? 150 : 50),
        left: position.x - (isExpanded ? 250 : 100),
        zIndex: 1000,
        background: "white",
        borderRadius: "12px",
        border: "1px solid #e5e7eb",
        padding: "16px",
        boxShadow: "0 10px 25px rgba(0, 0, 0, 0.15)",
        minWidth: isExpanded ? "500px" : "200px",
        maxWidth: isExpanded ? "600px" : "250px",
        maxHeight: isExpanded ? "400px" : "auto",
        overflow: isExpanded ? "hidden" : "visible",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {!showReplaceInput && !showAddInput && !showResearchResults && (
        <div style={{ display: "flex", justifyContent: "center" }}>
          <button
            onClick={handleResearch}
            disabled={isResearching || !selectedText.trim()}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "8px",
              padding: "10px 16px",
              border: "1px solid #3b82f6",
              borderRadius: "8px",
              background: "#3b82f6",
              color: "white",
              cursor:
                isResearching || !selectedText.trim()
                  ? "not-allowed"
                  : "pointer",
              fontSize: "14px",
              fontWeight: "500",
              opacity: isResearching || !selectedText.trim() ? 0.5 : 1,
            }}
          >
            <Search className="w-4 h-4" />
            Research
          </button>
        </div>
      )}

      {showResearchResults && (
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: "12px",
            height: "100%",
          }}
        >
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "8px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{ fontSize: "14px", fontWeight: "500", color: "#374151" }}
            >
              Research: "{researchQuery.substring(0, 30)}
              {researchQuery.length > 30 ? "..." : ""}"
            </div>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "4px",
                border: "none",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div
            style={{
              display: "flex",
              gap: "6px",
              alignItems: "center",
              paddingBottom: "8px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: editor.isActive("bold") ? "#e5e7eb" : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Bold className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: editor.isActive("italic")
                  ? "#e5e7eb"
                  : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Italic className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: editor.isActive("underline")
                  ? "#e5e7eb"
                  : "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Underline className="w-4 h-4" />
            </button>

            <button
              onClick={() => editor.chain().focus().setColor("#ef4444").run()}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Palette className="w-4 h-4" />
            </button>

            <div
              style={{
                width: "1px",
                height: "20px",
                background: "#e5e7eb",
                margin: "0 4px",
              }}
            />

            <button
              onClick={handleResearch}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Search className="w-4 h-4" />
            </button>

            <button
              onClick={handleCopy}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Copy className="w-4 h-4" />
            </button>

            <button
              onClick={handleReplace}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <RotateCw className="w-4 h-4" />
            </button>

            <button
              onClick={handleAdd}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Plus className="w-4 h-4" />
            </button>

            <button
              onClick={handleSaveResearch}
              style={{
                padding: "6px",
                border: "none",
                borderRadius: "6px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Save className="w-4 h-4" />
            </button>
          </div>

          <div
            style={{
              flex: 1,
              overflowY: "auto",
              padding: "12px",
              background: "#f9fafb",
              borderRadius: "8px",
              fontSize: "13px",
              lineHeight: "1.6",
              color: "#374151",
              minHeight: "200px",
              maxHeight: "250px",
              border: "1px solid #e5e7eb",
            }}
          >
            {isResearching ? (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  height: "100px",
                }}
              >
                <div style={{ fontSize: "13px", color: "#6b7280" }}>
                  Researching...
                </div>
              </div>
            ) : (
              researchResults || "No research results available"
            )}
          </div>

          {!isResearching && researchResults && (
            <div
              style={{
                display: "flex",
                gap: "8px",
                paddingTop: "8px",
                borderTop: "1px solid #f3f4f6",
              }}
            >
              <button
                onClick={handleCopyResearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  background: "#3b82f6",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                <Copy className="w-3 h-3" />
                Copy Results
              </button>
              <button
                onClick={handleSaveResearch}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  padding: "8px 12px",
                  background: "#10b981",
                  color: "white",
                  border: "none",
                  borderRadius: "6px",
                  cursor: "pointer",
                  fontSize: "12px",
                  fontWeight: "500",
                }}
              >
                <Save className="w-3 h-3" />
                Save as Document
              </button>
            </div>
          )}
        </div>
      )}

      {showReplaceInput && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "8px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}
            >
              Replace: "{selectedText.substring(0, 50)}
              {selectedText.length > 50 ? "..." : ""}"
            </div>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "4px",
                border: "none",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={replaceText}
            onChange={(e) => setReplaceText(e.target.value)}
            placeholder="Enter replacement text"
            style={{
              padding: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
              minHeight: "80px",
              resize: "vertical",
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={executeReplace}
              style={{
                padding: "6px 12px",
                background: "#3b82f6",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Replace
            </button>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "6px 12px",
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showAddInput && (
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          <div
            style={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              paddingBottom: "8px",
              borderBottom: "1px solid #f3f4f6",
            }}
          >
            <div
              style={{ fontSize: "12px", fontWeight: "500", color: "#374151" }}
            >
              Add text after selection
            </div>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "4px",
                border: "none",
                borderRadius: "4px",
                background: "transparent",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={addText}
            onChange={(e) => setAddText(e.target.value)}
            placeholder="Enter text to add"
            style={{
              padding: "8px",
              border: "1px solid #e5e7eb",
              borderRadius: "6px",
              fontSize: "12px",
              outline: "none",
              minHeight: "80px",
              resize: "vertical",
            }}
            autoFocus
          />
          <div style={{ display: "flex", gap: "8px" }}>
            <button
              onClick={executeAdd}
              style={{
                padding: "6px 12px",
                background: "#10b981",
                color: "white",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Add
            </button>
            <button
              onClick={handleBackToMain}
              style={{
                padding: "6px 12px",
                background: "#e5e7eb",
                color: "#374151",
                border: "none",
                borderRadius: "6px",
                cursor: "pointer",
                fontSize: "12px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleTextModal;
