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
} from "lucide-react";
import ExportOptions from "./ExportOptions";

const Toolbar = ({ editor, onSave, content, title }) => {
  const [showExport, setShowExport] = useState(false);
  const [showFontSize, setShowFontSize] = useState(false);
  const [showFontFamily, setShowFontFamily] = useState(false);
  const [showMoreTools, setShowMoreTools] = useState(false);
  const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 0 });

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
    console.log("Custom setFontSize result:", result1);

    const result2 = editor
      .chain()
      .focus()
      .setMark("textStyle", { fontSize: size })
      .run();
    console.log("Direct textStyle result:", result2);

    setShowFontSize(false);
  };

  const setFontFamily = (family) => {
    console.log("Setting font family to:", family);

    const result1 = editor.chain().focus().setFontFamily(family).run();
    console.log("FontFamily extension result:", result1);

    const result2 = editor
      .chain()
      .focus()
      .setMark("textStyle", { fontFamily: family })
      .run();
    console.log("Direct textStyle fontFamily result:", result2);

    setShowFontFamily(false);
  };

  const getCurrentFontSize = () => {
    if (!editor) return "14px";
    const attrs = editor.getAttributes("textStyle");
    console.log("Current textStyle attrs:", attrs);
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

  const calculateDropdownPosition = (buttonRef) => {
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      return {
        top: rect.bottom + window.scrollY + 5,
        left: rect.left + window.scrollX,
      };
    }
    return { top: 0, left: 0 };
  };

  const handleFontFamilyClick = () => {
    const position = calculateDropdownPosition(fontFamilyButtonRef);
    setDropdownPosition(position);
    setShowFontFamily(!showFontFamily);
    setShowFontSize(false);
    setShowExport(false);
  };

  const handleFontSizeClick = () => {
    const position = calculateDropdownPosition(fontSizeButtonRef);
    setDropdownPosition(position);
    setShowFontSize(!showFontSize);
    setShowFontFamily(false);
    setShowExport(false);
  };

  const handleExportClick = () => {
    const position = calculateDropdownPosition(exportButtonRef);
    setDropdownPosition(position);
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
      if (
        !event.target.closest(".dropdown-container") &&
        !event.target.closest(".dropdown-menu")
      ) {
        setShowFontSize(false);
        setShowFontFamily(false);
        setShowMoreTools(false);
        setShowExport(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <>
      <div
        className="bg-white border-b border-gray-200 flex-shrink-0 relative"
        style={{ zIndex: 100 }}
      >
        {/* Main Toolbar */}
        <div className="p-2 sm:p-3 flex items-center gap-1 overflow-x-auto">
          {/* Undo/Redo  */}
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

          {/* Font controls  */}
          <div className="hidden md:flex items-center gap-2 mr-4">
            {/* Font Family */}
            <div className="relative dropdown-container">
              <button
                ref={fontFamilyButtonRef}
                onClick={handleFontFamilyClick}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[120px] justify-between"
              >
                <span className="truncate">{getCurrentFontFamily()}</span>
                <ChevronDown className="w-3 h-3 flex-shrink-0" />
              </button>
            </div>

            {/* Font Size */}
            <div className="relative dropdown-container">
              <button
                ref={fontSizeButtonRef}
                onClick={handleFontSizeClick}
                className="flex items-center gap-1 px-2 py-1.5 hover:bg-gray-100 rounded text-xs border border-gray-300 min-w-[70px] justify-between"
              >
                <span>{getCurrentFontSize()}</span>
                <ChevronDown className="w-3 h-3" />
              </button>
            </div>
          </div>

          <div className="hidden md:block w-px h-6 bg-gray-300 mr-4"></div>

          {/* Text Formatting */}
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

          {/* Lists -  */}
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

          {/* More Tools - Mobile */}
          <div className="relative md:hidden flex-shrink-0 dropdown-container">
            <button
              onClick={() => {
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
              <div className="absolute top-full right-0 mt-1 bg-white border border-gray-200 rounded-lg shadow-xl z-50 p-2 min-w-[280px] dropdown-menu">
                {/* Font controls for mobile */}
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
                      editor.isActive({ textAlign: "left" })
                        ? "bg-blue-100"
                        : ""
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

          {/* Desktop Tools - Hidden on mobile */}
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
              onClick={() =>
                editor.chain().focus().setTextAlign("center").run()
              }
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

          {/* Save and Export */}
          <div className="flex items-center gap-1 sm:gap-2 flex-shrink-0">
            <button
              onClick={onSave}
              className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs sm:text-sm"
            >
              <Save className="w-3 h-3 sm:w-4 sm:h-4" />
              <span className="hidden sm:inline">Save</span>
            </button>

            <div className="relative dropdown-container">
              <button
                ref={exportButtonRef}
                onClick={handleExportClick}
                className="flex items-center gap-1 sm:gap-2 px-2 sm:px-4 py-1.5 sm:py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-xs sm:text-sm"
              >
                <Download className="w-3 h-3 sm:w-4 sm:h-4" />
                <span className="hidden sm:inline">Export</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Font Family Dropdown */}
      {showFontFamily && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl min-w-[160px] max-h-64 overflow-y-auto dropdown-menu"
          style={{
            zIndex: 10000,
            left: `${dropdownPosition.left}px`,
            top: `${dropdownPosition.top}px`,
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

      {/* Font Size Dropdown */}
      {showFontSize && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl max-h-64 overflow-y-auto dropdown-menu"
          style={{
            zIndex: 10000,
            left: `${dropdownPosition.left}px`,
            top: `${dropdownPosition.top}px`,
          }}
        >
          {fontSizes.map((size) => (
            <button
              key={size.value}
              onClick={() => setFontSize(size.value)}
              className="block w-full text-left px-3 py-2 hover:bg-gray-100 text-sm transition-colors whitespace-nowrap"
              style={{ fontSize: "14px" }}
            >
              {size.label}
            </button>
          ))}
        </div>
      )}

      {/* Export Dropdown */}
      {showExport && (
        <div
          className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-48 dropdown-menu"
          style={{
            zIndex: 10000,
            left: `${dropdownPosition.left}px`,
            top: `${dropdownPosition.top}px`,
          }}
        >
          <h3 className="text-sm font-medium text-gray-900 mb-3">
            Export Document
          </h3>

          <div className="space-y-2">
            <button
              onClick={async () => {
                try {
                  const { exportToPDF } = await import("../../utils/pdfExport");
                  await exportToPDF(content, title);
                  toast.success("PDF exported successfully!");
                } catch (error) {
                  toast.error(`Export failed: ${error.message}`);
                }
                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <FileText className="w-4 h-4 text-red-500" />
              Export as PDF
            </button>

            <button
              onClick={async () => {
                try {
                  const { exportToWord } = await import(
                    "../../utils/pdfExport"
                  );
                  exportToWord(content, title);
                  toast.success("Word document exported successfully!");
                } catch (error) {
                  toast.error(`Export failed: ${error.message}`);
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
                try {
                  const { exportToHTML } = await import(
                    "../../utils/pdfExport"
                  );
                  exportToHTML(content, title);
                  toast.success("HTML file exported successfully!");
                } catch (error) {
                  toast.error(`Export failed: ${error.message}`);
                }
                setShowExport(false);
              }}
              className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
            >
              <Globe className="w-4 h-4 text-green-500" />
              Export as HTML
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export default Toolbar;
