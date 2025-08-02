import React from "react";
import { PAGE_CONFIG } from "../../utils/constants";
import HeaderFooter from "./HeaderFooter";

const PageContainer = ({ children, pageNumber, totalPages, documentTitle }) => {
  return (
    <div
      className="page-container bg-white shadow-lg mb-4 relative mx-auto"
      style={{
        width: "100%",
        maxWidth: `${PAGE_CONFIG.A4_WIDTH_PX}px`,
        minHeight: `${PAGE_CONFIG.A4_HEIGHT_PX}px`,
      }}
    >
      <HeaderFooter
        type="header"
        pageNumber={pageNumber}
        totalPages={totalPages}
        documentTitle={documentTitle}
      />

      <div
        className="page-content"
        style={{
          padding: `${PAGE_CONFIG.MARGIN_PX}px`,
          minHeight: `${
            PAGE_CONFIG.A4_HEIGHT_PX -
            PAGE_CONFIG.HEADER_HEIGHT_PX -
            PAGE_CONFIG.FOOTER_HEIGHT_PX
          }px`,
        }}
      >
        {children}
      </div>

      <HeaderFooter
        type="footer"
        pageNumber={pageNumber}
        totalPages={totalPages}
        documentTitle={documentTitle}
      />
    </div>
  );
};

export default PageContainer;
