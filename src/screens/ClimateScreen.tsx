import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import Slider from "@react-native-community/slider"; // Ensure this is installed or use a different slider
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import useClimateSettings from "../hooks/useClimateSettings";
import commonStyles from "../styles/commonStyles";
import ControlButton from "../components/ControlButton";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

const ClimateScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();

  const {
    acOn,
    toggleAc,
    fanSpeed,
    increaseFan,
    decreaseFan,
    setFanSpeed,
    autoOn,
    toggleAuto,
    frontDefrostOn,
    toggleFrontDefrost,
    rearDefrostOn,
    toggleRearDefrost,
    airFace,
    toggleAirFace,
    airMiddle,
    toggleAirMiddle,
    airFoot,
    toggleAirFoot,
  } = useClimateSettings();

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Main Climate Controls */}
      <View style={styles.controlsContainer}>
        {/* AC On/Off Toggle */}
        <ControlButton
          active={acOn}
          iconName="snowflake"
          label="空調"
          onPress={toggleAc}
        />

        {/* Fan Speed Control */}
        <View style={styles.fanControl}>
          <Text
            style={[
              styles.controlLabel,
              { fontSize: responsiveScale.mediumFontSize },
            ]}
          >
            風速控制
          </Text>

          <View style={styles.fanSliderContainer}>
            <TouchableOpacity onPress={decreaseFan}>
              <MaterialCommunityIcons
                color="#aaa"
                name="fan-off"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>

            <Slider
              maximumTrackTintColor="#333"
              maximumValue={10}
              minimumTrackTintColor="#3498db"
              minimumValue={0}
              step={1}
              style={styles.slider}
              thumbTintColor="#fff"
              value={fanSpeed}
              onValueChange={setFanSpeed}
            />

            <TouchableOpacity onPress={increaseFan}>
              <MaterialCommunityIcons
                color="#fff"
                name="fan"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>
          </View>

          <View style={styles.fanSpeedIndicator}>
            {[...Array(10)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.fanSpeedDot,
                  i < fanSpeed ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Climate Controls */}
        <View style={styles.climateControls}>
          <ControlButton
            active={autoOn}
            iconName="auto-fix"
            label="自動"
            onPress={toggleAuto}
          />
          <ControlButton
            active={frontDefrostOn}
            iconName="car-defrost-front"
            label="前除霜"
            onPress={toggleFrontDefrost}
          />
          <ControlButton
            active={rearDefrostOn}
            iconName="car-defrost-rear"
            label="後除霜"
            onPress={toggleRearDefrost}
          />
        </View>

        {/* Air Flow Direction */}
        <View style={styles.airFlowContainer}>
          <Text
            style={[
              styles.controlLabel,
              { fontSize: responsiveScale.mediumFontSize },
            ]}
          >
            出風方向
          </Text>

          <View style={styles.airFlowButtons}>
            <ControlButton
              active={airFace}
              iconName="emoticon-outline"
              label="面部"
              style={styles.airFlowButton}
              textStyle={commonStyles.controlText}
              onPress={toggleAirFace}
            />

            <ControlButton
              active={airMiddle}
              iconName="car-seat"
              label="中間"
              style={styles.airFlowButton}
              textStyle={commonStyles.controlText}
              onPress={toggleAirMiddle}
            />

            <ControlButton
              active={airFoot}
              iconName="shoe-print"
              label="腳部"
              style={styles.airFlowButton}
              textStyle={commonStyles.controlText}
              onPress={toggleAirFoot}
            />
          </View>
        </View>

        {/* Power Button */}
        {/* 已整合至底部溫度顯示區，這裡移除關閉空調按鈕 */}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tempDisplay: {
    alignItems: "center",
    marginBottom: 40,
  },
  tempText: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "300",
  },
  tempControls: {
    flexDirection: "row",
    marginTop: 20,
  },
  tempButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  fanControl: {
    marginBottom: 30,
  },
  fanSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  fanSpeedIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  fanSpeedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: "#3498db",
  },
  inactiveDot: {
    backgroundColor: "#333",
  },
  climateControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  airFlowContainer: {
    marginBottom: 30,
  },
  airFlowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  airFlowButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    width: "30%",
  },
});

export default ClimateScreen;
