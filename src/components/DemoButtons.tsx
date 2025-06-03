// DemoButtons.tsx
// Demo-only component to trigger TPMS (tire pressure) warning via WebSocket toggle
// Also includes realtime voice debug controls and permission status display
import React, { useState } from "react";
import {
  TouchableOpacity,
  StyleSheet,
  Platform,
  View,
  Text,
  ScrollView,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import { usePermissionHelp } from "../hooks/usePermissionHelp";
import { useOpenAIStatus } from "../hooks/useOpenAIStatus";

interface Props {
  ws: WebSocket | null;
  realtimeVoice?: {
    isConnected: boolean;
    isRecording: boolean;
    error: string | null;
    startAudio: () => void;
    stopAudio: () => void;
  };
  locationError?: string | null;
}

const DemoButtons: React.FC<Props> = ({ ws, realtimeVoice, locationError }) => {
  const [tpmsActive, setTpmsActive] = useState(false);

  // 使用 OpenAI 狀態檢測 hook
  const { status: openAIStatus } = useOpenAIStatus();

  // 收集 OpenAI 錯誤訊息
  const openAIErrors: string[] = [];

  if (!openAIStatus.configurationStatus.isConfigured) {
    openAIErrors.push(
      `缺少環境變數: ${openAIStatus.configurationStatus.missingVars.join(", ")}`,
    );
  }
  if (
    openAIStatus.chatCompletionStatus.tested &&
    !openAIStatus.chatCompletionStatus.isAvailable
  ) {
    openAIErrors.push(`Chat API: ${openAIStatus.chatCompletionStatus.error}`);
  }
  if (
    openAIStatus.textToSpeechStatus.tested &&
    !openAIStatus.textToSpeechStatus.isAvailable
  ) {
    openAIErrors.push(`TTS API: ${openAIStatus.textToSpeechStatus.error}`);
  }

  // 使用權限設定說明 hook - 增加 Realtime Voice 連線狀態
  const realtimeVoiceConnectionStatus = realtimeVoice?.isConnected
    ? "已連線"
    : realtimeVoice?.error
      ? `連線失敗: ${realtimeVoice.error}`
      : "未連線";

  const { config: helpConfig, setShowHelp } = usePermissionHelp({
    realtimeVoiceError: realtimeVoice?.error,
    locationError,
    openAIErrors,
    isRealtimeVoiceConnected: realtimeVoice?.isConnected,
    realtimeVoiceConnectionStatus,
  });

  const toggleTpms = () => {
    const newValue = !tpmsActive;

    setTpmsActive(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tpms_warning: newValue }));
    }
  };

  const toggleRealtimeVoice = () => {
    if (!realtimeVoice) return;

    if (realtimeVoice.isRecording) {
      realtimeVoice.stopAudio();
    } else {
      realtimeVoice.startAudio();
    }
  };

  return (
    <View style={styles.buttonContainer}>
      {/* Permission and API Status Help Panel */}
      {helpConfig.showHelp &&
        (helpConfig.hasPermissionIssues ||
          helpConfig.hasOpenAIIssues ||
          helpConfig.hasRealtimeVoiceIssues) &&
        Platform.OS === "web" && (
          <View style={styles.permissionHelp}>
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setShowHelp(false)}
            >
              <MaterialCommunityIcons color="#fff" name="close" size={16} />
            </TouchableOpacity>

            <ScrollView
              showsVerticalScrollIndicator={false}
              style={styles.helpScrollView}
            >
              {/* 權限問題說明 */}
              {helpConfig.hasPermissionIssues && (
                <>
                  <Text style={styles.helpTitle}>權限設定說明</Text>
                  <Text style={styles.helpText}>
                    在非安全環境 (HTTP) 中需要設定 Chrome flags:
                  </Text>
                  <Text style={styles.helpSteps}>1. 打開 chrome://flags/</Text>
                  <Text style={styles.helpSteps}>
                    2. 搜尋 &quot;Insecure origins treated as secure&quot;
                  </Text>
                  <Text style={styles.helpSteps}>
                    3. 加入當前網址: {helpConfig.currentOrigin}
                  </Text>
                  <Text style={styles.helpSteps}>
                    4. 設為 &quot;Enabled&quot; 並重啟瀏覽器
                  </Text>

                  {(helpConfig.hasOpenAIIssues ||
                    helpConfig.hasRealtimeVoiceIssues) && (
                    <View style={styles.separator} />
                  )}
                </>
              )}

              {/* OpenAI API 問題說明 */}
              {helpConfig.hasOpenAIIssues && (
                <>
                  <Text style={styles.helpTitle}>OpenAI API 設定問題</Text>
                  <Text style={styles.helpText}>檢測到以下 API 連線問題：</Text>
                  {helpConfig.openAIErrors.map((error, index) => (
                    <Text key={index} style={styles.errorText}>
                      • {error}
                    </Text>
                  ))}

                  {helpConfig.hasRealtimeVoiceIssues && (
                    <View style={styles.separator} />
                  )}
                </>
              )}

              {/* Realtime Voice 連線問題說明 */}
              {helpConfig.hasRealtimeVoiceIssues && (
                <>
                  <Text style={styles.helpTitle}>即時語音連線問題</Text>
                  <Text style={styles.helpText}>
                    Realtime Voice WebSocket 連線狀態：
                  </Text>
                  <Text style={styles.errorText}>
                    • 狀態: {helpConfig.realtimeVoiceStatus}
                  </Text>
                  {helpConfig.realtimeVoiceError && (
                    <Text style={styles.errorText}>
                      • 錯誤: {helpConfig.realtimeVoiceError}
                    </Text>
                  )}
                  <Text style={styles.helpText}>請確認：</Text>
                  <Text style={styles.helpSteps}>
                    1. Realtime Voice 伺服器已啟動 (ws://localhost:8100)
                  </Text>
                  <Text style={styles.helpSteps}>2. 網路連線正常</Text>
                  <Text style={styles.helpSteps}>
                    3. 如使用非 localhost，請檢查伺服器 URL 設定
                  </Text>
                </>
              )}
            </ScrollView>
          </View>
        )}

      {/* Realtime Voice Debug Button */}
      {realtimeVoice && (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[styles.container, styles.voiceDebugButton]}
          onPress={toggleRealtimeVoice}
        >
          <MaterialCommunityIcons
            color={
              !realtimeVoice.isConnected
                ? "#ff4444" // 沒順利連接時顯示紅色
                : realtimeVoice.isRecording
                  ? "#00ff00" // 順利連接且正在錄音時顯示綠色
                  : "#ff4444" // 順利連接但手動關閉錄音時顯示紅色
            }
            name={
              !realtimeVoice.isConnected
                ? "wifi-off" // 沒順利連接時顯示 wifi-off
                : realtimeVoice.isRecording
                  ? "microphone" // 順利連接且正在錄音時顯示 microphone
                  : "microphone-off" // 順利連接但手動關閉錄音時顯示 microphone-off
            }
            size={16}
          />
        </TouchableOpacity>
      )}

      {/* TPMS Demo Button */}
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.container}
        onPress={toggleTpms}
      >
        <MaterialCommunityIcons
          color={tpmsActive ? "#ff4444" : "#ffffff"}
          name={tpmsActive ? "car-tire-alert" : "car-tire-alert"}
          size={16}
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    left: 10,
    zIndex: 150,
    flexDirection: "row",
    gap: 8,
  },
  container: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
  voiceDebugButton: {
    // Additional styles for voice debug button if needed
  },
  permissionHelp: {
    position: "absolute",
    top: 40,
    left: 0,
    width: 350,
    maxHeight: 400,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 16,
    borderRadius: 8,
    zIndex: 200,
    borderWidth: 1,
    borderColor: "#ffd700",
  },
  helpScrollView: {
    maxHeight: 360,
  },
  closeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    zIndex: 210,
  },
  helpTitle: {
    color: "#ffd700",
    fontWeight: "bold",
    fontSize: 14,
    marginBottom: 8,
    marginRight: 30,
  },
  helpText: {
    color: "#ffffff",
    fontSize: 12,
    marginBottom: 8,
    lineHeight: 16,
  },
  helpSteps: {
    color: "#cccccc",
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 14,
  },
  errorText: {
    color: "#ff8888",
    fontSize: 11,
    marginLeft: 8,
    marginBottom: 4,
    lineHeight: 14,
  },
  separator: {
    height: 1,
    backgroundColor: "#444444",
    marginVertical: 12,
    marginRight: 30,
  },
});

export default DemoButtons;
