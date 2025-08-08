import React, { useState, useEffect } from "react";
import {
  ArrowRightLeft,
  Save,
  Copy,
  RotateCcw,
  Languages,
  Sparkles,
  FileText,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useGemini } from "../../hooks/useGemini";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";
import { Language } from "../../types";

interface TranslationItem {
  id: string;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

const TranslatePage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { generate, loading } = useGemini();
  const [sourceText, setSourceText] = useState("");
  const [translatedText, setTranslatedText] = useState("");
  const [sourceLang, setSourceLang] = useState("auto");
  const [targetLang, setTargetLang] = useState("spanish");
  const [translationHistory, setTranslationHistory] = useState<
    TranslationItem[]
  >([]);
  const [documentTitle, setDocumentTitle] = useState("");

  const languages: Language[] = [
    { code: "auto", name: "Auto-detect", flag: "🌐" },
    { code: "english", name: "English", flag: "🇺🇸" },
    { code: "spanish", name: "Spanish", flag: "🇪🇸" },
    { code: "french", name: "French", flag: "🇫🇷" },
    { code: "german", name: "German", flag: "🇩🇪" },
    { code: "italian", name: "Italian", flag: "🇮🇹" },
    { code: "portuguese", name: "Portuguese", flag: "🇵🇹" },
    { code: "russian", name: "Russian", flag: "🇷🇺" },
    { code: "chinese", name: "Chinese", flag: "🇨🇳" },
    { code: "japanese", name: "Japanese", flag: "🇯🇵" },
    { code: "korean", name: "Korean", flag: "🇰🇷" },
    { code: "arabic", name: "Arabic", flag: "🇸🇦" },
    { code: "hindi", name: "Hindi", flag: "🇮🇳" },
    { code: "tamil", name: "Tamil", flag: "🇮🇳" },
    { code: "telugu", name: "Telugu", flag: "🇮🇳" },
    { code: "malayalam", name: "Malayalam", flag: "🇮🇳" },
    { code: "kannada", name: "Kannada", flag: "🇮🇳" },
    { code: "bengali", name: "Bengali", flag: "🇧🇩" },
    { code: "marathi", name: "Marathi", flag: "🇮🇳" },
    { code: "gujarati", name: "Gujarati", flag: "🇮🇳" },
    { code: "punjabi", name: "Punjabi", flag: "🇮🇳" },
    { code: "urdu", name: "Urdu", flag: "🇵🇰" },
    { code: "dutch", name: "Dutch", flag: "🇳🇱" },
    { code: "swedish", name: "Swedish", flag: "🇸🇪" },
    { code: "norwegian", name: "Norwegian", flag: "🇳🇴" },
    { code: "danish", name: "Danish", flag: "🇩🇰" },
    { code: "finnish", name: "Finnish", flag: "🇫🇮" },
    { code: "polish", name: "Polish", flag: "🇵🇱" },
    { code: "czech", name: "Czech", flag: "🇨🇿" },
    { code: "hungarian", name: "Hungarian", flag: "🇭🇺" },
    { code: "turkish", name: "Turkish", flag: "🇹🇷" },
    { code: "hebrew", name: "Hebrew", flag: "🇮🇱" },
    { code: "thai", name: "Thai", flag: "🇹🇭" },
    { code: "vietnamese", name: "Vietnamese", flag: "🇻🇳" },
    { code: "indonesian", name: "Indonesian", flag: "🇮🇩" },
    { code: "malay", name: "Malay", flag: "🇲🇾" },
    { code: "filipino", name: "Filipino", flag: "🇵🇭" },
  ];

  useEffect(() => {
    const saved = localStorage.getItem("translationHistory");
    if (saved) {
      setTranslationHistory(JSON.parse(saved));
    }
  }, []);

  useEffect(() => {
    if (state.pageContent && state.pageContent.type === "translation") {
      setSourceText(state.pageContent.sourceText || "");
      setTranslatedText(state.pageContent.translatedText || "");
      setSourceLang(state.pageContent.sourceLang || "auto");
      setTargetLang(state.pageContent.targetLang || "spanish");
      setDocumentTitle(state.pageContent.title || "");
      dispatch({ type: "CLEAR_PAGE_CONTENT" });
    }
  }, [state.pageContent, dispatch]);

