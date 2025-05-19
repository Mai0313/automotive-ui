import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";
import { AzureOpenAI, OpenAI } from "openai";
import { Stream } from "openai/streaming";
import { Platform } from "react-native";
import * as FileSystem from 'expo-file-system'; // Added import

// Initialize the appropriate client based on api_type
const createClient = () => {
  const apiType = process.env.EXPO_PUBLIC_OPENAI_API_TYPE;
  console.log("config", process.env);
  console.log("apiType", process.env.EXPO_PUBLIC_OPENAI_API_TYPE);

  if (apiType === "azure") {
    const apiKey = process.env.EXPO_PUBLIC_AZURE_OPENAI_API_KEY;
    const baseURL = process.env.EXPO_PUBLIC_AZURE_OPENAI_ENDPOINT + "/openai";
    const deployment = process.env.EXPO_PUBLIC_AZURE_OPENAI_DEPLOYMENT || process.env.EXPO_PUBLIC_OPENAI_MODEL;
    const apiVersion = process.env.EXPO_PUBLIC_OPENAI_API_VERSION;
    console.log("Using Azure OpenAI client");
    return new AzureOpenAI({
      apiKey,
      baseURL,
      deployment,
      apiVersion,
      dangerouslyAllowBrowser: true,
    });
  } else {
    const apiKey = process.env.EXPO_PUBLIC_OPENAI_API_KEY;
    const baseURL = process.env.EXPO_PUBLIC_OPENAI_BASE_URL;
    console.log("Using OpenAI client");
    return new OpenAI({
      apiKey,
      baseURL,
      dangerouslyAllowBrowser: true,
    });
  }
};

