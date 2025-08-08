export interface Document {
  id: string;
  title: string;
  content: string;
  type: "document" | "legal-document" | "chat" | "research" | "translation";
  created: string;
  lastModified: string;
  wordCount: number;
  characterCount: number;
  preview: string;
  savedAt?: string;
  query?: string;
  result?: string;
  sourceText?: string;
  translatedText?: string;
  sourceLang?: string;
  targetLang?: string;
  watermark?: {
    enabled: boolean;
    text?: string;
    opacity?: number;
  };
  rulers?: boolean;
  margins?: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  };
}

export interface ChatMessage {
  type: "user" | "ai" | "error";
  content: string;
  timestamp: string;
}

export interface Activity {
  id: string;
  type: string;
  title: string;
  timestamp: string;
  content: string | ChatMessage[];
  query?: string;
  documentId: string;
}

export interface AppState {
  currentPage: string;
  sidebarOpen: boolean;
  documents: Document[];
  savedDocuments: Document[];
  currentDocument: Document | null;
  chatHistory: ChatMessage[];
  isLoading: boolean;
  searchResults: any[];
  todayActivities: Activity[];
  pageContent: any;
}

export interface Language {
  code: string;
  name: string;
  flag: string;
}

export interface FontOption {
  label: string;
  value: string;
}

export interface PageConfig {
  A4_WIDTH_MM: number;
  A4_HEIGHT_MM: number;
  A4_WIDTH_PX: number;
  A4_HEIGHT_PX: number;
  MARGIN_MM: number;
  MARGIN_PX: number;
  HEADER_HEIGHT_PX: number;
  FOOTER_HEIGHT_PX: number;
}

export interface EditorConfig {
  CONTENT_WIDTH: number;
  CONTENT_HEIGHT: number;
}
