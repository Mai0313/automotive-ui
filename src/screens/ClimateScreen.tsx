import React from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Platform,
  StyleSheet as RNStyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import useClimateSettings from "../hooks/useClimateSettings";
import commonStyles from "../styles/commonStyles";
import { layoutStyles } from "../styles/layoutStyles";
import ControlButton from "../components/ControlButton";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

// Slider fallback for web with proper HTML attributes
const Slider =
  Platform.OS === "web"
    ? ({
        value,
        onValueChange,
        minimumValue = 0,
        maximumValue = 5,
        step = 1,
        style,
        ..._omit
      }: any) => (
        <input
          max={maximumValue}
          min={minimumValue}
          step={step}
          style={RNStyleSheet.flatten(style)}
          type="range"
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
        />
      )
    : require("@react-native-community/slider").default;

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
      <View style={layoutStyles.climateControlsContainer}>
        {/* AC On/Off Toggle */}
        <ControlButton
          active={acOn}
          iconName="snowflake"
          label="空調"
          onPress={toggleAc}
        />

        {/* Fan Speed Control */}
        <View style={layoutStyles.climateFanControl}>
          <Text
            style={[
              layoutStyles.climateControlLabel,
              { fontSize: responsiveScale.mediumFontSize },
            ]}
          >
            風速控制
          </Text>

          <View style={layoutStyles.climateFanSliderContainer}>
            <TouchableOpacity onPress={decreaseFan}>
              <MaterialCommunityIcons
                color="#aaa"
                name="fan-off"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>

            <Slider
              maximumTrackTintColor="#333"
              maximumValue={5}
              minimumTrackTintColor="#3498db"
              minimumValue={0}
              step={1}
              style={layoutStyles.climateSlider}
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

          <View style={layoutStyles.climateFanSpeedIndicator}>
            {[...Array(5)].map((_, i) => (
              <View
                key={i}
                style={[
                  layoutStyles.climateFanSpeedDot,
                  i < fanSpeed ? layoutStyles.climateActiveDot : layoutStyles.climateInactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Climate Controls */}
        <View style={layoutStyles.climateClimateControls}>
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
        <View style={layoutStyles.climateAirFlowContainer}>
          <Text
            style={[
              layoutStyles.climateControlLabel,
              { fontSize: responsiveScale.mediumFontSize },
            ]}
          >
            出風方向
          </Text>

          <View style={layoutStyles.climateAirFlowButtons}>
            <ControlButton
              active={airFace}
              iconName="emoticon-outline"
              label="面部"
              style={layoutStyles.climateAirFlowButton}
              textStyle={commonStyles.controlText}
              onPress={toggleAirFace}
            />

            <ControlButton
              active={airMiddle}
              iconName="car-seat"
              label="中間"
              style={layoutStyles.climateAirFlowButton}
              textStyle={commonStyles.controlText}
              onPress={toggleAirMiddle}
            />

            <ControlButton
              active={airFoot}
              iconName="shoe-print"
              label="腳部"
              style={layoutStyles.climateAirFlowButton}
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

export default ClimateScreen;
