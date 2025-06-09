import React, { useEffect } from "react";
import { View, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import { useRealtimeVoice } from "../hooks/useRealtimeVoice";
import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";
import { layoutStyles } from "../styles/layoutStyles";

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
    <SafeAreaView style={[commonStyles.container, layoutStyles.aiContainer]}>
      <View style={layoutStyles.aiContent}>
        {/* 主要控制按鈕 */}
        <TouchableOpacity
          disabled={!realtimeVoice.isConnected}
          style={[
            layoutStyles.aiPrimaryButton,
            {
              width: responsiveScale.buttonSize * 4,
              height: responsiveScale.buttonSize * 4,
              borderRadius: responsiveScale.buttonSize * 2,
            },
          ]}
          onPress={realtimeVoice.toggleMute}
        >
          <MaterialCommunityIcons
            color={color}
            name={icon}
            size={responsiveScale.largeIconSize * 2.5}
          />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default AIAssistantScreen;
