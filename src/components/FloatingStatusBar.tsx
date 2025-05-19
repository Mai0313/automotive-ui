import React from "react";
import { View, Text, StyleSheet } from "react-native";

import useCurrentTime from "../hooks/useCurrentTime";

interface FloatingStatusBarProps {
  temperature?: string;
}

const FloatingStatusBar: React.FC<FloatingStatusBarProps> = ({
  temperature = "30°C",
}) => {
  const currentTime = useCurrentTime();

  return (
    <View style={[styles.container, { pointerEvents: "none" }]}>
      <Text style={styles.info}>{temperature}</Text>
      <Text style={[styles.info, { marginLeft: 10 }]}>{currentTime}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 5,
    left: 20,
    right: 20,
    backgroundColor: "rgba(18,18,18,0.8)",
    borderRadius: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 5,
    zIndex: 100,
  },
  info: {
    color: "#fff",
    fontSize: 14,
  },
});

export default FloatingStatusBar;
