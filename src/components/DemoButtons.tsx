// DemoButtons.tsx
// Demo-only component to trigger TPMS (tire pressure) warning via WebSocket toggle
// Also includes realtime voice debug controls and permission status display
import React, { useState, useEffect } from "react";
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
  locationError?: string | null;
  currentTpmsWarning?: boolean; // 當前數據庫中的 TPMS 警示狀態
}

const DemoButtons: React.FC<Props> = ({
  ws,
  locationError,
  currentTpmsWarning = false,
}) => {
  const [tpmsActive, setTpmsActive] = useState(currentTpmsWarning);

  // 當傳入的 currentTpmsWarning 改變時，同步更新本地狀態
  useEffect(() => {
    setTpmsActive(currentTpmsWarning);
  }, [currentTpmsWarning]);

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

  // 使用權限設定說明 hook
  const { config: helpConfig, setShowHelp } = usePermissionHelp({
    locationError,
    openAIErrors,
  });

  const toggleTpms = () => {
    const newValue = !tpmsActive;

    setTpmsActive(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tpms_warning: newValue }));
    }
  };

  return (
    <View style={styles.buttonContainer}>
      {/* Permission and API Status Help Panel */}
      {helpConfig.showHelp &&
        (helpConfig.hasPermissionIssues || helpConfig.hasOpenAIIssues) &&
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

                  {helpConfig.hasOpenAIIssues && (
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
                </>
              )}
            </ScrollView>
          </View>
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
