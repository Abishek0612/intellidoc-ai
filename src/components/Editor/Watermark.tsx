import React from "react";

interface WatermarkProps {
  text?: string;
  opacity?: number;
}

const Watermark: React.FC<WatermarkProps> = ({
  text = "CONFIDENTIAL DRAFT",
  opacity = 0.1,
}) => {
  const watermarkStyle = {
    position: "absolute" as const,
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%) rotate(-45deg)",
    fontSize: "48px",
    fontWeight: "bold",
    color: "#000",
    opacity: opacity,
    pointerEvents: "none" as const,
    userSelect: "none" as const,
    zIndex: 1,
    fontFamily: "Arial, sans-serif",
  };

  return <div style={watermarkStyle}>{text}</div>;
};

export default Watermark;
