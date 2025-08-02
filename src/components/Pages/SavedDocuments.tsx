import React, { useState, useEffect } from "react";
import {
  FileText,
  Search,
  Trash2,
  ExternalLink,
  Calendar,
  Hash,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { getSavedDocuments } from "../../services/localStorage";
import { toast } from "react-toastify";
import { Document } from "../../types";

const SavedDocuments: React.FC = () => {
  const { state, dispatch } = useApp();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedType, setSelectedType] = useState("all");

  useEffect(() => {
    loadDocuments();
  }, [state.savedDocuments]);

  const loadDocuments = (): void => {
    const saved = getSavedDocuments();
    setDocuments(saved.reverse());
  };

  const handleDelete = async (
    documentId: string,
    e: React.MouseEvent
  ): Promise<void> => {
    e.stopPropagation();
    if (window.confirm("Are you sure you want to delete this document?")) {
      dispatch({ type: "DELETE_DOCUMENT", payload: documentId });
      toast.success("Document deleted successfully", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    }
  };

  const handleOpenDocument = (document: Document): void => {
    const pageMap: Record<string, string> = {
      research: "research",
      chat: "chat",
      document: "write",
      "legal-document": "editor",
      translation: "translate",
    };

    const targetPage = pageMap[document.type] || "editor";

    dispatch({
      type: "SET_CURRENT_PAGE_WITH_CONTENT",
      payload: {
        page: targetPage,
        content: document,
      },
    });

    if (window.innerWidth < 1024) {
      dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
    }
  };

  const filteredDocuments = documents.filter((doc) => {
    const matchesSearch =
      doc.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (doc.content &&
        doc.content.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesType = selectedType === "all" || doc.type === selectedType;
    return matchesSearch && matchesType;
  });

  const getTypeIcon = (type: string): string => {
    switch (type) {
      case "chat":
        return "💬";
      case "research":
        return "🔍";
      case "document":
        return "📄";
      case "translation":
        return "🌐";
      default:
        return "📝";
    }
  };

  const getTypeColor = (type: string): string => {
    switch (type) {
      case "chat":
        return "bg-blue-100 text-blue-800";
      case "research":
        return "bg-green-100 text-green-800";
      case "document":
        return "bg-purple-100 text-purple-800";
      case "translation":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 lg:p-6">
        <h1 className="text-xl lg:text-2xl font-bold mb-4">Saved Documents</h1>

        <div className="flex flex-col sm:flex-row gap-2 lg:gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Search documents..."
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
            />
          </div>

          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="px-3 lg:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm lg:text-base"
          >
            <option value="all">All Types</option>
            <option value="chat">Chats</option>
            <option value="research">Research</option>
            <option value="document">Documents</option>
          </select>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 lg:p-6">
        {filteredDocuments.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <FileText className="w-12 lg:w-16 h-12 lg:h-16 mx-auto mb-4 text-gray-300" />
            <h3 className="text-lg lg:text-xl font-medium mb-2">
              {documents.length === 0
                ? "No Saved Documents"
                : "No Documents Found"}
            </h3>
            <p className="text-sm lg:text-base">
              {documents.length === 0
                ? "Start creating documents, chats, or research to see them here."
                : "Try adjusting your search or filter criteria."}
            </p>
          </div>
        ) : (
          <div className="grid gap-3 lg:gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {filteredDocuments.map((document) => (
              <div
                key={document.id}
                className="bg-white rounded-lg border border-gray-200 p-3 lg:p-4 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() => handleOpenDocument(document)}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base lg:text-lg">
                      {getTypeIcon(document.type)}
                    </span>
                    <span
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getTypeColor(
                        document.type
                      )}`}
                    >
                      {document.type}
                    </span>
                  </div>
                  <button
                    onClick={(e) => handleDelete(document.id, e)}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-3 h-3 lg:w-4 lg:h-4" />
                  </button>
                </div>

                <h3 className="font-medium text-gray-900 mb-2 line-clamp-2 text-sm lg:text-base">
                  {document.title}
                </h3>

                <p className="text-xs lg:text-sm text-gray-600 mb-3 line-clamp-3">
                  {typeof document.content === "string"
                    ? document.content.substring(0, 100) + "..."
                    : "Chat conversation"}
                </p>

                <div className="flex items-center justify-between text-xs text-gray-500">
                  <div className="flex items-center gap-2 lg:gap-3">
                    <div className="flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      <span className="hidden sm:inline">
                        {new Date(
                          document.savedAt || document.lastModified
                        ).toLocaleDateString()}
                      </span>
                      <span className="sm:hidden">
                        {new Date(
                          document.savedAt || document.lastModified
                        ).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                    </div>
                    {document.wordCount && (
                      <div className="flex items-center gap-1">
                        <Hash className="w-3 h-3" />
                        {document.wordCount} words
                      </div>
                    )}
                  </div>
                  <ExternalLink className="w-3 h-3" />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default SavedDocuments;
