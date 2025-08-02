import React from "react";
import { Menu, X } from "lucide-react";
import { useApp } from "../../context/AppContext";

const MobileHeader = () => {
  const { state, dispatch } = useApp();

  const toggleSidebar = () => {
    dispatch({ type: "TOGGLE_SIDEBAR" });
  };

  return (
    <div className="lg:hidden bg-white border-b border-gray-200 p-4 flex items-center justify-between sticky top-0 z-50">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 bg-purple-600 rounded flex items-center justify-center">
          <span className="text-white font-bold text-sm">V</span>
        </div>
        <span className="font-semibold">Vettam.AI</span>
      </div>

      <button
        onClick={toggleSidebar}
        className="p-2 hover:bg-gray-100 rounded-lg"
      >
        {state.sidebarOpen ? (
          <X className="w-6 h-6" />
        ) : (
          <Menu className="w-6 h-6" />
        )}
      </button>
    </div>
  );
};

export default MobileHeader;
