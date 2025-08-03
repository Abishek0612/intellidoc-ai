import React, { useState } from "react";
import { useApp } from "../../context/AppContext";
import { FileText, MessageCircle, Search, X, Languages } from "lucide-react";
import { toast } from "react-toastify";
import { Activity } from "../../types";

const TodaySection: React.FC = () => {
  const { state, dispatch } = useApp();
  const [showAll, setShowAll] = useState(false);

  const displayedActivities = showAll
    ? state.todayActivities
    : state.todayActivities.slice(0, 4);

  const getActivityIcon = (type: string): JSX.Element => {
    switch (type) {
      case "research":
        return <Search className="w-3 h-3" />;
      case "chat":
        return <MessageCircle className="w-3 h-3" />;
      case "translation":
        return <Languages className="w-3 h-3" />;
      default:
        return <FileText className="w-3 h-3" />;
    }
  };

  const handleActivityClick = (activity: Activity): void => {
    const documentToLoad = state.savedDocuments.find(
      (doc) => doc.id === activity.documentId
    );

    if (!documentToLoad) {
      toast.warn("Associated document not found. It may have been deleted.", {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
      });
      return;
    }

    const pageMap: Record<string, string> = {
      research: "research",
      chat: "chat",
      document: "write",
      "legal-document": "editor",
      translation: "translate",
    };

    const targetPage = pageMap[documentToLoad.type] || "editor";

    dispatch({
      type: "SET_CURRENT_PAGE_WITH_CONTENT",
      payload: {
        page: targetPage,
        content: documentToLoad,
      },
    });

    if (window.innerWidth < 1024) {
      dispatch({ type: "SET_SIDEBAR_OPEN", payload: false });
    }
  };

  const handleDeleteActivity = (
    e: React.MouseEvent,
    activityId: string
  ): void => {
    e.stopPropagation();

    dispatch({ type: "DELETE_ACTIVITY", payload: activityId });

    toast.success("Activity removed from Today", {
      position: window.innerWidth < 768 ? "top-center" : "top-right",
      autoClose: 2000,
    });
  };

  const formatTime = (timestamp: string): string => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return "Just now";
  };

  return (
    <div className="flex-1 p-4 overflow-y-auto">
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-medium text-purple-200">Today</h3>
      </div>

      {displayedActivities.length === 0 ? (
        <div className="text-xs text-purple-300 text-center py-4">
          No recent activities
        </div>
      ) : (
        <div className="space-y-2">
          {displayedActivities.map((activity) => (
            <div
              key={activity.id}
              className="group relative p-2 hover:bg-purple-500 rounded cursor-pointer transition-colors"
              onClick={() => handleActivityClick(activity)}
            >
              <div className="flex items-start gap-2">
                <div className="text-purple-300 mt-0.5 flex-shrink-0">
                  {getActivityIcon(activity.type)}
                </div>
                <div className="flex-1 min-w-0 pr-6">
                  <div className="text-xs text-purple-200 truncate">
                    {activity.title}
                  </div>
                  <div className="text-xs text-purple-300 mt-0.5">
                    {formatTime(activity.timestamp)}
                  </div>
                </div>
                <button
                  onClick={(e) => handleDeleteActivity(e, activity.id)}
                  className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 text-purple-300 hover:text-red-300 transition-all duration-200 p-1"
                  title="Remove from Today"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {state.todayActivities.length > 4 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs text-purple-300 mt-4 hover:text-white transition-colors w-full text-center"
        >
          {showAll ? "Show less" : "View more"}
        </button>
      )}
    </div>
  );
};

export default TodaySection;
