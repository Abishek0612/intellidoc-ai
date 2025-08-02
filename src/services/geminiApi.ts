import { toast } from "react-toastify";

interface KeyUsage {
  [key: number]: number;
}

interface GenerateOptions {
  maxRetries?: number;
  temperature?: number;
  maxTokens?: number;
}

class SimpleApiKeyManager {
  private apiKeys: string[];
  private currentKeyIndex: number;
  private blockedKeys: Set<number>;
  private keyResetTimes: Map<number, number>;
  private keyUsageCount: KeyUsage;
  private hasShownInitialToast: boolean;

  constructor() {
    const apiKeyString = import.meta.env.VITE_GEMINI_API_KEY || "";
    this.apiKeys = apiKeyString
      .split("||")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    this.currentKeyIndex = 0;
    this.blockedKeys = new Set();
    this.keyResetTimes = new Map();
    this.keyUsageCount = {};
    this.hasShownInitialToast = false;

    this.apiKeys.forEach((_, index) => {
      this.keyUsageCount[index] = 0;
    });

    console.log(`🔑 Loaded ${this.apiKeys.length} API keys for fallback`);

    if (!this.hasShownInitialToast) {
      if (this.apiKeys.length === 0) {
        toast.error("No API keys configured! Please check your .env file.", {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 5000,
        });
      } else if (this.apiKeys.length > 1) {
        toast.success(
          `${this.apiKeys.length} Gemini API keys loaded successfully`,
          {
            position: window.innerWidth < 768 ? "top-center" : "top-right",
            autoClose: 2000,
          }
        );
      }
      this.hasShownInitialToast = true;
    }
  }

  getCurrentKey(): string {
    this.cleanupExpiredBlocks();

    for (let i = 0; i < this.apiKeys.length; i++) {
      const keyIndex = (this.currentKeyIndex + i) % this.apiKeys.length;
      if (!this.blockedKeys.has(keyIndex)) {
        this.currentKeyIndex = keyIndex;
        return this.apiKeys[keyIndex];
      }
    }

    return this.apiKeys[this.currentKeyIndex];
  }

  markKeyAsBlocked(): void {
    const keyNumber = this.currentKeyIndex + 1;
    const totalKeys = this.apiKeys.length;

    console.warn(
      `🚫 Blocking API key ${keyNumber}/${totalKeys} due to rate limit`
    );

    this.blockedKeys.add(this.currentKeyIndex);
    this.keyResetTimes.set(this.currentKeyIndex, Date.now() + 60 * 60 * 1000);

    const oldKeyIndex = this.currentKeyIndex;
    this.currentKeyIndex = (this.currentKeyIndex + 1) % this.apiKeys.length;

    this.cleanupExpiredBlocks();
    const availableKeys = this.apiKeys.length - this.blockedKeys.size;

    if (availableKeys > 0) {
      for (let i = 0; i < this.apiKeys.length; i++) {
        const keyIndex = (oldKeyIndex + 1 + i) % this.apiKeys.length;
        if (!this.blockedKeys.has(keyIndex)) {
          this.currentKeyIndex = keyIndex;

          toast.warning(
            `Gemini API limit reached. Switching to backup key ${
              keyIndex + 1
            }/${totalKeys}`,
            {
              position: window.innerWidth < 768 ? "top-center" : "top-right",
              autoClose: 3000,
            }
          );
          break;
        }
      }
    } else {
      const nextResetMinutes = this.getNextResetMinutes();
      toast.error(
        `All ${totalKeys} API keys exhausted. Please try again in ${nextResetMinutes} minutes.`,
        {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 8000,
        }
      );
    }
  }

  cleanupExpiredBlocks(): void {
    const now = Date.now();

    for (const [keyIndex, resetTime] of this.keyResetTimes.entries()) {
      if (now > resetTime) {
        this.blockedKeys.delete(keyIndex);
        this.keyResetTimes.delete(keyIndex);
        console.log(`✅ API key ${keyIndex + 1} is available again`);
      }
    }
  }

  allKeysBlocked(): boolean {
    this.cleanupExpiredBlocks();
    return this.blockedKeys.size >= this.apiKeys.length;
  }

  getNextResetTime(): number | null {
    const resetTimes = Array.from(this.keyResetTimes.values());
    return resetTimes.length > 0 ? Math.min(...resetTimes) : null;
  }

  getNextResetMinutes(): number {
    const nextReset = this.getNextResetTime();
    return nextReset ? Math.ceil((nextReset - Date.now()) / 60000) : 0;
  }

  incrementUsage(): void {
    const currentCount = this.keyUsageCount[this.currentKeyIndex] || 0;
    this.keyUsageCount[this.currentKeyIndex] = currentCount + 1;
  }
}

const keyManager = new SimpleApiKeyManager();

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

