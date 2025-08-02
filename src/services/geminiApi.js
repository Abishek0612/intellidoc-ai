import { toast } from "react-toastify";

class SimpleApiKeyManager {
  constructor() {
    const apiKeyString = import.meta.env.GEMINI_API_KEY || "";
    this.apiKeys = apiKeyString
      .split("||")
      .map((key) => key.trim())
      .filter((key) => key.length > 0);

    this.currentKeyIndex = 0;
    this.blockedKeys = new Set();
    this.keyResetTimes = new Map();
    this.keyUsageCount = new Map();
    this.hasShownInitialToast = false;

    this.apiKeys.forEach((_, index) => {
      this.keyUsageCount.set(index, 0);
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

  getCurrentKey() {
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

  markKeyAsBlocked() {
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

  cleanupExpiredBlocks() {
    const now = Date.now();
    const unlockedKeys = [];

    for (const [keyIndex, resetTime] of this.keyResetTimes.entries()) {
      if (now > resetTime) {
        this.blockedKeys.delete(keyIndex);
        this.keyResetTimes.delete(keyIndex);
        unlockedKeys.push(keyIndex + 1);
        console.log(`✅ API key ${keyIndex + 1} is available again`);
      }
    }
  }

  allKeysBlocked() {
    this.cleanupExpiredBlocks();
    return this.blockedKeys.size >= this.apiKeys.length;
  }

  getNextResetTime() {
    const resetTimes = Array.from(this.keyResetTimes.values());
    return resetTimes.length > 0 ? Math.min(...resetTimes) : null;
  }

  getNextResetMinutes() {
    const nextReset = this.getNextResetTime();
    return nextReset ? Math.ceil((nextReset - Date.now()) / 60000) : 0;
  }

  incrementUsage() {
    const currentCount = this.keyUsageCount.get(this.currentKeyIndex) || 0;
    this.keyUsageCount.set(this.currentKeyIndex, currentCount + 1);
  }

  getStatus() {
    this.cleanupExpiredBlocks();
    const nextReset = this.getNextResetTime();
    const waitMinutes = nextReset
      ? Math.ceil((nextReset - Date.now()) / 60000)
      : 0;
    const currentUsage = this.keyUsageCount.get(this.currentKeyIndex) || 0;

    return {
      totalKeys: this.apiKeys.length,
      currentKey: this.currentKeyIndex + 1,
      currentKeyUsage: currentUsage,
      blockedKeys: this.blockedKeys.size,
      availableKeys: this.apiKeys.length - this.blockedKeys.size,
      nextResetMinutes: waitMinutes,
      allBlocked: this.allKeysBlocked(),
    };
  }

  getDetailedStatus() {
    this.cleanupExpiredBlocks();
    return {
      ...this.getStatus(),
      keyDetails: this.apiKeys.map((key, index) => ({
        keyNumber: index + 1,
        keyPreview: key.substring(0, 12) + "...",
        isBlocked: this.blockedKeys.has(index),
        usage: this.keyUsageCount.get(index) || 0,
        resetTime: this.keyResetTimes.get(index),
        isCurrent: index === this.currentKeyIndex,
      })),
    };
  }
}

const keyManager = new SimpleApiKeyManager();

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

const makeGeminiRequest = async (prompt, options = {}) => {
  const { maxRetries = 3, temperature = 0.7, maxTokens = 150 } = options;
  let lastError;

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
      const status = keyManager.getStatus();
      const errorMsg = `All ${status.totalKeys} API keys are rate limited. Try again in ${status.nextResetMinutes} minutes.`;

      toast.error(
        `All API keys exhausted. Next available in ${status.nextResetMinutes} minutes.`,
        {
          position: window.innerWidth < 768 ? "top-center" : "top-right",
          autoClose: 8000,
        }
      );

      throw new Error(errorMsg);
    }

    try {
      const status = keyManager.getStatus();
      console.log(
        `🚀 Attempt ${attempt + 1}/${maxRetries} using API key ${
          status.currentKey
        }/${status.totalKeys} (${status.availableKeys} available, ${
          status.currentKeyUsage
        } uses)`
      );

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
      const finalStatus = keyManager.getStatus();

      console.log(
        `✅ Success with API key ${finalStatus.currentKey} (${finalStatus.currentKeyUsage} total uses)`
      );

      return result;
    } catch (error) {
      lastError = error;
      console.error(`❌ Attempt ${attempt + 1} failed:`, error.message);

      if (
        (error.message.includes("429") || error.message.includes("quota")) &&
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

  const finalStatus = keyManager.getStatus();
  console.error("🔥 All attempts failed. Final status:", finalStatus);

  if (
    lastError.message.includes("429") ||
    lastError.message.includes("quota")
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

  throw lastError;
};

export const generateWithGemini = async (prompt, options = {}) => {
  return makeGeminiRequest(prompt, options);
};

export const searchWithGemini = async (query, options = {}) => {
  const searchPrompt = `Search and provide information about: ${query}`;
  return makeGeminiRequest(searchPrompt, {
    ...options,
    maxTokens: options.maxTokens || 300,
  });
};

export const generateSearchSuggestions = async (query, options = {}) => {
  if (!query || query.trim().length === 0) {
    return "artificial intelligence\nmachine learning\nweb development\ndata science\ncloud computing";
  }
  const suggestionsPrompt = `Generate 5 search suggestions related to: ${query}. Return only the suggestions, one per line, without numbers or bullets.`;
  return makeGeminiRequest(suggestionsPrompt, {
    ...options,
    maxTokens: options.maxTokens || 100,
  });
};

export const analyzeContent = async (content, options = {}) => {
  const analysisPrompt = `Analyze the following content and provide key insights: ${content}`;
  return makeGeminiRequest(analysisPrompt, {
    ...options,
    maxTokens: options.maxTokens || 200,
  });
};

export const summarizeContent = async (content, options = {}) => {
  const summaryPrompt = `Summarize the following content in 3-4 sentences: ${content}`;
  return makeGeminiRequest(summaryPrompt, {
    ...options,
    maxTokens: options.maxTokens || 150,
  });
};

export const translateText = async (text, targetLanguage, options = {}) => {
  const translatePrompt = `Translate the following text to ${targetLanguage}: ${text}`;
  return makeGeminiRequest(translatePrompt, {
    ...options,
    maxTokens: options.maxTokens || 200,
  });
};

export const detectLanguage = async (text, options = {}) => {
  const detectPrompt = `Identify the language of this text. Respond with only the language name: ${text}`;
  return makeGeminiRequest(detectPrompt, {
    ...options,
    maxTokens: options.maxTokens || 10,
  });
};

export const getApiStatus = () => {
  return keyManager.getStatus();
};

export const getDetailedApiStatus = () => {
  return keyManager.getDetailedStatus();
};

export const showApiStatus = () => {
  const status = keyManager.getDetailedStatus();

  console.table(status.keyDetails);

  const message = `📊 API Status: ${status.availableKeys}/${status.totalKeys} keys available. Current: Key ${status.currentKey} (${status.currentKeyUsage} uses)`;

  toast.info(message, {
    position: window.innerWidth < 768 ? "top-center" : "top-right",
    autoClose: 4000,
  });

  return status;
};
