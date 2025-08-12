import React from "react";
import {
  X,
  Minimize2,
  Maximize2,
  RotateCcw,
  Bot,
  Sparkles,
  Download,
} from "lucide-react";
import { motion } from "framer-motion";

interface ChatbotHeaderProps {
  onClose: () => void;
  onMinimize: () => void;
  onClear: () => void;
  onExport?: () => Promise<void>;
  isMinimized: boolean;
  currentTask?: string;
}

const ChatbotHeader: React.FC<ChatbotHeaderProps> = ({
  onClose,
  onMinimize,
  onClear,
  onExport,
  isMinimized,
  currentTask,
}) => {
  return (
    <div className="chatbot-header">
      <div className="chatbot-header-left">
        <div className="chatbot-header-avatar">
          <Bot className="w-5 h-5" />
          <motion.div
            className="chatbot-header-status"
            animate={{ scale: [1, 1.2, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />
        </div>
        <div className="chatbot-header-info">
          <h3 className="chatbot-header-title">
            AI Assistant
            <Sparkles className="w-3 h-3 ml-1 inline text-yellow-400" />
          </h3>
          <p className="chatbot-header-subtitle">
            {currentTask ? `Working on: ${currentTask}` : "Always here to help"}
          </p>
        </div>
      </div>

      <div className="chatbot-header-actions">
        <button
          onClick={onClear}
          className="chatbot-header-btn"
          title="Clear chat"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        {onExport && (
          <button
            onClick={onExport}
            className="chatbot-header-btn"
            title="Export chat"
          >
            <Download className="w-4 h-4" />
          </button>
        )}
        <button
          onClick={onMinimize}
          className="chatbot-header-btn"
          title={isMinimized ? "Maximize" : "Minimize"}
        >
          {isMinimized ? (
            <Maximize2 className="w-4 h-4" />
          ) : (
            <Minimize2 className="w-4 h-4" />
          )}
        </button>
        <button
          onClick={onClose}
          className="chatbot-header-btn chatbot-header-close"
          title="Close"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};

export default ChatbotHeader;
