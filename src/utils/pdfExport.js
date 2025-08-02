import html2pdf from "html2pdf.js";
import { saveAs } from "file-saver";

export const exportToPDF = async (content, title = "document") => {
  const element = document.createElement("div");
  element.innerHTML = content;
  element.style.padding = "40px";
  element.style.fontFamily = "Arial, sans-serif";
  element.style.lineHeight = "1.6";
  element.style.color = "#333";

  const options = {
    margin: [20, 20, 20, 20],
    filename: `${title}.pdf`,
    image: { type: "jpeg", quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true },
    jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
  };

  try {
    await html2pdf().set(options).from(element).save();
    return true;
  } catch (error) {
    console.error("Error exporting PDF:", error);
    return false;
  }
};

export const exportToWord = (content, title = "document") => {
  const htmlContent = `
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 40px; }
          h1, h2, h3 { color: #333; }
          p { margin-bottom: 1em; }
          ul, ol { margin: 1em 0; padding-left: 2em; }
          blockquote { border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `;

  const blob = new Blob([htmlContent], {
    type: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  });

  saveAs(blob, `${title}.doc`);
};

export const exportToHTML = (content, title = "document") => {
  const htmlContent = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <title>${title}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; }
          h1, h2, h3 { color: #333; }
          p { margin-bottom: 1em; }
          ul, ol { margin: 1em 0; padding-left: 2em; }
          blockquote { border-left: 4px solid #ccc; margin: 1em 0; padding-left: 1em; background: #f9f9f9; }
          code { background: #f4f4f4; padding: 2px 4px; border-radius: 3px; }
          pre { background: #f4f4f4; padding: 1em; border-radius: 5px; overflow-x: auto; }
        </style>
      </head>
      <body>${content}</body>
    </html>
  `;

  const blob = new Blob([htmlContent], { type: "text/html" });
  saveAs(blob, `${title}.html`);
};
