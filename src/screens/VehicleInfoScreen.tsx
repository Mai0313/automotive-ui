// TODO: 若需圖片選取請用 expo-image-picker，若需相機請用 expo-camera
// import * as ImagePicker from "expo-image-picker";
// import { Camera } from "expo-camera";
// 參考：https://docs.expo.dev/versions/latest/sdk/image-picker/  https://docs.expo.dev/versions/latest/sdk/camera/

import React, { useState } from "react";
import { View, Text, Image, TouchableOpacity, Platform } from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";
import { layoutStyles } from "../styles/layoutStyles";

// mapping from warning keys to icon names
export const warningIconMap: Record<string, string> = {
  engine_warning: "engine",
  oil_pressure_warning: "oil-temperature",
  battery_warning: "car-battery",
  coolant_temp_warning: "thermometer",
  brake_warning: "car-brake-alert",
  abs_warning: "car-brake-abs",
  tpms_warning: "car-tire-alert",
  airbag_warning: "airbag",
  low_fuel_warning: "fuel",
  door_ajar_warning: "door-open",
  seat_belt_warning: "seatbelt",
  exterior_light_failure_warning: "lightbulb-outline",
};

interface Props {
  vehicleWarnings: Record<string, boolean>;
}

const VehicleInfoScreen: React.FC<Props> = ({ vehicleWarnings }) => {
  const responsiveScale = useResponsiveStyles();

  // Mock vehicle data
  const speed = 0;
  const range = "315 mi";
  const gear: string = "P"; // Drive mode
  const batteryLevel = 70; // percentage

  const [pickedImage, setPickedImage] = useState<string | null>(null);

  // 新增：每個 quick control 的開關狀態
  const [lockOn, setLockOn] = useState<boolean>(false);
  const [lightOn, setLightOn] = useState<boolean>(false);
  const [autoDriveOn, setAutoDriveOn] = useState<boolean>(false);

  // Filter active warnings
  const activeWarnings = Object.entries(vehicleWarnings).filter(([, v]) => v);

  // 圖片選取功能（僅行動裝置）
  const pickImage = async () => {
    if (Platform.OS === "web") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [4, 3],
      quality: 1,
    });

    if (!result.canceled && result.assets && result.assets.length > 0) {
      setPickedImage(result.assets[0].uri);
    }
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Main Content */}
      <View style={layoutStyles.vehicleContent}>
        {/* Main Speed Display */}
        <View style={layoutStyles.vehicleSpeedContainer}>
          <Text style={layoutStyles.vehicleSpeedText}>{speed}</Text>
          <Text style={layoutStyles.vehicleUnitText}>MPH</Text>

          <View style={layoutStyles.vehicleGearIndicator}>
            <Text
              style={[
                layoutStyles.vehicleGearText,
                gear === "P" ? layoutStyles.vehicleActiveGear : null,
              ]}
            >
              P
            </Text>
            <Text
              style={[
                layoutStyles.vehicleGearText,
                gear === "R" ? layoutStyles.vehicleActiveGear : null,
              ]}
            >
              R
            </Text>
            <Text
              style={[
                layoutStyles.vehicleGearText,
                gear === "N" ? layoutStyles.vehicleActiveGear : null,
              ]}
            >
              N
            </Text>
            <Text
              style={[
                layoutStyles.vehicleGearText,
                gear === "D" ? layoutStyles.vehicleActiveGear : null,
              ]}
            >
              D
            </Text>
          </View>
        </View>

        {/* Range & Battery Info */}
        <View style={layoutStyles.vehicleRangeContainer}>
          <View style={layoutStyles.vehicleBatteryInfoSmall}>
            <Icon
              color="#4CAF50"
              name={`battery-${batteryLevel}`}
              size={responsiveScale.mediumIconSize}
            />
            <Text
              style={[
                layoutStyles.vehicleRangeTextSmall,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              {range}
            </Text>
          </View>
        </View>

        {/* Quick Controls */}
        <View style={layoutStyles.vehicleQuickControls}>
          <TouchableOpacity
            style={[
              layoutStyles.vehicleControlButton,
              lockOn && layoutStyles.vehicleActiveButton,
            ]}
            onPress={() => setLockOn((v) => !v)}
          >
            <Icon
              color={lockOn ? "#3498db" : "#fff"}
              name="car-door"
              size={responsiveScale.largeIconSize}
            />
            <Text
              style={[
                layoutStyles.vehicleControlText,
                lockOn && layoutStyles.vehicleActiveText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              門鎖
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              layoutStyles.vehicleControlButton,
              lightOn && layoutStyles.vehicleActiveButton,
            ]}
            onPress={() => setLightOn((v) => !v)}
          >
            <Icon
              color={lightOn ? "#3498db" : "#fff"}
              name="car-light-high"
              size={responsiveScale.largeIconSize}
            />
            <Text
              style={[
                layoutStyles.vehicleControlText,
                lightOn && layoutStyles.vehicleActiveText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              車燈
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              layoutStyles.vehicleControlButton,
              autoDriveOn && layoutStyles.vehicleActiveButton,
            ]}
            onPress={() => setAutoDriveOn((v) => !v)}
          >
            <Icon
              color={autoDriveOn ? "#3498db" : "#fff"}
              name="car-cruise-control"
              size={responsiveScale.largeIconSize}
            />
            <Text
              style={[
                layoutStyles.vehicleControlText,
                autoDriveOn && layoutStyles.vehicleActiveText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              自動駕駛
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Picker Button (Mobile Only) */}
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={{
              margin: responsiveScale.mediumMargin,
              backgroundColor: "#3498db",
              padding: responsiveScale.mediumPadding,
              borderRadius: responsiveScale.borderRadius,
            }}
            onPress={pickImage}
          >
            <Text
              style={{ color: "#fff", fontSize: responsiveScale.smallFontSize }}
            >
              選取圖片 (expo-image-picker)
            </Text>
          </TouchableOpacity>
        )}

        {/* Display Picked Image */}
        {pickedImage && (
          <Image
            source={{ uri: pickedImage }}
            style={{
              width: 200,
              height: 150,
              alignSelf: "center",
              margin: 10,
              borderRadius: 8,
            }}
          />
        )}
      </View>
      {/* 警示燈顯示 */}
      {activeWarnings.length > 0 && (
        <View style={layoutStyles.vehicleWarningBar}>
          {activeWarnings.map(([key]) => (
            <Icon
              key={key}
              color="#e74c3c"
              name={
                (warningIconMap[key] ||
                  "alert-circle-outline") as React.ComponentProps<
                  typeof Icon
                >["name"]
              }
              size={responsiveScale.largeIconSize}
              style={layoutStyles.vehicleWarningIcon}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

export default VehicleInfoScreen;
