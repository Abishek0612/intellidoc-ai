import React from "react";
import {
  FileText,
  MessageCircle,
  Languages,
  Search,
  BookOpen,
  Sparkles,
} from "lucide-react";
import { motion } from "framer-motion";

interface QuickActionsProps {
  onAction: (action: string) => void;
}

const QuickActions: React.FC<QuickActionsProps> = ({ onAction }) => {
  const actions = [
    { icon: FileText, label: "New Document", action: "open editor" },
    { icon: MessageCircle, label: "Start Chat", action: "open chat" },
    { icon: Languages, label: "Translate", action: "open translator" },
    { icon: Search, label: "Research", action: "open research" },
    { icon: BookOpen, label: "My Documents", action: "show documents" },
  ];

  return (
    <div className="chatbot-quick-actions">
      <div className="chatbot-quick-actions-header">
        <Sparkles className="w-3 h-3" />
        <span>Quick Actions</span>
      </div>
      <div className="chatbot-quick-actions-grid">
        {actions.map((item, index) => (
          <motion.button
            key={index}
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="chatbot-quick-action"
            onClick={() => onAction(item.action)}
            title={item.label}
          >
            <item.icon className="w-4 h-4" />
            <span>{item.label}</span>
          </motion.button>
        ))}
      </div>
    </div>
  );
};

export default QuickActions;
