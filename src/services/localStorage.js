export const saveToLocalStorage = (key, data) => {
  try {
    const serializedData = JSON.stringify(data);
    localStorage.setItem(key, serializedData);
    return true;
  } catch (error) {
    console.error("Error saving to localStorage:", error);
    return false;
  }
};

export const getFromLocalStorage = (key) => {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch (error) {
    console.error("Error getting from localStorage:", error);
    return null;
  }
};

export const removeFromLocalStorage = (key) => {
  try {
    localStorage.removeItem(key);
    return true;
  } catch (error) {
    console.error("Error removing from localStorage:", error);
    return false;
  }
};

export const saveDocument = (document) => {
  const timestamp = new Date().toISOString();
  const documentWithMetadata = {
    ...document,
    id: Date.now().toString(),
    savedAt: timestamp,
    lastModified: timestamp,
  };

  const savedDocs = getFromLocalStorage("savedDocuments") || [];
  const updatedDocs = [...savedDocs, documentWithMetadata];

  return saveToLocalStorage("savedDocuments", updatedDocs);
};

export const getSavedDocuments = () => {
  return getFromLocalStorage("savedDocuments") || [];
};

export const deleteDocument = (documentId) => {
  try {
    const savedDocs = getFromLocalStorage("savedDocuments") || [];
    const updatedDocs = savedDocs.filter((doc) => doc.id !== documentId);

    const todayActivities = getFromLocalStorage("todayActivities") || [];
    const updatedActivities = todayActivities.filter(
      (activity) => activity.documentId !== documentId
    );

    const success1 = saveToLocalStorage("savedDocuments", updatedDocs);
    const success2 = saveToLocalStorage("todayActivities", updatedActivities);

    return success1 && success2;
  } catch (error) {
    console.error("Error deleting document:", error);
    return false;
  }
};

export const updateDocument = (documentId, updates) => {
  try {
    const savedDocs = getFromLocalStorage("savedDocuments") || [];
    const updatedDocs = savedDocs.map((doc) =>
      doc.id === documentId
        ? { ...doc, ...updates, lastModified: new Date().toISOString() }
        : doc
    );

    return saveToLocalStorage("savedDocuments", updatedDocs);
  } catch (error) {
    console.error("Error updating document:", error);
    return false;
  }
};
