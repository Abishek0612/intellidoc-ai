import { useState, useCallback, useEffect, useRef } from "react";
import { useApp } from "../context/AppContext";
import { useGemini } from "./useGemini";
import { toast } from "react-toastify";

interface ChatMessage {
  id: string;
  type: "user" | "bot" | "system";
  content: string;
  timestamp: Date;
  actions?: Array<{ label: string; action: string }>;
  metadata?: {
    documentId?: string;
    translationPair?: { source: string; target: string };
    researchQuery?: string;
    codeBlock?: boolean;
    language?: string;
  };
}

interface ChatContext {
  currentTask?: string;
  lastDocument?: string;
  preferences?: {
    language?: string;
    tone?: string;
  };
}

export const useChatbot = () => {
  const { state, dispatch } = useApp();
  const { generate, loading } = useGemini();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [context, setContext] = useState<ChatContext>({});
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if ("webkitSpeechRecognition" in window) {
      const recognition = new (window as any).webkitSpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = false;
      recognition.lang = "en-US";

      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        handleVoiceInput(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast.error("Voice recognition failed");
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = recognition;
    }
  }, []);

  const handleVoiceInput = (transcript: string) => {
    sendMessage(transcript);
    setIsListening(false);
  };

  const startListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.start();
      setIsListening(true);
      toast.info("Listening... Speak now!", {
        position: "bottom-center",
        autoClose: 2000,
      });
    }
  };

  const stopListening = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      setIsListening(false);
    }
  };

  const executeCommand = useCallback(
    async (command: string) => {
      const lowerCommand = command.toLowerCase();

      if (
        lowerCommand.includes("create") &&
        lowerCommand.includes("document")
      ) {
        const titleMatch = command.match(/["']([^"']+)["']/);
        const title = titleMatch ? titleMatch[1] : "Untitled Document";

        dispatch({ type: "SET_CURRENT_PAGE", payload: "editor" });

        if (lowerCommand.includes("letter")) {
          const letterTemplate = await generateDocumentTemplate(
            "letter",
            title
          );
          dispatch({
            type: "SET_CURRENT_PAGE_WITH_CONTENT",
            payload: {
              page: "editor",
              content: {
                title,
                content: letterTemplate,
                type: "document",
              },
            },
          });
          addBotMessage(`Created a letter template titled "${title}"! 📝`);
        } else if (lowerCommand.includes("report")) {
          const reportTemplate = await generateDocumentTemplate(
            "report",
            title
          );
          dispatch({
            type: "SET_CURRENT_PAGE_WITH_CONTENT",
            payload: {
              page: "editor",
              content: {
                title,
                content: reportTemplate,
                type: "document",
              },
            },
          });
          addBotMessage(`Created a report template titled "${title}"! 📊`);
        } else if (lowerCommand.includes("email")) {
          const emailTemplate = await generateDocumentTemplate("email", title);
          dispatch({
            type: "SET_CURRENT_PAGE_WITH_CONTENT",
            payload: {
              page: "editor",
              content: {
                title,
                content: emailTemplate,
                type: "document",
              },
            },
          });
          addBotMessage(`Created an email template! ✉️`);
        } else {
          addBotMessage(`Created a new document titled "${title}"! ✍️`);
        }
        setContext({ ...context, lastDocument: title });
        return true;
      }

      if (lowerCommand.includes("translate")) {
        const textMatch = command.match(/translate\s+["']([^"']+)["']/i);
        const langMatch = command.match(/to\s+(\w+)/i);

        if (textMatch) {
          const text = textMatch[1];
          const targetLang = langMatch ? langMatch[1] : "Spanish";

          setIsTyping(true);
          try {
            const translatedText = await generate(
              `Translate "${text}" to ${targetLang}. Only provide the translation, nothing else.`,
              { maxTokens: 200 }
            );
            setIsTyping(false);

            addBotMessage(
              `Translation to ${targetLang}:\n\n"${translatedText}"`,
              [
                { label: "Open Translator", action: "open translator" },
                { label: "Copy Translation", action: `copy:${translatedText}` },
              ]
            );

            setContext({
              ...context,
              currentTask: "translation",
            });
          } catch (error) {
            setIsTyping(false);
            addBotMessage("Translation failed. Please try again.");
          }
          return true;
        }
      }

      if (
        lowerCommand.includes("research") ||
        lowerCommand.includes("search")
      ) {
        const queryMatch = command.match(
          /(?:research|search)\s+(?:for\s+)?["']?([^"']+)["']?/i
        );

        if (queryMatch) {
          const query = queryMatch[1];
          setIsTyping(true);

          try {
            const research = await generate(
              `Research and provide comprehensive information about: ${query}. Include key facts, recent developments, and practical insights.`,
              { maxTokens: 500 }
            );
            setIsTyping(false);

            addBotMessage(
              `📚 Research Results for "${query}":\n\n${research}`,
              [
                { label: "Save as Document", action: `save:research:${query}` },
                { label: "Open Research Tool", action: "open research" },
                { label: "Deep Dive", action: `deep-research:${query}` },
              ]
            );

            setContext({
              ...context,
              currentTask: "research",
            });
          } catch (error) {
            setIsTyping(false);
            addBotMessage("Research failed. Please try again.");
          }
          return true;
        }
      }

      if (
        lowerCommand.includes("write") ||
        lowerCommand.includes("help me") ||
        lowerCommand.includes("draft")
      ) {
        const contentMatch = command.match(
          /(?:write|draft|help me with)\s+(?:a\s+)?(.+)/i
        );

        if (contentMatch) {
          const request = contentMatch[1];
          setIsTyping(true);

          try {
            const content = await generate(
              `Help write the following: ${request}. Provide a well-structured, professional response.`,
              { maxTokens: 500 }
            );
            setIsTyping(false);

            addBotMessage(`✍️ Here's your draft:\n\n${content}`, [
              { label: "Open in Editor", action: `edit:${content}` },
              { label: "Copy Text", action: `copy:${content}` },
              { label: "Improve", action: `improve:${content}` },
              { label: "Make it Shorter", action: `shorten:${content}` },
            ]);

            setContext({
              ...context,
              currentTask: "writing",
              lastDocument: request,
            });
          } catch (error) {
            setIsTyping(false);
            addBotMessage("Writing assistance failed. Please try again.");
          }
          return true;
        }
      }

      if (
        lowerCommand.includes("code") ||
        lowerCommand.includes("function") ||
        lowerCommand.includes("implement")
      ) {
        const codeRequest = command
          .replace(/^(code|write code for|implement|create function for)/i, "")
          .trim();
        setIsTyping(true);

        try {
          const code = await generate(
            `Generate code for: ${codeRequest}. Provide clean, commented code with explanations.`,
            { maxTokens: 500 }
          );
          setIsTyping(false);

          addBotMessage(`💻 Here's your code:\n\n\`\`\`\n${code}\n\`\`\``, [
            { label: "Copy Code", action: `copy:${code}` },
            { label: "Open in Editor", action: `edit:${code}` },
            { label: "Explain Code", action: `explain:${code}` },
          ]);

          setContext({
            ...context,
            currentTask: "coding",
          });
        } catch (error) {
          setIsTyping(false);
          addBotMessage("Code generation failed. Please try again.");
        }
        return true;
      }

      if (
        lowerCommand.includes("summarize") ||
        lowerCommand.includes("summary")
      ) {
        const docs = state.savedDocuments;
        if (docs.length > 0) {
          const lastDoc = docs[docs.length - 1];
          setIsTyping(true);

          try {
            const summary = await generate(
              `Summarize this content in 3-4 key points: ${lastDoc.content}`,
              { maxTokens: 200 }
            );
            setIsTyping(false);

            addBotMessage(`📄 Summary of "${lastDoc.title}":\n\n${summary}`, [
              { label: "View Document", action: `view:${lastDoc.id}` },
              {
                label: "Create Summary Doc",
                action: `create-summary:${lastDoc.id}`,
              },
            ]);
          } catch (error) {
            setIsTyping(false);
            addBotMessage("Summarization failed. Please try again.");
          }
          return true;
        }
      }

      if (lowerCommand.includes("analyze") || lowerCommand.includes("review")) {
        const docs = state.savedDocuments;
        if (docs.length > 0) {
          const lastDoc = docs[docs.length - 1];
          setIsTyping(true);

          try {
            const analysis = await generate(
              `Analyze this document and provide insights on structure, content quality, and suggestions for improvement: ${lastDoc.content}`,
              { maxTokens: 400 }
            );
            setIsTyping(false);

            addBotMessage(`🔍 Analysis of "${lastDoc.title}":\n\n${analysis}`, [
              {
                label: "Apply Suggestions",
                action: `apply-suggestions:${lastDoc.id}`,
              },
              { label: "View Document", action: `view:${lastDoc.id}` },
            ]);
          } catch (error) {
            setIsTyping(false);
            addBotMessage("Analysis failed. Please try again.");
          }
          return true;
        }
      }

      if (lowerCommand.includes("teach") || lowerCommand.includes("explain")) {
        const topic = command.replace(/^(teach me about|explain)/i, "").trim();
        setIsTyping(true);

        try {
          const explanation = await generate(
            `Explain ${topic} in a clear, educational way with examples. Make it easy to understand.`,
            { maxTokens: 500 }
          );
          setIsTyping(false);

          addBotMessage(`🎓 Learning about ${topic}:\n\n${explanation}`, [
            { label: "Save as Note", action: `save:note:${topic}` },
            { label: "Learn More", action: `deep-dive:${topic}` },
            { label: "Quiz Me", action: `quiz:${topic}` },
          ]);
        } catch (error) {
          setIsTyping(false);
          addBotMessage("Explanation failed. Please try again.");
        }
        return true;
      }

      if (
        lowerCommand.includes("brainstorm") ||
        lowerCommand.includes("ideas")
      ) {
        const topic = command
          .replace(/^(brainstorm|give me ideas for)/i, "")
          .trim();
        setIsTyping(true);

        try {
          const ideas = await generate(
            `Brainstorm creative ideas for: ${topic}. Provide 5-7 unique and innovative suggestions.`,
            { maxTokens: 400 }
          );
          setIsTyping(false);

          addBotMessage(`💡 Brainstorming Ideas for "${topic}":\n\n${ideas}`, [
            { label: "Save Ideas", action: `save:brainstorm:${topic}` },
            { label: "Expand on Idea", action: `expand:${topic}` },
            { label: "More Ideas", action: `more-ideas:${topic}` },
          ]);
        } catch (error) {
          setIsTyping(false);
          addBotMessage("Brainstorming failed. Please try again.");
        }
        return true;
      }

      if (lowerCommand.includes("todo") || lowerCommand.includes("task")) {
        const taskMatch = command.match(
          /(?:add|create)\s+(?:task|todo)\s+["']?([^"']+)["']?/i
        );

        if (taskMatch) {
          const task = taskMatch[1];
          const tasks = JSON.parse(
            localStorage.getItem("chatbot-tasks") || "[]"
          );
          tasks.push({
            id: Date.now().toString(),
            task,
            completed: false,
            created: new Date().toISOString(),
          });
          localStorage.setItem("chatbot-tasks", JSON.stringify(tasks));

          addBotMessage(
            `✅ Task added: "${task}"\n\nYou have ${tasks.length} task(s) in your list.`,
            [
              { label: "View All Tasks", action: "view-tasks" },
              { label: "Add Another", action: "add-task" },
            ]
          );
          return true;
        }
      }

      if (
        lowerCommand.includes("export chat") ||
        lowerCommand.includes("save conversation")
      ) {
        const chatContent = messages
          .map(
            (m) =>
              `[${m.timestamp.toLocaleTimeString()}] ${
                m.type === "user" ? "You" : "AI"
              }: ${m.content}`
          )
          .join("\n\n");

        dispatch({
          type: "SET_CURRENT_PAGE_WITH_CONTENT",
          payload: {
            page: "editor",
            content: {
              title: `Chat Export - ${new Date().toLocaleDateString()}`,
              content: chatContent,
              type: "document",
            },
          },
        });

        addBotMessage("Chat history exported to document editor! 📋");
        return true;
      }

      if (
        lowerCommand.includes("schedule") ||
        lowerCommand.includes("remind")
      ) {
        const timeMatch = command.match(
          /(?:at|in)\s+(\d+:\d+|\d+\s+(?:hours?|minutes?|days?))/i
        );
        const taskMatch = command.match(
          /(?:to|about)\s+(.+?)(?:\s+at|\s+in|$)/i
        );

        if (taskMatch) {
          const task = taskMatch[1];
          const time = timeMatch ? timeMatch[1] : "later";

          addBotMessage(`⏰ Reminder set: "${task}" for ${time}`, [
            { label: "View Reminders", action: "view-reminders" },
            { label: "Set Another", action: "set-reminder" },
          ]);

          const reminders = JSON.parse(
            localStorage.getItem("chatbot-reminders") || "[]"
          );
          reminders.push({
            id: Date.now().toString(),
            task,
            time,
            created: new Date().toISOString(),
          });
          localStorage.setItem("chatbot-reminders", JSON.stringify(reminders));
          return true;
        }
      }

      return handleNavigationCommands(lowerCommand);
    },
    [dispatch, state.savedDocuments, messages, context]
  );

  const handleNavigationCommands = (lowerCommand: string): boolean => {
    if (
      lowerCommand.includes("open editor") ||
      lowerCommand.includes("new document") ||
      lowerCommand.includes("write")
    ) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: "editor" });
      addBotMessage("Opening the document editor for you! ✍️");
      return true;
    }

    if (
      lowerCommand.includes("open chat") ||
      lowerCommand.includes("start chat")
    ) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: "chat" });
      addBotMessage("Starting a new chat session! 💬");
      return true;
    }

    if (
      lowerCommand.includes("open translator") ||
      lowerCommand.includes("translation tool")
    ) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: "translate" });
      addBotMessage("Opening the translator! 🌍");
      return true;
    }

    if (
      lowerCommand.includes("open research") ||
      lowerCommand.includes("research tool")
    ) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: "research" });
      addBotMessage("Opening the research tool! 🔍");
      return true;
    }

    if (
      lowerCommand.includes("show documents") ||
      lowerCommand.includes("my documents")
    ) {
      dispatch({ type: "SET_CURRENT_PAGE", payload: "saved" });
      const docCount = state.savedDocuments.length;
      addBotMessage(
        `You have ${docCount} saved document${docCount !== 1 ? "s" : ""}! 📚`
      );
      return true;
    }

    return false;
  };

  const generateDocumentTemplate = async (
    type: string,
    title: string
  ): Promise<string> => {
    const prompts: Record<string, string> = {
      letter: `Create a professional letter template with placeholder text. Include: sender address, date, recipient address, salutation, body paragraphs, closing, and signature line.`,
      report: `Create a professional report template for "${title}". Include: executive summary, introduction, methodology, findings, conclusions, and recommendations sections.`,
      email: `Create a professional email template. Include: subject line, greeting, introduction, main content, call to action, and professional closing.`,
    };

    try {
      const template = await generate(prompts[type] || prompts.letter, {
        maxTokens: 500,
      });
      return template;
    } catch (error) {
      return `<h1>${title}</h1>\n<p>Start writing here...</p>`;
    }
  };

  useEffect(() => {
    const handleAction = async (event: CustomEvent) => {
      const action = event.detail;

      if (action.startsWith("copy:")) {
        const text = action.replace("copy:", "");
        await navigator.clipboard.writeText(text);
        toast.success("Copied to clipboard!", {
          position: "bottom-center",
          autoClose: 2000,
        });
      } else if (action.startsWith("edit:")) {
        const content = action.replace("edit:", "");
        dispatch({
          type: "SET_CURRENT_PAGE_WITH_CONTENT",
          payload: {
            page: "editor",
            content: {
              title: "AI Generated Content",
              content,
              type: "document",
            },
          },
        });
        addBotMessage("Content opened in editor! 📝");
      } else if (action.startsWith("save:")) {
        const parts = action.split(":");
        const saveType = parts[1];
        const saveTitle = parts[2];

        const docId = Date.now().toString();
        const content = messages[messages.length - 1]?.content || "";

        dispatch({
          type: "SAVE_DOCUMENT",
          payload: {
            id: docId,
            title: saveTitle || "AI Generated",
            content,
            type: saveType === "research" ? "research" : "document",
            created: new Date().toISOString(),
            lastModified: new Date().toISOString(),
            wordCount: content.split(" ").length,
            characterCount: content.length,
            preview: content.substring(0, 150),
          },
        });

        addBotMessage(`Saved as "${saveTitle}"! 💾`);
      } else if (action === "view-tasks") {
        const tasks = JSON.parse(localStorage.getItem("chatbot-tasks") || "[]");
        const taskList = tasks
          .map(
            (t: any, i: number) =>
              `${i + 1}. ${t.task} ${t.completed ? "✅" : "⏳"}`
          )
          .join("\n");

        addBotMessage(`📋 Your Tasks:\n\n${taskList || "No tasks yet!"}`, [
          { label: "Add Task", action: "add-task" },
          { label: "Clear Completed", action: "clear-completed" },
        ]);
      } else {
        executeCommand(action);
      }
    };

    window.addEventListener("chatbot-action" as any, handleAction);
    return () => {
      window.removeEventListener("chatbot-action" as any, handleAction);
    };
  }, [messages]);

  const addUserMessage = (content: string) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: "user",
      content,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, message]);
  };

  const addBotMessage = (content: string, actions?: ChatMessage["actions"]) => {
    const message: ChatMessage = {
      id: Date.now().toString(),
      type: "bot",
      content,
      timestamp: new Date(),
      actions,
    };
    setMessages((prev) => [...prev, message]);
  };

  const sendMessage = useCallback(
    async (message: string) => {
      addUserMessage(message);

      const isCommand = await executeCommand(message);
      if (isCommand) return;

      setIsTyping(true);

      try {
        const contextInfo = context.currentTask
          ? `The user is currently working on: ${context.currentTask}. `
          : "";

        const prompt = `You are a helpful AI assistant integrated into a document editing application. 
        ${contextInfo}
        The user said: "${message}"
        
        Capabilities you can mention if relevant:
        - Create and edit documents with templates
        - Translate text between languages
        - Research topics
        - Generate code
        - Summarize documents
        - Brainstorm ideas
        - Writing assistance
        - Task management
        
        Provide a helpful, friendly, and concise response. Be conversational and engaging.
        If the user seems to need help with a specific task, suggest relevant actions.`;

        const response = await generate(prompt, { maxTokens: 300 });
        setIsTyping(false);

        const actions: ChatMessage["actions"] = [];
        const lowerResponse = response.toLowerCase();

        if (
          lowerResponse.includes("document") ||
          lowerResponse.includes("write")
        ) {
          actions.push({ label: "Create Document", action: "open editor" });
        }
        if (lowerResponse.includes("translat")) {
          actions.push({ label: "Open Translator", action: "open translator" });
        }
        if (
          lowerResponse.includes("research") ||
          lowerResponse.includes("search")
        ) {
          actions.push({ label: "Start Research", action: "open research" });
        }
        if (lowerResponse.includes("help")) {
          actions.push({ label: "Show Commands", action: "help" });
        }

        addBotMessage(response, actions.length > 0 ? actions : undefined);
      } catch (error) {
        setIsTyping(false);
        addBotMessage(
          "I'm having trouble connecting right now. Please try again in a moment. 🤔"
        );
        console.error("Chatbot error:", error);
      }
    },
    [generate, context, executeCommand]
  );

  const clearChat = useCallback(() => {
    setMessages([]);
    setContext({});
    toast.success("Chat cleared!", {
      position: "bottom-center",
      autoClose: 2000,
    });
  }, []);

  const exportChat = useCallback(async () => {
    const chatHTML = messages
      .map(
        (m) => `
        <div style="margin-bottom: 16px;">
          <strong>${m.type === "user" ? "You" : "AI Assistant"}:</strong>
          <p>${m.content}</p>
          <small>${m.timestamp.toLocaleString()}</small>
        </div>
      `
      )
      .join("");

    return chatHTML;
  }, [messages]);

  return {
    messages,
    isTyping,
    sendMessage,
    clearChat,
    executeCommand,
    exportChat,
    startListening,
    stopListening,
    isListening,
    context,
  };
};
