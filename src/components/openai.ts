import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";
import { AzureOpenAI, OpenAI } from "openai";
import { Stream } from "openai/streaming";

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