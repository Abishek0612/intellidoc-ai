import React, { useState, useRef, useCallback, useEffect } from "react";

interface RulerProps {
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
  onMarginsChange?: (margins: {
    left: number;
    right: number;
    top: number;
    bottom: number;
  }) => void;
}

const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
  onMarginsChange,
}) => {
  const [isDragging, setIsDragging] = useState<string | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartY, setDragStartY] = useState(0);
  const [initialMargins, setInitialMargins] = useState({
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
  });
  const [tabStops, setTabStops] = useState<number[]>([]);
  const rulerRef = useRef<HTMLDivElement>(null);

  const handleMouseMove = useCallback(
    (e: MouseEvent) => {
      if (!isDragging || !onMarginsChange) return;

      const deltaX = e.clientX - dragStartX;
      const deltaY = e.clientY - dragStartY;

      let newMargins = { ...initialMargins };

      switch (isDragging) {
        case "left":
          newMargins.left = Math.max(
            20,
            Math.min(width / 2, initialMargins.left + deltaX)
          );
          break;
        case "right":
          newMargins.right = Math.max(
            20,
            Math.min(width / 2, initialMargins.right - deltaX)
          );
          break;
        case "top":
          newMargins.top = Math.max(
            20,
            Math.min(height / 2, initialMargins.top + deltaY)
          );
          break;
        case "bottom":
          newMargins.bottom = Math.max(
            20,
            Math.min(height / 2, initialMargins.bottom - deltaY)
          );
          break;
      }

      onMarginsChange(newMargins);
    },
    [
      isDragging,
      dragStartX,
      dragStartY,
      initialMargins,
      width,
      height,
      onMarginsChange,
    ]
  );

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }, [handleMouseMove]);

  useEffect(() => {
    if (isDragging) {
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
      document.body.style.cursor =
        isDragging.includes("left") || isDragging.includes("right")
          ? "ew-resize"
          : "ns-resize";
      document.body.style.userSelect = "none";
    }

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [isDragging, handleMouseMove, handleMouseUp]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, type: string) => {
      e.preventDefault();
      e.stopPropagation();

      setIsDragging(type);
      setDragStartX(e.clientX);
      setDragStartY(e.clientY);
      setInitialMargins({
        left: marginLeft,
        right: marginRight,
        top: marginTop,
        bottom: marginBottom,
      });
    },
    [marginLeft, marginRight, marginTop, marginBottom]
  );

  const handleRulerClick = useCallback(
    (e: React.MouseEvent, orientation: "horizontal" | "vertical") => {
      if (isDragging) return;

      const rect = e.currentTarget.getBoundingClientRect();

      if (orientation === "horizontal") {
        const clickX = e.clientX - rect.left;
        if (clickX > marginLeft && clickX < width - marginRight) {
          setTabStops((prev) => [...prev, clickX].sort((a, b) => a - b));
        }
      }
    },
    [isDragging, marginLeft, marginRight, width]
  );

  const removeTabStop = useCallback((index: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setTabStops((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const generateHorizontalMarks = () => {
    const marks = [];
    const increment = 20;

    for (let i = 0; i <= width; i += increment) {
      const isMajor = i % 100 === 0;
      const isMedium = i % 50 === 0;

      marks.push(
        <div
          key={`h-${i}`}
          className="absolute bg-gray-700 pointer-events-none"
          style={{
            left: `${i}px`,
            bottom: 0,
            width: "1px",
            height: isMajor ? "15px" : isMedium ? "10px" : "6px",
          }}
        />
      );

      if (isMajor && i > 0) {
        const inches = Math.round((i / 96) * 10) / 10;
        marks.push(
          <div
            key={`h-label-${i}`}
            className="absolute text-xs text-gray-800 font-medium select-none pointer-events-none"
            style={{
              left: `${i + 3}px`,
              bottom: "1px",
              fontSize: "11px",
            }}
          >
            {inches}"
          </div>
        );
      }
    }
    return marks;
  };

  const generateVerticalMarks = () => {
    const marks = [];
    const increment = 20;

    for (let i = 0; i <= height; i += increment) {
      const isMajor = i % 100 === 0;
      const isMedium = i % 50 === 0;

      marks.push(
        <div
          key={`v-${i}`}
          className="absolute bg-gray-700 pointer-events-none"
          style={{
            top: `${i}px`,
            right: 0,
            height: "1px",
            width: isMajor ? "15px" : isMedium ? "10px" : "6px",
          }}
        />
      );

      if (isMajor && i > 0) {
        const inches = Math.round((i / 96) * 10) / 10;
        marks.push(
          <div
            key={`v-label-${i}`}
            className="absolute text-xs text-gray-800 font-medium select-none pointer-events-none"
            style={{
              top: `${i - 6}px`,
              right: "2px",
              fontSize: "11px",
              transform: "rotate(-90deg)",
              transformOrigin: "center",
              width: "20px",
              textAlign: "center",
            }}
          >
            {inches}"
          </div>
        );
      }
    }
    return marks;
  };

  return (
    <div ref={rulerRef} className="select-none">
      <div
        className="absolute bg-white border-b-2 border-r-2 border-gray-400 shadow-lg"
        style={{
          top: 0,
          left: 0,
          width: "30px",
          height: "30px",
          zIndex: 20,
          background: "linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)",
        }}
      >
        <div className="w-full h-full flex items-center justify-center">
          <div className="w-2 h-2 bg-gray-400 rounded-full"></div>
        </div>
      </div>

      <div
        className="absolute bg-white border-b-2 border-gray-400 shadow-lg cursor-pointer"
        style={{
          top: 0,
          left: "30px",
          width: `${width}px`,
          height: "30px",
          zIndex: 20,
          background: "linear-gradient(to bottom, #ffffff 0%, #f1f5f9 100%)",
        }}
        onClick={(e) => handleRulerClick(e, "horizontal")}
      >
        {generateHorizontalMarks()}

        {tabStops.map((position, index) => (
          <div
            key={`tab-${index}`}
            className="absolute bg-gray-600 cursor-pointer hover:bg-gray-800 transition-colors z-10"
            style={{
              left: `${position - 3}px`,
              top: "15px",
              width: "6px",
              height: "8px",
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
            onClick={(e) => removeTabStop(index, e)}
            title="Click to remove tab stop"
          />
        ))}

        <div
          className={`absolute shadow-md transition-all duration-200 z-10 ${
            isDragging === "left"
              ? "bg-blue-600 scale-110"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          style={{
            left: `${marginLeft - 4}px`,
            top: "18px",
            width: "8px",
            height: "12px",
            borderRadius: "0 0 4px 4px",
            cursor: "grab",
          }}
          onMouseDown={(e) => handleMouseDown(e, "left")}
          title="Left Margin - Drag to adjust"
        />

        <div
          className={`absolute shadow-md transition-all duration-200 z-10 ${
            isDragging === "right"
              ? "bg-blue-600 scale-110"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          style={{
            left: `${width - marginRight - 4}px`,
            top: "18px",
            width: "8px",
            height: "12px",
            borderRadius: "0 0 4px 4px",
            cursor: "grab",
          }}
          onMouseDown={(e) => handleMouseDown(e, "right")}
          title="Right Margin - Drag to adjust"
        />

        <div
          className="absolute bg-green-400 opacity-30 pointer-events-none"
          style={{
            left: `${marginLeft}px`,
            top: "25px",
            width: `${width - marginLeft - marginRight}px`,
            height: "5px",
          }}
        />
      </div>

      <div
        className="absolute bg-white border-r-2 border-gray-400 shadow-lg"
        style={{
          top: "30px",
          left: 0,
          width: "30px",
          height: `${height}px`,
          zIndex: 20,
          background: "linear-gradient(to right, #ffffff 0%, #f1f5f9 100%)",
        }}
      >
        {generateVerticalMarks()}

        <div
          className={`absolute shadow-md transition-all duration-200 z-10 ${
            isDragging === "top"
              ? "bg-blue-600 scale-110"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          style={{
            top: `${marginTop - 4}px`,
            left: "18px",
            width: "12px",
            height: "8px",
            borderRadius: "0 4px 4px 0",
            cursor: "grab",
          }}
          onMouseDown={(e) => handleMouseDown(e, "top")}
          title="Top Margin - Drag to adjust"
        />

        <div
          className={`absolute shadow-md transition-all duration-200 z-10 ${
            isDragging === "bottom"
              ? "bg-blue-600 scale-110"
              : "bg-blue-500 hover:bg-blue-600"
          }`}
          style={{
            top: `${height - marginBottom - 4}px`,
            left: "18px",
            width: "12px",
            height: "8px",
            borderRadius: "0 4px 4px 0",
            cursor: "grab",
          }}
          onMouseDown={(e) => handleMouseDown(e, "bottom")}
          title="Bottom Margin - Drag to adjust"
        />

        <div
          className="absolute bg-green-400 opacity-30 pointer-events-none"
          style={{
            top: `${marginTop}px`,
            left: "25px",
            width: "5px",
            height: `${height - marginTop - marginBottom}px`,
          }}
        />
      </div>

      <div
        className="absolute pointer-events-none transition-all duration-300"
        style={{
          left: `${marginLeft + 30}px`,
          top: `${marginTop + 30}px`,
          width: `${width - marginLeft - marginRight}px`,
          height: `${height - marginTop - marginBottom}px`,
          zIndex: 5,
          border: "2px solid rgba(34, 197, 94, 0.8)",
          backgroundColor: "rgba(34, 197, 94, 0.1)",
          borderStyle: "dashed",
        }}
      />

      <div
        className="absolute shadow-inner pointer-events-none"
        style={{
          left: "30px",
          top: "30px",
          width: `${width}px`,
          height: `${height}px`,
          zIndex: 3,
          border: "1px solid #d1d5db",
        }}
      />

      {isDragging && (
        <div
          className="absolute bg-black text-white px-2 py-1 rounded text-xs pointer-events-none z-30"
          style={{
            left: "50px",
            top: "5px",
          }}
        >
          Adjusting {isDragging} margin
        </div>
      )}
    </div>
  );
};

export default Ruler;
