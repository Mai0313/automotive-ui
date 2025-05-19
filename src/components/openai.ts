import type {
  ChatCompletionMessageParam,
  ChatCompletionChunk,
} from "openai/resources";

import { AzureOpenAI, OpenAI } from "openai";
import { Stream } from "openai/streaming";

// Initialize the appropriate client based on api_type
const createClient = () => {
  const apiType = process.env.OPENAI_API_TYPE || "openai";

  if (apiType === "azure") {
    // Azure OpenAI
    const apiKey = process.env.AZURE_OPENAI_API_KEY!;
    const baseURL = (process.env.AZURE_OPENAI_ENDPOINT || "") + "/openai";
    const deployment = process.env.AZURE_OPENAI_DEPLOYMENT || process.env.OPENAI_MODEL;
    const apiVersion = process.env.OPENAI_API_VERSION;
    return new AzureOpenAI({
      apiKey,
      baseURL,
      deployment,
      apiVersion,
      dangerouslyAllowBrowser: true,
    });
  } else {
    const apiKey = process.env.OPENAI_API_KEY!;
    const baseURL = process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";
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
  model = undefined,
}: {
  messages: ChatCompletionMessageParam[];
  onDelta: (delta: string) => void;
  signal?: AbortSignal;
  model?: string;
}): Promise<void> {
  const client = createClient();
  // AzureOpenAI and OpenAI both support .chat.completions.create
  // with stream: true for streaming
  const stream = await client.chat.completions.create({
    model: model || process.env.OPENAI_MODEL || "gpt-3.5-turbo",
    messages,
    stream: true,
  }, { signal });

  for await (const chunk of stream as Stream<ChatCompletionChunk>) {
    const delta = chunk.choices?.[0]?.delta?.content;
    if (delta) onDelta(delta);
  }
}
