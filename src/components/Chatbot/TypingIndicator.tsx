import React from "react";
import { motion } from "framer-motion";

const TypingIndicator: React.FC = () => {
  return (
    <div className="chatbot-typing-container">
      <div className="chatbot-typing-indicator">
        <motion.div
          className="chatbot-typing-dot"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
        />
        <motion.div
          className="chatbot-typing-dot"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
        />
        <motion.div
          className="chatbot-typing-dot"
          animate={{ y: [0, -10, 0] }}
          transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
        />
      </div>
      <span className="chatbot-typing-text">AI is thinking...</span>
    </div>
  );
};

export default TypingIndicator;
