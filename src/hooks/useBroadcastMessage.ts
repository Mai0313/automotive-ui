import { useCallback } from "react";

import { getRealtimeVoiceUrl } from "../utils/env";

/**
 * Hook for managing Realtime Voice Broadcast API
 *
 * This hook provides functionality to send messages to the Realtime Voice server
 * via the broadcast API, which will be spoken by the LLM + TTS pipeline.
 */
export function useBroadcastMessage() {
  /**
   * Get the broadcast API URL from the Realtime Voice WebSocket URL
   */
  const getBroadcastUrl = useCallback((): string => {
    const voiceUrl = getRealtimeVoiceUrl();
    // 將 ws://localhost:8100/ws 轉換為 http://localhost:8100/api/event/broadcast
    const httpUrl = voiceUrl
      .replace("ws://", "http://")
      .replace("/ws", "/api/event/broadcast");

    return httpUrl;
  }, []);

  /**
   * Send a message to the broadcast API
   *
   * @param message - The message to be spoken by the LLM + TTS pipeline
   * @returns Promise<boolean> - Success status
   */
  const sendMessage = useCallback(
    async (message: string): Promise<boolean> => {
      try {
        console.log("📢 [Broadcast] Sending message:", message);

        const response = await fetch(getBroadcastUrl(), {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ message }),
        });

        if (!response.ok) {
          console.error(
            "❌ [Broadcast] HTTP error:",
            response.status,
            response.statusText,
          );

          return false;
        }

        const result = await response.json();

        console.log("✅ [Broadcast] Success:", result);

        return result.status === "success";
      } catch (error) {
        console.error("❌ [Broadcast] Network error:", error);

        return false;
      }
    },
    [getBroadcastUrl],
  );

  return {
    sendMessage,
    getBroadcastUrl,
  };
}
