import html2pdf from "html2pdf.js";
import { Document as DocxDocument, Packer, Paragraph, TextRun } from "docx";
import { saveAs } from "file-saver";
import { Document } from "../types";

class ExportService {
  private sanitizeContentForPDF(htmlContent: string, title: string): string {
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
  }

  private getTextContent(htmlContent: string): string {
    const tempDiv = document.createElement("div");
    tempDiv.innerHTML = htmlContent;
    return tempDiv.textContent || tempDiv.innerText || "";
  }

  async exportToPDF(options: Document): Promise<void> {
    try {
      const { content, title } = options;
      const cleanHTML = this.sanitizeContentForPDF(content, title);
      const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.pdf`;

      const opt = {
        margin: 0.5,
        filename: filename,
        image: { type: "jpeg", quality: 0.98 },
        html2canvas: { scale: 2, useCORS: true },
        jsPDF: { unit: "in", format: "a4", orientation: "portrait" },
      };

      await html2pdf().set(opt).from(cleanHTML).save();
    } catch (error) {
      throw new Error(
        `PDF export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async exportToWord(options: Document): Promise<void> {
    try {
      const { content, title } = options;
      const textContent = this.getTextContent(content);

      const doc = new DocxDocument({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                children: [
                  new TextRun({
                    text: title,
                    bold: true,
                    size: 32,
                  }),
                ],
              }),
              new Paragraph({
                children: [
                  new TextRun({
                    text: textContent,
                    size: 24,
                  }),
                ],
              }),
            ],
          },
        ],
      });

      const blob = await Packer.toBlob(doc);
      const filename = `${title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.docx`;
      saveAs(blob, filename);
    } catch (error) {
      throw new Error(
        `Word export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  exportToHTML(options: Document): void {
    try {
      const { content, title } = options;
      const cleanHTML = this.sanitizeContentForPDF(content, title);
      const filename = `${title
        .replace(/[^a-z0-9]/gi, "_")
        .toLowerCase()}.html`;

      const blob = new Blob([cleanHTML], { type: "text/html;charset=utf-8" });
      saveAs(blob, filename);
    } catch (error) {
      throw new Error(
        `HTML export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  exportToText(options: Document): void {
    try {
      const { content, title } = options;
      const textContent = this.getTextContent(content);
      const fullText = `${title}\n${"=".repeat(
        title.length
      )}\n\n${textContent}`;
      const filename = `${title.replace(/[^a-z0-9]/gi, "_").toLowerCase()}.txt`;

      const blob = new Blob([fullText], { type: "text/plain;charset=utf-8" });
      saveAs(blob, filename);
    } catch (error) {
      throw new Error(
        `Text export failed: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  async export(
    options: Document & { format: "pdf" | "word" | "html" | "text" }
  ): Promise<void> {
    switch (options.format) {
      case "pdf":
        return this.exportToPDF(options);
      case "word":
        return this.exportToWord(options);
      case "html":
        return this.exportToHTML(options);
      case "text":
        return this.exportToText(options);
      default:
        throw new Error(`Unsupported export format: ${options.format}`);
    }
  }
}

export const exportService = new ExportService();