// Export a streaming chat completion function
export async function streamChatCompletion({
  messages,
  onDelta,
  signal,
}: {
  messages: ChatCompletionMessageParam[];
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
}): Promise<void> {
  try {
    const client = createClient();
    console.log("streamChatCompletion called with model:", process.env.EXPO_PUBLIC_OPENAI_MODEL);

    const stream = await client.chat.completions.create(
      {
        model: process.env.EXPO_PUBLIC_OPENAI_MODEL,
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
    console.error("OpenAI API error:", error);
    throw error;
  }
}

export async function transcribeAudio(audioUri: string): Promise<string> {
  const client = createClient();
  try {
    console.log(`Transcribing audio from URI: ${audioUri}`);

    const response = await fetch(audioUri);
    const blob = await response.blob();
    console.log("[Transcribe] Fetched blob. Size:", blob.size, "Type:", blob.type);

    // Determine filename and type based on platform and URI
    // Whisper supports: mp3, mp4, mpeg, mpga, m4a, wav, webm
    let filename = "audio.m4a"; // Default for Android or if type is generic
    let audioFile: File;

    // It's crucial that the file extension in `filename` matches the actual audio format.
    // Whisper uses the filename extension to determine how to process the file.
    if (Platform.OS === 'ios' && (audioUri.endsWith('.caf') || blob.type === 'audio/x-caf' || blob.type === 'audio/caf')) {
      filename = "audio.caf";
      audioFile = new File([blob], filename, { type: "audio/x-caf" });
    } else if (Platform.OS === 'android' && (audioUri.endsWith('.mp4') || audioUri.endsWith('.m4a') || blob.type === 'audio/mp4' || blob.type === 'audio/m4a')) {
      // Android often records in .mp4 (which is m4a audio in an mp4 container) or .m4a
      filename = "audio.m4a"; // Whisper prefers .m4a for this format
      audioFile = new File([blob], filename, { type: "audio/m4a" });
    } else if (blob.type && (blob.type.startsWith("audio/webm"))) {
      filename = "audio.webm";
      audioFile = new File([blob], filename, { type: blob.type });
    } else if (blob.type && (blob.type.startsWith("audio/wav") || blob.type.startsWith("audio/wave"))) {
      filename = "audio.wav";
      audioFile = new File([blob], filename, { type: blob.type });
    } else if (blob.type && (blob.type.startsWith("audio/mpeg"))) {
      filename = "audio.mp3"; // Assuming mpeg is mp3
      audioFile = new File([blob], filename, { type: blob.type });
    } else {
      // Fallback, trying to infer from blob type or defaulting to m4a
      const extensionFromType = blob.type ? blob.type.split('/')[1] : null;
      if (extensionFromType && ['mp3', 'mp4', 'mpeg', 'mpga', 'm4a', 'wav', 'webm'].includes(extensionFromType.split('+')[0])) {
        filename = `audio.${extensionFromType.split('+')[0]}`;
      } else {
        // Default if type is unknown or not directly supported by a simple extension mapping
        console.warn(`Unknown audio type: ${blob.type}, defaulting to audio.m4a for transcription.`);
        filename = "audio.m4a";
      }
      audioFile = new File([blob], filename, { type: blob.type || "audio/m4a" });
    }
    console.log("[Transcribe] Created File object. Size:", audioFile.size, "Name:", audioFile.name, "Type:", audioFile.type);
    
    console.log(`Attempting to transcribe with filename: ${filename} and type: ${audioFile.type}`);

    const transcription = await client.audio.transcriptions.create({
      file: audioFile,
      model: "whisper-1",
    });

    console.log("Transcription successful:", transcription.text);
    return transcription.text;
  } catch (error) {
    console.error("OpenAI Transcription API error:", error);
    let errorMessage = "Unknown error during transcription";
    if (error instanceof Error) {
      errorMessage = error.message;
      // If the error object has more specific properties from the OpenAI SDK, 
      // you might need to cast it to a more specific error type or check for those properties.
      // For example, if it's an APIError from 'openai' library:
      // if (error instanceof OpenAI.APIError) {
      //   console.error("OpenAI API Error Status:", error.status);
      //   console.error("OpenAI API Error Headers:", error.headers);
      //   console.error("OpenAI API Error Code:", error.code);
      // }
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // The following console.error lines for error.response, error.request, error.message
    // were for a generic Axios-like error structure. 
    // With the OpenAI SDK, errors are typically instances of Error or OpenAI.APIError.
    // Consider adjusting based on the actual error objects you encounter from the SDK.

    // Example of checking for OpenAI SDK specific error details if needed:
    // if (error && typeof error === 'object' && 'response' in error) {
    //   const apiError = error as { response?: { data?: any, status?: number, headers?: any }, request?: any, message?: string };
    //   if (apiError.response) {
    //     console.error("Error response data:", apiError.response.data);
    //     console.error("Error response status:", apiError.response.status);
    //     console.error("Error response headers:", apiError.response.headers);
    //   } else if (apiError.request) {
    //     console.error("Error request:", apiError.request);
    //   } else if (apiError.message) {
    //     console.error('Error message:', apiError.message);
    //   }
    // }

    throw new Error(`Failed to transcribe audio: ${errorMessage}`);
  }
  // Ensure a string is always returned or an error is thrown.
  // This path should ideally not be reached if errors are handled correctly above.
  return ""; 
}

export async function textToSpeech(text: string): Promise<string | null> {
  const client = createClient();
  try {
    console.log(`[TTS] Attempting to generate speech for text: "${text.substring(0, 30)}..."`);
    const response = await client.audio.speech.create({
      model: "tts-1-hd",
      voice: "alloy",
      input: text,
      response_format: "mp3",
    });
    console.log("[TTS] OpenAI API call successful, attempting to get blob.");

    const blob = await response.blob();
    console.log("[TTS] Blob received, size:", blob.size, "type:", blob.type, "attempting to read with FileReader.");

    const reader = new FileReader();
    return new Promise((resolve, reject) => {
      reader.onloadend = async () => {
        console.log("[TTS] FileReader onloadend.");
        if (typeof reader.result !== 'string') {
          console.error("[TTS] FileReader result is not a string.");
          return reject(new Error("Failed to read audio data as base64."));
        }

        if (Platform.OS === 'web') {
          // On web, play directly from data URL
          console.log("[TTS] Web platform. Resolving with data URI.");
          resolve(reader.result); // reader.result is the base64 data URI
        } else {
          // On native, save to file and play from file URI
          const base64Data = reader.result.split(',')[1];
          const fileUri = FileSystem.documentDirectory + `speech_${Date.now()}.mp3`;
          console.log("[TTS] Native platform. Attempting to write audio to FileSystem at:", fileUri);
          try {
            await FileSystem.writeAsStringAsync(fileUri, base64Data, {
              encoding: FileSystem.EncodingType.Base64,
            });
            console.log("[TTS] FileSystem write successful. Resolving with file URI:", fileUri);
            resolve(fileUri);
          } catch (fileSystemError) {
            console.error("[TTS] FileSystem write error:", fileSystemError);
            reject(fileSystemError);
          }
        }
      };
      reader.onerror = (error) => {
        console.error("[TTS] FileReader onerror:", error);
        reject(new Error("Failed to read audio blob for TTS."));
      };
      reader.readAsDataURL(blob);
      console.log("[TTS] FileReader.readAsDataURL(blob) called.");
    });

  } catch (error) {
    console.error("[TTS] OpenAI TTS API error or other error in textToSpeech:", error);
    let errorMessage = "Unknown error during text-to-speech conversion";
    if (error instanceof Error) {
      errorMessage = error.message;
    } else if (typeof error === 'string') {
      errorMessage = error;
    }
    // Consider more specific error handling for OpenAI.APIError if needed
    throw new Error(`Failed to generate speech: ${errorMessage}`);
  }
}