const makeGeminiRequest = async (
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const { maxRetries = 3, temperature = 0.7, maxTokens = 150 } = options;
  let lastError: Error;

  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const currentKey = keyManager.getCurrentKey();

    if (!currentKey) {
      const error = new Error(
        "No API keys configured in environment variables"
      );
      toast.error(
        "No Gemini API keys found. Please check your configuration.",
        {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 5000,
        }
      );
      throw error;
    }

    if (keyManager.allKeysBlocked()) {
      const nextResetMinutes = keyManager.getNextResetMinutes();
      const errorMsg = `All API keys are rate limited. Try again in ${nextResetMinutes} minutes.`;

      toast.error(
        `All API keys exhausted. Next available in ${nextResetMinutes} minutes.`,
        {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 8000,
        }
      );

      throw new Error(errorMsg);
    }

    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${currentKey}`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  {
                    text: prompt,
                  },
                ],
              },
            ],
            generationConfig: {
              temperature: temperature,
              maxOutputTokens: maxTokens,
            },
          }),
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP error! status: ${response.status}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage += ` - ${errorData.error?.message || errorText}`;
        } catch {
          errorMessage += ` - ${errorText}`;
        }

        if (
          response.status === 429 ||
          errorMessage.includes("quota") ||
          errorMessage.includes("rate limit")
        ) {
          keyManager.markKeyAsBlocked();

          if (!keyManager.allKeysBlocked()) {
            console.log("🔄 Switching to next available API key...");
            continue;
          }
        }

        throw new Error(errorMessage);
      }

      const data = await response.json();

      if (
        !data.candidates ||
        !data.candidates[0] ||
        !data.candidates[0].content
      ) {
        throw new Error("Invalid response format from Gemini API");
      }

      keyManager.incrementUsage();

      const result = data.candidates[0].content.parts[0].text;
      return result;
    } catch (error) {
      lastError = error as Error;
      console.error(`❌ Attempt ${attempt + 1} failed:`, lastError.message);

      if (
        (lastError.message.includes("429") ||
          lastError.message.includes("quota")) &&
        !keyManager.allKeysBlocked()
      ) {
        continue;
      }

      if (attempt < maxRetries - 1) {
        const waitTime = 1000 * (attempt + 1);
        console.log(`⏳ Waiting ${waitTime}ms before retry...`);
        await delay(waitTime);
      }
    }
  }

  if (
    lastError!.message.includes("429") ||
    lastError!.message.includes("quota")
  ) {
    toast.error(
      "Request failed due to API rate limits. Please try again later.",
      {
        position: window.innerWidth < 768 ? "top-center" : "top-right",
        autoClose: 6000,
      }
    );
  } else {
    toast.error("Request failed. Please try again.", {
      position: window.innerWidth < 768 ? "top-center" : "top-right",
      autoClose: 4000,
    });
  }

  throw lastError!;
};

export const generateWithGemini = async (
  prompt: string,
  options: GenerateOptions = {}
): Promise<string> => {
  return makeGeminiRequest(prompt, options);
};

export const searchWithGemini = async (
  query: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const searchPrompt = `Search and provide information about: ${query}`;
  return makeGeminiRequest(searchPrompt, {
    ...options,
    maxTokens: options.maxTokens || 300,
  });
};

export const generateSearchSuggestions = async (
  query: string,
  options: GenerateOptions = {}
): Promise<string> => {
  if (!query || query.trim().length === 0) {
    return "artificial intelligence\nmachine learning\nweb development\ndata science\ncloud computing";
  }
  const suggestionsPrompt = `Generate 5 search suggestions related to: ${query}. Return only the suggestions, one per line, without numbers or bullets.`;
  return makeGeminiRequest(suggestionsPrompt, {
    ...options,
    maxTokens: options.maxTokens || 100,
  });
};

export const analyzeContent = async (
  content: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const analysisPrompt = `Analyze the following content and provide key insights: ${content}`;
  return makeGeminiRequest(analysisPrompt, {
    ...options,
    maxTokens: options.maxTokens || 200,
  });
};

export const summarizeContent = async (
  content: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const summaryPrompt = `Summarize the following content in 3-4 sentences: ${content}`;
  return makeGeminiRequest(summaryPrompt, {
    ...options,
    maxTokens: options.maxTokens || 150,
  });
};

export const translateText = async (
  text: string,
  targetLanguage: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const translatePrompt = `Translate the following text to ${targetLanguage}: ${text}`;
  return makeGeminiRequest(translatePrompt, {
    ...options,
    maxTokens: options.maxTokens || 200,
  });
};

export const detectLanguage = async (
  text: string,
  options: GenerateOptions = {}
): Promise<string> => {
  const detectPrompt = `Identify the language of this text. Respond with only the language name: ${text}`;
  return makeGeminiRequest(detectPrompt, {
    ...options,
    maxTokens: options.maxTokens || 10,
  });
};
