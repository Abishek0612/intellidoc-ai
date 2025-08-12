import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search,
  FileText,
  MessageCircle,
  Languages,
  BookOpen,
  Code,
  Lightbulb,
  Calendar,
  CheckSquare,
  Download,
  Settings,
} from "lucide-react";

interface Command {
  id: string;
  label: string;
  description: string;
  icon: React.ComponentType<any>;
  action: string;
  category: string;
  keywords: string[];
}

interface CommandPaletteProps {
  onClose: () => void;
  onSelect: (action: string) => void;
}

const CommandPalette: React.FC<CommandPaletteProps> = ({
  onClose,
  onSelect,
}) => {
  const [search, setSearch] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const commands: Command[] = [
    {
      id: "1",
      label: "Create Document",
      description: "Start a new document with templates",
      icon: FileText,
      action: 'create document "Untitled"',
      category: "Documents",
      keywords: ["new", "write", "doc"],
    },
    {
      id: "2",
      label: "Create Letter",
      description: "Professional letter template",
      icon: FileText,
      action: 'create letter document "Business Letter"',
      category: "Documents",
      keywords: ["mail", "correspondence"],
    },
    {
      id: "3",
      label: "Create Report",
      description: "Structured report template",
      icon: FileText,
      action: 'create report document "Analysis Report"',
      category: "Documents",
      keywords: ["analysis", "summary"],
    },
    {
      id: "4",
      label: "Translate Text",
      description: "Quick translation between languages",
      icon: Languages,
      action: "open translator",
      category: "Tools",
      keywords: ["language", "convert"],
    },
    {
      id: "5",
      label: "Research Topic",
      description: "AI-powered research assistant",
      icon: Search,
      action: "open research",
      category: "Tools",
      keywords: ["search", "find", "investigate"],
    },
    {
      id: "6",
      label: "Generate Code",
      description: "Create code snippets with AI",
      icon: Code,
      action: "code",
      category: "Development",
      keywords: ["programming", "function", "script"],
    },
    {
      id: "7",
      label: "Brainstorm Ideas",
      description: "Get creative suggestions",
      icon: Lightbulb,
      action: "brainstorm ideas for your topic",
      category: "Creative",
      keywords: ["ideas", "creative", "suggestions"],
    },
    {
      id: "8",
      label: "Add Task",
      description: "Create a new to-do item",
      icon: CheckSquare,
      action: 'add task "New Task"',
      category: "Productivity",
      keywords: ["todo", "reminder"],
    },
    {
      id: "9",
      label: "Schedule Reminder",
      description: "Set a timed reminder",
      icon: Calendar,
      action: 'schedule reminder "Meeting" at 3pm',
      category: "Productivity",
      keywords: ["alarm", "notification"],
    },
    {
      id: "10",
      label: "Export Chat",
      description: "Save conversation history",
      icon: Download,
      action: "export chat",
      category: "System",
      keywords: ["save", "download", "backup"],
    },
  ];

  const filteredCommands = commands.filter((cmd) => {
    const searchLower = search.toLowerCase();
    return (
      cmd.label.toLowerCase().includes(searchLower) ||
      cmd.description.toLowerCase().includes(searchLower) ||
      cmd.category.toLowerCase().includes(searchLower) ||
      cmd.keywords.some((k) => k.includes(searchLower))
    );
  });

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((i) => Math.min(i + 1, filteredCommands.length - 1));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((i) => Math.max(i - 1, 0));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (filteredCommands[selectedIndex]) {
          onSelect(filteredCommands[selectedIndex].action);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [filteredCommands, selectedIndex, onClose, onSelect]);

  const groupedCommands = filteredCommands.reduce((acc, cmd) => {
    if (!acc[cmd.category]) acc[cmd.category] = [];
    acc[cmd.category].push(cmd);
    return acc;
  }, {} as Record<string, Command[]>);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="chatbot-command-overlay"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.95, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.95, opacity: 0 }}
          className="chatbot-command-palette"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="chatbot-command-header">
            <Search className="w-4 h-4 text-gray-400" />
            <input
              ref={inputRef}
              type="text"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setSelectedIndex(0);
              }}
              placeholder="Type a command or search..."
              className="chatbot-command-input"
            />
            <kbd className="chatbot-command-kbd">ESC</kbd>
          </div>

          <div className="chatbot-command-list">
            {Object.entries(groupedCommands).map(([category, cmds]) => (
              <div key={category} className="chatbot-command-group">
                <div className="chatbot-command-category">{category}</div>
                {cmds.map((cmd, idx) => {
                  const globalIndex = filteredCommands.indexOf(cmd);
                  return (
                    <button
                      key={cmd.id}
                      className={`chatbot-command-item ${
                        globalIndex === selectedIndex ? "selected" : ""
                      }`}
                      onClick={() => onSelect(cmd.action)}
                      onMouseEnter={() => setSelectedIndex(globalIndex)}
                    >
                      <cmd.icon className="w-4 h-4" />
                      <div className="chatbot-command-content">
                        <div className="chatbot-command-label">{cmd.label}</div>
                        <div className="chatbot-command-desc">
                          {cmd.description}
                        </div>
                      </div>
                      {globalIndex === selectedIndex && (
                        <kbd className="chatbot-command-kbd">↵</kbd>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          <div className="chatbot-command-footer">
            <div className="chatbot-command-hint">
              <kbd>↑↓</kbd> Navigate
            </div>
            <div className="chatbot-command-hint">
              <kbd>↵</kbd> Select
            </div>
            <div className="chatbot-command-hint">
              <kbd>ESC</kbd> Close
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

export default CommandPalette;
