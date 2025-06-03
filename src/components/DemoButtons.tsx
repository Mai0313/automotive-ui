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
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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
  const [showPermissionHelp, setShowPermissionHelp] = useState(false);

  // 檢查是否有權限問題
  const hasPermissionIssues = Boolean(
    (realtimeVoice?.error && realtimeVoice.error.includes("權限")) ||
      (locationError && locationError.includes("權限")),
  );

  // 如果有權限問題，自動顯示說明
  useEffect(() => {
    if (hasPermissionIssues) {
      setShowPermissionHelp(true);
    }
  }, [hasPermissionIssues]);

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
      {/* Permission Help Panel */}
      {showPermissionHelp && hasPermissionIssues && Platform.OS === "web" && (
        <View style={styles.permissionHelp}>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowPermissionHelp(false)}
          >
            <MaterialCommunityIcons color="#fff" name="close" size={16} />
          </TouchableOpacity>

          <Text style={styles.helpTitle}>權限設定說明</Text>
          <Text style={styles.helpText}>
            在非安全環境 (HTTP) 中需要設定 Chrome flags:
          </Text>
          <Text style={styles.helpSteps}>1. 打開 chrome://flags/</Text>
          <Text style={styles.helpSteps}>
            2. 搜尋 &quot;Insecure origins treated as secure&quot;
          </Text>
          <Text style={styles.helpSteps}>
            3. 加入當前網址:{" "}
            {typeof window !== "undefined" ? window.location.origin : ""}
          </Text>
          <Text style={styles.helpSteps}>
            4. 設為 &quot;Enabled&quot; 並重啟瀏覽器
          </Text>
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
    width: 320,
    backgroundColor: "rgba(0, 0, 0, 0.9)",
    padding: 16,
    borderRadius: 8,
    zIndex: 200,
    borderWidth: 1,
    borderColor: "#ffd700",
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
});

export default DemoButtons;
