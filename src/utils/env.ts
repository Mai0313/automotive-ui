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
 * Get WebSocket server URL with platform-specific handling
 */
export function getWebSocketUrl(): string {
  const wsUrl = getRequiredEnv('EXPO_PUBLIC_WS_SERVER_URL');
  
  // For Android emulator, replace localhost with 10.0.2.2
  if (Platform.OS === "android" && wsUrl.includes('localhost')) {
    return wsUrl.replace('localhost', '10.0.2.2');
  }
  
  return wsUrl;
}

/**
 * Get HTTP server URL with platform-specific handling
 */
export function getHttpServerUrl(): string {
  const httpUrl = getRequiredEnv('EXPO_PUBLIC_HTTP_SERVER_URL');
  
  // For Android emulator, replace localhost with 10.0.2.2
  if (Platform.OS === "android" && httpUrl.includes('localhost')) {
    return httpUrl.replace('localhost', '10.0.2.2');
  }
  
  return httpUrl;
}

/**
 * Get Realtime Voice WebSocket server URL with platform-specific handling
 */
export function getRealtimeVoiceUrl(): string {
  const voiceUrl = getRequiredEnv('EXPO_PUBLIC_REALTIME_VOICE_URL');
  
  // For Android emulator, replace localhost with 10.0.2.2
  if (Platform.OS === "android" && voiceUrl.includes('localhost')) {
    return voiceUrl.replace('localhost', '10.0.2.2');
  }
  
  return voiceUrl;
}
