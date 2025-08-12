import React, { useState, useRef, useEffect } from "react";
import {
  MessageCircle,
  X,
  Minimize2,
  Maximize2,
  Send,
  Sparkles,
  Bot,
  Mic,
  MicOff,
  Download,
  Upload,
  Command,
} from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useChatbot } from "../../hooks/useChatbot";
import ChatbotMessage from "./ChatbotMessage";
import QuickActions from "./QuickActions";
import TypingIndicator from "./TypingIndicator";
import SuggestedPrompts from "./SuggestedPrompts";
import ChatbotHeader from "./ChatbotHeader";
import CommandPalette from "./CommandPalette";
import "../../styles/chatbot.css";

const FloatingChatbot: React.FC = () => {
  const { dispatch } = useApp();
  const {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    executeCommand,
    exportChat,
    startListening,
    stopListening,
    isListening,
    context,
  } = useChatbot();

  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [inputMessage, setInputMessage] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(true);
  const [showCommandPalette, setShowCommandPalette] = useState(false);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isTyping]);

  useEffect(() => {
    if (messages.length > 0) {
      setShowSuggestions(false);
    }
  }, [messages]);

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setShowCommandPalette(true);
      }

      if ((e.metaKey || e.ctrlKey) && e.key === "/") {
        e.preventDefault();
        setIsOpen(!isOpen);
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [isOpen]);

  const handleSend = async () => {
    if (!inputMessage.trim() && !uploadedFile) return;

    let message = inputMessage;

    if (uploadedFile) {
      message = `[File uploaded: ${uploadedFile.name}] ${message}`;
      if (uploadedFile.type.startsWith("text/")) {
        const text = await uploadedFile.text();
        message += `\n\nFile content:\n${text.substring(0, 1000)}...`;
      }
      setUploadedFile(null);
    }

    setInputMessage("");
    setShowSuggestions(false);

    await sendMessage(message);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleQuickAction = (action: string) => {
    setShowSuggestions(false);
    executeCommand(action);
  };

  const handleSuggestedPrompt = (prompt: string) => {
    setInputMessage(prompt);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const handleVoiceToggle = () => {
    if (isListening) {
      stopListening();
    } else {
      startListening();
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setUploadedFile(file);
      setInputMessage(`Analyze this file: ${file.name}`);
    }
  };

  const handleExportChat = async () => {
    const chatContent = await exportChat();
    const blob = new Blob([chatContent], { type: "text/html" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `chat-export-${new Date().toISOString()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleCommandSelect = (command: string) => {
    setShowCommandPalette(false);
    executeCommand(command);
  };

  return (
    <>
      {/* Floating Button with Status Indicator */}
      <button
        className={`chatbot-fab ${isOpen ? "chatbot-fab-hidden" : ""}`}
        onClick={() => setIsOpen(true)}
        aria-label="Open Assistant"
      >
        <div className="chatbot-fab-icon">
          <Bot className="w-6 h-6" />
        </div>
        <div className="chatbot-fab-pulse"></div>
        {context?.currentTask && (
          <div className="chatbot-fab-badge">
            <span>
              {context.currentTask === "writing"
                ? "✍️"
                : context.currentTask === "research"
                ? "🔍"
                : context.currentTask === "coding"
                ? "💻"
                : "💬"}
            </span>
          </div>
        )}
      </button>

      {/* Chat Window */}
      <div
        className={`chatbot-container ${isOpen ? "chatbot-open" : ""} ${
          isMinimized ? "chatbot-minimized" : ""
        }`}
      >
        <ChatbotHeader
          onClose={() => setIsOpen(false)}
          onMinimize={() => setIsMinimized(!isMinimized)}
          onClear={clearChat}
          onExport={handleExportChat}
          isMinimized={isMinimized}
          currentTask={context?.currentTask}
        />

        {!isMinimized && (
          <>
            {/* Messages Area */}
            <div className="chatbot-messages">
              {messages.length === 0 && showSuggestions ? (
                <div className="chatbot-welcome">
                  <div className="chatbot-welcome-icon">
                    <Sparkles className="w-12 h-12 text-purple-500" />
                  </div>
                  <h3 className="chatbot-welcome-title">
                    Hi! I'm your AI Assistant
                  </h3>
                  <p className="chatbot-welcome-text">
                    I can help you write, translate, research, code, and much
                    more!
                  </p>

                  {/* Quick Stats */}
                  <div className="chatbot-stats">
                    <div className="chatbot-stat">
                      <span className="chatbot-stat-value">10+</span>
                      <span className="chatbot-stat-label">Features</span>
                    </div>
                    <div className="chatbot-stat">
                      <span className="chatbot-stat-value">∞</span>
                      <span className="chatbot-stat-label">Possibilities</span>
                    </div>
                    <div className="chatbot-stat">
                      <span className="chatbot-stat-value">24/7</span>
                      <span className="chatbot-stat-label">Available</span>
                    </div>
                  </div>

                  <SuggestedPrompts onSelect={handleSuggestedPrompt} />
                </div>
              ) : (
                <>
                  {messages.map((message, index) => (
                    <ChatbotMessage
                      key={message.id}
                      message={message}
                      isLast={index === messages.length - 1}
                    />
                  ))}
                  {isTyping && <TypingIndicator />}
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            {/* Quick Actions Bar */}
            <QuickActions onAction={handleQuickAction} />

            {/* Input Area with Advanced Features */}
            <div className="chatbot-input-wrapper">
              {uploadedFile && (
                <div className="chatbot-file-preview">
                  <span>📎 {uploadedFile.name}</span>
                  <button onClick={() => setUploadedFile(null)}>✕</button>
                </div>
              )}

              <div className="chatbot-input-container">
                <div className="chatbot-input-actions">
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="chatbot-input-action"
                    title="Upload file"
                  >
                    <Upload className="w-4 h-4" />
                  </button>

                  <button
                    onClick={handleVoiceToggle}
                    className={`chatbot-input-action ${
                      isListening ? "active" : ""
                    }`}
                    title="Voice input"
                  >
                    {isListening ? (
                      <MicOff className="w-4 h-4" />
                    ) : (
                      <Mic className="w-4 h-4" />
                    )}
                  </button>

                  <button
                    onClick={() => setShowCommandPalette(true)}
                    className="chatbot-input-action"
                    title="Command palette (Cmd+K)"
                  >
                    <Command className="w-4 h-4" />
                  </button>
                </div>

                <textarea
                  ref={inputRef}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  placeholder={
                    isListening
                      ? "Listening... Speak now!"
                      : "Ask anything or type / for commands..."
                  }
                  className="chatbot-input"
                  rows={1}
                  disabled={isListening}
                />

                <button
                  onClick={handleSend}
                  disabled={(!inputMessage.trim() && !uploadedFile) || isTyping}
                  className="chatbot-send-btn"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>

              <input
                ref={fileInputRef}
                type="file"
                onChange={handleFileUpload}
                style={{ display: "none" }}
                accept=".txt,.md,.doc,.docx,.pdf,.csv,.json"
              />
            </div>
          </>
        )}
      </div>

      {/* Command Palette Modal */}
      {showCommandPalette && (
        <CommandPalette
          onClose={() => setShowCommandPalette(false)}
          onSelect={handleCommandSelect}
        />
      )}
    </>
  );
};

export default FloatingChatbot;
