import React, { useState, useEffect } from "react";
import { FileText, Plus, Search, Calendar, Hash } from "lucide-react";
import { useApp } from "../../context/AppContext";

const DocumentSelector = ({ onDocumentSelect, onNewDocument }) => {
  const { state } = useApp();
  const [searchTerm, setSearchTerm] = useState("");
  const [documents, setDocuments] = useState([]);

  useEffect(() => {
    const saved = localStorage.getItem("editorDocuments");
    if (saved) {
      setDocuments(JSON.parse(saved));
    }
  }, []);

  const filteredDocuments = documents.filter(
    (doc) =>
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      doc.content.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="bg-white border-r border-gray-200 w-80 flex flex-col">
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Documents</h2>
          <button
            onClick={onNewDocument}
            className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm"
          >
            <Plus className="w-4 h-4" />
            New
          </button>
        </div>

        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search documents..."
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {filteredDocuments.length === 0 ? (
          <div className="p-4 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-2 text-gray-300" />
            <p className="text-sm">
              {documents.length === 0
                ? "No documents yet"
                : "No documents found"}
            </p>
            <button
              onClick={onNewDocument}
              className="mt-2 text-blue-500 hover:text-blue-600 text-sm"
            >
              Create your first document
            </button>
          </div>
        ) : (
          <div className="p-2 space-y-2">
            {filteredDocuments.map((doc) => (
              <div
                key={doc.id}
                onClick={() => onDocumentSelect(doc)}
                className="p-3 hover:bg-gray-100 rounded-lg cursor-pointer transition-colors"
              >
                <h3 className="font-medium text-gray-900 text-sm mb-1 truncate">
                  {doc.title}
                </h3>
                <p className="text-xs text-gray-600 mb-2 line-clamp-2">
                  {doc.preview}
                </p>
                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-3 h-3" />
                    {new Date(doc.lastModified).toLocaleDateString()}
                  </div>
                  <div className="flex items-center gap-1">
                    <Hash className="w-3 h-3" />
                    {doc.wordCount} words
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default DocumentSelector;
