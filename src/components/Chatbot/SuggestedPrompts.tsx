import React from "react";
import { motion } from "framer-motion";
import { Zap } from "lucide-react";

interface SuggestedPromptsProps {
  onSelect: (prompt: string) => void;
}

const SuggestedPrompts: React.FC<SuggestedPromptsProps> = ({ onSelect }) => {
  const prompts = [
    "📝 Create a new document",
    "🌍 Translate some text",
    "🔍 Research a topic",
    "💬 Start a conversation",
    "📚 Show my saved documents",
    "✨ Help me write an email",
    "🎯 What can you do?",
    "🚀 Show me around",
  ];

  return (
    <div className="chatbot-suggested-prompts">
      <div className="chatbot-suggested-header">
        <Zap className="w-3 h-3" />
        <span>Try asking:</span>
      </div>
      <div className="chatbot-suggested-grid">
        {prompts.map((prompt, index) => (
          <motion.button
            key={index}
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: index * 0.05 }}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="chatbot-suggested-btn"
            onClick={() => onSelect(prompt)}
          >
            {prompt}
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default SuggestedPrompts;
