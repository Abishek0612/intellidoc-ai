import { useState } from "react";
import { searchWithGemini, generateWithGemini } from "../services/geminiApi";

interface GenerateOptions {
  maxTokens?: number;
  temperature?: number;
}

interface UseGeminiReturn {
  search: (query: string) => Promise<string>;
  generate: (prompt: string, context?: GenerateOptions) => Promise<string>;
  loading: boolean;
  error: string | null;
}

export const useGemini = (): UseGeminiReturn => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = async (query: string): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const result = await searchWithGemini(query);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  const generate = async (
    prompt: string,
    context?: GenerateOptions
  ): Promise<string> => {
    setLoading(true);
    setError(null);

    try {
      const result = await generateWithGemini(prompt, context);
      setLoading(false);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(errorMessage);
      setLoading(false);
      throw err;
    }
  };

  return { search, generate, loading, error };
};
