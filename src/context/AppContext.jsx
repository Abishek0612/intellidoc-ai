import React, { createContext, useContext, useReducer, useEffect } from "react";

const AppContext = createContext();

const initialState = {
  currentPage: "editor",
  sidebarOpen: false,
  documents: [],
  savedDocuments: [],
  currentDocument: null,
  chatHistory: [],
  isLoading: false,
  searchResults: [],
  todayActivities: [],
  pageContent: null,
};

const appReducer = (state, action) => {
  switch (action.type) {
    case "SET_CURRENT_PAGE":
      return { ...state, currentPage: action.payload, pageContent: null };
    case "SET_CURRENT_PAGE_WITH_CONTENT":
      return {
        ...state,
        currentPage: action.payload.page,
        pageContent: action.payload.content,
      };
    case "CLEAR_PAGE_CONTENT":
      return { ...state, pageContent: null };
    case "TOGGLE_SIDEBAR":
      return { ...state, sidebarOpen: !state.sidebarOpen };
    case "SET_SIDEBAR_OPEN":
      return { ...state, sidebarOpen: action.payload };
    case "ADD_DOCUMENT":
      return { ...state, documents: [...state.documents, action.payload] };
    case "SAVE_DOCUMENT":
      const savedDocs = [...state.savedDocuments, action.payload];
      try {
        localStorage.setItem("savedDocuments", JSON.stringify(savedDocs));
      } catch (error) {
        console.error("Error saving to localStorage:", error);
      }
      return {
        ...state,
        savedDocuments: savedDocs,
      };
    case "LOAD_SAVED_DOCUMENTS":
      return { ...state, savedDocuments: action.payload };
    case "LOAD_TODAY_ACTIVITIES":
      return { ...state, todayActivities: action.payload };
    case "SET_CURRENT_DOCUMENT":
      return { ...state, currentDocument: action.payload };
    case "ADD_CHAT_MESSAGE":
      const newChatHistory = [...state.chatHistory, action.payload];
      try {
        localStorage.setItem("chatHistory", JSON.stringify(newChatHistory));
      } catch (error) {
        console.error("Error saving chat to localStorage:", error);
      }
      return { ...state, chatHistory: newChatHistory };
    case "SET_LOADING":
      return { ...state, isLoading: action.payload };
    case "SET_SEARCH_RESULTS":
      return { ...state, searchResults: action.payload };
    case "CLEAR_CHAT":
      try {
        localStorage.setItem("chatHistory", JSON.stringify([]));
      } catch (error) {
        console.error("Error clearing chat from localStorage:", error);
      }
      return { ...state, chatHistory: [] };
    case "ADD_ACTIVITY":
      const activity = {
        id: Date.now().toString(),
        type: action.payload.type,
        title: action.payload.title,
        timestamp: new Date().toISOString(),
        content: action.payload.content,
        query: action.payload.query,
        documentId: action.payload.documentId,
      };

      const existingIndex = state.todayActivities.findIndex(
        (a) => a.title === activity.title && a.type === activity.type
      );

      let activities;
      if (existingIndex !== -1) {
        activities = [...state.todayActivities];
        activities[existingIndex] = activity;
      } else {
        activities = [activity, ...state.todayActivities].slice(0, 20);
      }

      try {
        localStorage.setItem("todayActivities", JSON.stringify(activities));
      } catch (error) {
        console.error("Error saving activity:", error);
      }
      return { ...state, todayActivities: activities };
    case "DELETE_DOCUMENT":
      const filteredDocs = state.savedDocuments.filter(
        (doc) => doc.id !== action.payload
      );
      const filteredActivities = state.todayActivities.filter(
        (activity) => activity.documentId !== action.payload
      );
      try {
        localStorage.setItem("savedDocuments", JSON.stringify(filteredDocs));
        localStorage.setItem(
          "todayActivities",
          JSON.stringify(filteredActivities)
        );
      } catch (error) {
        console.error("Error deleting from localStorage:", error);
      }
      return {
        ...state,
        savedDocuments: filteredDocs,
        todayActivities: filteredActivities,
      };
    case "DELETE_ACTIVITY":
      const updatedActivities = state.todayActivities.filter(
        (activity) => activity.id !== action.payload
      );
      try {
        localStorage.setItem(
          "todayActivities",
          JSON.stringify(updatedActivities)
        );
      } catch (error) {
        console.error("Error deleting activity from localStorage:", error);
      }
      return {
        ...state,
        todayActivities: updatedActivities,
      };
    default:
      return state;
  }
};

export const AppProvider = ({ children }) => {
  const [state, dispatch] = useReducer(appReducer, initialState);

  useEffect(() => {
    try {
      const savedDocs = JSON.parse(
        localStorage.getItem("savedDocuments") || "[]"
      );
      const chatHistory = JSON.parse(
        localStorage.getItem("chatHistory") || "[]"
      );
      const todayActivities = JSON.parse(
        localStorage.getItem("todayActivities") || "[]"
      );

      dispatch({ type: "LOAD_SAVED_DOCUMENTS", payload: savedDocs });
      dispatch({ type: "LOAD_TODAY_ACTIVITIES", payload: todayActivities });
      if (chatHistory.length > 0) {
        chatHistory.forEach((msg) => {
          dispatch({ type: "ADD_CHAT_MESSAGE", payload: msg });
        });
      }
    } catch (error) {
      console.error("Error loading from localStorage:", error);
    }
  }, []);

  return (
    <AppContext.Provider value={{ state, dispatch }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error("useApp must be used within AppProvider");
  }
  return context;
};
