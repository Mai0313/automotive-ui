import { useEffect, useRef, useState } from "react";
import { Platform } from "react-native";
import { useAudioRecorder, AudioModule } from "expo-audio";
import protobuf from "protobufjs";

import { getRealtimeVoiceUrl } from "../utils/env";

interface RealtimeVoiceConfig {
  serverUrl?: string;
  sampleRate?: number;
  numChannels?: number;
  autoStart?: boolean;
}

export const useRealtimeVoice = (config: RealtimeVoiceConfig = {}) => {
  const {
    serverUrl = getRealtimeVoiceUrl(),
    sampleRate = 16000,
    numChannels = 1,
    autoStart = false,
  } = config;

  const [isConnected, setIsConnected] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const wsRef = useRef<WebSocket | null>(null);
  const audioRecorder = useAudioRecorder(
    {
      extension: ".wav",
      sampleRate: sampleRate,
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
    (status) => {
      // Handle recording status updates if needed
      console.log("Recording status:", status);
    },
  );
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const microphoneStreamRef = useRef<MediaStream | null>(null);
  const frameTypeRef = useRef<any>(null);
  const activeSources = useRef<AudioBufferSourceNode[]>([]);
  const playTimeRef = useRef<number>(0);
  const lastMessageTimeRef = useRef<number>(0);

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

        console.log("Received JSON:", jsonData);

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
          source.stop();
          console.log("Stopped active audio due to interrupt signal");
        });
        activeSources.current = [];
        playTimeRef.current = 0;
      }

      if (!parsedFrame?.audio) return;

      // Reset play time if needed
      const diffTime =
        audioContextRef.current.currentTime - lastMessageTimeRef.current;

      if (playTimeRef.current === 0 || diffTime > 1.0) {
        playTimeRef.current = audioContextRef.current.currentTime;
      }
      lastMessageTimeRef.current = audioContextRef.current.currentTime;

      // Process audio data
      const audioVector = Array.from(parsedFrame.audio.audio);
      const audioArray = new Uint8Array(audioVector.map((x) => Number(x)));

      audioContextRef.current.decodeAudioData(audioArray.buffer, (buffer) => {
        if (!audioContextRef.current) return;

        const source = new AudioBufferSourceNode(audioContextRef.current);

        source.buffer = buffer;
        source.start(playTimeRef.current);
        source.connect(audioContextRef.current.destination);
        playTimeRef.current += buffer.duration;
        activeSources.current.push(source);

        console.log("New audio playback started");
      });
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
      console.log("WebSocket connection established");
      setIsConnected(true);
      setError(null);
    });

    ws.addEventListener("message", handleWebSocketMessage);

    ws.addEventListener("close", (event) => {
      console.log("WebSocket connection closed:", event.code, event.reason);
      setIsConnected(false);
      stopAudio();
    });

    ws.addEventListener("error", (event) => {
      console.error("WebSocket error:", event);
      setError("WebSocket connection failed");
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
      sampleRate: sampleRate,
    });

    const stream = await navigator.mediaDevices.getUserMedia({
      audio: {
        sampleRate: sampleRate,
        channelCount: numChannels,
        autoGainControl: true,
        echoCancellation: true,
        noiseSuppression: true,
      },
    });

    microphoneStreamRef.current = stream;
    scriptProcessorRef.current = audioContextRef.current.createScriptProcessor(
      512,
      1,
      1,
    );
    sourceRef.current = audioContextRef.current.createMediaStreamSource(stream);

    sourceRef.current.connect(scriptProcessorRef.current);
    scriptProcessorRef.current.connect(audioContextRef.current.destination);

    scriptProcessorRef.current.onaudioprocess = (event) => {
      if (!wsRef.current || !frameTypeRef.current) return;

      const audioData = event.inputBuffer.getChannelData(0);
      const pcmS16Array = convertFloat32ToS16PCM(audioData);
      const pcmByteArray = new Uint8Array(pcmS16Array.buffer);

      const frame = frameTypeRef.current.create({
        audio: {
          audio: Array.from(pcmByteArray),
          sampleRate: sampleRate,
          numChannels: numChannels,
        },
      });

      const encodedFrame = new Uint8Array(
        frameTypeRef.current.encode(frame).finish(),
      );

      wsRef.current.send(encodedFrame);
    };
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

  // Stop audio
  const stopAudio = async () => {
    try {
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
    error,
    startAudio,
    stopAudio,
  };
};
