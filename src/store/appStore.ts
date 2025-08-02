import { create } from "zustand";
import { subscribeWithSelector } from "zustand/middleware";
import { AppState, Document, ChatMessage, Activity } from "../types";

interface AppStore extends AppState {
  setCurrentPage: (page: string) => void;
  setCurrentPageWithContent: (page: string, content: any) => void;
  clearPageContent: () => void;
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  addDocument: (document: Document) => void;
  saveDocument: (document: Document) => void;
  loadSavedDocuments: (documents: Document[]) => void;
  setCurrentDocument: (document: Document | null) => void;
  addChatMessage: (message: ChatMessage) => void;
  clearChat: () => void;
  setLoading: (loading: boolean) => void;
  addActivity: (activity: Omit<Activity, "id" | "timestamp">) => void;
  deleteDocument: (documentId: string) => void;
  deleteActivity: (activityId: string) => void;
}

export const useAppStore = create<AppStore>()(
  subscribeWithSelector((set, get) => ({
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

    setCurrentPage: (page: string) =>
      set({ currentPage: page, pageContent: null }),

    setCurrentPageWithContent: (page: string, content: any) =>
      set({ currentPage: page, pageContent: content }),

    clearPageContent: () => set({ pageContent: null }),

    toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),

    setSidebarOpen: (open: boolean) => set({ sidebarOpen: open }),

    addDocument: (document: Document) =>
      set((state) => ({ documents: [...state.documents, document] })),

    saveDocument: (document: Document) =>
      set((state) => {
        const savedDocs = [...state.savedDocuments, document];
        try {
          localStorage.setItem("savedDocuments", JSON.stringify(savedDocs));
        } catch (error) {
          console.error("Error saving to localStorage:", error);
        }
        return { savedDocuments: savedDocs };
      }),

    loadSavedDocuments: (documents: Document[]) =>
      set({ savedDocuments: documents }),

    setCurrentDocument: (document: Document | null) =>
      set({ currentDocument: document }),

    addChatMessage: (message: ChatMessage) =>
      set((state) => {
        const newChatHistory = [...state.chatHistory, message];
        try {
          localStorage.setItem("chatHistory", JSON.stringify(newChatHistory));
        } catch (error) {
          console.error("Error saving chat:", error);
        }
        return { chatHistory: newChatHistory };
      }),

    clearChat: () => {
      try {
        localStorage.setItem("chatHistory", JSON.stringify([]));
      } catch (error) {
        console.error("Error clearing chat:", error);
      }
      set({ chatHistory: [] });
    },

    setLoading: (loading: boolean) => set({ isLoading: loading }),

    addActivity: (activity: Omit<Activity, "id" | "timestamp">) =>
      set((state) => {
        const newActivity: Activity = {
          ...activity,
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
        };

        const existingIndex = state.todayActivities.findIndex(
          (a) => a.title === newActivity.title && a.type === newActivity.type
        );

        let activities: Activity[];
        if (existingIndex !== -1) {
          activities = [...state.todayActivities];
          activities[existingIndex] = newActivity;
        } else {
          activities = [newActivity, ...state.todayActivities].slice(0, 20);
        }

        try {
          localStorage.setItem("todayActivities", JSON.stringify(activities));
        } catch (error) {
          console.error("Error saving activity:", error);
        }
        return { todayActivities: activities };
      }),

    deleteDocument: (documentId: string) =>
      set((state) => {
        const filteredDocs = state.savedDocuments.filter(
          (doc) => doc.id !== documentId
        );
        const filteredActivities = state.todayActivities.filter(
          (activity) => activity.documentId !== documentId
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
          savedDocuments: filteredDocs,
          todayActivities: filteredActivities,
        };
      }),

    deleteActivity: (activityId: string) =>
      set((state) => {
        const updatedActivities = state.todayActivities.filter(
          (activity) => activity.id !== activityId
        );

        try {
          localStorage.setItem(
            "todayActivities",
            JSON.stringify(updatedActivities)
          );
        } catch (error) {
          console.error("Error deleting activity:", error);
        }

        return { todayActivities: updatedActivities };
      }),
  }))
);
