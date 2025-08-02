import { toast } from "react-toastify";

const sanitizeContentForPDF = (htmlContent, title) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = htmlContent;

  const allElements = tempDiv.querySelectorAll("*");
  allElements.forEach((element) => {
    element.removeAttribute("class");

    const style = element.getAttribute("style");
    if (style) {
      const cleanStyle = style
        .replace(/oklch\([^)]+\)/g, "#333")
        .replace(/hsl\([^)]+\)/g, "#333")
        .replace(/var\([^)]+\)/g, "#333");
      element.setAttribute("style", cleanStyle);
    }
  });

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="UTF-8">
      <title>${title}</title>
      <style>
        body {
          font-family: Arial, sans-serif;
          font-size: 14px;
          line-height: 1.6;
          color: #333;
          max-width: 800px;
          margin: 0 auto;
          padding: 20px;
        }
        h1, h2, h3, h4, h5, h6 {
          font-weight: bold;
          margin: 20px 0 10px 0;
        }
        h1 { font-size: 24px; }
        h2 { font-size: 20px; }
        h3 { font-size: 18px; }
        p { margin: 10px 0; }
        ul, ol { margin: 10px 0; padding-left: 30px; }
        li { margin: 5px 0; }
        strong { font-weight: bold; }
        em { font-style: italic; }
        u { text-decoration: underline; }
        blockquote {
          border-left: 4px solid #ccc;
          margin: 15px 0;
          padding-left: 15px;
          font-style: italic;
        }
        table {
          border-collapse: collapse;
          width: 100%;
          margin: 15px 0;
        }
        table td, table th {
          border: 1px solid #ccc;
          padding: 8px;
          text-align: left;
        }
        table th {
          background-color: #f5f5f5;
          font-weight: bold;
        }
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      ${tempDiv.innerHTML}
    </body>
    </html>
  `;
};

export const exportToPDF = async (content, title = "Document") => {
  try {
    console.log("Starting PDF export...");

    const html2pdf = (await import("html2pdf.js")).default;

    const cleanHTML = sanitizeContentForPDF(content, title);
    const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

    const opt = {
      margin: 0.5,
      filename: filename,
      image: { type: "jpeg", quality: 0.98 },
      html2canvas: { scale: 2 },
      jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
    };

    console.log("Generating PDF...");
    await html2pdf().set(opt).from(cleanHTML).save();
    console.log("PDF export completed");
  } catch (error) {
    console.error("PDF export error:", error);
    throw new Error(`PDF export failed: ${error.message}`);
  }
};

export const exportToWord = (content, title = "Document") => {
  try {
    console.log("Starting Word export...");

    const cleanHTML = sanitizeContentForPDF(content, title);
    const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.doc`;

    const blob = new Blob([cleanHTML], {
      type: "application/msword;charset=utf-8",
    });

    downloadBlob(blob, filename);
    console.log("Word export completed");
  } catch (error) {
    console.error("Word export error:", error);
    throw new Error(`Word export failed: ${error.message}`);
  }
};

export const exportToHTML = (content, title = "Document") => {
  try {
    console.log("Starting HTML export...");

    const cleanHTML = sanitizeContentForPDF(content, title);
    const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.html`;

    const blob = new Blob([cleanHTML], {
      type: "text/html;charset=utf-8",
    });

    downloadBlob(blob, filename);
    console.log("HTML export completed");
  } catch (error) {
    console.error("HTML export error:", error);
    throw new Error(`HTML export failed: ${error.message}`);
  }
};

export const exportAsText = (content, title = "Document") => {
  try {
    console.log("Starting text export...");

    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = content;
    const textContent = tempDiv.textContent || tempDiv.innerText || "";

    const fullText = `${title}\n${"=".repeat(title.length)}\n\n${textContent}`;
    const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;

    const blob = new Blob([fullText], {
      type: "text/plain;charset=utf-8",
    });

    downloadBlob(blob, filename);
    console.log("Text export completed");
  } catch (error) {
    console.error("Text export error:", error);
    throw new Error(`Text export failed: ${error.message}`);
  }
};

const downloadBlob = (blob, filename) => {
  try {
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    setTimeout(() => URL.revokeObjectURL(url), 100);
  } catch (error) {
    console.error("Download failed:", error);
    throw new Error("Failed to download file");
  }
};
