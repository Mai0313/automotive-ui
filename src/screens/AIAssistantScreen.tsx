import React, { useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  TouchableOpacity, 
  TextInput, 
  ScrollView, 
  KeyboardAvoidingView, 
  Platform 
} from 'react-native';
import { MaterialCommunityIcons, Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
      text: '您好！我是您的車載 AI 助理。我可以幫您控制車輛功能、查詢資訊或提供幫助。請問需要什麼協助？',
      isUser: false,
      timestamp: '10:18 AM',
    },
  ]);
  const [input, setInput] = useState('');
  const [isListening, setIsListening] = useState(false);

  // Mock responses for demo purposes
  const mockResponses: Record<string, string> = {
    '你好': '您好！很高興為您服務。',
    '天氣': '目前外部溫度為 17°C，天氣晴朗。今日預計溫度為 15-22°C，無降雨機率。',
    '播放音樂': '好的，正在播放您喜愛的播放清單。',
    '導航': '請問您要前往哪裡？您可以說出地點名稱或地址。',
    '設定溫度': '已將車內溫度設定為 22°C。',
    '電量': '目前電池電量為 70%，預估剩餘里程為 315 公里。',
  };

  // Function to send a message
  const sendMessage = () => {
    if (!input.trim()) return;

    // Add user message
    const newMessage: Message = {
      id: messages.length + 1,
      text: input,
      isUser: true,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages([...messages, newMessage]);
    setInput('');

    // Simulate AI response with a slight delay
    setTimeout(() => {
      let responseText = '我不確定如何回應。請嘗試用其他方式提問。';
      
      // Check for keywords in input
      for (const keyword in mockResponses) {
        if (input.includes(keyword)) {
          responseText = mockResponses[keyword];
          break;
        }
      }

      const aiResponse: Message = {
        id: messages.length + 2,
        text: responseText,
        isUser: false,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages(prevMessages => [...prevMessages, aiResponse]);
    }, 1000);
  };

  // Function to toggle voice listening
  const toggleVoiceInput = () => {
    setIsListening(!isListening);
    
    // If turning on voice, simulate voice recognition after a delay
    if (!isListening) {
      setTimeout(() => {
        setIsListening(false);
        setInput('播放音樂');
        
        // Automatically send the recognized command
        setTimeout(() => {
          sendMessage();
        }, 500);
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>AI 助理</Text>
        <Text style={styles.statusTime}>10:21 AM</Text>
      </View>

      {/* Messages Area */}
      <ScrollView 
        style={styles.messagesContainer}
        contentContainerStyle={styles.messagesList}
      >
        {messages.map(message => (
          <View 
            key={message.id} 
            style={[
              styles.messageBubble, 
              message.isUser ? styles.userBubble : styles.aiBubble
            ]}
          >
            {!message.isUser && (
              <View style={styles.aiIconContainer}>
                <MaterialCommunityIcons name="robot" size={24} color="#3498db" />
              </View>
            )}
            <View style={styles.messageContent}>
              <Text style={styles.messageText}>{message.text}</Text>
              <Text style={styles.timestamp}>{message.timestamp}</Text>
            </View>
          </View>
        ))}
      </ScrollView>

      {/* Voice Listening Indicator - shown when voice is active */}
      {isListening && (
        <View style={styles.listeningIndicator}>
          <Text style={styles.listeningText}>正在聆聽...</Text>
          <View style={styles.waveContainer}>
            {[...Array(5)].map((_, i) => (
              <View 
                key={i} 
                style={[
                  styles.wave,
                  { height: 15 + Math.random() * 20, marginHorizontal: 3 }
                ]} 
              />
            ))}
          </View>
        </View>
      )}

      {/* Input Area */}
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.inputContainer}
      >
        <View style={styles.inputRow}>
          <TextInput
            style={styles.input}
            placeholder="請輸入訊息..."
            placeholderTextColor="#777"
            value={input}
            onChangeText={setInput}
            onSubmitEditing={sendMessage}
          />
          <TouchableOpacity 
            style={[styles.iconButton, isListening && styles.listeningButton]} 
            onPress={toggleVoiceInput}
          >
            <Ionicons 
              name={isListening ? "radio" : "mic-outline"} 
              size={24} 
              color={isListening ? "#3498db" : "#fff"} 
            />
          </TouchableOpacity>
          <TouchableOpacity 
            style={[styles.iconButton, !input.trim() && styles.disabledButton]} 
            onPress={sendMessage}
            disabled={!input.trim()}
          >
            <Ionicons name="send" size={24} color={input.trim() ? "#3498db" : "#555"} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>

      {/* Quick Action Suggestions */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.suggestionsContainer}
      >
        {['播放音樂', '導航回家', '天氣狀況', '電量狀態', '設定溫度'].map((suggestion, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.suggestionButton}
            onPress={() => setInput(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#222',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusTime: {
    color: '#aaa',
    fontSize: 16,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesList: {
    padding: 15,
  },
  messageBubble: {
    marginBottom: 15,
    maxWidth: '80%',
    borderRadius: 20,
    padding: 12,
    paddingVertical: 10,
    flexDirection: 'row',
  },
  userBubble: {
    backgroundColor: '#333',
    alignSelf: 'flex-end',
    borderBottomRightRadius: 5,
  },
  aiBubble: {
    backgroundColor: '#222',
    alignSelf: 'flex-start',
    borderBottomLeftRadius: 5,
  },
  aiIconContainer: {
    marginRight: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  messageContent: {
    flex: 1,
  },
  messageText: {
    color: '#fff',
    fontSize: 16,
  },
  timestamp: {
    color: '#999',
    fontSize: 12,
    alignSelf: 'flex-end',
    marginTop: 5,
  },
  inputContainer: {
    paddingHorizontal: 10,
    paddingVertical: 10,
    borderTopWidth: 1,
    borderTopColor: '#222',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  input: {
    flex: 1,
    backgroundColor: '#222',
    color: '#fff',
    padding: 12,
    borderRadius: 25,
    marginRight: 10,
    fontSize: 16,
  },
  iconButton: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: '#222',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 5,
  },
  disabledButton: {
    backgroundColor: '#1A1A1A',
  },
  listeningButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  suggestionsContainer: {
    paddingHorizontal: 10,
    paddingVertical: 15,
  },
  suggestionButton: {
    backgroundColor: '#222',
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 20,
    marginHorizontal: 5,
  },
  suggestionText: {
    color: '#3498db',
    fontSize: 14,
  },
  listeningIndicator: {
    alignItems: 'center',
    justifyContent: 'center',
    marginVertical: 20,
  },
  listeningText: {
    color: '#3498db',
    fontSize: 18,
    marginBottom: 10,
  },
  waveContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 40,
  },
  wave: {
    width: 4,
    backgroundColor: '#3498db',
    borderRadius: 2,
  },
});

export default AIAssistantScreen;