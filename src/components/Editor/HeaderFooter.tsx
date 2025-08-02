import React from "react";

interface HeaderFooterProps {
  type?: "header" | "footer";
  pageNumber: number;
  totalPages: number;
  documentTitle: string;
}

const HeaderFooter: React.FC<HeaderFooterProps> = ({
  type = "header",
  pageNumber,
  totalPages,
  documentTitle,
}) => {
  return (
    <div
      className={`
      ${type === "header" ? "header" : "footer"} 
      flex justify-between items-center px-4 py-2 text-sm text-gray-600 bg-white border-b border-gray-200
      ${type === "footer" ? "border-t border-b-0" : ""}
    `}
    >
      {type === "header" ? (
        <>
          <div className="font-medium truncate">{documentTitle}</div>
          <div className="text-xs ml-2">
            Page {pageNumber} of {totalPages}
          </div>
        </>
      ) : (
        <>
          <div className="text-xs">Saved</div>
          <div className="text-xs">
            Page {pageNumber} of {totalPages}
          </div>
        </>
      )}
    </div>
  );
};

export default HeaderFooter;
