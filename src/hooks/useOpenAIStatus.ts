import { useState, useEffect } from "react";

import { isOpenAIConfigured } from "../utils/env";

import { chatCompletion, textToSpeech } from "./openai";

export interface OpenAIStatus {
  isTesting: boolean;
  chatCompletionStatus: {
    isAvailable: boolean;
    error: string | null;
    tested: boolean;
  };
  textToSpeechStatus: {
    isAvailable: boolean;
    error: string | null;
    tested: boolean;
  };
  configurationStatus: {
    isConfigured: boolean;
    missingVars: string[];
  };
}

export const useOpenAIStatus = () => {
  const [status, setStatus] = useState<OpenAIStatus>({
    isTesting: false,
    chatCompletionStatus: {
      isAvailable: false,
      error: null,
      tested: false,
    },
    textToSpeechStatus: {
      isAvailable: false,
      error: null,
      tested: false,
    },
    configurationStatus: {
      isConfigured: false,
      missingVars: [],
    },
  });

  // 檢查環境變數配置
  const checkConfiguration = () => {
    const configured = isOpenAIConfigured();
    const missingVars: string[] = [];

    if (!process.env.EXPO_PUBLIC_OPENAI_API_KEY) {
      missingVars.push("EXPO_PUBLIC_OPENAI_API_KEY");
    }
    if (!process.env.EXPO_PUBLIC_OPENAI_BASE_URL) {
      missingVars.push("EXPO_PUBLIC_OPENAI_BASE_URL");
    }
    if (!process.env.EXPO_PUBLIC_OPENAI_MODEL) {
      missingVars.push("EXPO_PUBLIC_OPENAI_MODEL");
    }

    setStatus((prev) => ({
      ...prev,
      configurationStatus: {
        isConfigured: configured,
        missingVars,
      },
    }));

    return configured;
  };

  // 測試 Chat Completion API
  const testChatCompletion = async () => {
    if (!checkConfiguration()) {
      setStatus((prev) => ({
        ...prev,
        chatCompletionStatus: {
          isAvailable: false,
          error: "OpenAI 環境變數未設定完整",
          tested: true,
        },
      }));

      return;
    }

    try {
      let response = "";
      let hasError = false;

      await chatCompletion({
        messages: [{ role: "user", content: "hi" }],
        onDelta: (delta) => {
          response += delta;
          // 檢查是否有錯誤訊息
          if (delta.includes("❌")) {
            hasError = true;
          }
        },
      });

      if (hasError || response.includes("❌")) {
        throw new Error(response);
      }

      setStatus((prev) => ({
        ...prev,
        chatCompletionStatus: {
          isAvailable: true,
          error: null,
          tested: true,
        },
      }));
    } catch (error) {
      let errorMessage = "Chat Completion API 連線失敗";

      if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          errorMessage = "API Key 無效或未授權";
        } else if (
          error.message.includes("404") ||
          error.message.includes("Not Found")
        ) {
          errorMessage = "API 端點不存在，請檢查 BASE_URL 設定";
        } else if (
          error.message.includes("429") ||
          error.message.includes("Rate limit")
        ) {
          errorMessage = "API 請求頻率限制，請稍後再試";
        } else if (error.message.includes("設定")) {
          errorMessage = error.message;
        } else if (error.message.includes("Network")) {
          errorMessage = "網路連線問題，請檢查網路或 BASE_URL";
        }
      }

      setStatus((prev) => ({
        ...prev,
        chatCompletionStatus: {
          isAvailable: false,
          error: errorMessage,
          tested: true,
        },
      }));
    }
  };

  // 測試 Text-to-Speech API
  const testTextToSpeech = async () => {
    if (!checkConfiguration()) {
      setStatus((prev) => ({
        ...prev,
        textToSpeechStatus: {
          isAvailable: false,
          error: "OpenAI 環境變數未設定完整",
          tested: true,
        },
      }));

      return;
    }

    try {
      const audioUri = await textToSpeech("test");

      if (audioUri) {
        setStatus((prev) => ({
          ...prev,
          textToSpeechStatus: {
            isAvailable: true,
            error: null,
            tested: true,
          },
        }));
      } else {
        throw new Error("未取得音訊資料");
      }
    } catch (error) {
      let errorMessage = "Text-to-Speech API 連線失敗";

      if (error instanceof Error) {
        if (
          error.message.includes("401") ||
          error.message.includes("Unauthorized")
        ) {
          errorMessage = "API Key 無效或未授權";
        } else if (
          error.message.includes("404") ||
          error.message.includes("Not Found")
        ) {
          errorMessage = "TTS API 端點不存在，請檢查 BASE_URL 設定";
        } else if (
          error.message.includes("429") ||
          error.message.includes("Rate limit")
        ) {
          errorMessage = "API 請求頻率限制，請稍後再試";
        } else if (
          error.message.includes("設定") ||
          error.message.includes("Configuration")
        ) {
          errorMessage = "OpenAI 設定不完整";
        } else if (
          error.message.includes("Network") ||
          error.message.includes("fetch")
        ) {
          errorMessage = "網路連線問題，請檢查網路或 BASE_URL";
        }
      }

      setStatus((prev) => ({
        ...prev,
        textToSpeechStatus: {
          isAvailable: false,
          error: errorMessage,
          tested: true,
        },
      }));
    }
  };

  // 執行所有測試
  const runAllTests = async () => {
    setStatus((prev) => ({
      ...prev,
      isTesting: true,
      chatCompletionStatus: { ...prev.chatCompletionStatus, tested: false },
      textToSpeechStatus: { ...prev.textToSpeechStatus, tested: false },
    }));

    await Promise.all([testChatCompletion(), testTextToSpeech()]);

    setStatus((prev) => ({
      ...prev,
      isTesting: false,
    }));
  };

  // 組件載入時自動執行測試
  useEffect(() => {
    runAllTests();
  }, []);

  return {
    status,
    runAllTests,
    testChatCompletion,
    testTextToSpeech,
  };
};
