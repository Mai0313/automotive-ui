import { Platform } from "react-native";

/**
 * Get required environment variable or throw error
 */
function getRequiredEnv(key: string): string {
  const value = process.env[key];

  if (!value) {
    throw new Error(`Environment variable ${key} is required but not set`);
  }

  return value;
}

/**
 * Get current hostname for web platform
 */
function getCurrentHostname(): string {
  if (Platform.OS === "web" && typeof window !== "undefined") {
    return window.location.hostname;
  }

  return "localhost";
}

/**
 * Replace localhost with appropriate hostname based on platform
 */
function replaceLocalhostWithHostname(url: string): string {
  if (!url.includes("localhost")) {
    return url;
  }

  // For Android emulator, replace localhost with 10.0.2.2
  if (Platform.OS === "android") {
    return url.replace("localhost", "10.0.2.2");
  }

  // For web platform, replace localhost with current hostname if not localhost
  if (Platform.OS === "web") {
    const currentHostname = getCurrentHostname();

    if (currentHostname !== "localhost") {
      return url.replace("localhost", currentHostname);
    }
  }

  return url;
}

/**
 * Get WebSocket server URL with platform-specific handling
 */
export function getWebSocketUrl(): string {
  const wsUrl = getRequiredEnv("EXPO_PUBLIC_WS_SERVER_URL");

  return replaceLocalhostWithHostname(wsUrl);
}

/**
 * Get HTTP server URL with platform-specific handling
 */
export function getHttpServerUrl(): string {
  const httpUrl = getRequiredEnv("EXPO_PUBLIC_HTTP_SERVER_URL");

  return replaceLocalhostWithHostname(httpUrl);
}

/**
 * Get Realtime Voice WebSocket server URL with platform-specific handling
 */
export function getRealtimeVoiceUrl(): string {
  const voiceUrl = getRequiredEnv("EXPO_PUBLIC_REALTIME_VOICE_URL");

  return replaceLocalhostWithHostname(voiceUrl);
}

// OpenAI Configuration Functions

/**
 * Get OpenAI API type
 */
export function getOpenAIApiType(): string {
  return getRequiredEnv("EXPO_PUBLIC_OPENAI_API_TYPE");
}

/**
 * Get OpenAI API key
 */
export function getOpenAIApiKey(): string {
  return getRequiredEnv("EXPO_PUBLIC_OPENAI_API_KEY");
}

/**
 * Get OpenAI base URL
 */
export function getOpenAIBaseUrl(): string {
  return getRequiredEnv("EXPO_PUBLIC_OPENAI_BASE_URL");
}

/**
 * Get OpenAI API version
 */
export function getOpenAIApiVersion(): string {
  return getRequiredEnv("EXPO_PUBLIC_OPENAI_API_VERSION");
}

/**
 * Get OpenAI model name
 */
export function getOpenAIModel(): string {
  return getRequiredEnv("EXPO_PUBLIC_OPENAI_MODEL");
}

/**
 * Get OpenAI deployment name (optional, for Azure)
 */
export function getOpenAIDeploymentName(): string | undefined {
  const deployment = process.env.EXPO_PUBLIC_OPENAI_DEPLOYMENT_NAME;
  const model = process.env.EXPO_PUBLIC_OPENAI_MODEL;

  return deployment || model;
}
