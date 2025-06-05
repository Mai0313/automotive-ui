import React, { useEffect } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRealtimeVoice } from "../hooks/useRealtimeVoice";
import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

const AIAssistantScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();
  
  // 初始化 Realtime Voice Hook
  const realtimeVoice = useRealtimeVoice({
    autoStart: Platform.OS === "web", // 僅在 web 上自動開始
  });

  // 自動啟動語音連線（如果不是自動開始的平台）
  useEffect(() => {
    if (Platform.OS !== "web" && !realtimeVoice.isConnected) {
      realtimeVoice.startAudio();
    }
  }, []);

  // 取得圖標和顏色
  const getIconAndColor = () => {
    if (!realtimeVoice.isConnected) {
      return { icon: "wifi-off" as const, color: "#ff4444" }; // 未連線 - 紅色 wifi-off
    }
    if (realtimeVoice.isMuted) {
      return { icon: "microphone-off" as const, color: "#ff4444" }; // 靜音 - 紅色 mic-off
    }
    return { icon: "microphone" as const, color: "#00ff00" }; // 已連線且未靜音 - 綠色 mic
  };

  const { icon, color } = getIconAndColor();

  return (
    <SafeAreaView style={[commonStyles.container, styles.container]}>
      <View style={styles.content}>
        {/* 主要控制按鈕 */}
        <TouchableOpacity
          style={[
            styles.primaryButton,
            {
              width: responsiveScale.buttonSize * 4,
              height: responsiveScale.buttonSize * 4,
              borderRadius: responsiveScale.buttonSize * 2,
            },
          ]}
          onPress={realtimeVoice.toggleMute}
          disabled={!realtimeVoice.isConnected}
        >
          <MaterialCommunityIcons
            name={icon}
            size={responsiveScale.largeIconSize * 2.5}
            color={color}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  primaryButton: {
    backgroundColor: '#2c3e50',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
});

export default AIAssistantScreen;
