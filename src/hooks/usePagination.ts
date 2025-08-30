import { useState, useEffect, useCallback, useRef } from "react";
import { Editor } from "@tiptap/react";

interface UsePaginationReturn {
  currentPage: number;
  totalPages: number;
  scrollContainerRef: React.RefObject<HTMLDivElement>;
}

const PAGE_HEIGHT = 1123;
const USABLE_HEIGHT = 947;
const PAGE_GAP = 24;

export const usePagination = (editor: Editor | null): UsePaginationReturn => {
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const calculationTimeoutRef = useRef<number | null>(null);

  const calculatePageMetrics = useCallback(() => {
    if (!editor?.view.dom || !scrollContainerRef.current) {
      return;
    }

    const proseMirrorElement = editor.view.dom as HTMLElement;
    const content =
      proseMirrorElement.textContent || proseMirrorElement.innerText || "";

    if (content.trim().length === 0) {
      setTotalPages(1);
      setCurrentPage(1);
      return;
    }

    const contentHeight = proseMirrorElement.scrollHeight;
    const actualContentHeight = contentHeight - 228;

    let calculatedPages = 1;
    if (actualContentHeight > USABLE_HEIGHT) {
      calculatedPages = Math.ceil(actualContentHeight / USABLE_HEIGHT);
    }

    const automaticBreaks =
      editor.getHTML().split('data-break-type="automatic"').length - 1;
    const manualBreaks =
      editor.getHTML().split('data-break-type="manual"').length - 1;

    calculatedPages = Math.max(calculatedPages, automaticBreaks + 1);

    setTotalPages(Math.max(1, calculatedPages));

    const { scrollTop } = scrollContainerRef.current;
    const effectivePageHeight = PAGE_HEIGHT + PAGE_GAP;
    const calculatedCurrentPage =
      Math.floor(scrollTop / effectivePageHeight) + 1;

    setCurrentPage(
      Math.max(1, Math.min(calculatedCurrentPage, calculatedPages))
    );
  }, [editor]);

  useEffect(() => {
    if (editor) {
      const debouncedCalculation = () => {
        if (calculationTimeoutRef.current) {
          clearTimeout(calculationTimeoutRef.current);
        }
        calculationTimeoutRef.current = window.setTimeout(
          calculatePageMetrics,
          100
        );
      };

      editor.on("update", debouncedCalculation);
      editor.on("selectionUpdate", debouncedCalculation);

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
        editor.off("selectionUpdate", debouncedCalculation);
        if (scrollContainer) {
          scrollContainer.removeEventListener("scroll", debouncedCalculation);
        }
        if (calculationTimeoutRef.current) {
          clearTimeout(calculationTimeoutRef.current);
        }
        observer.disconnect();
      };
    }
  }, [editor, calculatePageMetrics]);

  return { currentPage, totalPages, scrollContainerRef };
};
