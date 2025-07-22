import React, { useState } from "react";
import { View, Text, StyleSheet, Platform } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

import { useResponsiveStyles } from "../hooks/useResponsiveStyles";
import { layoutStyles } from "../styles/layoutStyles";
import Orb from "../components/Orb";

// Slider fallback for web
const Slider =
  Platform.OS === "web"
    ? ({
        value,
        onValueChange,
        minimumValue = 0,
        maximumValue = 1,
        step = 0.01,
        style,
        ...rest
      }: any) => (
        <input
          max={maximumValue}
          min={minimumValue}
          step={step}
          style={StyleSheet.flatten(style)}
          type="range"
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
          {...rest}
        />
      )
    : require("@react-native-community/slider").default;

const AmbientLightScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();
  const [hue, setHue] = useState(180);
  const [intensity, setIntensity] = useState(0.5);

  return (
    <SafeAreaView style={layoutStyles.ambientContainer}>
      <View style={layoutStyles.ambientOrbContainer}>
        <Orb hoverIntensity={intensity} hue={hue} />
      </View>
      <View style={layoutStyles.ambientControlGroup}>
        <Text
          style={[
            layoutStyles.ambientLabel,
            { fontSize: responsiveScale.mediumFontSize },
          ]}
        >
          Hue
        </Text>
        <Slider
          maximumValue={360}
          minimumValue={0}
          step={1}
          style={layoutStyles.ambientSlider}
          value={hue}
          onValueChange={(v: number) => setHue(v)}
        />
      </View>
      <View style={layoutStyles.ambientControlGroup}>
        <Text
          style={[
            layoutStyles.ambientLabel,
            { fontSize: responsiveScale.mediumFontSize },
          ]}
        >
          Intensity
        </Text>
        <Slider
          maximumValue={1}
          minimumValue={0}
          step={0.01}
          style={layoutStyles.ambientSlider}
          value={intensity}
          onValueChange={(v: number) => setIntensity(v)}
        />
      </View>
    </SafeAreaView>
  );
};

export default AmbientLightScreen;
