import React, { useState, useRef } from "react";
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

const Toolbar = ({ editor, onSave, content, title }) => {
  const [showExport, setShowExport] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);

  const fontFamilyButtonRef = useRef(null);
  const fontSizeButtonRef = useRef(null);
  const exportButtonRef = useRef(null);

  if (!editor) return null;

  const fontSizes = [
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
  ];

  const fontFamilies = [
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
  ];

  const setFontSize = (size) => {
    console.log("Setting font size to:", size);
    const result1 = editor.chain().focus().setFontSize(size).run();
    const result2 = editor
      .chain()
      .focus()
      .setMark("textStyle", { fontSize: size })
      .run();
    console.log("Font size results:", result1, result2);
    setShowFontSize(false);
  };

  const setFontFamily = (family) => {
    console.log("Setting font family to:", family);
    const result1 = editor.chain().focus().setFontFamily(family).run();
    const result2 = editor
      .chain()
      .focus()
      .setMark("textStyle", { fontFamily: family })
      .run();
    console.log("Font family results:", result1, result2);
    setShowFontFamily(false);
  };

  const getCurrentFontSize = () => {
    if (!editor) return "14px";
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize || "14px";
  };

  const getCurrentFontFamily = () => {
    if (!editor) return "Times New Roman";
    const attrs = editor.getAttributes("textStyle");
    if (attrs.fontFamily) {
      const family = fontFamilies.find((f) => f.value === attrs.fontFamily);
      return family ? family.label : attrs.fontFamily.split(",")[0];
    }
    return "Times New Roman";
  };

  const handleExportClick = () => {
    console.log("=== EXPORT BUTTON CLICKED ===");
    console.log("Current showExport state:", showExport);
    console.log("Content available:", !!content);
    console.log("Content length:", content?.length || 0);
    console.log("Title available:", !!title);
    console.log("Title value:", title);
    setShowExport(!showExport);
    setShowFontSize(false);
    setShowFontFamily(false);
  };

  const addLink = () => {
    const url = window.prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  };

  const addImage = () => {
    const url = window.prompt("Enter image URL:");
    if (url) {
      editor.chain().focus().setImage({ src: url }).run();
    }
  };

  const insertTable = () => {
    editor
      .chain()
      .focus()
      .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
      .run();
  };

  React.useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest(".export-dropdown-container")) {
        setShowExport(false);
      }
      if (!event.target.closest(".font-dropdown-container")) {
        setShowFontSize(false);
        setShowFontFamily(false);
      }
      if (!event.target.closest(".more-tools-container")) {
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
              onClick={handleExportClick}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm"
            >
              <Download className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Export</span>
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
            <div className="text-xs text-gray-500 mb-2 p-2 bg-gray-50 rounded">
              <div>Content Length: {content?.length || 0}</div>
              <div>Title: {title || "No title"}</div>
            </div>

            <button
              onClick={() => {
                console.log("=== SIMPLE TEST CLICKED ===");
                console.log("Content:", content);
                console.log("Title:", title);

                try {
                  const testText = `Title: ${title}\n\nContent:\n${content}\n\nExported at: ${new Date().toLocaleString()}`;
                  const blob = new Blob([testText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = "simple-test.txt";
                  a.click();
                  URL.revokeObjectURL(url);

                  console.log("Simple test export completed");
                  toast.success("Simple test export worked!");
                } catch (error) {
                  console.error("Simple test failed:", error);
                  toast.error("Simple test failed: " + error.message);
                }

                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors bg-yellow-50"
            >
              <FileText className="w-4 h-4 text-yellow-600" />
              Simple Test
            </button>

            <button
              onClick={() => {
                console.log("=== HTML EXPORT CLICKED ===");

                try {
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
</html>`;

                  const blob = new Blob([htmlContent], { type: "text/html" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.html`;
                  a.click();
                  URL.revokeObjectURL(url);

                  console.log("HTML export completed");
                  toast.success("HTML exported successfully!");
                } catch (error) {
                  console.error("HTML export error:", error);
                  toast.error("HTML export failed: " + error.message);
                }

                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Globe className="w-4 h-4 text-green-500" />
              Export as HTML
            </button>

            <button
              onClick={() => {
                console.log("=== TEXT EXPORT CLICKED ===");

                try {
                  const div = document.createElement("div");
                  div.innerHTML = content;
                  const textContent = div.textContent || div.innerText || "";

                  const fullText = `${title}\n${"=".repeat(
                    title.length
                  )}\n\n${textContent}`;

                  const blob = new Blob([fullText], { type: "text/plain" });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.txt`;
                  a.click();
                  URL.revokeObjectURL(url);

                  console.log("Text export completed");
                  toast.success("Text exported successfully!");
                } catch (error) {
                  console.error("Text export error:", error);
                  toast.error("Text export failed: " + error.message);
                }

                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              Export as Text
            </button>

            <button
              onClick={() => {
                console.log("=== WORD EXPORT CLICKED ===");

                try {
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
</html>`;

                  const blob = new Blob([wordContent], {
                    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
                  });
                  const url = URL.createObjectURL(blob);
                  const a = document.createElement("a");
                  a.href = url;
                  a.download = `${title.replace(/[^a-z0-9]/gi, "_")}.doc`;
                  a.click();
                  URL.revokeObjectURL(url);

                  console.log("Word export completed");
                  toast.success("Word exported successfully!");
                } catch (error) {
                  console.error("Word export error:", error);
                  toast.error("Word export failed: " + error.message);
                }

                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <File className="w-4 h-4 text-blue-500" />
              Export as Word
            </button>

            <button
              onClick={async () => {
                console.log("=== PDF EXPORT CLICKED ===");

                try {
                  toast.info("Loading PDF library...");

                  const html2pdf = (await import("html2pdf.js")).default;
                  console.log("html2pdf loaded:", html2pdf);

                  const element = document.createElement("div");
                  element.innerHTML = `<h1>${title}</h1><div>${content}</div>`;
                  element.style.padding = "20px";
                  element.style.fontFamily = "Arial, sans-serif";

                  const opt = {
                    margin: 0.5,
                    filename: `${title.replace(/[^a-z0-9]/gi, "_")}.pdf`,
                    image: { type: "jpeg", quality: 0.98 },
                    html2canvas: { scale: 2 },
                    jsPDF: {
                      unit: "in",
                      format: "a4",
                      orientation: "portrait",
                    },
                  };

                  console.log("Starting PDF generation...");
                  await html2pdf().set(opt).from(element).save();

                  console.log("PDF export completed");
                  toast.success("PDF exported successfully!");
                } catch (error) {
                  console.error("PDF export error:", error);
                  toast.error("PDF export failed: " + error.message);
                }

                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export as PDF
            </button>

            <button
              onClick={() => {
                console.log("Close button clicked");
                setShowExport(false);
              }}
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
