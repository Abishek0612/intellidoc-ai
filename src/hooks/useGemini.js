import { useState } from "react";
import { searchWithGemini, generateWithGemini } from "../services/geminiApi";

export const useGemini = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = async (query) => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchWithGemini(query);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  const generate = async (prompt, context) => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateWithGemini(prompt, context);
      setLoading(false);
      return result;
    } catch (err) {
      setError(err.message);
      setLoading(false);
      throw err;
    }
  };

  return { search, generate, loading, error };
};
