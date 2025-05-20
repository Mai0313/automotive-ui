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
import type { ChatCompletionMessageParam } from "openai/resources";
import { 
  AudioModule, 
  useAudioRecorder, 
  RecordingPresets, 
  AudioPlayer, 
  createAudioPlayer, // Import createAudioPlayer directly
  type AudioStatus    // Import AudioStatus type
} from "expo-audio"; 

import { chatCompletion, transcribeAudio, textToSpeech } from "../components/openai"; // Added textToSpeech
import commonStyles from "../styles/commonStyles";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const AIAssistantScreen: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: 1,
      text: "您好！我是您的車載 AI 助理。我可以幫您控制車輛功能、查詢資訊或提供幫助。請問需要什麼協助？",
      isUser: false,
      timestamp: "10:18 AM",
    },
  ]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const [isRecording, setIsRecording] = useState(false);
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
      if (Platform.OS !== 'web') { // Only run on native platforms
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
    if (!textToSend) { // Clear input only if it's not from voice input
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
        .filter(msg => msg.text.trim() !== "[正在辨識語音...]" && msg.text.trim() !== "[語音辨識失敗]") // Filter out placeholders
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
                : msg
            )
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
          console.log("[SendMessage] player.play() awaited successfully (or returned void).");
          const subscription = player.addListener("playbackStatusUpdate", (status: AudioStatus) => { // Add AudioStatus type
            if (status.didJustFinish) {
              console.log("TTS playback finished.");
              player.release();
              setCurrentSound(null);
              subscription.remove(); // Clean up listener
            }
          });
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
              : msg
          )
        );
        console.error("AI Response error:", error);
      }
    } finally {
      setIsTyping(false);
      setAbortController(null);
      console.log("[SendMessage] Main finally block reached. isTyping set to false.");
    }
  };

  // Function to start recording audio
  const startRecording = async () => {
    if (Platform.OS === 'web') {
      // For web, check if MediaRecorder is available, which expo-audio uses under the hood.
      // Also, ensure the site is served over HTTPS for microphone access.
      if (typeof MediaRecorder === 'undefined') {
        alert("瀏覽器不支援錄音功能。");
        return;
      }
      if (window.location.protocol !== 'https:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1') {
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
        console.log("Recorder is busy or has a previous recording, resetting...");
        // Attempt to stop and unload if there's a URI, or just reset state
        if(audioRecorder.isRecording){
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
    let transcriptionPlaceholderId: number | null = null; // Declare here for wider scope

    if (!audioRecorder.isRecording) {
        if (audioRecorder.uri) { // If already stopped but URI exists
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
        setMessages((prevMessages) => [...prevMessages, transcriptionPlaceholder]);

        const transcribedText = await transcribeAudio(uri);
        console.log("Transcribed text:", transcribedText);

        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            msg.id === transcriptionPlaceholderId
              ? { ...msg, text: transcribedText }
              : msg
          )
        );

        if (transcribedText.trim()) {
          await sendMessage(transcribedText); 
        } else {
          setMessages((prevMessages) => prevMessages.filter(msg => msg.id !== transcriptionPlaceholderId));
          setIsTyping(false);
        }
      } catch (error) {
        console.error("Transcription error:", error);
        setMessages((prevMessages) =>
          prevMessages.map((msg) =>
            transcriptionPlaceholderId && msg.id === transcriptionPlaceholderId // Check if ID was set
              ? { ...msg, text: "[語音辨識失敗]" }
              : msg
          )
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
      {/* Chat Area */}
      <View style={styles.chatContainer}>
        <FlatList
          ref={flatListRef}
          contentContainerStyle={styles.messagesList}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />

        {/* Input Area */}
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          style={styles.inputContainer}
        >
          <View style={styles.inputRow}>
            <TextInput
              placeholder="請輸入訊息..."
              placeholderTextColor="#777"
              style={styles.input}
              value={inputText}
              editable={!isTyping && !isRecording} // Disable input when recording
              onChangeText={setInputText}
              onSubmitEditing={() => sendMessage()}
            />
            {isTyping && !isRecording ? ( // Show close icon only when typing and not recording
              <TouchableOpacity style={styles.iconButton} onPress={cancelRequest}>
                <MaterialIcons color="#e74c3c" name="close" size={24} />
              </TouchableOpacity>
            ) : !isRecording ? ( // Show send icon only when not recording
              <TouchableOpacity
                style={[styles.iconButton, (!inputText.trim() || isTyping) && styles.iconButtonDisabled]}
                disabled={!inputText.trim() || isTyping}
                onPress={() => sendMessage()}
              >
                <MaterialIcons color="#3498db" name="send" size={24} />
              </TouchableOpacity>
            ) : null}
            {/* Microphone Button */}
            <TouchableOpacity 
              style={[styles.iconButton, isTyping && styles.iconButtonDisabled]} // Disable mic when AI is typing
              onPress={isRecording ? stopRecordingAndTranscribe : startRecording}
              disabled={isTyping && !isRecording} // Disable mic if AI is responding (but allow stopping if already recording)
            >
              <MaterialIcons color={isRecording ? "#e74c3c" : "#3498db"} name={isRecording ? "stop" : "mic"} size={24} />
            </TouchableOpacity>
          </View>
          
          {(isTyping || isRecording) && ( // Show indicator if AI is typing OR user is recording
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.typingText}>{isRecording ? "正在錄音中..." : isTyping ? "AI 正在回應中..." : ""}</Text>
            </View>
          )}
        </KeyboardAvoidingView>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  chatContainer: {
    flex: 1,
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  messagesList: {
    paddingVertical: 10,
  },
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
  inputContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: "#222",
  },
  inputRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  input: {
    flex: 1,
    backgroundColor: "#222",
    color: "#fff",
    padding: 12,
    borderRadius: 25,
    marginRight: 10,
    fontSize: 16,
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
  }
});

export default AIAssistantScreen;
