import type { ChatCompletionMessageParam } from "openai/resources";

import { useState, useCallback, useRef, useEffect } from "react";
import { Platform } from "react-native";
import { Audio } from "expo-av";

import { getStreamingTTSUrl } from "../utils/env";

import { chatCompletion } from "./openai";

export interface RealtimeTTSState {
  isProcessing: boolean;
  isConnected: boolean;
  isSpeaking: boolean;
  error: string | null;
  currentText: string;
  processedText: string;
}

export interface RealtimeTTSConfig {
  onStatusChange?: (status: RealtimeTTSState) => void;
  onError?: (error: string) => void;
  onSpeakingComplete?: () => void;
}

export const useRealtimeTTS = (config?: RealtimeTTSConfig) => {
  const [state, setState] = useState<RealtimeTTSState>({
    isProcessing: false,
    isConnected: false,
    isSpeaking: false,
    error: null,
    currentText: "",
    processedText: "",
  });

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const currentPlaybackRef = useRef<Audio.Sound | null>(null);
  const pendingAudioChunks = useRef<ArrayBuffer[]>([]);
  const isFlushingRef = useRef(false);
  const currentAudioSourceRef = useRef<AudioBufferSourceNode | null>(null);
  const currentHtmlAudioRef = useRef<HTMLAudioElement | null>(null);
  const audioQueueRef = useRef<ArrayBuffer[]>([]);
  const isPlayingQueueRef = useRef(false);

  // 初始化 AudioContext (Web only)
  const initializeAudioContext = useCallback(() => {
    if (Platform.OS === "web" && !audioContextRef.current) {
      try {
        audioContextRef.current = new (window.AudioContext ||
          (window as any).webkitAudioContext)();
        console.log("🔊 [RealtimeTTS] AudioContext initialized");
      } catch (error) {
        console.error(
          "🚫 [RealtimeTTS] Failed to initialize AudioContext:",
          error,
        );
      }
    }
  }, []);

  // 檢查音訊資料格式
  const detectAudioFormat = useCallback((data: ArrayBuffer): string => {
    const bytes = new Uint8Array(data);

    // 檢查 WAV 格式 (RIFF header)
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x52 &&
      bytes[1] === 0x49 &&
      bytes[2] === 0x46 &&
      bytes[3] === 0x46
    ) {
      return "wav";
    }

    // 檢查 MP3 格式 (ID3 tag 或 frame sync)
    if (
      bytes.length >= 3 &&
      ((bytes[0] === 0x49 && bytes[1] === 0x44 && bytes[2] === 0x33) || // ID3
        (bytes[0] === 0xff && (bytes[1] & 0xe0) === 0xe0))
    ) {
      // Frame sync
      return "mp3";
    }

    // 檢查 OGG 格式
    if (
      bytes.length >= 4 &&
      bytes[0] === 0x4f &&
      bytes[1] === 0x67 &&
      bytes[2] === 0x67 &&
      bytes[3] === 0x53
    ) {
      return "ogg";
    }

    // 其他情況假設為原始 PCM
    return "pcm";
  }, []);

  // 將原始 PCM 資料轉換為 WAV 格式
  const createWavFromPCM = useCallback(
    (
      pcmData: ArrayBuffer,
      sampleRate: number = 22050,
      channels: number = 1,
    ): ArrayBuffer => {
      const pcmLength = pcmData.byteLength;
      const wavLength = 44 + pcmLength; // WAV header (44 bytes) + PCM data
      const buffer = new ArrayBuffer(wavLength);
      const view = new DataView(buffer);
      const pcmView = new Int16Array(pcmData);

      // WAV header
      const writeString = (offset: number, string: string) => {
        for (let i = 0; i < string.length; i++) {
          view.setUint8(offset + i, string.charCodeAt(i));
        }
      };

      writeString(0, "RIFF");
      view.setUint32(4, wavLength - 8, true); // Chunk size
      writeString(8, "WAVE");
      writeString(12, "fmt ");
      view.setUint32(16, 16, true); // Subchunk1 size
      view.setUint16(20, 1, true); // Audio format (PCM)
      view.setUint16(22, channels, true); // Number of channels
      view.setUint32(24, sampleRate, true); // Sample rate
      view.setUint32(28, sampleRate * channels * 2, true); // Byte rate
      view.setUint16(32, channels * 2, true); // Block align
      view.setUint16(34, 16, true); // Bits per sample
      writeString(36, "data");
      view.setUint32(40, pcmLength, true); // Subchunk2 size

      // Copy PCM data
      const wavPcm = new Int16Array(buffer, 44);

      wavPcm.set(pcmView);

      return buffer;
    },
    [],
  );

  // 停止當前播放的音訊
  const stopCurrentAudio = useCallback(() => {
    // 停止 AudioContext 播放
    if (currentAudioSourceRef.current) {
      try {
        currentAudioSourceRef.current.stop();
        currentAudioSourceRef.current.disconnect();
      } catch (error) {
        console.error(
          `🚫 [RealtimeTTS] Error stopping AudioContext source: ${error}`,
        );
      }
      currentAudioSourceRef.current = null;
    }

    // 停止 HTML Audio 播放
    if (currentHtmlAudioRef.current) {
      try {
        currentHtmlAudioRef.current.pause();
        currentHtmlAudioRef.current.currentTime = 0;
      } catch (error) {
        console.error(`🚫 [RealtimeTTS] Error stopping HTML Audio:`, error);
      }
      currentHtmlAudioRef.current = null;
    }
  }, []);

  // 處理音訊佇列
  const processAudioQueue = useCallback(async () => {
    if (isPlayingQueueRef.current || audioQueueRef.current.length === 0) {
      return;
    }

    isPlayingQueueRef.current = true;

    while (audioQueueRef.current.length > 0) {
      const audioData = audioQueueRef.current.shift();

      if (audioData) {
        await playAudioChunkInternal(audioData);
        // 小延遲避免音訊重疊
        await new Promise((resolve) => setTimeout(resolve, 50));
      }
    }

    isPlayingQueueRef.current = false;
  }, []);

  // 內部音訊播放函數（不透過佇列）
  const playAudioChunkInternal = useCallback(
    async (audioData: ArrayBuffer) => {
      try {
        if (Platform.OS === "web" && audioContextRef.current) {
          // 首先檢查音訊資料是否有效
          if (audioData.byteLength === 0) {
            console.warn("🚫 [RealtimeTTS] Empty audio data received");

            return;
          }

          // 停止之前的播放
          stopCurrentAudio();

          const audioFormat = detectAudioFormat(audioData);

          console.log(
            `🔊 [RealtimeTTS] Detected audio format: ${audioFormat}, size: ${audioData.byteLength} bytes`,
          );

          let processedAudioData = audioData;

          // 如果是原始 PCM，先轉換為 WAV
          if (audioFormat === "pcm") {
            console.log("🔧 [RealtimeTTS] Converting PCM to WAV format");
            processedAudioData = createWavFromPCM(audioData);
          }

          // 嘗試使用 AudioContext 解碼
          try {
            const audioBuffer = await audioContextRef.current.decodeAudioData(
              processedAudioData.slice(0), // 創建 copy 避免 detached buffer
            );

            const source = audioContextRef.current.createBufferSource();

            source.buffer = audioBuffer;
            source.connect(audioContextRef.current.destination);

            // 保存當前播放源的引用
            currentAudioSourceRef.current = source;

            // 更新播放狀態
            setState((prev) => ({ ...prev, isSpeaking: true }));

            source.start();
            console.log(
              "✅ [RealtimeTTS] Audio chunk started playing via AudioContext",
            );

            // 等待播放完成
            await new Promise<void>((resolve) => {
              source.onended = () => {
                if (currentAudioSourceRef.current === source) {
                  setState((prev) => ({ ...prev, isSpeaking: false }));
                  currentAudioSourceRef.current = null;
                  config?.onSpeakingComplete?.();
                }
                resolve();
              };
            });

            return; // 成功播放，直接返回
          } catch (decodeError) {
            console.error(
              "🚫 [RealtimeTTS] AudioContext decode error:",
              decodeError,
            );
            console.log("🔧 [RealtimeTTS] Audio data details:", {
              originalSize: audioData.byteLength,
              processedSize: processedAudioData.byteLength,
              format: audioFormat,
              firstBytes:
                audioData.byteLength > 0
                  ? Array.from(new Uint8Array(audioData.slice(0, 16)))
                  : "empty",
            });
          }

          // AudioContext 失敗，嘗試 HTML Audio 元素 fallback
          try {
            console.log("🔧 [RealtimeTTS] Trying HTML Audio fallback");

            // 嘗試多種 MIME types
            const mimeTypes =
              audioFormat === "pcm"
                ? ["audio/wav", "audio/wave"]
                : audioFormat === "mp3"
                  ? ["audio/mpeg", "audio/mp3"]
                  : audioFormat === "ogg"
                    ? ["audio/ogg"]
                    : ["audio/wav", "audio/mpeg", "audio/ogg"];

            for (const mimeType of mimeTypes) {
              try {
                const blob = new Blob([processedAudioData], { type: mimeType });
                const audioUrl = URL.createObjectURL(blob);
                const htmlAudio = new (window as any).Audio(audioUrl);

                // 保存當前 HTML Audio 引用
                currentHtmlAudioRef.current = htmlAudio;

                await new Promise<void>((resolve, reject) => {
                  htmlAudio.onloadeddata = () => {
                    setState((prev) => ({ ...prev, isSpeaking: true }));
                  };

                  htmlAudio.onended = () => {
                    if (currentHtmlAudioRef.current === htmlAudio) {
                      setState((prev) => ({ ...prev, isSpeaking: false }));
                      currentHtmlAudioRef.current = null;
                      config?.onSpeakingComplete?.();
                    }
                    URL.revokeObjectURL(audioUrl);
                    resolve();
                  };

                  htmlAudio.onerror = (audioError: Event) => {
                    console.error(
                      `🚫 [RealtimeTTS] HTML Audio error with ${mimeType}:`,
                      audioError,
                    );
                    URL.revokeObjectURL(audioUrl);
                    if (currentHtmlAudioRef.current === htmlAudio) {
                      currentHtmlAudioRef.current = null;
                    }
                    reject(audioError);
                  };

                  htmlAudio
                    .play()
                    .then(() => {
                      console.log(
                        `✅ [RealtimeTTS] HTML Audio playback successful with ${mimeType}`,
                      );
                    })
                    .catch(reject);
                });

                return; // 成功播放，退出
              } catch (mimeError) {
                console.warn(
                  `🚫 [RealtimeTTS] Failed with MIME type ${mimeType}:`,
                  mimeError,
                );
                continue;
              }
            }

            throw new Error("All HTML Audio fallback attempts failed");
          } catch (fallbackError) {
            console.error(
              "🚫 [RealtimeTTS] All audio playback methods failed:",
              fallbackError,
            );

            // 最後嘗試：儲存音訊資料供調試
            if (audioData.byteLength > 0) {
              const blob = new Blob([processedAudioData], {
                type: "application/octet-stream",
              });
              const url = URL.createObjectURL(blob);

              console.log(
                "🔧 [RealtimeTTS] Debug: Audio data URL for manual inspection:",
                url,
              );

              // 5 秒後清除 URL
              setTimeout(() => URL.revokeObjectURL(url), 5000);
            }
          }
        } else {
          // 原生平台使用 Expo Audio
          console.warn(
            "🔊 [RealtimeTTS] Native platform audio playback not fully implemented",
          );
        }
      } catch (error) {
        console.error("🚫 [RealtimeTTS] Audio playback error:", error);
      }
    },
    [config, detectAudioFormat, createWavFromPCM, stopCurrentAudio],
  );

  // 公開的音訊播放函數（透過佇列）
  const playAudioChunk = useCallback(
    async (audioData: ArrayBuffer) => {
      // 將音訊加入佇列
      audioQueueRef.current.push(audioData);

      // 開始處理佇列
      await processAudioQueue();
    },
    [processAudioQueue],
  );

  // 連接到 WebSocket TTS 服務
  const connect = useCallback(async () => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return; // 已經連接
    }

    try {
      initializeAudioContext();

      const wsUrl = getStreamingTTSUrl();

      console.log("🔌 [RealtimeTTS] Connecting to:", wsUrl);

      wsRef.current = new WebSocket(wsUrl);

      wsRef.current.onopen = () => {
        console.log("✅ [RealtimeTTS] WebSocket connected");
        setState((prev) => ({
          ...prev,
          isConnected: true,
          error: null,
        }));
        config?.onStatusChange?.(state);
      };

      wsRef.current.onmessage = async (event) => {
        if (event.data instanceof Blob) {
          // 接收到音頻數據
          const arrayBuffer = await event.data.arrayBuffer();

          // 將音訊塊添加到隊列
          audioQueueRef.current.push(arrayBuffer);
          pendingAudioChunks.current.push(arrayBuffer);

          // 如果當前沒有播放，開始處理隊列
          if (!isPlayingQueueRef.current) {
            processAudioQueue();
          }
        } else {
          // 接收到文字消息 (JSON)
          try {
            const message = JSON.parse(event.data);

            console.log("📨 [RealtimeTTS] Received message:", message);

            switch (message.type) {
              case "chunk_complete":
                setState((prev) => ({
                  ...prev,
                  processedText: prev.processedText + message.text,
                }));
                break;
              case "flush_complete":
                setState((prev) => ({
                  ...prev,
                  processedText: prev.currentText,
                  isProcessing: false,
                }));
                isFlushingRef.current = false;
                break;
              case "reset_complete":
                setState((prev) => ({
                  ...prev,
                  currentText: "",
                  processedText: "",
                  isProcessing: false,
                }));
                break;
              case "error":
                console.error("🚫 [RealtimeTTS] Server error:", message.error);
                setState((prev) => ({
                  ...prev,
                  error: message.error,
                  isProcessing: false,
                }));
                config?.onError?.(message.error);
                break;
            }
          } catch (e) {
            console.error("🚫 [RealtimeTTS] Failed to parse message:", e);
          }
        }
      };

      wsRef.current.onclose = () => {
        console.log("🔌 [RealtimeTTS] WebSocket disconnected");
        setState((prev) => ({
          ...prev,
          isConnected: false,
        }));
      };

      wsRef.current.onerror = (error) => {
        console.error("🚫 [RealtimeTTS] WebSocket error:", error);
        setState((prev) => ({
          ...prev,
          isConnected: false,
          error: "WebSocket connection failed",
        }));
        config?.onError?.("WebSocket connection failed");
      };
    } catch (error) {
      console.error("🚫 [RealtimeTTS] Connection error:", error);
      setState((prev) => ({
        ...prev,
        error: error instanceof Error ? error.message : "Connection failed",
      }));
      config?.onError?.(
        error instanceof Error ? error.message : "Connection failed",
      );
    }
  }, [initializeAudioContext, playAudioChunk, config, state]);

  // 發送文字到 TTS 服務
  const sendText = useCallback((text: string) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.warn("🚫 [RealtimeTTS] WebSocket not connected");

      return;
    }

    try {
      // 發送 JSON 消息
      const message = {
        type: "text",
        text: text,
      };

      wsRef.current.send(JSON.stringify(message));
      console.log("📤 [RealtimeTTS] Sent text:", text);

      setState((prev) => ({
        ...prev,
        currentText: prev.currentText + text,
      }));
    } catch (error) {
      console.error("🚫 [RealtimeTTS] Failed to send text:", error);
    }
  }, []);

  // 強制處理剩餘文字
  const flush = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      isFlushingRef.current = true;
      wsRef.current.send(JSON.stringify({ type: "flush" }));
      console.log("🔄 [RealtimeTTS] Flushing remaining text");
    } catch (error) {
      console.error("🚫 [RealtimeTTS] Failed to flush:", error);
      isFlushingRef.current = false;
    }
  }, []);

  // 重置 TTS 狀態
  const reset = useCallback(() => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current.send(JSON.stringify({ type: "reset" }));
      pendingAudioChunks.current = [];
      console.log("🔄 [RealtimeTTS] Reset TTS state");
    } catch (error) {
      console.error("🚫 [RealtimeTTS] Failed to reset:", error);
    }
  }, []);

  // 執行完整的 Chat + TTS 流程 (非串流模式)
  const processConversation = useCallback(
    async (
      messages: ChatCompletionMessageParam[],
      options?: {
        onDelta?: (delta: string) => void;
        signal?: AbortSignal;
      },
    ) => {
      if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
        await connect();
        // 等待連接建立
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }

      setState((prev) => ({
        ...prev,
        isProcessing: true,
        currentText: "",
        processedText: "",
        error: null,
      }));

      try {
        // 重置 TTS 狀態
        reset();

        console.log(
          "🔄 [RealtimeTTS] Starting chat completion (non-streaming)...",
        );

        // 使用非串流模式生成完整回應
        const completeResponse = await chatCompletion({
          messages,
          stream: false,
          signal: options?.signal,
        });

        // 檢查回應是否有效
        if (!completeResponse || typeof completeResponse !== "string") {
          throw new Error("Failed to generate response");
        }

        console.log(
          "✅ [RealtimeTTS] Chat completion finished, response length:",
          completeResponse.length,
        );

        // 更新當前文字狀態
        setState((prev) => ({
          ...prev,
          currentText: completeResponse,
        }));

        // 如果有 onDelta 回調，一次性傳遞完整回應
        if (options?.onDelta) {
          options.onDelta(completeResponse);
        }

        // 將完整句子發送到 TTS WebSocket
        console.log("🔄 [RealtimeTTS] Sending complete response to TTS...");
        sendText(completeResponse);

        // 強制處理文字
        flush();
      } catch (error) {
        console.error("🚫 [RealtimeTTS] Conversation processing error:", error);
        setState((prev) => ({
          ...prev,
          isProcessing: false,
          error: error instanceof Error ? error.message : "Processing failed",
        }));
        config?.onError?.(
          error instanceof Error ? error.message : "Processing failed",
        );
      }
    },
    [connect, reset, sendText, flush, config],
  );

  // 斷開連接
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }

    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }

    if (currentPlaybackRef.current) {
      currentPlaybackRef.current.unloadAsync();
      currentPlaybackRef.current = null;
    }

    setState((prev) => ({
      ...prev,
      isConnected: false,
      isProcessing: false,
      isSpeaking: false,
    }));
  }, []);

  // 清理函數
  useEffect(() => {
    return () => {
      disconnect();
    };
  }, [disconnect]);

  return {
    state,
    connect,
    disconnect,
    sendText,
    flush,
    reset,
    processConversation,
    isConnected: state.isConnected,
    isProcessing: state.isProcessing,
    isSpeaking: state.isSpeaking,
    error: state.error,
  };
};
