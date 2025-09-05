import React, { useEffect, useRef } from "react";
import { Editor } from "@tiptap/react";
import { Bold, Italic, Palette, Underline } from "lucide-react"; // Removed Italic since it's unused

interface SimpleTextModalProps {
  editor: Editor | null;
  visible: boolean;
  position: { x: number; y: number };
  onClose: () => void;
}

const SimpleTextModal: React.FC<SimpleTextModalProps> = ({
  editor,
  visible,
  position,
  onClose,
}) => {
  const modalRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleOutsideClick = (event: MouseEvent) => {
      if (
        modalRef.current &&
        !modalRef.current.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    if (visible) {
      document.addEventListener("mousedown", handleOutsideClick);
    }

    return () => {
      document.removeEventListener("mousedown", handleOutsideClick);
    };
  }, [visible, onClose]);

  // FIX: Only return null if not visible OR editor is null
  if (!visible || !editor) return null;

  return (
    <div
      ref={modalRef}
      style={{
        position: "fixed",
        top: position.y - 50,
        left: position.x - 75,
        zIndex: 1000,
        background: "white",
        borderRadius: "8px",
        border: "1px solid #e5e7eb",
        padding: "8px 12px",
      }}
    >
      <button
        onClick={() => {
          editor.chain().focus().toggleBold().run();
        }}
      >
        <Bold className="w-4 h-4" />
      </button>

      <button onClick={() => editor.chain().focus().toggleItalic().run()}>
        <Italic className="w-4 h-4" />
      </button>

      <button onClick={() => editor.chain().focus().toggleUnderline().run()}>
        <Underline className="w-4 h-4" />
      </button>

      <button onClick={() => editor.chain().focus().setColor("#ef4444").run()}>
        <Palette className="w-4 h-4" />
      </button>
    </div>
  );
};

export default SimpleTextModal;
