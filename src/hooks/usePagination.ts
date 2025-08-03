import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";
import { PAGE_CONFIG } from "../utils/constants";

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

export const usePagination = (editor: Editor | null): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const calculationTimeoutRef = useRef<number | null>(null);

  const calculatePageMetrics = useCallback(() => {
    if (!editor?.view.dom || !scrollContainerRef.current) {
      return;
    }

    const contentHeight = editor.view.dom.scrollHeight;
    const pageContentHeight =
      PAGE_CONFIG.A4_HEIGHT_PX - PAGE_CONFIG.MARGIN_PX * 2;
    const calculatedTotalPages = Math.max(
      1,
      Math.ceil(contentHeight / pageContentHeight)
    );

    const { scrollTop } = scrollContainerRef.current;
    const effectivePageHeight = PAGE_CONFIG.A4_HEIGHT_PX;
    const calculatedCurrentPage =
      Math.floor(scrollTop / effectivePageHeight) + 1;

    setTotalPages(calculatedTotalPages);
    setCurrentPage(
      Math.max(1, Math.min(calculatedCurrentPage, calculatedTotalPages))
    );
  }, [editor]);

  useEffect(() => {
    if (editor) {
      const debouncedCalculation = () => {
        if (calculationTimeoutRef.current)
          clearTimeout(calculationTimeoutRef.current);
        calculationTimeoutRef.current = window.setTimeout(
          calculatePageMetrics,
          250
        );
      };

      editor.on("update", debouncedCalculation);
      const scrollContainer = scrollContainerRef.current;
      if (scrollContainer) {
        scrollContainer.addEventListener("scroll", debouncedCalculation, {
          passive: true,
        });
      }

      const observer = new ResizeObserver(debouncedCalculation);
      observer.observe(editor.view.dom);

      setTimeout(debouncedCalculation, 100);

      return () => {
        editor.off("update", debouncedCalculation);
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", debouncedCalculation);
        }
        if (calculationTimeoutRef.current)
          clearTimeout(calculationTimeoutRef.current);
        observer.disconnect();
      };
    }
  }, [editor, calculatePageMetrics]);

  return { currentPage, totalPages, scrollContainerRef };
};
