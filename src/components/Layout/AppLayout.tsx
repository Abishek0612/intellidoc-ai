import React from "react";
import { useApp } from "../../context/AppContext";
import Sidebar from "./Sidebar";
import MobileHeader from "./MobileHeader";
import DocumentEditor from "../Pages/DocumentEditor";
import ChatPage from "../Pages/ChatPage";
import ResearchPage from "../Pages/ResearchPage";
import TranslatePage from "../Pages/TranslatePage";
import SavedDocuments from "../Pages/SavedDocuments";

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
          {renderCurrentPage()}
        </div>
      </div>
    </div>
  );
};

export default AppLayout;
