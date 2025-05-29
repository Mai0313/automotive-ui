import React from "react";
import { View, Text, StyleSheet } from "react-native";

import useCurrentTime from "../hooks/useCurrentTime";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

interface FloatingStatusBarProps {
  temperature?: string;
}

const FloatingStatusBar: React.FC<FloatingStatusBarProps> = ({
  temperature = "30°C",
}) => {
  const currentTime = useCurrentTime();
  const responsiveScale = useResponsiveStyles();

  return (
    <View
      style={[
        styles.container,
        {
          pointerEvents: "none",
          borderRadius: responsiveScale.borderRadius,
          paddingHorizontal: responsiveScale.smallPadding,
          paddingVertical: responsiveScale.smallPadding / 2,
        },
      ]}
    >
      <Text style={[styles.info, { fontSize: responsiveScale.smallFontSize }]}>
        {temperature}
      </Text>
      <Text
        style={[
          styles.info,
          {
            marginLeft: responsiveScale.smallPadding,
            fontSize: responsiveScale.smallFontSize,
          },
        ]}
      >
        {currentTime}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    top: 5,
    left: 20,
    right: 20,
    backgroundColor: "rgba(18,18,18,1)",
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
