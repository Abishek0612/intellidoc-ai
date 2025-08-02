export const generateDocumentId = () => {
  return `doc_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
};

export const formatFileSize = (bytes) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export const getWordCount = (html) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return text
    .trim()
    .split(/\s+/)
    .filter((word) => word.length > 0).length;
};

export const getCharacterCount = (html) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = html;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return text.length;
};

export const createDocumentPreview = (content, maxLength = 150) => {
  const tempDiv = document.createElement("div");
  tempDiv.innerHTML = content;
  const text = tempDiv.textContent || tempDiv.innerText || "";
  return text.length > maxLength ? text.substring(0, maxLength) + "..." : text;
};
