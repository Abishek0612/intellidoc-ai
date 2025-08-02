import { useState, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { PAGE_CONFIG, EDITOR_CONFIG } from "../utils/constants";

interface Page {
  id: number;
  number: number;
  content: any;
}

interface UsePaginationReturn {
  pages: Page[];
  currentPage: number;
  setCurrentPage: (page: number) => void;
  totalPages: number;
}

export const usePagination = (editor: Editor | null): UsePaginationReturn => {
  const [pages, setPages] = useState<Page[]>([]);
  const [currentPage, setCurrentPage] = useState(1);

  const calculatePages = useCallback(() => {
    if (!editor) return;

    const content = editor.view.dom;
    const contentHeight = content.scrollHeight;
    const pageCount =
      Math.ceil(contentHeight / EDITOR_CONFIG.CONTENT_HEIGHT) || 1;

    const newPages: Page[] = Array.from({ length: pageCount }, (_, index) => ({
      id: index + 1,
      number: index + 1,
      content: null,
    }));

    setPages(newPages);
  }, [editor]);

  useEffect(() => {
    if (editor) {
      calculatePages();

      const updateHandler = (): void => {
        calculatePages();
      };

      editor.on("update", updateHandler);
      editor.on("selectionUpdate", updateHandler);

      return () => {
        editor.off("update", updateHandler);
        editor.off("selectionUpdate", updateHandler);
      };
    }
  }, [editor, calculatePages]);

  return {
    pages,
    currentPage,
    setCurrentPage,
    totalPages: pages.length,
  };
};
