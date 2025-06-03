// DemoButtons.tsx
// Demo-only component to trigger TPMS (tire pressure) warning via WebSocket toggle
// Also includes realtime voice debug controls
import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Platform, View } from "react-native";
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
}

const DemoButtons: React.FC<Props> = ({ ws, realtimeVoice }) => {
  const [tpmsActive, setTpmsActive] = useState(false);

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
      {/* Realtime Voice Debug Button */}
      {realtimeVoice && (
        <TouchableOpacity
          style={[styles.container, styles.voiceDebugButton]}
          onPress={toggleRealtimeVoice}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons
            name={realtimeVoice.isRecording ? "microphone" : "microphone-off"}
            size={16}
            color={
              realtimeVoice.error 
                ? "#ff4444" 
                : realtimeVoice.isConnected 
                  ? "#00ff00" 
                  : "#ffffff"
            }
          />
        </TouchableOpacity>
      )}
      
      {/* TPMS Demo Button */}
      <TouchableOpacity
        style={styles.container}
        onPress={toggleTpms}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons
          name={tpmsActive ? "car-tire-alert" : "car-tire-alert"}
          size={16}
          color={tpmsActive ? "#ff4444" : "#ffffff"}
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
});

export default DemoButtons;
