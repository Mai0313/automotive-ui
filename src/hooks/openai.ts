import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";

import { OpenAI } from "openai";
import { Stream } from "openai/streaming";
import { Platform } from "react-native";
import * as FileSystem from "expo-file-system"; // Added import

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

export async function transcribeAudio(audioUri: string): Promise<string> {
  try {
    if (!isOpenAIConfigured()) {
      const errorMsg =
        "🚫 [OpenAI Transcribe] Configuration incomplete. Please configure OpenAI environment variables to use speech-to-text functionality.";

      console.error(errorMsg);
      throw new OpenAIConfigurationError(
        "OpenAI configuration is incomplete for transcription",
      );
    }

    const client = createClient();

    const response = await fetch(audioUri);
    const blob = await response.blob();

    console.log(`📝 [Transcribe] Processing audio from URI: ${audioUri}`);
    console.log(`📝 [Transcribe] Size: ${blob.size}, Type: ${blob.type}`);

    // Determine filename and type based on platform and URI
    // Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    let filename = "audio.m4a"; // Default for Android or if type is generic
    let audioFile: File;

    // It's crucial that the file extension in `filename` matches the actual audio format.
    // Whisper uses the filename extension to determine how to process the file.
    if (
      Platform.OS === "ios" &&
      (audioUri.endsWith(".caf") ||
        blob.type === "audio/x-caf" ||
        blob.type === "audio/caf")
    ) {
      filename = "audio.caf";
      audioFile = new File([blob], filename, { type: "audio/x-caf" });
    } else if (
      Platform.OS === "android" &&
      (audioUri.endsWith(".mp4") ||
        audioUri.endsWith(".m4a") ||
        blob.type === "audio/mp4" ||
        blob.type === "audio/m4a")
    ) {
      // Android often records in .mp4 (which is m4a audio in an mp4 container) or .m4a
      filename = "audio.m4a"; // Whisper prefers .m4a for this format
      audioFile = new File([blob], filename, { type: "audio/m4a" });
    } else if (blob.type && blob.type.startsWith("audio/webm")) {
      filename = "audio.webm";
      audioFile = new File([blob], filename, { type: blob.type });
    } else if (
      blob.type &&
      (blob.type.startsWith("audio/wav") || blob.type.startsWith("audio/wave"))
    ) {
      filename = "audio.wav";
      audioFile = new File([blob], filename, { type: blob.type });
    } else if (blob.type && blob.type.startsWith("audio/mpeg")) {
      filename = "audio.mp3"; // Assuming mpeg is mp3
      audioFile = new File([blob], filename, { type: blob.type });
    } else {
      // Fallback, trying to infer from blob type or defaulting to m4a
      const extensionFromType = blob.type ? blob.type.split("/")[1] : null;

      if (
        extensionFromType &&
        ["mp3", "mp4", "mpeg", "mpga", "m4a", "wav", "webm"].includes(
          extensionFromType.split("+")[0],
        )
      ) {
        filename = `audio.${extensionFromType.split("+")[0]}`;
      } else {
        // Default if type is unknown or not directly supported by a simple extension mapping
        console.warn(
          `⚠️ [Transcribe] Unknown audio type: ${blob.type}, defaulting to audio.m4a for transcription.`,
        );
        filename = "audio.m4a";
      }
      audioFile = new File([blob], filename, {
        type: blob.type || "audio/m4a",
      });
    }
    console.log(
      "📝 [Transcribe] Created File object. Size:",
      audioFile.size,
      "Name:",
      audioFile.name,
      "Type:",
      audioFile.type,
    );

    console.log(
      `📝 [Transcribe] Attempting to transcribe with filename: ${filename} and type: ${audioFile.type}`,
    );

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    console.log("✅ [Transcribe] Successful:", transcription.text);

    return transcription.text;
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      console.error(
        "🚫 [OpenAI Transcribe] Configuration error:",
        error.message,
      );
      throw error;
    }

    console.error("🚫 [OpenAI Transcribe] API error:", error);
    let errorMessage = "Unknown error during transcription";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }

    throw new Error(`Failed to transcribe audio: ${errorMessage}`);
  }
}

export async function textToSpeech(text: string): Promise<string | null> {
  try {
    if (!isOpenAIConfigured()) {
      const errorMsg =
        "🚫 [OpenAI TTS] Configuration incomplete. Please configure OpenAI environment variables to use text-to-speech functionality.";

      console.error(errorMsg);
      throw new OpenAIConfigurationError(
        "OpenAI configuration is incomplete for TTS",
      );
    }

    const client = createClient();

    console.log(`🔊 [TTS] Attempting to generate speech for text:\n"${text}"`);
    const response = await client.audio.speech.create({
      model: "tts-1-hd",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });

    console.log("🔊 [TTS] OpenAI API call successful, attempting to get blob.");

    const blob = await response.blob();

    console.log(
      "🔊 [TTS] Blob received, size:",
      blob.size,
      "type:",
      blob.type,
      "attempting to read with FileReader.",
    );

    const reader = new FileReader();

    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        console.log("🔊 [TTS] FileReader onloadend.");
        if (typeof reader.result !== "string") {
          console.error("🚫 [TTS] FileReader result is not a string.");

          return reject(new Error("Failed to read audio data as base64."));
        }

        if (Platform.OS === "web") {
          // On web, play directly from data URL
          console.log("🔊 [TTS] Web platform. Resolving with data URI.");
          resolve(reader.result); // reader.result is the base64 data URI
        } else {
          // On native, save to file and play from file URI
          const base64Data = reader.result.split(",")[1];
          const fileUri =
            FileSystem.documentDirectory + `speech_${Date.now()}.mp3`;

          console.log(
            "🔊 [TTS] Native platform. Attempting to write audio to FileSystem at:",
            fileUri,
          );
          try {
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log(
              "✅ [TTS] FileSystem write successful. Resolving with file URI:",
              fileUri,
            );
            resolve(fileUri);
          } catch (fileSystemError) {
            console.error("🚫 [TTS] FileSystem write error:", fileSystemError);
            reject(fileSystemError);
          }
        }
      };
      reader.onerror = (error) => {
        console.error("🚫 [TTS] FileReader onerror:", error);
        reject(new Error("Failed to read audio blob for TTS."));
      };
      reader.readAsDataURL(blob);
      console.log("🔊 [TTS] FileReader.readAsDataURL(blob) called.");
    });
  } catch (error) {
    if (error instanceof OpenAIConfigurationError) {
      console.error("🚫 [OpenAI TTS] Configuration error:", error.message);
      throw error;
    }

    console.error(
      "🚫 [TTS] OpenAI TTS API error or other error in textToSpeech:",
      error,
    );
    let errorMessage = "Unknown error during text-to-speech conversion";

    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === "string") {
      errorMessage = error;
    }
    // Consider more specific error handling for OpenAI.APIError if needed
    throw new Error(`Failed to generate speech: ${errorMessage}`);
  }
}
