import React, { useState, useEffect, useRef } from "react";
import {
  Search,
  Sparkles,
  BookOpen,
  Clock,
  Copy,
  ChevronDown,
} from "lucide-react";
import { useGemini } from "../../hooks/useGemini";
import { generateSearchSuggestions } from "../../services/geminiApi";
import { useApp } from "../../context/AppContext";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";

const ResearchPage = () => {
  const { generate, loading } = useGemini();
  const { state, dispatch } = useApp();
  const [query, setQuery] = useState("");
  const [result, setResult] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [loadingSuggestions, setLoadingSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState([]);
  const [showHistory, setShowHistory] = useState(false);
  const searchRef = useRef(null);
  const suggestionsRef = useRef(null);

  useEffect(() => {
    if (state.pageContent && state.pageContent.type === "research") {
      setQuery(state.pageContent.query || "");
      setResult(state.pageContent.result || "");
      dispatch({ type: "CLEAR_PAGE_CONTENT" });
    }

    const saved = localStorage.getItem("researchHistory");
    if (saved) {
      setSearchHistory(JSON.parse(saved));
    }
  }, [state.pageContent, dispatch]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target)
      ) {
        setShowSuggestions(false);
        setShowHistory(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const loadSuggestions = async (searchQuery) => {
    if (!searchQuery.trim() || searchQuery.length < 2) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    setLoadingSuggestions(true);
    try {
      const suggestionsText = await generateSearchSuggestions(searchQuery);
      const suggestionsList = suggestionsText
        .split("\n")
        .filter((s) => s.trim().length > 0)
        .slice(0, 5);
      setSuggestions(suggestionsList);
      setShowSuggestions(true);
    } catch (error) {
      console.error("Failed to load suggestions:", error);
      setSuggestions([]);
      setShowSuggestions(false);
    }
    setLoadingSuggestions(false);
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setQuery(value);

    if (value.trim().length >= 2) {
      const timeoutId = setTimeout(() => {
        loadSuggestions(value);
      }, 300);

      return () => clearTimeout(timeoutId);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleInputFocus = () => {
    if (query.trim().length === 0 && searchHistory.length > 0) {
      setShowHistory(true);
    } else if (suggestions.length > 0) {
      setShowSuggestions(true);
    }
  };

  const handleSearch = async () => {
    if (!query.trim()) {
      toast.warning("Please enter a search query", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
      return;
    }

    setShowSuggestions(false);
    setShowHistory(false);

    try {
      const prompt = `Research and provide comprehensive information about: ${query}. Include key facts, recent developments, and practical insights.`;
      const response = await generate(prompt, { maxTokens: 500 });

      setResult(response);

      const searchItem = {
        id: Date.now().toString(),
        query,
        result: response,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [searchItem, ...searchHistory].slice(0, 20);
      setSearchHistory(updatedHistory);
      localStorage.setItem("researchHistory", JSON.stringify(updatedHistory));

      const researchDocument = {
        title: `Research: ${query}`,
        type: "research",
        query,
        result: response,
        content: response,
        wordCount: response.split(" ").length,
      };

      dispatch({ type: "SAVE_DOCUMENT", payload: researchDocument });

      dispatch({
        type: "ADD_ACTIVITY",
        payload: {
          type: "research",
          title: `Research: ${query}`,
          content: response,
          documentId: searchItem.id,
        },
      });
    } catch (error) {
      console.error("Research failed:", error);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setQuery(suggestion);
    setShowSuggestions(false);
    setShowHistory(false);
  };

  const handleHistoryClick = (item) => {
    setQuery(item.query);
    setResult(item.result);
    setShowHistory(false);
  };

  const handleCopyResult = async () => {
    try {
      await navigator.clipboard.writeText(result);
      toast.success("Research results copied to clipboard!", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    } catch (error) {
      toast.error("Failed to copy text", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50 overflow-hidden">
      <div className="bg-white border-b border-gray-200 p-4 flex-shrink-0">
        <div className="flex items-center gap-2 mb-4">
          <BookOpen className="w-6 h-6 text-blue-500" />
          <h1 className="text-xl font-bold">AI Research Assistant</h1>
        </div>

        <div className="flex gap-2 relative" ref={suggestionsRef}>
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 z-10" />
            <input
              ref={searchRef}
              type="text"
              value={query}
              onChange={handleInputChange}
              onFocus={handleInputFocus}
              onKeyPress={(e) => e.key === "Enter" && handleSearch()}
              placeholder="What would you like to research today?"
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />

            {(showSuggestions || showHistory) && (
              <div className="absolute top-full left-0 right-0 bg-white border border-gray-200 rounded-lg shadow-lg mt-1 z-50 max-h-64 overflow-y-auto">
                {showHistory && searchHistory.length > 0 && (
                  <div>
                    <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center gap-2">
                      <Clock className="w-3 h-3" />
                      Recent Searches
                    </div>
                    {searchHistory.slice(0, 5).map((item) => (
                      <button
                        key={item.id}
                        onClick={() => handleHistoryClick(item)}
                        className="w-full text-left px-3 py-2 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0"
                      >
                        <div className="text-sm text-gray-900 truncate">
                          {item.query}
                        </div>
                        <div className="text-xs text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </div>
                      </button>
                    ))}
                  </div>
                )}

                {showSuggestions && (
                  <div>
                    {loadingSuggestions ? (
                      <div className="px-3 py-4">
                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <div className="w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                          Loading suggestions...
                        </div>
                      </div>
                    ) : suggestions.length > 0 ? (
                      <div>
                        <div className="px-3 py-2 text-xs font-medium text-gray-500 border-b border-gray-100 flex items-center gap-2">
                          <Sparkles className="w-3 h-3" />
                          Suggestions
                        </div>
                        {suggestions.map((suggestion, index) => (
                          <button
                            key={index}
                            onClick={() => handleSuggestionClick(suggestion)}
                            className="w-full text-left px-3 py-2 text-sm text-gray-900 hover:bg-gray-50 transition-colors border-b border-gray-50 last:border-b-0 truncate"
                          >
                            {suggestion}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                )}
              </div>
            )}
          </div>

          <button
            onClick={handleSearch}
            disabled={loading || !query.trim()}
            className="px-6 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors flex items-center gap-2"
          >
            {loading ? (
              <LoadingSpinner size="sm" message="Researching..." />
            ) : (
              <>
                <Sparkles className="w-4 h-4" />
                Research
              </>
            )}
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto">
        {result ? (
          <div className="p-6">
            <div className="bg-white rounded-lg border border-gray-200 p-6">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold text-gray-900">
                  Research Results
                </h2>
                <button
                  onClick={handleCopyResult}
                  className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded transition-colors"
                >
                  <Copy className="w-4 h-4" />
                  Copy
                </button>
              </div>

              <div className="prose max-w-none">
                <div className="whitespace-pre-wrap text-gray-800 leading-relaxed">
                  {result}
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Start Your Research
              </h3>
              <p className="text-gray-600 mb-4">
                Enter a topic above to begin researching with AI assistance
              </p>
              <div className="text-sm text-gray-500">
                💡 Tip: Type at least 2 characters to see suggestions
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ResearchPage;
