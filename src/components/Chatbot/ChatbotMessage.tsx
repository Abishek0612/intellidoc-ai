import React, { useState, useEffect } from "react";
import { Bot, User, Copy, CheckCircle } from "lucide-react";
import { motion } from "framer-motion";

interface ChatbotMessageProps {
  message: {
    id: string;
    type: "user" | "bot" | "system";
    content: string;
    timestamp: Date;
    actions?: Array<{ label: string; action: string }>;
  };
  isLast: boolean;
}

const ChatbotMessage: React.FC<ChatbotMessageProps> = ({ message, isLast }) => {
  const [copied, setCopied] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const getMessageIcon = () => {
    switch (message.type) {
      case "user":
        return <User className="w-4 h-4" />;
      case "system":
        return <Bot className="w-4 h-4 text-orange-500" />;
      default:
        return <Bot className="w-4 h-4" />;
    }
  };

  const getMessageClass = () => {
    switch (message.type) {
      case "user":
        return "chatbot-message-user";
      case "system":
        return "chatbot-message-system";
      default:
        return "chatbot-message-bot";
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: isVisible ? 1 : 0, y: isVisible ? 0 : 20 }}
      transition={{ duration: 0.3 }}
      className={`chatbot-message ${getMessageClass()}`}
    >
      <div className="chatbot-message-avatar">{getMessageIcon()}</div>

      <div className="chatbot-message-content">
        <div className="chatbot-message-bubble">
          <div className="chatbot-message-text">{message.content}</div>

          {message.actions && (
            <div className="chatbot-message-actions">
              {message.actions.map((action, index) => (
                <button
                  key={index}
                  className="chatbot-action-btn"
                  onClick={() =>
                    window.dispatchEvent(
                      new CustomEvent("chatbot-action", {
                        detail: action.action,
                      })
                    )
                  }
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="chatbot-message-meta">
          <span className="chatbot-message-time">
            {message.timestamp.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>

          {(message.type === "bot" || message.type === "system") && (
            <button
              onClick={handleCopy}
              className="chatbot-copy-btn"
              title="Copy message"
            >
              {copied ? (
                <CheckCircle className="w-3 h-3 text-green-500" />
              ) : (
                <Copy className="w-3 h-3" />
              )}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
};

export default ChatbotMessage;
