import type { ChatCompletionMessageParam } from "openai/resources";

import React, { useState, useRef, useCallback, useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import {
  AudioModule,
  useAudioRecorder,
  RecordingPresets,
  AudioPlayer,
  createAudioPlayer, // Import createAudioPlayer directly
  type AudioStatus, // Import AudioStatus type
} from "expo-audio";

import { chatCompletion, transcribeAudio, textToSpeech } from "../hooks/openai"; // Added textToSpeech
import commonStyles from "../styles/commonStyles";
import Orb from "../components/Orb";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const AIAssistantScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();

  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "您好！我是您的車載 AI 助理。我可以幫您控制車輛功能、查詢資訊或提供幫助。請問需要什麼協助？",
      isUser: false,
      timestamp: "10:18 AM",
    },
  ]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [abortController, setAbortController] =
    useState<AbortController | null>(null);
  const [isRecording, setIsRecording] = useState<boolean>(false);
  const [isDevMode, setIsDevMode] = useState<boolean>(false); // 新增：開發模式
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const [currentSound, setCurrentSound] = useState<AudioPlayer | null>(null); // For playing TTS audio

  const flatListRef = useRef<FlatList>(null);
  const nextIdRef = useRef(2); // Start from 2 since initial message has id 1

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  // Abort ongoing request if component unmounts
  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
      // Clean up sound object when component unmounts
      currentSound?.release();
    };
  }, [abortController, currentSound]);

  // Request microphone permissions when component mounts
  useEffect(() => {
    (async () => {
      if (Platform.OS !== "web") {
        // Only run on native platforms
        const { status } = await AudioModule.requestPermissionsAsync();

        if (status !== "granted") {
          alert("無法取得麥克風權限，錄音功能將無法使用。");
        }
      }
    })();
  }, []);

  // Generate current time in HH:MM AM/PM format
  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Function to cancel ongoing request
  const cancelRequest = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
    }
  }, [abortController]);

  // Function to send a message to the AI
  const sendMessage = async (textToSend?: string) => {
    const currentText = textToSend || inputText;

    if (!currentText.trim() || isTyping) return;

    // Cancel any ongoing request
    if (abortController) {
      cancelRequest();
    }

    // Add user message
    const userMessage: Message = {
      id: nextIdRef.current++,
      text: currentText, // Use currentText instead of inputText
      isUser: true,
      timestamp: getCurrentTime(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (!textToSend) {
      // Clear input only if it's not from voice input
      setInputText("");
    }
    setIsTyping(true);

    // Create placeholder for AI response
    const aiPlaceholderId = nextIdRef.current++;
    const aiPlaceholder: Message = {
      id: aiPlaceholderId,
      text: "",
      isUser: false,
      timestamp: getCurrentTime(),
    };

    setMessages((prevMessages) => [...prevMessages, aiPlaceholder]);

    // Create abort controller for this request
    const controller = new AbortController();

    setAbortController(controller);

    try {
      // Prepare context with conversation history
      const conversationHistory: ChatCompletionMessageParam[] = messages
        .concat(userMessage) // Ensure userMessage is included for context
        .filter(
          (msg) =>
            msg.text.trim() !== "[正在辨識語音...]" &&
            msg.text.trim() !== "[語音辨識失敗]",
        ) // Filter out placeholders
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text,
        })) as ChatCompletionMessageParam[];

      let accumulatedResponse = ""; // Accumulate full AI response for TTS

      // Start streaming response
      await chatCompletion({
        messages: conversationHistory,
        signal: controller.signal,
        onDelta: (delta: string) => {
          accumulatedResponse += delta;
          // Update AI response with streaming text
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiPlaceholderId
                ? { ...msg, text: msg.text + delta }
                : msg,
            ),
          );
        },
      });

      // After streaming is complete, play TTS if response is not empty
      if (accumulatedResponse.trim()) {
        if (currentSound) {
          console.log("[SendMessage] Stopping and releasing previous sound.");
          await currentSound.pause();
          currentSound.release();
        }
        console.log("[SendMessage] Attempting to call textToSpeech.");
        const audioUri = await textToSpeech(accumulatedResponse);

        if (audioUri) {
          console.log("[SendMessage] Playing TTS from URI:", audioUri);
          const player = createAudioPlayer({ uri: audioUri });

          setCurrentSound(player);
          console.log("[SendMessage] Attempting to play sound.");
          await player.play();
          console.log(
            "[SendMessage] player.play() awaited successfully (or returned void).",
          );
          const subscription = player.addListener(
            "playbackStatusUpdate",
            (status: AudioStatus) => {
              // Add AudioStatus type
              if (status.didJustFinish) {
                console.log("TTS playback finished.");
                player.release();
                setCurrentSound(null);
                subscription.remove(); // Clean up listener
              }
            },
          );
        } else {
          console.warn("TTS audio URI is null, cannot play.");
        }
      }
    } catch (error) {
      // Handle errors - only show error if not aborted
      if ((error as Error).name !== "AbortError") {
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === aiPlaceholderId
              ? {
                  ...msg,
                  text: "抱歉，我無法處理您的請求。請稍後再試。",
                }
              : msg,
          ),
        );
        console.error("AI Response error:", error);
      }
    } finally {
      setIsTyping(false);
      setAbortController(null);
      console.log(
        "[SendMessage] Main finally block reached. isTyping set to false.",
      );
    }
  };

  // Function to start recording audio
  const startRecording = async () => {
    console.log("[startRecording] 函數被呼叫");
    if (Platform.OS === "web") {
      // For web, check if MediaRecorder is available, which expo-audio uses under the hood.
      // Also, ensure the site is served over HTTPS for microphone access.
      if (typeof MediaRecorder === "undefined") {
        alert("瀏覽器不支援錄音功能。");

        return;
      }
      if (
        window.location.protocol !== "https:" &&
        window.location.hostname !== "localhost" &&
        window.location.hostname !== "127.0.0.1"
      ) {
        alert("麥克風錄音需要在 HTTPS 安全連線下執行。");

        return;
      }
      // On web, permission is typically requested by the browser when prepareToRecordAsync or record is called.
      // So, we skip the explicit AudioModule.getPermissionsAsync/requestPermissionsAsync calls here.
    } else {
      // Native platforms still use AudioModule for permissions
      const { granted } = await AudioModule.getPermissionsAsync();

      if (!granted) {
        const { status } = await AudioModule.requestPermissionsAsync();

        if (status !== "granted") {
          alert("無法取得麥克風權限");

          return;
        }
      }
    }

    try {
      console.log("Starting recording with expo-audio...");
      // Ensure recorder is not already in a recording state or has a pending operation
      if (audioRecorder.isRecording || audioRecorder.uri) {
        console.log(
          "Recorder is busy or has a previous recording, resetting...",
        );
        // Attempt to stop and unload if there's a URI, or just reset state
        if (audioRecorder.isRecording) {
          await audioRecorder.stop();
        }
        // It's good practice to ensure the recorder is in a clean state before preparing a new recording.
        // The expo-audio hook should handle much of this, but explicit checks can help.
      }
      await audioRecorder.prepareToRecordAsync();
      await audioRecorder.record();
      setIsRecording(true);
      console.log("Recording started with expo-audio");
    } catch (err) {
      console.error("Failed to start recording with expo-audio", err);
      alert("錄音失敗，請檢查權限或裝置狀態。");
      setIsRecording(false); // Ensure isRecording is reset on error
    }
  };

  // Function to stop recording audio and transcribe
  const stopRecordingAndTranscribe = async () => {
    console.log("[stopRecordingAndTranscribe] 函數被呼叫");
    let transcriptionPlaceholderId: number | null = null; // Declare here for wider scope

    if (!audioRecorder.isRecording) {
      if (audioRecorder.uri) {
        // If already stopped but URI exists
        console.log("Recording was already stopped. URI:", audioRecorder.uri);
      } else {
        console.log("Recorder is not active and no URI available.");
        setIsRecording(false); // Ensure UI consistency

        return;
      }
    } else {
      console.log("Stopping recording with expo-audio..");
      try {
        await audioRecorder.stop();
        console.log("Recording stopped. URI:", audioRecorder.uri);
      } catch (error) {
        console.error("Failed to stop recording:", error);
        alert("停止錄音失敗。");
        setIsRecording(false);

        return;
      }
    }

    setIsRecording(false);
    const uri = audioRecorder.uri;

    if (uri) {
      try {
        setIsTyping(true);
        transcriptionPlaceholderId = nextIdRef.current++; // Assign here
        const transcriptionPlaceholder: Message = {
          id: transcriptionPlaceholderId,
          text: "[正在辨識語音...]",
          isUser: true,
          timestamp: getCurrentTime(),
        };

        setMessages((prevMessages) => [
          ...prevMessages,
          transcriptionPlaceholder,
        ]);

        const transcribedText = await transcribeAudio(uri);

        console.log("Transcribed text:", transcribedText);

        // 辨識完後，移除 placeholder，再呼叫 sendMessage
        setMessages((prevMessages) =>
          prevMessages.filter((msg) => msg.id !== transcriptionPlaceholderId),
        );

        if (transcribedText.trim()) {
          await sendMessage(transcribedText);
        } else {
          setIsTyping(false);
        }
      } catch (error) {
        console.error("Transcription error:", error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            transcriptionPlaceholderId && msg.id === transcriptionPlaceholderId // Check if ID was set
              ? { ...msg, text: "[語音辨識失敗]" }
              : msg,
          ),
        );
        setIsTyping(false);
      }
    } else {
      console.log("No recording URI found after stopping.");
      setIsTyping(false); // Ensure typing indicator is turned off
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View
      style={[
        styles.messageBubble,
        item.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <Text style={styles.messageText}>{item.text}</Text>
    </View>
  );

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* 直接顯示 Orb 語音助理介面 */}
      <View style={styles.orbContainer}>
        {Platform.OS === "web" ? (
          <View style={styles.orbWrapper}>
            <Orb
              forceHoverState={isRecording}
              hoverIntensity={0.5}
              hue={0}
              rotateOnHover={true}
            />

            {/* 錄音控制覆蓋層 */}
            <TouchableOpacity
              disabled={isTyping}
              style={styles.orbOverlay}
              onPress={() => {
                console.log(
                  "[TouchableOpacity] 被點擊，isRecording:",
                  isRecording,
                );
                if (isRecording) {
                  stopRecordingAndTranscribe();
                } else {
                  startRecording();
                }
              }}
            >
              {/* 空的 TouchableOpacity，覆蓋整個 Orb 區域以接收點擊 */}
            </TouchableOpacity>
          </View>
        ) : (
          // 原生平台的替代 UI
          <TouchableOpacity
            disabled={isTyping}
            style={[
              styles.nativeOrbButton,
              isRecording && styles.nativeOrbButtonActive,
            ]}
            onPress={isRecording ? stopRecordingAndTranscribe : startRecording}
          >
            <MaterialIcons
              color={isRecording ? "#fff" : "#3498db"}
              name={isRecording ? "stop" : "mic"}
              size={responsiveScale.largeIconSize * 2.5}
            />
            <Text
              style={[
                styles.nativeOrbButtonText,
                isRecording && styles.nativeOrbButtonTextActive,
                { fontSize: responsiveScale.mediumFontSize },
              ]}
            >
              {isRecording
                ? "停止錄音"
                : isTyping
                  ? "AI 正在思考..."
                  : "開始對話"}
            </Text>
          </TouchableOpacity>
        )}

        {/* 狀態指示器 */}
        {(isTyping || isRecording) && (
          <View style={styles.statusIndicator}>
            <ActivityIndicator color="#3498db" size="small" />
            <Text
              style={[
                styles.statusText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              {isRecording ? "正在錄音中..." : "AI 正在回應中..."}
            </Text>
          </View>
        )}

        {/* 開發模式按鈕 - 右上角 */}
        <TouchableOpacity
          style={[
            styles.devModeButton,
            { padding: responsiveScale.mediumPadding },
          ]}
          onPress={() => setIsDevMode(true)}
        >
          <MaterialIcons
            color="#ffffff"
            name="keyboard"
            size={responsiveScale.mediumIconSize}
          />
          <Text
            style={[
              styles.devModeButtonText,
              { fontSize: responsiveScale.smallFontSize },
            ]}
          >
            開發模式
          </Text>
        </TouchableOpacity>
      </View>

      {/* Dev Mode 彈出視窗 */}
      {isDevMode && (
        <View style={styles.devModeOverlay}>
          <View style={styles.devModeContainer}>
            <View style={styles.devModeHeader}>
              <Text
                style={[
                  styles.devModeTitle,
                  { fontSize: responsiveScale.largeFontSize },
                ]}
              >
                開發模式 - 文字輸入與聊天歷史
              </Text>
              <TouchableOpacity
                style={[
                  styles.devModeCloseButton,
                  { padding: responsiveScale.smallPadding },
                ]}
                onPress={() => setIsDevMode(false)}
              >
                <MaterialIcons
                  color="#fff"
                  name="close"
                  size={responsiveScale.mediumIconSize}
                />
              </TouchableOpacity>
            </View>

            {/* 聊天歷史區域 */}
            <View style={styles.chatContainer}>
              <FlatList
                ref={flatListRef}
                contentContainerStyle={styles.messagesList}
                data={messages}
                keyExtractor={(item) => item.id.toString()}
                renderItem={renderMessage}
                showsVerticalScrollIndicator={false}
              />
            </View>

            <KeyboardAvoidingView
              behavior={Platform.OS === "ios" ? "padding" : "height"}
              style={styles.devInputContainer}
            >
              <View style={styles.inputRow}>
                <TextInput
                  multiline
                  editable={!isTyping && !isRecording}
                  placeholder="請輸入訊息..."
                  placeholderTextColor="#777"
                  style={styles.input}
                  value={inputText}
                  onChangeText={setInputText}
                  onSubmitEditing={() => sendMessage()}
                />
                {isTyping && !isRecording ? (
                  <TouchableOpacity
                    style={[
                      styles.iconButton,
                      {
                        width: responsiveScale.buttonSize,
                        height: responsiveScale.buttonSize,
                        borderRadius: responsiveScale.buttonSize / 2,
                      },
                    ]}
                    onPress={cancelRequest}
                  >
                    <MaterialIcons
                      color="#e74c3c"
                      name="close"
                      size={responsiveScale.mediumIconSize}
                    />
                  </TouchableOpacity>
                ) : !isRecording ? (
                  <TouchableOpacity
                    disabled={!inputText.trim() || isTyping}
                    style={[
                      styles.iconButton,
                      {
                        width: responsiveScale.buttonSize,
                        height: responsiveScale.buttonSize,
                        borderRadius: responsiveScale.buttonSize / 2,
                      },
                      (!inputText.trim() || isTyping) &&
                        styles.iconButtonDisabled,
                    ]}
                    onPress={() => sendMessage()}
                  >
                    <MaterialIcons
                      color="#3498db"
                      name="send"
                      size={responsiveScale.mediumIconSize}
                    />
                  </TouchableOpacity>
                ) : null}
              </View>
              {(isTyping || isRecording) && (
                <View style={styles.typingIndicator}>
                  <ActivityIndicator color="#3498db" size="small" />
                  <Text
                    style={[
                      styles.typingText,
                      { fontSize: responsiveScale.smallFontSize },
                    ]}
                  >
                    {isRecording
                      ? "正在錄音中..."
                      : isTyping
                        ? "AI 正在回應中..."
                        : ""}
                  </Text>
                </View>
              )}
            </KeyboardAvoidingView>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Message styles (still needed for dev mode)
  messageBubble: {
    marginBottom: 15,
    maxWidth: "80%",
    borderRadius: 20,
    padding: 12,
    paddingVertical: 10,
    flexDirection: "row",
  },
  userMessage: {
    backgroundColor: "#333",
    alignSelf: "flex-end",
    borderBottomRightRadius: 5,
  },
  aiMessage: {
    backgroundColor: "#222",
    alignSelf: "flex-start",
    borderBottomLeftRadius: 5,
  },
  messageText: {
    color: "#fff",
    fontSize: 16,
  },
  chatContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messagesList: {
    paddingVertical: 10,
  },
  devModeButton: {
    position: "absolute",
    top: 50,
    right: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(34, 34, 34, 0.8)",
    borderRadius: 15,
    padding: 10,
    zIndex: 10,
  },
  devModeButtonText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  orbContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  orbWrapper: {
    width: "100%",
    height: 400,
    position: "relative",
    justifyContent: "center",
    alignItems: "center",
  },
  orbOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "transparent",
    zIndex: 10, // 確保在 Orb 上方
  },
  orbStatus: {
    position: "absolute",
    bottom: -80, // 移到 Orb 容器下方
    left: 0,
    right: 0,
    alignItems: "center",
    zIndex: 5, // 低於覆蓋層
  },
  orbStatusText: {
    color: "#fff",
    fontSize: 16,
    textAlign: "center",
    backgroundColor: "rgba(0,0,0,0.7)",
    padding: 10,
    borderRadius: 15,
  },
  nativeOrbButton: {
    backgroundColor: "#222",
    borderRadius: 100,
    width: 200,
    height: 200,
    justifyContent: "center",
    alignItems: "center",
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
  },
  nativeOrbButtonActive: {
    backgroundColor: "#e74c3c",
  },
  nativeOrbButtonText: {
    color: "#3498db",
    fontSize: 16,
    fontWeight: "bold",
    marginTop: 12,
    textAlign: "center",
  },
  nativeOrbButtonTextActive: {
    color: "#fff",
  },
  statusIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 20,
    justifyContent: "center",
  },
  statusText: {
    color: "#3498db",
    marginLeft: 8,
    fontSize: 14,
  },
  orbControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "100%",
    marginTop: 40,
  },
  controlButton: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#222",
    borderRadius: 15,
    padding: 12,
    paddingHorizontal: 16,
  },
  controlButtonText: {
    color: "#ffffff",
    fontSize: 14,
    marginLeft: 8,
  },
  devModeOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "rgba(0,0,0,0.9)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  devModeContainer: {
    backgroundColor: "#111",
    borderRadius: 20,
    padding: 20,
    width: "90%",
    maxHeight: "80%",
  },
  devModeHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  devModeTitle: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
  },
  devModeCloseButton: {
    padding: 5,
  },
  devInputContainer: {
    flex: 1,
  },
  inputContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 15,
    marginRight: 10,
    fontSize: 16,
    maxHeight: 100,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#222",
    justifyContent: "center",
    alignItems: "center",
    marginLeft: 5,
  },
  iconButtonDisabled: {
    opacity: 0.5,
  },
  typingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 8,
    marginLeft: 15,
  },
  typingText: {
    color: "#3498db",
    marginLeft: 8,
    fontSize: 14,
  },
});

export default AIAssistantScreen;
