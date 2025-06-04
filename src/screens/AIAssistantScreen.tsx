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
import { chatCompletion } from "../hooks/openai";
import { isOpenAIConfigured } from "../utils/env";
import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

interface Message {
  id: number;
  text: string;
  isUser: boolean;
  timestamp: string;
}

const AIAssistantScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState<string>("");
  const [isTyping, setIsTyping] = useState<boolean>(false);
  const [abortController, setAbortController] = useState<AbortController | null>(null);
  const flatListRef = useRef<FlatList>(null);
  const nextIdRef = useRef(1);

  useEffect(() => {
    if (flatListRef.current && messages.length > 0) {
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    }
  }, [messages]);

  useEffect(() => {
    return () => {
      if (abortController) {
        abortController.abort();
      }
    };
  }, [abortController]);

  const getCurrentTime = () => {
    return new Date().toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const cancelRequest = useCallback(() => {
    if (abortController) {
      abortController.abort();
      setAbortController(null);
      setIsTyping(false);
    }
  }, [abortController]);

  const sendMessage = async (textToSend?: string) => {
    const currentText = textToSend || inputText;
    if (!currentText.trim() || isTyping) return;
    if (!isOpenAIConfigured()) {
      const userMessage: Message = {
        id: nextIdRef.current++,
        text: currentText,
        isUser: true,
        timestamp: getCurrentTime(),
      };
      const configErrorMessage: Message = {
        id: nextIdRef.current++,
        text: "❌ AI 功能目前無法使用，請設定 OpenAI API 金鑰。請參考專案的 .env.example 檔案了解如何配置環境變數。",
        isUser: false,
        timestamp: getCurrentTime(),
      };
      setMessages((prevMessages) => [
        ...prevMessages,
        userMessage,
        configErrorMessage,
      ]);
      if (!textToSend) {
        setInputText("");
      }
      return;
    }
    if (abortController) {
      cancelRequest();
    }
    const userMessage: Message = {
      id: nextIdRef.current++,
      text: currentText,
      isUser: true,
      timestamp: getCurrentTime(),
    };
    setMessages((prevMessages) => [...prevMessages, userMessage]);
    if (!textToSend) {
      setInputText("");
    }
    setIsTyping(true);
    const aiPlaceholderId = nextIdRef.current++;
    const aiPlaceholder: Message = {
      id: aiPlaceholderId,
      text: "",
      isUser: false,
      timestamp: getCurrentTime(),
    };
    setMessages((prevMessages) => [...prevMessages, aiPlaceholder]);
    const controller = new AbortController();
    setAbortController(controller);
    try {
      const conversationHistory: ChatCompletionMessageParam[] = messages
        .concat(userMessage)
        .map((msg) => ({
          role: msg.isUser ? "user" : "assistant",
          content: msg.text,
        })) as ChatCompletionMessageParam[];
      let accumulatedResponse = "";
      await chatCompletion({
        messages: conversationHistory,
        signal: controller.signal,
        onDelta: (delta: string) => {
          accumulatedResponse += delta;
          setMessages((prevMessages) =>
            prevMessages.map((msg) =>
              msg.id === aiPlaceholderId
                ? { ...msg, text: msg.text + delta }
                : msg,
            ),
          );
        },
      });
    } catch (error) {
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
    <SafeAreaView style={[commonStyles.container, { paddingBottom: 0 }]}> 
      <View style={styles.flexGrowContainer}>
        <FlatList
          ref={flatListRef}
          contentContainerStyle={styles.bottomAlignMessagesList}
          data={messages}
          keyExtractor={(item) => item.id.toString()}
          renderItem={renderMessage}
          showsVerticalScrollIndicator={false}
        />
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.inputBarContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            multiline
            editable={!isTyping}
            placeholder="請輸入訊息..."
            placeholderTextColor="#777"
            style={styles.input}
            value={inputText}
            onChangeText={setInputText}
            onSubmitEditing={() => sendMessage()}
          />
          {isTyping ? (
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
          ) : (
            <TouchableOpacity
              disabled={!inputText.trim() || isTyping}
              style={[
                styles.iconButton,
                {
                  width: responsiveScale.buttonSize,
                  height: responsiveScale.buttonSize,
                  borderRadius: responsiveScale.buttonSize / 2,
                },
                (!inputText.trim() || isTyping) && styles.iconButtonDisabled,
              ]}
              onPress={() => sendMessage()}
            >
              <MaterialIcons
                color="#3498db"
                name="send"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>
          )}
        </View>
        {isTyping && (
          <View style={styles.typingIndicator}>
            <ActivityIndicator color="#3498db" size="small" />
            <Text
              style={[
                styles.typingText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              AI 正在回應中...
            </Text>
          </View>
        )}
      </KeyboardAvoidingView>
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
  flexGrowContainer: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  bottomAlignMessagesList: {
    flexGrow: 1,
    justifyContent: 'flex-end',
    paddingHorizontal: 10,
    paddingBottom: 10,
  },
  inputBarContainer: {
    borderTopWidth: 1,
    // borderTopColor: '#222',
    // backgroundColor: '#111',
    paddingHorizontal: 10,
    paddingBottom: Platform.OS === 'ios' ? 24 : 10,
    paddingTop: 6,
  },
});

export default AIAssistantScreen;
