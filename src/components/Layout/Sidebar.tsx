import React, { useEffect } from "react";
import { MessageCircle, Search, Bookmark, FileText, X } from "lucide-react";
import { useApp } from "../../context/AppContext";
import TodaySection from "../Sidebar/TodaySection";

interface MenuItem {
  id: string;
  icon: React.ComponentType<any>;
  label: string;
  action: () => void;
}

const Sidebar: React.FC = () => {
  const { state, dispatch } = useApp();

  const setCurrentPage = (page: string): void => {
    dispatch({ type: "SET_CURRENT_PAGE", payload: page });
    if (window.innerWidth < 1024) {
      dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
    }
  };

  const handleNewChat = (): void => {
    dispatch({ type: "CLEAR_CHAT" });
    setCurrentPage("chat");
  };

  const menuItems: MenuItem[] = [
    {
      id: "chat",
      icon: MessageCircle,
      label: "New Chat",
      action: () => handleNewChat(),
    },
    {
      id: "research",
      icon: Search,
      label: "Research",
      action: () => setCurrentPage("research"),
    },
    {
      id: "translate",
      icon: MessageCircle,
      label: "Translate",
      action: () => setCurrentPage("translate"),
    },
    {
      id: "write",
      icon: FileText,
      label: "Write",
      action: () => setCurrentPage("write"),
    },
  ];

  const toolItems: MenuItem[] = [
    {
      id: "editor",
      icon: FileText,
      label: "Editor",
      action: () => setCurrentPage("editor"),
    },
    {
      id: "bookmarks",
      icon: Bookmark,
      label: "Bookmarks",
      action: () => setCurrentPage("saved"),
    },
  ];

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent): void => {
      const target = event.target as Element;
      if (window.innerWidth < 1024 && state.sidebarOpen) {
        const sidebar = document.getElementById("sidebar");
        if (sidebar && !sidebar.contains(target)) {
          dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
        }
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [state.sidebarOpen, dispatch]);

  useEffect(() => {
    const handleResize = (): void => {
      if (window.innerWidth >= 1024) {
        dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
      }
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [dispatch]);

  return (
    <>
      {state.sidebarOpen && (
        <div className="lg:hidden fixed inset-0 bg-black bg-opacity-50 z-40" />
      )}

      <div
        id="sidebar"
        className={`
          fixed lg:relative inset-y-0 left-0 z-50 lg:z-auto
          w-80 bg-gradient-to-b from-purple-600 to-purple-700 text-white flex flex-col
          transform transition-transform duration-300 ease-in-out
          ${
            state.sidebarOpen
              ? "translate-x-0"
              : "-translate-x-full lg:translate-x-0"
          }
        `}
      >
        <div className="lg:hidden absolute top-4 right-4">
          <button
            onClick={() =>
              dispatch({ type: "SET_SIDEBAR_OPEN", payload: false })
            }
            className="p-2 hover:bg-purple-500 rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-4 border-b border-purple-500">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 bg-white rounded flex items-center justify-center">
              <span className="text-purple-600 font-bold text-sm">V</span>
            </div>
            <span className="font-semibold">Vettam.AI</span>
          </div>

          <button
            onClick={handleNewChat}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
          >
            New Chat
          </button>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-purple-200 mb-3">Features</h3>

          <div className="space-y-1">
            {menuItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  state.currentPage === item.id
                    ? "bg-purple-500"
                    : "hover:bg-purple-500"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="p-4 space-y-2">
          <h3 className="text-sm font-medium text-purple-200 mb-3">Tools</h3>

          <div className="space-y-1">
            {toolItems.map((item) => (
              <button
                key={item.id}
                onClick={item.action}
                className={`w-full flex items-center gap-3 p-2 rounded cursor-pointer transition-colors ${
                  state.currentPage === item.id
                    ? "bg-purple-500"
                    : "hover:bg-purple-500"
                }`}
              >
                <item.icon className="w-4 h-4" />
                <span className="text-sm">{item.label}</span>
              </button>
            ))}
          </div>
        </div>

        <TodaySection />

        <div className="p-4 border-t border-purple-500">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-medium">MS</span>
            </div>
            <div>
              <div className="text-sm font-medium">Michael Smith</div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
