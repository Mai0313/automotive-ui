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

import { streamChatCompletion } from "../components/openai";
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
    };
  }, [abortController]);

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
  const sendMessage = async () => {
    if (!inputText.trim() || isTyping) return;

    // Cancel any ongoing request
    if (abortController) {
      cancelRequest();
    }

    // Add user message
    const userMessage: Message = {
      id: nextIdRef.current++,
      text: inputText,
      isUser: true,
      timestamp: getCurrentTime(),
    };

    setMessages((prevMessages) => [...prevMessages, userMessage]);
    setInputText("");
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
        .concat(userMessage)
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text,
        })) as ChatCompletionMessageParam[];

      // Start streaming response
      await streamChatCompletion({
        messages: conversationHistory,
        signal: controller.signal,
        onDelta: (delta: string) => {
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
              editable={!isTyping}
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
            />
            {isTyping ? (
              <TouchableOpacity style={styles.iconButton} onPress={cancelRequest}>
                <MaterialIcons color="#e74c3c" name="close" size={24} />
              </TouchableOpacity>
            ) : (
              <TouchableOpacity 
                style={[styles.iconButton, !inputText.trim() && styles.iconButtonDisabled]} 
                disabled={!inputText.trim()}
                onPress={sendMessage}
              >
                <MaterialIcons color="#3498db" name="send" size={24} />
              </TouchableOpacity>
            )}
          </View>
          
          {isTyping && (
            <View style={styles.typingIndicator}>
              <ActivityIndicator size="small" color="#3498db" />
              <Text style={styles.typingText}>AI 正在回應中...</Text>
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
