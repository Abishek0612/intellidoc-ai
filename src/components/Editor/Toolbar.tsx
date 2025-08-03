import React, { useState, useCallback, useMemo } from "react";
import { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
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

  if (!editor) return null;

  const fontSizes: FontOption[] = useMemo(
    () => [
      { label: "8px", value: "8px" },
      { label: "10px", value: "10px" },
      { label: "12px", value: "12px" },
      { label: "14px", value: "14px" },
      { label: "16px", value: "16px" },
      { label: "18px", value: "18px" },
      { label: "20px", value: "20px" },
      { label: "24px", value: "24px" },
      { label: "28px", value: "28px" },
      { label: "32px", value: "32px" },
      { label: "36px", value: "36px" },
      { label: "48px", value: "48px" },
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
    ],
    []
  );

  const setFontSize = useCallback(
    (size: string) => {
      console.log("Setting font size:", size);

      const { from, to } = editor.state.selection;
      if (from === to) {
        editor
          .chain()
          .focus()
          .selectAll()
          .setMark("textStyle", { fontSize: size })
          .run();
      } else {
        editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
      }

      setShowFontSize(false);
      console.log("Font size applied");
    },
    [editor]
  );

  const setFontFamily = useCallback(
    (family: string) => {
      console.log("Setting font family:", family);

      const { from, to } = editor.state.selection;
      if (from === to) {
        editor
          .chain()
          .focus()
          .selectAll()
          .setMark("textStyle", { fontFamily: family })
          .run();
      } else {
        editor
          .chain()
          .focus()
          .setMark("textStyle", { fontFamily: family })
          .run();
      }

      setShowFontFamily(false);
      console.log("Font family applied");
    },
    [editor]
  );

  const getCurrentFontSize = useCallback(() => {
    const attrs = editor.getAttributes("textStyle");
    return attrs.fontSize || "14px";
  }, [editor]);

  const getCurrentFontFamily = useCallback(() => {
    const attrs = editor.getAttributes("textStyle");
    if (attrs.fontFamily) {
      const family = fontFamilies.find((f) => f.value === attrs.fontFamily);
      return family ? family.label : attrs.fontFamily.split(",")[0];
    }
    return "Arial";
  }, [editor, fontFamilies]);

  const downloadFile = useCallback(
    (content: string, filename: string, mimeType: string) => {
      console.log("Creating download for:", filename);
      try {
        const blob = new Blob([content], { type: mimeType });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = filename;
        link.style.display = "none";
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        console.log("Download completed successfully");
        return true;
      } catch (error) {
        console.error("Download failed:", error);
        return false;
      }
    },
    []
  );

  const handleExport = useCallback(
    async (format: "pdf" | "word" | "html" | "text") => {
      console.log("Export started:", format);

      if (!content || !title) {
        console.error("Missing content or title");
        toast.error("No content available for export");
        return;
      }

      setIsExporting(true);

      try {
        const filename = title
          .replace(/[^a-z0-9\s]/gi, "_")
          .replace(/\s+/g, "_");
        console.log("Safe filename:", filename);

        if (format === "pdf") {
          console.log("Starting PDF export");
          try {
            console.log("Importing html2pdf");
            const html2pdfModule = await import("html2pdf.js");
            const html2pdf = html2pdfModule.default;
            console.log("html2pdf imported successfully");

            const htmlContent = `
            <div style="font-family: Arial, sans-serif; line-height: 1.6; padding: 40px; color: #333;">
              <h1 style="color: #333; margin-bottom: 20px; font-size: 24px;">${title}</h1>
              <div style="font-size: 14px;">${content}</div>
            </div>
          `;

            console.log("Creating PDF element");
            const element = document.createElement("div");
            element.innerHTML = htmlContent;
            document.body.appendChild(element);

            const options = {
              margin: 0.5,
              filename: `${filename}.pdf`,
              image: { type: "jpeg", quality: 0.98 },
              html2canvas: { scale: 2, useCORS: true },
              jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
            };

            console.log("Generating PDF");
            await html2pdf().set(options).from(element).save();

            document.body.removeChild(element);
            console.log("PDF export completed");
            toast.success("PDF exported successfully!");
          } catch (error) {
            console.error("PDF export error:", error);
            toast.error("PDF export failed. Please try again.");
          }
        } else if (format === "word") {
          console.log("Starting Word export");
          const wordContent = `<!DOCTYPE html>
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

          const success = downloadFile(
            wordContent,
            `${filename}.doc`,
            "application/msword"
          );
          if (success) {
            toast.success("Word document exported!");
          } else {
            toast.error("Word export failed");
          }
        } else if (format === "html") {
          console.log("Starting HTML export");
          const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    body { font-family: Arial, sans-serif; margin: 40px; line-height: 1.6; color: #333; }
    h1 { color: #333; margin-bottom: 20px; }
  </style>
</head>
<body>
  <h1>${title}</h1>
  <div>${content}</div>
</body>
</html>`;

          const success = downloadFile(
            htmlContent,
            `${filename}.html`,
            "text/html"
          );
          if (success) {
            toast.success("HTML exported!");
          } else {
            toast.error("HTML export failed");
          }
        } else if (format === "text") {
          console.log("Starting text export");
          const tempDiv = document.createElement("div");
          tempDiv.innerHTML = content;
          const textContent = tempDiv.textContent || tempDiv.innerText || "";
          const fullText = `${title}\n${"=".repeat(
            title.length
          )}\n\n${textContent}`;

          const success = downloadFile(
            fullText,
            `${filename}.txt`,
            "text/plain"
          );
          if (success) {
            toast.success("Text file exported!");
          } else {
            toast.error("Text export failed");
          }
        }
      } catch (error) {
        console.error("Export error:", error);
        toast.error("Export failed");
      } finally {
        setIsExporting(false);
        setShowExport(false);
        console.log("Export process completed");
      }
    },
    [content, title, downloadFile]
  );

  const addLink = useCallback(() => {
    const url = prompt("Enter URL:");
    if (url) {
      editor.chain().focus().setLink({ href: url }).run();
    }
  }, [editor]);

  const addImage = useCallback(() => {
    const url = prompt("Enter image URL:");
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

  const closeAllDropdowns = useCallback(() => {
    setShowExport(false);
    setShowFontSize(false);
    setShowFontFamily(false);
    setShowMoreTools(false);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest(".toolbar-dropdown")) {
        closeAllDropdowns();
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAllDropdowns]);

  return (
    <>
      {(showExport || showFontSize || showFontFamily || showMoreTools) && (
        <div
          className="fixed inset-0 bg-transparent"
          style={{ zIndex: 50000 }}
          onClick={closeAllDropdowns}
        />
      )}

      <div
        className="bg-white border-b border-gray-200 flex-shrink-0 relative"
        style={{ zIndex: 1000 }}
      >
        <div className="p-2 sm:p-3 flex items-center gap-1 overflow-x-auto">
          <div className="flex items-center gap-1 mr-2 flex-shrink-0">
            <button
              onClick={() => editor.chain().focus().undo().run()}
              disabled={!editor.can().undo()}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <Undo className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().redo().run()}
              disabled={!editor.can().redo()}
              className="p-1.5 sm:p-2 hover:bg-gray-100 rounded disabled:opacity-50"
            >
              <Redo className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-2 mr-4">
            <div className="relative toolbar-dropdown">
              <button
                onClick={() => {
                  console.log("Font family button clicked");
                  setShowFontFamily(!showFontFamily);
                  setShowFontSize(false);
                  setShowExport(false);
                  setShowMoreTools(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[120px] justify-between"
              >
                <span className="truncate">{getCurrentFontFamily()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="relative toolbar-dropdown">
              <button
                onClick={() => {
                  console.log("Font size button clicked");
                  setShowFontSize(!showFontSize);
                  setShowFontFamily(false);
                  setShowExport(false);
                  setShowMoreTools(false);
                }}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[70px] justify-between"
              >
                <span>{getCurrentFontSize()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBold().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("bold") ? "bg-blue-100" : ""
              }`}
            >
              <Bold className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleItalic().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("italic") ? "bg-blue-100" : ""
              }`}
            >
              <Italic className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleUnderline().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("underline") ? "bg-blue-100" : ""
              }`}
            >
              <Underline className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleStrike().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("strike") ? "bg-blue-100" : ""
              }`}
            >
              <Strikethrough className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="hidden md:flex items-center gap-1 mr-2">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("bulletList") ? "bg-blue-100" : ""
              }`}
            >
              <List className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive("orderedList") ? "bg-blue-100" : ""
              }`}
            >
              <ListOrdered className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive({ textAlign: "left" }) ? "bg-blue-100" : ""
              }`}
            >
              <AlignLeft className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive({ textAlign: "center" }) ? "bg-blue-100" : ""
              }`}
            >
              <AlignCenter className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("right").run()}
              className={`p-1.5 sm:p-2 hover:bg-gray-100 rounded ${
                editor.isActive({ textAlign: "right" }) ? "bg-blue-100" : ""
              }`}
            >
              <AlignRight className="w-3 h-3 sm:w-4 sm:h-4" />
            </button>
          </div>

          <div className="md:hidden relative toolbar-dropdown">
            <button
              onClick={() => {
                setShowMoreTools(!showMoreTools);
                setShowExport(false);
                setShowFontSize(false);
                setShowFontFamily(false);
              }}
              className="p-1.5 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <div className="relative toolbar-dropdown">
              <button
                onClick={() => {
                  console.log("Export button clicked");
                  setShowExport(!showExport);
                  setShowFontSize(false);
                  setShowFontFamily(false);
                  setShowMoreTools(false);
                }}
                disabled={isExporting}
                className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 disabled:opacity-50 text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">
                  {isExporting ? "Exporting..." : "Export"}
                </span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {showFontFamily && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[160px] max-h-64 overflow-y-auto"
          style={{
            zIndex: 50001,
            top: "140px",
            left: "420px",
          }}
        >
          {fontFamilies.map((font) => (
            <button
              key={font.value}
              onClick={() => {
                console.log("Font family selected:", font.value);
                setFontFamily(font.value);
              }}
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
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
          style={{
            zIndex: 50001,
            top: "140px",
            left: "550px",
          }}
        >
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => {
                console.log("Font size selected:", size.value);
                setFontSize(size.value);
              }}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap"
            >
              {size.label}
            </button>
          ))}
        </div>
      )}

      {showExport && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-56"
          style={{
            zIndex: 50001,
            top: "140px",
            right: "20px",
          }}
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export Document
          </h3>
          <div className="space-y-2">
            <button
              onClick={() => {
                console.log("PDF export clicked");
                handleExport("pdf");
              }}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export as PDF
            </button>
            <button
              onClick={() => {
                console.log("Word export clicked");
                handleExport("word");
              }}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <File className="w-4 h-4 text-blue-500" />
              Export as Word
            </button>
            <button
              onClick={() => {
                console.log("HTML export clicked");
                handleExport("html");
              }}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <Globe className="w-4 h-4 text-green-500" />
              Export as HTML
            </button>
            <button
              onClick={() => {
                console.log("Text export clicked");
                handleExport("text");
              }}
              disabled={isExporting}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <FileText className="w-4 h-4 text-gray-500" />
              Export as Text
            </button>
          </div>
        </div>
      )}

      {showMoreTools && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-80"
          style={{
            zIndex: 50001,
            top: "140px",
            right: "20px",
          }}
        >
          <div className="grid grid-cols-2 gap-2 mb-4">
            <select
              value={getCurrentFontFamily()}
              onChange={(e) => {
                const font = fontFamilies.find(
                  (f) => f.label === e.target.value
                );
                if (font) {
                  console.log("Mobile font family selected:", font.value);
                  setFontFamily(font.value);
                }
              }}
              className="px-2 py-1 text-xs border rounded"
            >
              {fontFamilies.map((font) => (
                <option key={font.value} value={font.label}>
                  {font.label}
                </option>
              ))}
            </select>
            <select
              value={getCurrentFontSize()}
              onChange={(e) => {
                console.log("Mobile font size selected:", e.target.value);
                setFontSize(e.target.value);
              }}
              className="px-2 py-1 text-xs border rounded"
            >
              {fontSizes.map((size) => (
                <option key={size.value} value={size.value}>
                  {size.label}
                </option>
              ))}
            </select>
          </div>
          <div className="grid grid-cols-4 gap-1">
            <button
              onClick={() => editor.chain().focus().toggleBulletList().run()}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <List className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleOrderedList().run()}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <ListOrdered className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().setTextAlign("left").run()}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <AlignLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
              className="p-2 hover:bg-gray-100 rounded"
            >
              <AlignCenter className="w-4 h-4" />
            </button>
            <button
              onClick={() => editor.chain().focus().toggleBlockquote().run()}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Quote className="w-4 h-4" />
            </button>
            <button onClick={addLink} className="p-2 hover:bg-gray-100 rounded">
              <Link className="w-4 h-4" />
            </button>
            <button
              onClick={addImage}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Image className="w-4 h-4" />
            </button>
            <button
              onClick={insertTable}
              className="p-2 hover:bg-gray-100 rounded"
            >
              <Table className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
