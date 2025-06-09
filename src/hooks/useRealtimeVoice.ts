import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAudioRecorder, AudioModule } from "expo-audio";
import protobuf from "protobufjs";

import { getRealtimeVoiceUrl } from "../utils/env";

interface RealtimeVoiceConfig {
  serverUrl?: string;
  numChannels?: number;
  autoStart?: boolean;
}

export const useRealtimeVoice = (config: RealtimeVoiceConfig = {}) => {
  const {
    serverUrl = getRealtimeVoiceUrl(),
    numChannels = 1,
    autoStart = false,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorder = useAudioRecorder(
    {
      extension: ".wav",
      sampleRate: 16000,
      numberOfChannels: numChannels,
      bitRate: 128000,
      android: {
        outputFormat: "mpeg4",
        audioEncoder: "aac",
      },
      ios: {
        outputFormat: "MPEG4AAC",
        audioQuality: 96,
      },
    },
    // Removed frequent status logging to reduce console noise
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const frameTypeRef = useRef<any>(null);
  const activeSources = useRef<AudioBufferSourceNode[]>([]);
  const playTimeRef = useRef<number>(0);
  const lastMessageTimeRef = useRef<number>(0);
  const scriptProcessorRef = useRef<any>(null);
  const isMutedRef = useRef<boolean>(false);

  // Debug: Audio recording functionality for debugging noise issues
  const recordedAudioChunks = useRef<AudioBuffer[]>([]);
  const recordingStartTime = useRef<number | null>(null);
  const recordingSessionId = useRef<string | null>(null);

  const startAudioRecording = () => {
    recordedAudioChunks.current = [];
    recordingStartTime.current = Date.now();
    recordingSessionId.current = new Date().toISOString().replace(/[:.]/g, "-");
    console.log(
      `[🔧 Debug] Started recording session: ${recordingSessionId.current}`,
    );
  };

  const addAudioChunk = (audioBuffer: AudioBuffer) => {
    if (recordingSessionId.current) {
      recordedAudioChunks.current.push(audioBuffer);
    }
  };

  const saveRecordedAudio = () => {
    if (Platform.OS !== "web" || recordedAudioChunks.current.length === 0)
      return;

    try {
      // Merge all audio chunks into one buffer
      const totalLength = recordedAudioChunks.current.reduce(
        (sum, buffer) => sum + buffer.length,
        0,
      );
      const sampleRate = recordedAudioChunks.current[0].sampleRate;
      const numberOfChannels = recordedAudioChunks.current[0].numberOfChannels;

      // Create merged audio context if needed
      const offlineContext = new OfflineAudioContext(
        numberOfChannels,
        totalLength,
        sampleRate,
      );
      let offset = 0;

      // Merge all chunks
      recordedAudioChunks.current.forEach((chunk) => {
        const source = offlineContext.createBufferSource();

        source.buffer = chunk;
        source.connect(offlineContext.destination);
        source.start(offset / sampleRate);
        offset += chunk.length;
      });

      offlineContext.startRendering().then((mergedBuffer) => {
        const wav = audioBufferToWav(mergedBuffer);
        const blob = new Blob([wav], { type: "audio/wav" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");

        a.href = url;
        a.download = `realtime_voice_${recordingSessionId.current}.wav`;
        a.click();
        URL.revokeObjectURL(url);

        const duration = mergedBuffer.duration;
        const chunks = recordedAudioChunks.current.length;

        console.log(
          `[🔧 Debug] Saved complete audio session: realtime_voice_${recordingSessionId.current}.wav`,
        );
        console.log(
          `[🔧 Debug] Duration: ${duration.toFixed(2)}s, Chunks: ${chunks}, Sample Rate: ${sampleRate}Hz`,
        );

        // Reset recording
        recordedAudioChunks.current = [];
        recordingSessionId.current = null;
      });
    } catch (err) {
      console.error("[🔧 Debug] Failed to save recorded audio:", err);
    }
  };

  // Convert AudioBuffer to WAV format
  const audioBufferToWav = (buffer: AudioBuffer): ArrayBuffer => {
    const length = buffer.length;
    const sampleRate = buffer.sampleRate;
    const numberOfChannels = buffer.numberOfChannels;
    const arrayBuffer = new ArrayBuffer(44 + length * numberOfChannels * 2);
    const view = new DataView(arrayBuffer);

    // Write WAV header
    const writeString = (offset: number, string: string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };

    writeString(0, "RIFF");
    view.setUint32(4, 36 + length * numberOfChannels * 2, true);
    writeString(8, "WAVE");
    writeString(12, "fmt ");
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numberOfChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * numberOfChannels * 2, true);
    view.setUint16(32, numberOfChannels * 2, true);
    view.setUint16(34, 16, true);
    writeString(36, "data");
    view.setUint32(40, length * numberOfChannels * 2, true);

    // Write audio data
    let offset = 44;

    for (let i = 0; i < length; i++) {
      for (let channel = 0; channel < numberOfChannels; channel++) {
        const sample = Math.max(
          -1,
          Math.min(1, buffer.getChannelData(channel)[i]),
        );

        view.setInt16(offset, sample * 0x7fff, true);
        offset += 2;
      }
    }

    return arrayBuffer;
  };
  // Debug End

  // Generate 8-digit UUID
  const generateUUID8 = () => {
    return Math.random().toString(36).substr(2, 8).toUpperCase();
  };

  // Initialize protobuf
  useEffect(() => {
    const initProtobuf = async () => {
      try {
        if (Platform.OS === "web") {
          // For web, load protobuf from public folder
          const response = await fetch("/frames.proto");
          const protoText = await response.text();
          const root = protobuf.parse(protoText).root;

          frameTypeRef.current = root.lookupType("pipecat.Frame");
        } else {
          // For native, we might need to handle differently
          // For now, we'll skip protobuf on native platforms
          console.warn("Protobuf not supported on native platforms yet");
        }
      } catch (err) {
        console.error("Failed to initialize protobuf:", err);
        setError("Failed to initialize protobuf");
      }
    };

    initProtobuf();
  }, []);

  // Sync isMuted state to ref for use in callbacks
  useEffect(() => {
    isMutedRef.current = isMuted;
  }, [isMuted]);

  // Convert Float32 to PCM S16
  const convertFloat32ToS16PCM = (float32Array: Float32Array): Int16Array => {
    const int16Array = new Int16Array(float32Array.length);

    for (let i = 0; i < float32Array.length; i++) {
      const clampedValue = Math.max(-1, Math.min(1, float32Array[i]));

      int16Array[i] =
        clampedValue < 0 ? clampedValue * 32768 : clampedValue * 32767;
    }

    return int16Array;
  };

  // Handle WebSocket message
  const handleWebSocketMessage = async (event: MessageEvent) => {
    try {
      // Try to parse as JSON first
      if (typeof event.data === "string") {
        const jsonData = JSON.parse(event.data);

        // Only log non-routine JSON messages
        if (jsonData.type && jsonData.type !== "heartbeat") {
          console.log("Received JSON:", jsonData);
        }

        return;
      }

      // Handle binary data (audio)
      if (
        Platform.OS === "web" &&
        frameTypeRef.current &&
        audioContextRef.current
      ) {
        const arrayBuffer = await event.data.arrayBuffer();

        enqueueAudioFromProto(arrayBuffer);
      }
    } catch (err) {
      console.error("Error handling WebSocket message:", err);
    }
  };

  // Enqueue audio from protobuf
  const enqueueAudioFromProto = (arrayBuffer: ArrayBuffer) => {
    if (!frameTypeRef.current || !audioContextRef.current) return;

    try {
      const parsedFrame = frameTypeRef.current.decode(
        new Uint8Array(arrayBuffer),
      );

      // Stop active audio if we receive text (interrupt signal)
      if (parsedFrame?.text) {
        activeSources.current.forEach((source) => {
          try {
            // Add try-catch for robustness
            source.stop();
          } catch (e) {
            console.warn("Error stopping source on interrupt:", e);
          }
        });
        activeSources.current = []; // Clear the array
        playTimeRef.current = 0; // Reset play time
        // Only log significant interrupts, not routine ones
        console.log("Audio interrupted by text signal");
      }

      if (!parsedFrame?.audio?.audio) return; // Ensure audio data exists

      // Debug: Log audio frame details
      const audioFrameInfo = {
        audioLength: parsedFrame.audio.audio?.length || 0,
        sampleRate: parsedFrame.audio.sampleRate || "unknown",
        numChannels: parsedFrame.audio.numChannels || "unknown",
      };

      console.log(
        `[🔧 Debug] Audio frame - Length: ${audioFrameInfo.audioLength}, Sample Rate: ${audioFrameInfo.sampleRate}, Channels: ${audioFrameInfo.numChannels}`,
      );
      // Debug End

      const now = audioContextRef.current.currentTime;
      const timeSinceLastMessage = now - lastMessageTimeRef.current;

      // Reset playTimeRef if:
      // 1. It's the very first audio chunk (playTimeRef.current === 0).
      // 2. The scheduled playTimeRef is significantly in the past (e.g., >100ms ago).
      // 3. There's been a considerable pause in receiving audio (e.g., >0.5s).
      // Add a small buffer (e.g., 0.05s) to schedule slightly in the future, accommodating decode/scheduling overhead.
      if (
        playTimeRef.current === 0 ||
        playTimeRef.current < now - 0.1 ||
        timeSinceLastMessage > 0.5
      ) {
        playTimeRef.current = now + 0.05; // Schedule to start slightly in the future from now.
      }
      lastMessageTimeRef.current = now;

      // Process audio data
      const audioVector = Array.from(parsedFrame.audio.audio);
      const audioArray = new Uint8Array(audioVector.map((x) => Number(x)));

      audioContextRef.current.decodeAudioData(
        audioArray.buffer,
        (buffer) => {
          // 雙重檢查 mute 狀態 - 防止競爭條件
          if (!audioContextRef.current || isMutedRef.current || isMuted) return;

          // Debug: Add audio chunk to recording for debugging
          addAudioChunk(buffer);
          // Debug End

          const source = new AudioBufferSourceNode(audioContextRef.current);

          source.buffer = buffer;

          // Determine the actual time to schedule this buffer.
          // It should be no earlier than the current playTimeRef, and also
          // no earlier than the current audio context time plus a small processing buffer (e.g., 0.02s).
          // This prevents scheduling in the past if decodeAudioData took some time.
          const scheduleTime = Math.max(
            playTimeRef.current,
            audioContextRef.current.currentTime + 0.02,
          );

          source.connect(audioContextRef.current.destination);
          source.start(scheduleTime);

          // Update playTimeRef for the *next* buffer.
          playTimeRef.current = scheduleTime + buffer.duration;

          activeSources.current.push(source);
          // Clean up the source node from activeSources array once it has finished playing.
          source.onended = () => {
            activeSources.current = activeSources.current.filter(
              (s) => s !== source,
            );
            // Optional: console.log("[Debug] Audio source ended and removed.");
          };
        },
        (decodeError) => {
          // Add error handling for decodeAudioData
          console.error("Error decoding audio data:", decodeError);
        },
      );
    } catch (err) {
      console.error("Error processing audio frame:", err);
    }
  };

  // Initialize WebSocket connection
  const initWebSocket = () => {
    const uuid = generateUUID8();
    const wsUrl = `${serverUrl}/${uuid}`;

    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;

    ws.addEventListener("open", () => {
      console.log("[🎙️ RealtimeVoice] connected.");
      setIsConnected(true);
      setError(null);

      // Debug: Start recording session when connected
      startAudioRecording();
      // Debug End
    });

    ws.addEventListener("message", handleWebSocketMessage);

    ws.addEventListener("close", () => {
      console.log("[👋 RealtimeVoice] disconnected.");
      setIsConnected(false);
      stopAudio();

      // Debug: Save recorded audio when disconnected
      saveRecordedAudio();
      // Debug End
    });

    ws.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      setError("[❌ RealtimeVoice] connection failed");
      setIsConnected(false);
    });
  };

  // Start audio recording and connection
  const startAudio = async () => {
    try {
      setError(null);

      if (Platform.OS === "web") {
        await startWebAudio();
        initWebSocket();
        setIsRecording(true);
        setIsPlaying(true);
      } else {
        // For native platforms, we'll use a simplified approach
        // Just start recording without realtime streaming for now
        await startNativeAudio();
        setIsRecording(true);
        console.log(
          "Native recording started - realtime streaming not yet implemented",
        );
      }
    } catch (err) {
      console.error("Error starting audio:", err);

      // 提供更詳細的錯誤訊息
      let errorMessage = "無法啟動音訊";

      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          errorMessage = "麥克風權限被拒絕。請允許網站存取麥克風。";
        } else if (err.name === "NotFoundError") {
          errorMessage = "找不到麥克風設備。請確認麥克風已連接。";
        } else if (err.name === "NotSupportedError") {
          errorMessage = "瀏覽器不支援音訊錄製功能。";
        } else if (err.message.includes("安全上下文")) {
          errorMessage = err.message;
        } else {
          errorMessage = `音訊啟動失敗: ${err.message}`;
        }
      }

      setError(errorMessage);
    }
  };

  // Start web audio
  const startWebAudio = async () => {
    // 檢查瀏覽器支援
    if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      throw new Error("瀏覽器不支援 getUserMedia API");
    }

    // 檢查是否為安全上下文
    if (!window.isSecureContext) {
      throw new Error(
        "需要安全上下文 (HTTPS 或 localhost)。請在 Chrome flags 中設定 'Insecure origins treated as secure' 加入當前網址: " +
          window.location.origin,
      );
    }

    audioContextRef.current = new (window.AudioContext ||
      (window as any).webkitAudioContext)({
      latencyHint: "interactive",
      sampleRate: 16000,
    });

    // 載入 AudioWorklet 處理器
    await audioContextRef.current.audioWorklet.addModule("/voice-processor.js");

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: 16000,
        channelCount: numChannels,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    microphoneStreamRef.current = stream;
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);
    // 建立 AudioWorkletNode
    const workletNode = new (window as any).AudioWorkletNode(
      audioContextRef.current,
      "voice-processor",
    );

    // 監聽 worklet 傳回的音訊資料
    workletNode.port.onmessage = (event: MessageEvent) => {
      if (!wsRef.current || !frameTypeRef.current || isMutedRef.current) return;

      // 檢查是否為命令回應（非音訊數據）
      if (typeof event.data === "object" && !event.data.length) {
        return;
      }

      const audioData = event.data as Float32Array;

      const pcmS16Array = convertFloat32ToS16PCM(audioData);
      const pcmByteArray = new Uint8Array(pcmS16Array.buffer);
      const frame = frameTypeRef.current.create({
        audio: {
          audio: Array.from(pcmByteArray),
          sampleRate: 16000,
          numChannels: numChannels,
        },
      });
      const encodedFrame = new Uint8Array(
        frameTypeRef.current.encode(frame).finish(),
      );

      // 檢查 WebSocket 狀態並發送
      if (wsRef.current.readyState === WebSocket.OPEN) {
        wsRef.current.send(encodedFrame);
      } else {
        // Only log WebSocket state issues occasionally to avoid spam
        if (Math.random() < 0.01) {
          // Log only 1% of failed attempts
          console.warn(
            `WebSocket not ready, state: ${wsRef.current.readyState}`,
          );
        }
      }
    };

    sourceRef.current.connect(workletNode);
    workletNode.connect(audioContextRef.current.destination);
    // 保留 workletNode 以便 stop 時清理
    (scriptProcessorRef as any).current = workletNode;
  };

  // Start native audio (simplified for now)
  const startNativeAudio = async () => {
    const { granted } = await AudioModule.requestPermissionsAsync();

    if (!granted) {
      throw new Error("Audio permission not granted");
    }

    try {
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      console.log("Native recording started");
    } catch (err) {
      console.error("Failed to start native recording:", err);
      throw err;
    }
  };

  // Mute audio (stop recording and playing but keep connection)
  const muteAudio = () => {
    setIsMuted(true);
    isMutedRef.current = true; // 立即同步 ref
    setIsRecording(false);
    setIsPlaying(false);

    // 暫停麥克風 tracks
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => {
        track.enabled = false; // 暫停而不是停止
      });
    }

    // 通知 AudioWorklet 進入 mute 狀態並清空緩衝區
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.port.postMessage({ command: "mute" });
    }

    // Stop any currently playing audio
    activeSources.current.forEach((source) => {
      try {
        source.stop();
      } catch (e) {
        console.error("Error stopping audio source:", e);
      }
    });
    activeSources.current = [];
    playTimeRef.current = 0;

    console.log("🔇 Audio muted - microphone tracks disabled, buffers cleared");
  };

  // Unmute audio (resume recording and playing)
  const unmuteAudio = () => {
    setIsMuted(false);
    isMutedRef.current = false; // 立即同步 ref
    setIsRecording(true);
    setIsPlaying(true);

    // 重新啟用麥克風 tracks
    if (microphoneStreamRef.current) {
      microphoneStreamRef.current.getTracks().forEach((track) => {
        track.enabled = true;
      });
    }

    // 通知 AudioWorklet 退出 mute 狀態
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.port.postMessage({ command: "unmute" });
    }

    console.log("🔊 Audio unmuted - microphone tracks re-enabled");
  };

  // Toggle mute state
  const toggleMute = () => {
    if (isMuted) {
      unmuteAudio();
    } else {
      muteAudio();
    }
  };

  // Stop audio
  const stopAudio = async () => {
    try {
      // Debug: Save recorded audio before stopping
      saveRecordedAudio();
      // Debug End
      setIsRecording(false);
      setIsPlaying(false);
      playTimeRef.current = 0;

      // Close WebSocket
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
      setIsConnected(false);

      // Stop web audio
      if (Platform.OS === "web") {
        if (scriptProcessorRef.current) {
          scriptProcessorRef.current.disconnect();
          scriptProcessorRef.current = null;
        }
        if (sourceRef.current) {
          sourceRef.current.disconnect();
          sourceRef.current = null;
        }
        if (microphoneStreamRef.current) {
          microphoneStreamRef.current
            .getTracks()
            .forEach((track) => track.stop());
          microphoneStreamRef.current = null;
        }
        activeSources.current.forEach((source) => source.stop());
        activeSources.current = [];
      }

      // Stop native audio
      if (audioRecorder.isRecording) {
        await audioRecorder.stop();
      }
    } catch (err) {
      console.error("Error stopping audio:", err);
    }
  };

  // Auto start if configured
  useEffect(() => {
    if (autoStart && Platform.OS === "web") {
      // Add a small delay for user interaction on web
      const timer = setTimeout(() => {
        startAudio();
      }, 1000);

      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopAudio();
    };
  }, []);

  return {
    isConnected,
    isRecording,
    isPlaying,
    isMuted,
    error,
    startAudio,
    stopAudio,
    muteAudio,
    unmuteAudio,
    toggleMute,
    // Debug function - can be called manually from console
    saveCurrentRecording: saveRecordedAudio,
    // Debug End
  };
};
