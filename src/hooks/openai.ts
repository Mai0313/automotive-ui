import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";

import { OpenAI } from "openai";
import { Stream } from "openai/streaming";

import {
  getOpenAIApiKey,
  getOpenAIBaseUrl,
  getOpenAIModel,
  isOpenAIConfigured,
} from "../utils/env";

/**
 * Custom error class for OpenAI configuration issues
 */
class OpenAIConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "OpenAIConfigurationError";
  }
}

// Initialize the OpenAI client
const createClient = () => {
  if (!isOpenAIConfigured()) {
    const errorMsg = `🚫 [OpenAI] Configuration incomplete. Please check the following environment variables:
- EXPO_PUBLIC_OPENAI_API_KEY
- EXPO_PUBLIC_OPENAI_BASE_URL  
- EXPO_PUBLIC_OPENAI_MODEL`;

    console.error(errorMsg);
    throw new OpenAIConfigurationError("OpenAI configuration is incomplete");
  }

  const apiKey = getOpenAIApiKey()!;
  const baseURL = getOpenAIBaseUrl()!;

  return new OpenAI({
    apiKey,
    baseURL,
    dangerouslyAllowBrowser: true,
  });
};

// Export a streaming chat completion function
export async function chatCompletion({
  messages,
  onDelta,
  signal,
}: {
  messages: ChatCompletionMessageParam[];
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  try {
    if (!isOpenAIConfigured()) {
      const errorMsg =
        "🚫 [OpenAI Chat] Configuration incomplete. Please configure OpenAI environment variables to use chat functionality.";

      console.error(errorMsg);
      onDelta("❌ OpenAI 設定不完整，無法使用對話功能。請檢查環境變數設定。");

      return;
    }

    const client = createClient();
    const model = getOpenAIModel()!;

    const stream = await client.chat.completions.create(
      {
        model,
        messages,
        stream: true,
      },
      { signal },
    );

    for await (const chunk of stream as Stream<ChatCompletionChunk>) {
      const delta = chunk.choices?.[0]?.delta?.content;

      if (delta) onDelta(delta);
    }
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      console.error("🚫 [OpenAI Chat] Configuration error:", error.message);
      onDelta("❌ OpenAI 設定錯誤，請檢查環境變數配置。");

      return;
    }

    console.error("🚫 [OpenAI Chat] API error:", error);

    // 提供更友善的錯誤訊息給用戶
    let userMessage = "❌ 對話服務暫時無法使用";

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        userMessage = "❌ API 金鑰無效，請檢查設定";
      } else if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        userMessage = "❌ 模型或端點不存在，請檢查設定";
      } else if (
        error.message.includes("429") ||
        error.message.includes("Rate limit")
      ) {
        userMessage = "❌ API 請求過於頻繁，請稍後再試";
      }
    }

    onDelta(userMessage);
    throw error;
  }
}

// Export a non-streaming chat completion function that returns the complete response
export async function chatCompletionComplete({
  messages,
  signal,
}: {
  messages: ChatCompletionMessageParam[];
  signal?: AbortSignal;
}): Promise<string> {
  try {
    if (!isOpenAIConfigured()) {
      const errorMsg =
        "🚫 [OpenAI Chat] Configuration incomplete. Please configure OpenAI environment variables to use chat functionality.";

      console.error(errorMsg);

      return "❌ OpenAI 設定不完整，無法使用對話功能。請檢查環境變數設定。";
    }

    const client = createClient();
    const model = getOpenAIModel()!;

    const completion = await client.chat.completions.create(
      {
        model,
        messages,
        stream: false,
      },
      { signal },
    );

    const content = completion.choices?.[0]?.message?.content;

    return content || "❌ 無法生成回應";
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      console.error("🚫 [OpenAI Chat] Configuration error:", error.message);

      return "❌ OpenAI 設定錯誤，請檢查環境變數配置。";
    }

    console.error("🚫 [OpenAI Chat] API error:", error);

    // 提供更友善的錯誤訊息給用戶
    let userMessage = "❌ 對話服務暫時無法使用";

    if (error instanceof Error) {
      if (
        error.message.includes("401") ||
        error.message.includes("Unauthorized")
      ) {
        userMessage = "❌ API 金鑰無效，請檢查設定";
      } else if (
        error.message.includes("404") ||
        error.message.includes("Not Found")
      ) {
        userMessage = "❌ 模型或端點不存在，請檢查設定";
      } else if (
        error.message.includes("429") ||
        error.message.includes("Rate limit")
      ) {
        userMessage = "❌ API 請求過於頻繁，請稍後再試";
      }
    }

    return userMessage;
  }
}
