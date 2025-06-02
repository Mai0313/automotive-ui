// DemoButtons.tsx
// Demo-only component to trigger TPMS (tire pressure) warning via WebSocket toggle
import React, { useState } from "react";
import { TouchableOpacity, StyleSheet, Platform } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface Props {
  ws: WebSocket | null;
}

const DemoButtons: React.FC<Props> = ({ ws }) => {
  const [tpmsActive, setTpmsActive] = useState(false);

  const toggleTpms = () => {
    const newValue = !tpmsActive;

    setTpmsActive(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tpms_warning: newValue }));
    }
  };

  return (
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
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    left: 60, // 放在語音圖標右邊
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 150,
  },
});

export default DemoButtons;