  const handleTranslate = async (): Promise<void> => {
    if (!sourceText.trim()) {
      toast.warning("Please enter text to translate", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
      return;
    }

    try {
      const sourceLanguage =
        sourceLang === "auto" ? "automatically detected language" : sourceLang;
      const prompt = `Translate the following text from ${sourceLanguage} to ${targetLang}. Only provide the translation, no explanations or additional text:

"${sourceText}"`;

      const translation = await generate(prompt);
      setTranslatedText(translation);

      const newTranslation: TranslationItem = {
        id: Date.now().toString(),
        sourceText,
        translatedText: translation,
        sourceLang,
        targetLang,
        timestamp: new Date().toISOString(),
      };

      const updatedHistory = [newTranslation, ...translationHistory].slice(
        0,
        50
      );
      setTranslationHistory(updatedHistory);
      localStorage.setItem(
        "translationHistory",
        JSON.stringify(updatedHistory)
      );
    } catch (error) {
      toast.error(
        `Translation failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`,
        {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
        }
      );
    }
  };

  const handleSwapLanguages = (): void => {
    if (sourceLang === "auto") {
      toast.info("Cannot swap when auto-detect is selected", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
      return;
    }

    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleCopy = async (text: string, type: string): Promise<void> => {
    try {
      await navigator.clipboard.writeText(text);
      toast.success(`${type} copied to clipboard!`, {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    } catch (error) {
      toast.error("Failed to copy text", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    }
  };

  const handleSaveTranslation = (): void => {
    if (!sourceText.trim() || !translatedText.trim()) {
      toast.warning("Please translate some text before saving", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
      return;
    }

    const docId = Date.now().toString();
    const finalTitle =
      documentTitle || `Translation - ${sourceText.substring(0, 30)}...`;

    const translationDocument = {
      title: finalTitle,
      type: "translation" as const,
      sourceText,
      translatedText,
      sourceLang,
      targetLang,
      content: `Source (${sourceLang}): ${sourceText}\n\nTranslation (${targetLang}): ${translatedText}`,
      wordCount: translatedText.split(" ").length,
      created: new Date().toISOString(),
      characterCount: translatedText.length,
      preview: translatedText.substring(0, 150),
    };

    dispatch({
      type: "SAVE_DOCUMENT",
      payload: {
        ...translationDocument,
        id: docId,
        lastModified: new Date().toISOString(),
      },
    });

    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        type: "translation",
        title: finalTitle,
        content: translationDocument.content,
        documentId: docId,
      },
    });

    toast.success("Translation saved successfully!", {
      position: window.innerWidth < 768 ? "top-center" : "top-right",
    });
  };

  const handleClear = (): void => {
    setSourceText("");
    setTranslatedText("");
    setDocumentTitle("");
  };

  const handleHistorySelect = (item: TranslationItem): void => {
    setSourceText(item.sourceText);
    setTranslatedText(item.translatedText);
    setSourceLang(item.sourceLang);
    setTargetLang(item.targetLang);
  };

  const getLanguageFlag = (code: string): string => {
    return languages.find((lang) => lang.code === code)?.flag || "🌐";
  };

  const getLanguageName = (code: string): string => {
    return languages.find((lang) => lang.code === code)?.name || code;
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-3 sm:p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-3 sm:mb-4">
          <div className="flex items-center gap-2">
            <Languages className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500" />
            <h1 className="text-lg sm:text-xl font-bold">AI Translator</h1>
          </div>
          <button
            onClick={handleSaveTranslation}
            disabled={!translatedText.trim()}
            className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm w-full sm:w-auto"
          >
            <Save className="w-4 h-4" />
            Save Translation
          </button>
        </div>

        <input
          type="text"
          value={documentTitle}
          onChange={(e) => setDocumentTitle(e.target.value)}
          placeholder="Enter translation title (optional)"
          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
        />
      </div>

      <div className="bg-white border-b border-gray-200 p-3 sm:p-4 flex-shrink-0">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4">
          <div className="w-full sm:flex-1 sm:max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              From
            </label>
            <select
              value={sourceLang}
              onChange={(e) => setSourceLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {languages.map((lang) => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>
          </div>

          <button
            onClick={handleSwapLanguages}
            disabled={sourceLang === "auto"}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed order-last sm:order-none sm:mt-6"
            title="Swap languages"
          >
            <ArrowRightLeft className="w-5 h-5 text-gray-600" />
          </button>

          <div className="w-full sm:flex-1 sm:max-w-xs">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              To
            </label>
            <select
              value={targetLang}
              onChange={(e) => setTargetLang(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              {languages
                .filter((lang) => lang.code !== "auto")
                .map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.flag} {lang.name}
                  </option>
                ))}
            </select>
          </div>
        </div>
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 bg-white border-b sm:border-b-0 sm:border-r border-gray-200">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {getLanguageFlag(sourceLang)} {getLanguageName(sourceLang)}
              </span>
              <span className="text-xs text-gray-500">
                {sourceText.length} chars
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopy(sourceText, "Source text")}
                disabled={!sourceText.trim()}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50"
                title="Copy source text"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button
                onClick={handleClear}
                className="p-1.5 hover:bg-gray-100 rounded text-gray-600"
                title="Clear all"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          <textarea
            value={sourceText}
            onChange={(e) => setSourceText(e.target.value)}
            placeholder="Enter text to translate..."
            className="w-full h-32 sm:h-48 p-3 sm:p-4 resize-none border-none outline-none text-gray-800 leading-relaxed"
          />

          <div className="p-3 sm:p-4 border-t border-gray-200">
            <button
              onClick={handleTranslate}
              disabled={!sourceText.trim() || loading}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
            >
              {loading ? (
                <LoadingSpinner size="sm" message="Translating..." />
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Translate
                </>
              )}
            </button>
          </div>
        </div>

        <div className="flex-1 bg-gray-50">
          <div className="flex items-center justify-between p-3 sm:p-4 border-b border-gray-200 bg-white">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {getLanguageFlag(targetLang)} {getLanguageName(targetLang)}
              </span>
              <span className="text-xs text-gray-500">
                {translatedText.length} chars
              </span>
            </div>
            <button
              onClick={() => handleCopy(translatedText, "Translation")}
              disabled={!translatedText.trim()}
              className="p-1.5 hover:bg-gray-100 rounded text-gray-600 disabled:opacity-50"
              title="Copy translation"
            >
              <Copy className="w-4 h-4" />
            </button>
          </div>

          <div className="h-32 sm:h-48 p-3 sm:p-4 bg-white overflow-y-auto">
            {translatedText ? (
              <div className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {translatedText}
              </div>
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500">
                <div className="text-center">
                  <Languages className="w-8 h-8 sm:w-12 sm:h-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-sm">Translation will appear here</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {translationHistory.length > 0 && (
        <div className="bg-white border-t border-gray-200 max-h-32 sm:max-h-48 overflow-y-auto flex-shrink-0">
          <div className="p-3 sm:p-4 border-b border-gray-100">
            <h3 className="text-sm font-medium text-gray-700 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Recent Translations
            </h3>
          </div>
          <div className="p-2 space-y-2">
            {translationHistory.slice(0, 5).map((item) => (
              <button
                key={item.id}
                onClick={() => handleHistorySelect(item)}
                className="w-full text-left p-3 hover:bg-gray-50 rounded-lg transition-colors"
              >
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <span>
                      {getLanguageFlag(item.sourceLang)}{" "}
                      {getLanguageName(item.sourceLang)}
                    </span>
                    <ArrowRightLeft className="w-3 h-3" />
                    <span>
                      {getLanguageFlag(item.targetLang)}{" "}
                      {getLanguageName(item.targetLang)}
                    </span>
                  </div>
                  <span className="text-xs text-gray-400">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 truncate">
                  {item.sourceText}
                </p>
                <p className="text-sm text-gray-600 truncate">
                  {item.translatedText}
                </p>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default TranslatePage;
