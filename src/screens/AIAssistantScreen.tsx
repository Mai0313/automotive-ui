import React, { useState, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as Clipboard from "expo-clipboard";
import * as Sharing from "expo-sharing";
import * as FileSystem from "expo-file-system";

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
  const flatListRef = useRef<FlatList>(null);

  // Mock responses for demo purposes
  const mockResponses: Record<string, string> = {
    你好: "您好！很高興為您服務。",
    天氣: "目前外部溫度為 30°C，天氣晴朗。今日預計溫度為 15-22°C，無降雨機率。",
    播放音樂: "好的，正在播放您喜愛的播放清單。",
    導航: "請問您要前往哪裡？您可以說出地點名稱或地址。",
    設定溫度: "已將車內溫度設定為 22°C。",
    電量: "目前電池電量為 70%，預估剩餘里程為 315 公里。",
  };

  // Function to send a message
  const sendMessage = () => {
    if (!inputText.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
      }),
    };

    setMessages([...messages, newMessage]);
    setInputText("");

    // Simulate AI response with a slight delay
    setTimeout(() => {
      let responseText = "我不確定如何回應。請嘗試用其他方式提問。";

      // Check for keywords in input
      for (const keyword in mockResponses) {
        if (inputText.includes(keyword)) {
          responseText = mockResponses[keyword];
          break;
        }
      }

      const aiResponse: Message = {
        id: messages.length + 2,
        text: responseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
        }),
      };

      setMessages((prevMessages) => [...prevMessages, aiResponse]);
    }, 1000);
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
              onChangeText={setInputText}
              onSubmitEditing={sendMessage}
            />
            <TouchableOpacity style={[styles.iconButton]} onPress={sendMessage}>
              <MaterialIcons color="#3498db" name="send" size={24} />
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </View>

      <View
        style={{
          flexDirection: "row",
          justifyContent: "center",
          margin: 10,
        }}
      >
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
});

export default AIAssistantScreen;
