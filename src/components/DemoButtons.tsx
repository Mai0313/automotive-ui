// DemoButtons.tsx
// Demo-only component to trigger TPMS (tire pressure) warning via WebSocket toggle
import React, { useState } from "react";
import { View, TouchableOpacity, Text, StyleSheet } from "react-native";

import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

interface Props {
  ws: WebSocket | null;
}

const DemoButtons: React.FC<Props> = ({ ws }) => {
  const [tpmsActive, setTpmsActive] = useState(false);
  const responsiveScale = useResponsiveStyles();

  const toggleTpms = () => {
    const newValue = !tpmsActive;

    setTpmsActive(newValue);
    if (ws && ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({ tpms_warning: newValue }));
    }
  };

  return (
    <View
      pointerEvents="box-none"
      style={[
        styles.container,
        {
          bottom: responsiveScale.buttonSize * 2.5,
          right: responsiveScale.mediumPadding,
        },
      ]}
    >
      <TouchableOpacity
        style={[
          styles.button,
          {
            paddingVertical: responsiveScale.smallPadding / 2,
            paddingHorizontal: responsiveScale.smallPadding,
            borderRadius: responsiveScale.borderRadius,
          },
        ]}
        onPress={toggleTpms}
      >
        <Text
          style={[
            styles.buttonText,
            { fontSize: responsiveScale.smallFontSize },
          ]}
        >
          {tpmsActive
            ? "Clear Tire Pressure Warning"
            : "Trigger Tire Pressure Warning"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 120,
    right: 20,
    zIndex: 200,
  },
  button: {
    backgroundColor: "#333",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
  },
  buttonText: {
    color: "#fff",
    fontSize: 12,
  },
});

export default DemoButtons;
