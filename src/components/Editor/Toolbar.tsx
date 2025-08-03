import React, { useState, useCallback, useMemo, useRef } from "react";
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
  const [currentFontSize, setCurrentFontSize] = useState("16px");
  const [currentFontFamily, setCurrentFontFamily] = useState("Arial");

  const isProcessingRef = useRef(false);
  const dropdownCloseTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  if (!editor) {
    return null;
  }

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

  const applyFontSize = useCallback(
    (size: string) => {
      if (!editor) return;

      try {
        const { from, to } = editor.state.selection;

        if (from === to) {
          const currentContent = editor.getHTML();
          const wrappedContent = `<div style="font-size: ${size};">${currentContent}</div>`;
          editor.commands.setContent(wrappedContent);
        } else {
          editor.chain().focus().setMark("textStyle", { fontSize: size }).run();
        }

        const editorElement = editor.view.dom as HTMLElement;
        if (editorElement) {
          editorElement.style.fontSize = size;
        }

        setCurrentFontSize(size);
        setShowFontSize(false);

        toast.success(`Font size changed to ${size}`, {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 1500,
        });
      } catch (error) {
        toast.error("Failed to change font size");
      }
    },
    [editor]
  );

  const applyFontFamily = useCallback(
    (family: string) => {
      if (!editor) return;

      try {
        const { from, to } = editor.state.selection;

        if (from === to) {
          const currentContent = editor.getHTML();
          const wrappedContent = `<div style="font-family: ${family};">${currentContent}</div>`;
          editor.commands.setContent(wrappedContent);
        } else {
          editor
            .chain()
            .focus()
            .setMark("textStyle", { fontFamily: family })
            .run();
        }

        const editorElement = editor.view.dom as HTMLElement;
        if (editorElement) {
          editorElement.style.fontFamily = family;
        }

        const familyName =
          fontFamilies.find((f) => f.value === family)?.label || family;
        setCurrentFontFamily(familyName);
        setShowFontFamily(false);

        toast.success(`Font changed to ${familyName}`, {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 1500,
        });
      } catch (error) {
        toast.error("Failed to change font family");
      }
    },
    [editor, fontFamilies]
  );

  const sanitizeHtmlForPDF = useCallback((htmlContent: string): string => {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;

    const allElements = tempDiv.querySelectorAll("*");

    allElements.forEach((element) => {
      element.removeAttribute("style");
      element.removeAttribute("class");

      const attributes = Array.from(element.attributes);
      attributes.forEach((attr) => {
        if (
          attr.name.startsWith("data-") ||
          attr.name.startsWith("contenteditable") ||
          attr.name === "spellcheck" ||
          attr.name === "role" ||
          attr.name === "aria-" ||
          attr.name.startsWith("aria")
        ) {
          element.removeAttribute(attr.name);
        }
      });

      if (element.textContent) {
        element.textContent = element.textContent.replace(
          /oklch\([^)]*\)/g,
          ""
        );
        element.textContent = element.textContent.replace(/rgb\([^)]*\)/g, "");
        element.textContent = element.textContent.replace(/rgba\([^)]*\)/g, "");
        element.textContent = element.textContent.replace(/hsl\([^)]*\)/g, "");
        element.textContent = element.textContent.replace(/hsla\([^)]*\)/g, "");
      }
    });

    let cleanHtml = tempDiv.innerHTML;

    cleanHtml = cleanHtml.replace(/style\s*=\s*"[^"]*"/gi, "");
    cleanHtml = cleanHtml.replace(/class\s*=\s*"[^"]*"/gi, "");
    cleanHtml = cleanHtml.replace(/data-[^=]*\s*=\s*"[^"]*"/gi, "");
    cleanHtml = cleanHtml.replace(/oklch\([^)]*\)/gi, "");
    cleanHtml = cleanHtml.replace(/rgb\([^)]*\)/gi, "");
    cleanHtml = cleanHtml.replace(/rgba\([^)]*\)/gi, "");
    cleanHtml = cleanHtml.replace(/hsl\([^)]*\)/gi, "");
    cleanHtml = cleanHtml.replace(/hsla\([^)]*\)/gi, "");

    return cleanHtml;
  }, []);

  const performPDFExport = useCallback(async () => {
    if (!content || !title || isProcessingRef.current) {
      if (!content || !title) {
        toast.error("No content available for export");
      }
      return;
    }

    isProcessingRef.current = true;

    try {
      const safeTitle = (title || "document")
        .replace(/[^a-z0-9\s]/gi, "_")
        .replace(/\s+/g, "_");
      const cleanContent = sanitizeHtmlForPDF(content);

      const pdfHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        body { 
            font-family: Arial, Helvetica, sans-serif;
            font-size: 14px;
            line-height: 1.6; 
            color: #333;
            padding: 40px;
            background: #fff;
        }
        h1 { 
            color: #2c3e50;
            font-size: 28px;
            font-weight: bold;
            margin-bottom: 24px;
            border-bottom: 2px solid #3498db;
            padding-bottom: 10px;
        }
        h2 { 
            color: #34495e;
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 16px 0;
        }
        h3 { 
            color: #34495e;
            font-size: 20px;
            font-weight: bold;
            margin: 18px 0 14px 0;
        }
        h4, h5, h6 { 
            color: #34495e;
            font-weight: bold;
            margin: 16px 0 12px 0;
        }
        p { 
            margin: 12px 0;
            text-align: justify;
        }
        ul, ol { 
            margin: 16px 0;
            padding-left: 32px;
        }
        li { 
            margin: 6px 0;
        }
        strong, b { 
            font-weight: bold;
            color: #2c3e50;
        }
        em, i { 
            font-style: italic;
        }
        u { 
            text-decoration: underline;
        }
        s, strike { 
            text-decoration: line-through;
        }
        blockquote {
            border-left: 4px solid #3498db;
            margin: 20px 0;
            padding: 15px 15px 15px 20px;
            font-style: italic;
            color: #7f8c8d;
            background: #f8f9fa;
        }
        table {
            border-collapse: collapse;
            width: 100%;
            margin: 20px 0;
            border: 1px solid #bdc3c7;
        }
        table td, table th {
            border: 1px solid #bdc3c7;
            padding: 12px;
            text-align: left;
            vertical-align: top;
        }
        table th {
            background: #ecf0f1;
            font-weight: bold;
            color: #2c3e50;
        }
        table tr:nth-child(even) {
            background: #f8f9fa;
        }
        img {
            max-width: 100%;
            height: auto;
            margin: 16px 0;
            display: block;
        }
        a {
            color: #3498db;
            text-decoration: underline;
        }
        code {
            background: #f1f2f6;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: Consolas, Monaco, monospace;
            font-size: 12px;
        }
        pre {
            background: #f1f2f6;
            padding: 16px;
            border-radius: 6px;
            overflow-x: auto;
            margin: 16px 0;
        }
        .text-center { text-align: center; }
        .text-left { text-align: left; }
        .text-right { text-align: right; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${cleanContent}
</body>
</html>`;

      const { default: html2pdf } = await import("html2pdf.js");

      const options = {
        margin: [0.5, 0.5, 0.5, 0.5],
        filename: `${safeTitle}.pdf`,
        image: {
          type: "jpeg",
          quality: 0.98,
        },
        html2canvas: {
          scale: 2,
          useCORS: true,
          allowTaint: true,
          letterRendering: true,
          logging: false,
          removeContainer: true,
          backgroundColor: "#ffffff",
        },
        jsPDF: {
          unit: "in",
          format: "a4",
          orientation: "portrait",
          compress: true,
        },
      };

      await html2pdf().set(options).from(pdfHtml).save();
      toast.success("PDF downloaded successfully!");
    } catch (error) {
      toast.error("PDF export failed. Please try again.");
    } finally {
      isProcessingRef.current = false;
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
      }
      dropdownCloseTimeoutRef.current = setTimeout(() => {
        setShowExport(false);
      }, 500);
    }
  }, [content, title, sanitizeHtmlForPDF]);

  const performOtherExport = useCallback(
    async (format: "word" | "html" | "text") => {
      if (!content || !title || isProcessingRef.current) {
        if (!content || !title) {
          toast.error("No content available for export");
        }
        return;
      }

      isProcessingRef.current = true;

      try {
        const safeTitle = (title || "document")
          .replace(/[^a-z0-9\s]/gi, "_")
          .replace(/\s+/g, "_");

        switch (format) {
          case "word":
            const wordContent = `<!DOCTYPE html>
<html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word'>
<head>
    <meta charset="UTF-8">
    <title>${title}</title>
    <style>
        body { font-family: Arial; padding: 20px; line-height: 1.6; }
        h1 { color: #333; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${content}
</body>
</html>`;

            const wordBlob = new Blob([wordContent], {
              type: "application/msword",
            });
            const wordUrl = URL.createObjectURL(wordBlob);
            const wordLink = document.createElement("a");
            wordLink.href = wordUrl;
            wordLink.download = `${safeTitle}.doc`;
            wordLink.style.display = "none";

            document.body.appendChild(wordLink);
            wordLink.click();
            document.body.removeChild(wordLink);
            URL.revokeObjectURL(wordUrl);

            toast.success("Word document downloaded!");
            break;

          case "html":
            const htmlContent = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial; padding: 20px; line-height: 1.6; }
        h1 { color: #333; margin-bottom: 20px; }
    </style>
</head>
<body>
    <h1>${title}</h1>
    ${content}
</body>
</html>`;

            const htmlBlob = new Blob([htmlContent], { type: "text/html" });
            const htmlUrl = URL.createObjectURL(htmlBlob);
            const htmlLink = document.createElement("a");
            htmlLink.href = htmlUrl;
            htmlLink.download = `${safeTitle}.html`;
            htmlLink.style.display = "none";

            document.body.appendChild(htmlLink);
            htmlLink.click();
            document.body.removeChild(htmlLink);
            URL.revokeObjectURL(htmlUrl);

            toast.success("HTML file downloaded!");
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
            const textLink = document.createElement("a");
            textLink.href = textUrl;
            textLink.download = `${safeTitle}.txt`;
            textLink.style.display = "none";

            document.body.appendChild(textLink);
            textLink.click();
            document.body.removeChild(textLink);
            URL.revokeObjectURL(textUrl);

            toast.success("Text file downloaded!");
            break;
        }
      } catch (error) {
        toast.error(`${format.toUpperCase()} export failed`);
      } finally {
        isProcessingRef.current = false;
        setShowExport(false);
      }
    },
    [content, title]
  );

  const closeAllDropdowns = useCallback(() => {
    setShowExport(false);
    setShowFontSize(false);
    setShowFontFamily(false);
    setShowMoreTools(false);
  }, []);

  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;

      if (
        target.closest(".dropdown-portal") ||
        target.closest(".toolbar-button")
      ) {
        return;
      }

      closeAllDropdowns();
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [closeAllDropdowns]);

  React.useEffect(() => {
    return () => {
      if (dropdownCloseTimeoutRef.current) {
        clearTimeout(dropdownCloseTimeoutRef.current);
      }
    };
  }, []);

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

  return (
    <>
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
            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFontFamily(!showFontFamily);
                  setShowFontSize(false);
                  setShowExport(false);
                  setShowMoreTools(false);
                }}
                className="toolbar-button flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[120px] justify-between"
              >
                <span className="truncate">{currentFontFamily}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setShowFontSize(!showFontSize);
                  setShowFontFamily(false);
                  setShowExport(false);
                  setShowMoreTools(false);
                }}
                className="toolbar-button flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[70px] justify-between"
              >
                <span>{currentFontSize}</span>
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

          <div className="md:hidden relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowMoreTools(!showMoreTools);
                setShowExport(false);
                setShowFontSize(false);
                setShowFontFamily(false);
              }}
              className="toolbar-button p-1.5 hover:bg-gray-100 rounded"
            >
              <MoreHorizontal className="w-4 h-4" />
            </button>
          </div>

          <div className="flex-1"></div>

          <div className="flex items-center gap-1 sm:gap-2">
            <button
              onClick={onSave}
              className="flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 text-xs sm:text-sm cursor-pointer"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <div className="relative">
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isProcessingRef.current) {
                    setShowExport(!showExport);
                    setShowFontSize(false);
                    setShowFontFamily(false);
                    setShowMoreTools(false);
                  }
                }}
                className="toolbar-button flex items-center gap-1 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 text-xs sm:text-sm cursor-pointer"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {typeof document !== "undefined" && (
        <>
          {showFontFamily && (
            <div
              className="dropdown-portal fixed bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[160px] max-h-64 overflow-y-auto"
              style={{
                zIndex: 999999,
                top: "140px",
                left: "420px",
              }}
            >
              {fontFamilies.map((font) => (
                <button
                  key={font.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFontFamily(font.value);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors cursor-pointer"
                  style={{ fontFamily: font.value }}
                >
                  {font.label}
                </button>
              ))}
            </div>
          )}

          {showFontSize && (
            <div
              className="dropdown-portal fixed bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto"
              style={{
                zIndex: 999999,
                top: "140px",
                left: "550px",
              }}
            >
              {fontSizes.map((size) => (
                <button
                  key={size.value}
                  onClick={(e) => {
                    e.stopPropagation();
                    applyFontSize(size.value);
                  }}
                  className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap cursor-pointer"
                >
                  {size.label}
                </button>
              ))}
            </div>
          )}

          {showExport && (
            <div
              className="dropdown-portal fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-56"
              style={{
                zIndex: 999999,
                top: "140px",
                right: "20px",
              }}
            >
              <h3 className="text-sm font-medium text-gray-900 mb-3">
                Export Document
              </h3>
              <div className="space-y-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    performPDFExport();
                  }}
                  disabled={isProcessingRef.current}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-red-500" />
                  Export as PDF
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    performOtherExport("word");
                  }}
                  disabled={isProcessingRef.current}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <File className="w-4 h-4 text-blue-500" />
                  Export as Word
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    performOtherExport("html");
                  }}
                  disabled={isProcessingRef.current}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-green-500" />
                  Export as HTML
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    performOtherExport("text");
                  }}
                  disabled={isProcessingRef.current}
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors disabled:opacity-50 cursor-pointer"
                >
                  <FileText className="w-4 h-4 text-gray-500" />
                  Export as Text
                </button>
              </div>
            </div>
          )}

          {showMoreTools && (
            <div
              className="dropdown-portal fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-80"
              style={{
                zIndex: 999999,
                top: "140px",
                right: "20px",
              }}
            >
              <div className="grid grid-cols-2 gap-2 mb-4">
                <select
                  value={currentFontFamily}
                  onChange={(e) => {
                    const font = fontFamilies.find(
                      (f) => f.label === e.target.value
                    );
                    if (font) {
                      applyFontFamily(font.value);
                    }
                  }}
                  className="px-2 py-1 text-xs border rounded cursor-pointer"
                >
                  {fontFamilies.map((font) => (
                    <option key={font.value} value={font.label}>
                      {font.label}
                    </option>
                  ))}
                </select>
                <select
                  value={currentFontSize}
                  onChange={(e) => applyFontSize(e.target.value)}
                  className="px-2 py-1 text-xs border rounded cursor-pointer"
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
                  onClick={() =>
                    editor.chain().focus().toggleBulletList().run()
                  }
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <List className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleOrderedList().run()
                  }
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <ListOrdered className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("left").run()
                  }
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <AlignLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().setTextAlign("center").run()
                  }
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <AlignCenter className="w-4 h-4" />
                </button>
                <button
                  onClick={() =>
                    editor.chain().focus().toggleBlockquote().run()
                  }
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Quote className="w-4 h-4" />
                </button>
                <button
                  onClick={addLink}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Link className="w-4 h-4" />
                </button>
                <button
                  onClick={addImage}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Image className="w-4 h-4" />
                </button>
                <button
                  onClick={insertTable}
                  className="p-2 hover:bg-gray-100 rounded cursor-pointer"
                >
                  <Table className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </>
  );
};

export default Toolbar;
