import React, { useState, useEffect } from "react";
import { Send, Save } from "lucide-react";
import { useApp } from "../../context/AppContext";
import { useGemini } from "../../hooks/useGemini";
import LoadingSpinner from "../Common/LoadingSpinner";
import { toast } from "react-toastify";
import { ChatMessage } from "../../types";

const ChatPage: React.FC = () => {
  const { state, dispatch } = useApp();
  const { generate, loading } = useGemini();
  const [input, setInput] = useState("");
  const [chatTitle, setChatTitle] = useState("");

  useEffect(() => {
    if (state.pageContent && state.pageContent.type === "chat") {
      setChatTitle(state.pageContent.title);
      dispatch({ type: "CLEAR_PAGE_CONTENT" });
    }
  }, [state.pageContent, dispatch]);

  const handleSendMessage = async (): Promise<void> => {
    if (!input.trim()) return;

    const userMessage: ChatMessage = {
      type: "user",
      content: input,
      timestamp: new Date().toISOString(),
    };

    dispatch({ type: "ADD_CHAT_MESSAGE", payload: userMessage });

    if (!chatTitle) {
      setChatTitle(input.length > 30 ? input.substring(0, 30) + "..." : input);
    }

    const messageInput = input;
    setInput("");

    try {
      const response = await generate(messageInput);
      const aiMessage: ChatMessage = {
        type: "ai",
        content: response,
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: aiMessage });
    } catch (error) {
      const errorMessage: ChatMessage = {
        type: "error",
        content:
          "Sorry, I encountered an error. Please check your API key and try again.",
        timestamp: new Date().toISOString(),
      };
      dispatch({ type: "ADD_CHAT_MESSAGE", payload: errorMessage });
      toast.error("Failed to get AI response", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
    }
  };

  const handleSaveChat = (): void => {
    const docId = Date.now().toString();
    const finalChatTitle =
      chatTitle || `Chat - ${new Date().toLocaleDateString()}`;

    const chatDocument = {
      title: finalChatTitle,
      type: "chat" as const,
      content: JSON.stringify(state.chatHistory),
      wordCount: state.chatHistory.reduce(
        (acc, msg) => acc + msg.content.split(" ").length,
        0
      ),
      created: new Date().toISOString(),
      characterCount: state.chatHistory.reduce(
        (acc, msg) => acc + msg.content.length,
        0
      ),
      preview:
        state.chatHistory.length > 0
          ? state.chatHistory[0].content.substring(0, 150)
          : "",
    };

    dispatch({
      type: "SAVE_DOCUMENT",
      payload: {
        ...chatDocument,
        id: docId,
        lastModified: new Date().toISOString(),
      },
    });

    dispatch({
      type: "ADD_ACTIVITY",
      payload: {
        type: "chat",
        title: finalChatTitle,
        content: state.chatHistory,
        documentId: docId,
      },
    });

    toast.success("Chat saved successfully!", {
      position: window.innerWidth < 768 ? "top-center" : "top-right",
    });
  };

  const handleKeyPress = (
    e: React.KeyboardEvent<HTMLTextAreaElement>
  ): void => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col h-screen bg-gray-50">
      <div className="bg-white border-b border-gray-200 p-4 flex items-center justify-between">
        <div className="flex-1 mr-4">
          <input
            type="text"
            placeholder="Enter chat title..."
            value={chatTitle}
            onChange={(e) => setChatTitle(e.target.value)}
            className="text-lg font-medium border-none outline-none bg-transparent w-full"
          />
          <p className="text-sm text-gray-500">AI-powered conversation</p>
        </div>
        <button
          onClick={handleSaveChat}
          disabled={state.chatHistory.length === 0}
          className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors text-sm"
        >
          <Save className="w-4 h-4" />
          <span className="hidden sm:inline">Save Chat</span>
          <span className="sm:hidden">Save</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {state.chatHistory.length === 0 ? (
          <div className="text-center text-gray-500 mt-20">
            <h3 className="text-xl font-medium mb-2">Start a conversation</h3>
            <p>Ask me anything, and I'll help you with AI-powered responses.</p>
          </div>
        ) : (
          state.chatHistory.map((message, index) => (
            <div
              key={index}
              className={`flex ${
                message.type === "user" ? "justify-end" : "justify-start"
              }`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  message.type === "user"
                    ? "bg-blue-500 text-white"
                    : message.type === "error"
                    ? "bg-red-100 text-red-700 border border-red-200"
                    : "bg-white text-gray-800 border border-gray-200"
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                <p
                  className={`text-xs mt-1 ${
                    message.type === "user" ? "text-blue-200" : "text-gray-500"
                  }`}
                >
                  {new Date(message.timestamp).toLocaleTimeString()}
                </p>
              </div>
            </div>
          ))
        )}

        {loading && (
          <div className="flex justify-start">
            <div className="bg-white border border-gray-200 rounded-lg p-4">
              <LoadingSpinner size="sm" message="AI is thinking..." />
            </div>
          </div>
        )}
      </div>

      <div className="bg-white border-t border-gray-200 p-4">
        <div className="flex gap-2">
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="Type your message..."
            rows={1}
            className="flex-1 resize-none border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
          />
          <button
            onClick={handleSendMessage}
            disabled={!input.trim() || loading}
            className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:bg-gray-300 transition-colors"
          >
            <Send className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChatPage;
