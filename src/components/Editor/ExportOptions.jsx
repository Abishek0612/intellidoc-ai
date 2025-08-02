import React, { useState } from "react";
import { Download, FileText, File, Globe } from "lucide-react";
import { exportToPDF, exportToWord, exportToHTML } from "../../utils/pdfExport";
import { toast } from "react-toastify";

const ExportOptions = ({ content, title, onClose }) => {
  const [exporting, setExporting] = useState(false);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      switch (format) {
        case "pdf":
          await exportToPDF(content, title);
          toast.success("PDF exported successfully!");
          break;
        case "word":
          exportToWord(content, title);
          toast.success("Word document exported successfully!");
          break;
        case "html":
          exportToHTML(content, title);
          toast.success("HTML file exported successfully!");
          break;
        default:
          break;
      }
    } catch (error) {
      toast.error(`Export failed: ${error.message}`);
    }
    setExporting(false);
    onClose();
  };

  return (
    <div
      className="fixed bg-white border border-gray-200 rounded-lg shadow-2xl p-4 w-48"
      style={{
        zIndex: 10000,
        right: "20px",
        top: "140px",
      }}
    >
      <h3 className="text-sm font-medium text-gray-900 mb-3">
        Export Document
      </h3>

      <div className="space-y-2">
        <button
          onClick={() => handleExport("pdf")}
          disabled={exporting}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <FileText className="w-4 h-4 text-red-500" />
          Export as PDF
        </button>

        <button
          onClick={() => handleExport("word")}
          disabled={exporting}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <File className="w-4 h-4 text-blue-500" />
          Export as Word
        </button>

        <button
          onClick={() => handleExport("html")}
          disabled={exporting}
          className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded transition-colors"
        >
          <Globe className="w-4 h-4 text-green-500" />
          Export as HTML
        </button>
      </div>

      {exporting && (
        <div className="mt-3 text-xs text-gray-500 text-center">
          Exporting...
        </div>
      )}
    </div>
  );
};

export default ExportOptions;
