import React from "react";

interface RulerProps {
  width: number;
  height: number;
  marginLeft: number;
  marginRight: number;
  marginTop: number;
  marginBottom: number;
}

const Ruler: React.FC<RulerProps> = ({
  width,
  height,
  marginLeft,
  marginRight,
  marginTop,
  marginBottom,
}) => {
  const generateMarks = (length: number, vertical = false) => {
    const marks = [];
    const increment = vertical ? 20 : 20; // 20px intervals

    for (let i = 0; i <= length; i += increment) {
      const isMajor = i % 100 === 0; // Major marks every 100px
      marks.push(
        <div
          key={i}
          className={`absolute ${
            vertical ? "border-r border-gray-400" : "border-b border-gray-400"
          }`}
          style={{
            [vertical ? "top" : "left"]: `${i}px`,
            [vertical ? "height" : "width"]: isMajor ? "15px" : "8px",
            [vertical ? "width" : "height"]: "1px",
          }}
        />
      );
    }
    return marks;
  };

  return (
    <>
      {/* Horizontal Ruler */}
      <div
        className="absolute top-0 left-0 bg-gray-100 border-b border-gray-300"
        style={{ width: `${width}px`, height: "25px", zIndex: 10 }}
      >
        {generateMarks(width)}
        {/* Left margin indicator */}
        <div
          className="absolute top-0 bg-blue-300 opacity-50"
          style={{
            left: `${marginLeft}px`,
            width: "2px",
            height: "25px",
          }}
        />
        {/* Right margin indicator */}
        <div
          className="absolute top-0 bg-blue-300 opacity-50"
          style={{
            left: `${width - marginRight}px`,
            width: "2px",
            height: "25px",
          }}
        />
      </div>

      {/* Vertical Ruler */}
      <div
        className="absolute top-0 left-0 bg-gray-100 border-r border-gray-300"
        style={{ width: "25px", height: `${height}px`, zIndex: 10 }}
      >
        {generateMarks(height, true)}
        {/* Top margin indicator */}
        <div
          className="absolute left-0 bg-blue-300 opacity-50"
          style={{
            top: `${marginTop}px`,
            width: "25px",
            height: "2px",
          }}
        />
        {/* Bottom margin indicator */}
        <div
          className="absolute left-0 bg-blue-300 opacity-50"
          style={{
            top: `${height - marginBottom}px`,
            width: "25px",
            height: "2px",
          }}
        />
      </div>

      {/* Margin guides */}
      <div
        className="absolute border border-dashed border-blue-300 opacity-30 pointer-events-none"
        style={{
          left: `${marginLeft + 25}px`,
          top: `${marginTop + 25}px`,
          width: `${width - marginLeft - marginRight - 25}px`,
          height: `${height - marginTop - marginBottom - 25}px`,
          zIndex: 5,
        }}
      />
    </>
  );
};

export default Ruler;
