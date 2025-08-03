import { useState, useEffect, useCallback } from "react";
import { Editor } from "@tiptap/react";
import { PAGE_CONFIG } from "../utils/constants";

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
  const [totalPages, setTotalPages] = useState(1);

  const calculatePages = useCallback(() => {
    if (!editor) {
      setTotalPages(1);
      setPages([{ id: 1, number: 1, content: null }]);
      return;
    }

    const content = editor.getHTML();
    if (!content || content === "<p></p>") {
      setTotalPages(1);
      setPages([{ id: 1, number: 1, content: null }]);
      return;
    }

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    tempDiv.style.position = "absolute";
    tempDiv.style.top = "-9999px";
    tempDiv.style.left = "-9999px";
    tempDiv.style.width = `${
      PAGE_CONFIG.A4_WIDTH_PX - PAGE_CONFIG.MARGIN_PX * 2
    }px`;
    tempDiv.style.fontSize = "14px";
    tempDiv.style.lineHeight = "1.6";
    tempDiv.style.fontFamily = "Times New Roman, serif";
    tempDiv.style.padding = "24px";
    tempDiv.style.visibility = "hidden";

    document.body.appendChild(tempDiv);

    setTimeout(() => {
      const contentHeight = tempDiv.scrollHeight;
      const pageContentHeight =
        PAGE_CONFIG.A4_HEIGHT_PX -
        PAGE_CONFIG.MARGIN_PX * 2 -
        PAGE_CONFIG.HEADER_HEIGHT_PX -
        PAGE_CONFIG.FOOTER_HEIGHT_PX;

      const calculatedPages = Math.max(
        1,
        Math.ceil(contentHeight / pageContentHeight)
      );

      if (calculatedPages !== totalPages) {
        setTotalPages(calculatedPages);

        const newPages: Page[] = Array.from(
          { length: calculatedPages },
          (_, index) => ({
            id: index + 1,
            number: index + 1,
            content: null,
          })
        );

        setPages(newPages);
      }

      document.body.removeChild(tempDiv);
    }, 50);
  }, [editor, totalPages]);

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
    totalPages,
  };
};
