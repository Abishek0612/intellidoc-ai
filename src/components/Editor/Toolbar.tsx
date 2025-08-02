import React, { useState, useRef, useCallback, useMemo } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Link,
  Image,
  Table,
  Undo,
  Redo,
  Save,
  Download,
  ChevronDown,
  MoreHorizontal,
  FileText,
  File,
  Globe,
} from "lucide-react";
import { toast } from "react-toastify";
import { FontOption } from "../../types";

interface ToolbarProps {
  editor: Editor | null;
  onSave: () => void;
  content: string;
  title: string;
}

const Toolbar: React.FC<ToolbarProps> = ({
  editor,
  onSave,
  content,
  title,
}) => {
  const [showExport, setShowExport] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  const fontFamilyButtonRef = useRef<HTMLButtonElement>(null);
  const fontSizeButtonRef = useRef<HTMLButtonElement>(null);
  const exportButtonRef = useRef<HTMLButtonElement>(null);

  if (!editor) return null;

  const fontSizes: FontOption[] = useMemo(
    () => [
      { label: "8px", value: "8px" },
      { label: "9px", value: "9px" },
      { label: "10px", value: "10px" },
      { label: "11px", value: "11px" },
      { label: "12px", value: "12px" },
      { label: "14px", value: "14px" },
      { label: "16px", value: "16px" },
      { label: "18px", value: "18px" },
      { label: "20px", value: "20px" },
      { label: "22px", value: "22px" },
      { label: "24px", value: "24px" },
      { label: "28px", value: "28px" },
      { label: "32px", value: "32px" },
      { label: "36px", value: "36px" },
      { label: "48px", value: "48px" },
      { label: "72px", value: "72px" },
    ],
    []
  );

  const fontFamilies: FontOption[] = useMemo(
    () => [
      { label: "Arial", value: "Arial, sans-serif" },
      { label: "Times New Roman", value: "Times New Roman, serif" },
      { label: "Helvetica", value: "Helvetica, sans-serif" },
      { label: "Georgia", value: "Georgia, serif" },
      { label: "Verdana", value: "Verdana, sans-serif" },
      { label: "Courier New", value: "Courier New, monospace" },
      { label: "Trebuchet MS", value: "Trebuchet MS, sans-serif" },
      { label: "Palatino", value: "Palatino, serif" },
      { label: "Tahoma", value: "Tahoma, sans-serif" },
      { label: "Comic Sans MS", value: "Comic Sans MS, cursive" },
      { label: "Impact", value: "Impact, fantasy" },
      { label: "Lucida Console", value: "Lucida Console, monospace" },
    ],
    []
  );

  const setFontSize = useCallback(
    (size: string) => {
      console.log("Setting font size to:", size);
      const result1 = editor.chain().focus().setFontSize(size).run();
      const result2 = editor
        .chain()
        .focus()
        .setMark("textStyle", { fontSize: size })
        .run();
      console.log("Font size results:", result1, result2);
      setShowFontSize(false);
    },
    [editor]
  );

  const setFontFamily = useCallback(
    (family: string) => {
      console.log("Setting font family to:", family);
      const result1 = editor.chain().focus().setFontFamily(family).run();
      const result2 = editor
        .chain()
        .focus()
        .setMark("textStyle", { fontFamily: family })
        .run();
      console.log("Font family results:", result1, result2);
      setShowFontFamily(false);
    },
    [editor]
  );

  const getCurrentFontSize = useCallback(() => {
    if (!editor) return "14px";
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize || "14px";
  }, [editor]);

  const getCurrentFontFamily = useCallback(() => {
    if (!editor) return "Times New Roman";
    const attrs = editor.getAttributes("textStyle");
    if (attrs.fontFamily) {
      const family = fontFamilies.find((f) => f.value === attrs.fontFamily);
      return family ? family.label : attrs.fontFamily.split(",")[0];
    }
    return "Times New Roman";
  }, [editor, fontFamilies]);

  const handleExportClick = useCallback(() => {
    console.log("=== EXPORT BUTTON CLICKED ===");
    console.log("Current showExport state:", showExport);
    console.log("Content available:", !!content);
    console.log("Content length:", content?.length || 0);
    console.log("Title available:", !!title);
    console.log("Title value:", title);
    setShowExport(!showExport);
    setShowFontSize(false);
    setShowFontFamily(false);
  }, [showExport, content, title]);

  const handleExport = useCallback(
    async (format: "pdf" | "word" | "html" | "text") => {
      if (!content || !title) {
        toast.error("No content or title available for export");
        return;
      }

      setIsExporting(true);
      try {
        switch (format) {
          case "pdf":
            const html2pdf = (await import("html2pdf.js")).default;
            const cleanHTML = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <div>${content}</div>
            </body>
            </html>
          `;

            const opt = {
              margin: 0.5,
              filename: `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2 },
              jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };

            await html2pdf().set(opt).from(cleanHTML).save();
            toast.success("PDF exported successfully!");
            break;

          case "word":
            const wordContent = `
            <!DOCTYPE html>
            <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
            <head>
              <meta charset='utf-8'>
              <title>${title}</title>
            </head>
            <body>
              <h1>${title}</h1>
              <div>${content}</div>
            </body>
            </html>
          `;

            const wordBlob = new Blob([wordContent], {
              type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            });
            const wordUrl = URL.createObjectURL(wordBlob);
            const wordA = document.createElement("a");
            wordA.href = wordUrl;
            wordA.download = `${title.replace(/[^a-z0-9]/gi, "_")}.doc`;
            wordA.click();
            URL.revokeObjectURL(wordUrl);
            toast.success("Word exported successfully!");
            break;

          case "html":
            const htmlContent = `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="UTF-8">
              <title>${title}</title>
              <style>
                body { font-family: Arial, sans-serif; margin: 40px; }
                h1 { color: #333; }
              </style>
            </head>
            <body>
              <h1>${title}</h1>
              <div>${content}</div>
            </body>
            </html>
          `;

            const htmlBlob = new Blob([htmlContent], { type: "text/html" });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            const htmlA = document.createElement("a");
            htmlA.href = htmlUrl;
            htmlA.download = `${title.replace(/[^a-z0-9]/gi, "_")}.html`;
            htmlA.click();
            URL.revokeObjectURL(htmlUrl);
            toast.success("HTML exported successfully!");
            break;

          case "text":
            const div = document.createElement("div");
            div.innerHTML = content;
            const textContent = div.textContent || div.innerText || "";
            const fullText = `${title}\n${"=".repeat(
              title.length
            )}\n\n${textContent}`;

            const textBlob = new Blob([fullText], { type: "text/plain" });
            const textUrl = URL.createObjectURL(textBlob);
            const textA = document.createElement("a");
            textA.href = textUrl;
            textA.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
            textA.click();
            URL.revokeObjectURL(textUrl);
            toast.success("Text exported successfully!");
            break;
        }
      } catch (error) {
        toast.error(
          `Export failed: ${
            error instanceof Error ? error.message : "Unknown error"
          }`
        );
      } finally {
        setIsExporting(false);
        setShowExport(false);
      }
    },
    [content, title]
  );

  const addLink = useCallback(() => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  }, [editor]);

  const insertTable = useCallback(() => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  }, [editor]);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (!target.closest(".export-dropdown-container")) {
        setShowExport(false);
      }
      if (!target.closest(".font-dropdown-container")) {
        setShowFontSize(false);
        setShowFontFamily(false);
      }
      if (!target.closest(".more-tools-container")) {
        setShowMoreTools(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="bg-white border-b border-gray-200 flex-shrink-0">
      <div className="p-2 sm:p-3 flex items-center gap-1 overflow-x-auto">
        <div className="flex items-center gap-1 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().undo()}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Undo"
          >
            <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().redo()}
            className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50 disabled:cursor-not-allowed"
            title="Redo"
          >
            <Redo className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="hidden md:flex items-center gap-2 mr-4">
          <div className="relative font-dropdown-container">
            <button
              ref={fontFamilyButtonRef}
              onClick={() => {
                console.log("Font family button clicked");
                setShowFontFamily(!showFontFamily);
                setShowFontSize(false);
                setShowExport(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[120px] justify-between"
            >
              <span className="truncate">{getCurrentFontFamily()}</span>
              <ChevronDown className="w-3 h-3 flex-shrink-0" />
            </button>
          </div>

          <div className="relative font-dropdown-container">
            <button
              ref={fontSizeButtonRef}
              onClick={() => {
                console.log("Font size button clicked");
                setShowFontSize(!showFontSize);
                setShowFontFamily(false);
                setShowExport(false);
              }}
              className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[70px] justify-between"
            >
              <span>{getCurrentFontSize()}</span>
              <ChevronDown className="w-3 h-3" />
            </button>
          </div>
        </div>

        <div className="hidden md:block w-px h-6 bg-gray-300 mr-4"></div>

        <div className="flex items-center gap-1 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
              editor.isActive("bold") ? "bg-blue-100" : ""
            }`}
            title="Bold"
          >
            <Bold className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
              editor.isActive("italic") ? "bg-blue-100" : ""
            }`}
            title="Italic"
          >
            <Italic className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
              editor.isActive("underline") ? "bg-blue-100" : ""
            }`}
            title="Underline"
          >
            <Underline className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="flex items-center gap-1 mr-2 flex-shrink-0">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
              editor.isActive("bulletList") ? "bg-blue-100" : ""
            }`}
            title="Bullet List"
          >
            <List className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
              editor.isActive("orderedList") ? "bg-blue-100" : ""
            }`}
            title="Numbered List"
          >
            <ListOrdered className="w-3 h-3 sm:w-4 sm:h-4" />
          </button>
        </div>

        <div className="relative md:hidden flex-shrink-0 more-tools-container">
          <button
            onClick={() => {
              console.log("More tools button clicked");
              setShowMoreTools(!showMoreTools);
              setShowFontSize(false);
              setShowFontFamily(false);
              setShowExport(false);
            }}
            className="p-1.5 hover:bg-gray-100 rounded"
            title="More Tools"
          >
            <MoreHorizontal className="w-4 h-4" />
          </button>

          {showMoreTools && (
            <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[280px]">
              <div className="mb-3 pb-3 border-b border-gray-100">
                <div className="flex gap-2 mb-2">
                  <div className="flex-1">
                    <select
                      value={
                        editor.getAttributes("textStyle").fontFamily ||
                        "Times New Roman, serif"
                      }
                      onChange={(e) => setFontFamily(e.target.value)}
                      className="w-full px-2 py-1.5 text-xs border border-gray-300 rounded"
                    >
                      {fontFamilies.map((font) => (
                        <option key={font.value} value={font.value}>
                          {font.label}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <select
                      value={getCurrentFontSize()}
                      onChange={(e) => setFontSize(e.target.value)}
                      className="px-2 py-1.5 text-xs border border-gray-300 rounded min-w-[60px]"
                    >
                      {fontSizes.map((size) => (
                        <option key={size.value} value={size.value}>
                          {size.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-1">
                <button
                  onClick={() => editor.chain().focus().toggleStrike().run()}
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive("strike") ? "bg-blue-100" : ""
                  }`}
                  title="Strikethrough"
                >
                  <Strikethrough className="w-4 h-4" />
                </button>
                <button
                  onClick={() => editor.chain().focus().toggleCode().run()}
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive("code") ? "bg-blue-100" : ""
                  }`}
                  title="Code"
                >
                  <Code className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive({ textAlign: "left" }) ? "bg-blue-100" : ""
                  }`}
                  title="Align Left"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive({ textAlign: "center" })
                      ? "bg-blue-100"
                      : ""
                  }`}
                  title="Align Center"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive("blockquote") ? "bg-blue-100" : ""
                  }`}
                  title="Quote"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  onClick={addLink}
                  className={`p-2 hover:bg-gray-100 rounded ${
                    editor.isActive("link") ? "bg-blue-100" : ""
                  }`}
                  title="Add Link"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  onClick={addImage}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Add Image"
                >
                  <Image className="w-4 h-4" />
                </button>
                <button
                  onClick={insertTable}
                  className="p-2 hover:bg-gray-100 rounded"
                  title="Insert Table"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="hidden md:flex items-center gap-1 mr-4">
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive("strike") ? "bg-blue-100" : ""
            }`}
            title="Strikethrough"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().toggleCode().run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive("code") ? "bg-blue-100" : ""
            }`}
            title="Code"
          >
            <Code className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={() => editor.chain().focus().setTextAlign("left").run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive({ textAlign: "left" }) ? "bg-blue-100" : ""
            }`}
            title="Align Left"
          >
            <AlignLeft className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign("center").run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive({ textAlign: "center" }) ? "bg-blue-100" : ""
            }`}
            title="Align Center"
          >
            <AlignCenter className="w-4 h-4" />
          </button>

          <button
            onClick={() => editor.chain().focus().setTextAlign("right").run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive({ textAlign: "right" }) ? "bg-blue-100" : ""
            }`}
            title="Align Right"
          >
            <AlignRight className="w-4 h-4" />
          </button>

          <div className="w-px h-6 bg-gray-300 mx-2"></div>

          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive("blockquote") ? "bg-blue-100" : ""
            }`}
            title="Quote"
          >
            <Quote className="w-4 h-4" />
          </button>

          <button
            onClick={addLink}
            className={`p-2 hover:bg-gray-100 rounded ${
              editor.isActive("link") ? "bg-blue-100" : ""
            }`}
            title="Add Link"
          >
            <Link className="w-4 h-4" />
          </button>

          <button
            onClick={addImage}
            className="p-2 hover:bg-gray-100 rounded"
            title="Add Image"
          >
            <Image className="w-4 h-4" />
          </button>

          <button
            onClick={insertTable}
            className="p-2 hover:bg-gray-100 rounded"
            title="Insert Table"
          >
            <Table className="w-4 h-4" />
          </button>
        </div>

        <div className="flex-1"></div>

        <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
          <button
            onClick={onSave}
            className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
          >
            <Save className="w-3 h-3 sm:w-4 sm:h-4" />
            <span className="hidden sm:inline">Save</span>
          </button>

          <div className="relative export-dropdown-container">
            <button
              ref={exportButtonRef}
              onClick={handleExportClick}
              disabled={isExporting}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">
                {isExporting ? "Exporting..." : "Export"}
              </span>
            </button>
          </div>
        </div>
      </div>

      {showExport && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl p-4 w-56"
          style={{
            top: "120px",
            right: "20px",
            zIndex: 99999,
          }}
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export Document
          </h3>

          <div className="space-y-2">
            <button
              onClick={() => handleExport("pdf")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export as PDF
            </button>

            <button
              onClick={() => handleExport("word")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <File className="w-4 h-4 text-blue-500" />
              Export as Word
            </button>

            <button
              onClick={() => handleExport("html")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <Globe className="w-4 h-4 text-green-500" />
              Export as HTML
            </button>

            <button
              onClick={() => handleExport("text")}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              Export as Text
            </button>

            <button
              onClick={() => setShowExport(false)}
              className="w-full mt-2 px-3 py-2 text-xs text-gray-500 hover:text-gray-700 border-t border-gray-200 pt-2"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {showFontFamily && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl min-w-[160px] max-h-64 overflow-y-auto"
          style={{
            top: "120px",
            left: "300px",
            zIndex: 99999,
          }}
        >
          {fontFamilies.map((font) => (
            <button
              key={font.value}
              onClick={() => setFontFamily(font.value)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors"
              style={{ fontFamily: font.value }}
            >
              {font.label}
            </button>
          ))}
        </div>
      )}

      {showFontSize && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto"
          style={{
            top: "120px",
            left: "450px",
            zIndex: 99999,
          }}
        >
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap"
            >
              {size.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default Toolbar;
