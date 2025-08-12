import React, { Suspense } from "react";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import LoadingSpinner from "../Common/LoadingSpinner";
import FloatingChatbot from "../Chatbot/FloatingChatbot";

const DocumentEditor = React.lazy(() => import("../Pages/DocumentEditor"));
const ChatPage = React.lazy(() => import("../Pages/ChatPage"));
const ResearchPage = React.lazy(() => import("../Pages/ResearchPage"));
const TranslatePage = React.lazy(() => import("../Pages/TranslatePage"));
const SavedDocuments = React.lazy(() => import("../Pages/SavedDocuments"));

const AppLayout: React.FC = () => {
  const { state } = useApp();

  const renderCurrentPage = (): JSX.Element => {
    switch (state.currentPage) {
      case "chat":
        return <ChatPage />;
      case "research":
        return <ResearchPage />;
      case "translate":
        return <TranslatePage />;
      case "write":
      case "editor":
        return <DocumentEditor />;
      case "saved":
        return <SavedDocuments />;
      default:
        return <DocumentEditor />;
    }
  };

  return (
    <div className="app-layout h-screen flex flex-col bg-gray-100 overflow-hidden">
      <MobileHeader />
      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <div className="flex-1 flex flex-col overflow-hidden">
          <Suspense fallback={<LoadingSpinner />}>
            {renderCurrentPage()}
          </Suspense>
        </div>
      </div>
      <FloatingChatbot />
    </div>
  );
};

export default AppLayout;
