// TODO: 若需圖片選取請用 expo-image-picker，若需相機請用 expo-camera
// import * as ImagePicker from "expo-image-picker";
// import { Camera } from "expo-camera";
// 參考：https://docs.expo.dev/versions/latest/sdk/image-picker/  https://docs.expo.dev/versions/latest/sdk/camera/

import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialCommunityIcons as Icon } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

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
      <View style={styles.content}>
        {/* Main Speed Display */}
        <View style={styles.speedContainer}>
          <Text style={styles.speedText}>{speed}</Text>
          <Text style={styles.unitText}>MPH</Text>

          <View style={styles.gearIndicator}>
            <Text
              style={[styles.gearText, gear === "P" ? styles.activeGear : null]}
            >
              P
            </Text>
            <Text
              style={[styles.gearText, gear === "R" ? styles.activeGear : null]}
            >
              R
            </Text>
            <Text
              style={[styles.gearText, gear === "N" ? styles.activeGear : null]}
            >
              N
            </Text>
            <Text
              style={[styles.gearText, gear === "D" ? styles.activeGear : null]}
            >
              D
            </Text>
          </View>
        </View>

        {/* Range & Battery Info */}
        <View style={styles.rangeContainer}>
          <View style={styles.batteryInfoSmall}>
            <Icon
              color="#4CAF50"
              name={`battery-${batteryLevel}`}
              size={responsiveScale.mediumIconSize}
            />
            <Text
              style={[
                styles.rangeTextSmall,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              {range}
            </Text>
          </View>
        </View>

        {/* Quick Controls */}
        <View style={styles.quickControls}>
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              lockOn && commonStyles.activeButton,
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
                commonStyles.controlText,
                lockOn && commonStyles.activeText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              門鎖
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              lightOn && commonStyles.activeButton,
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
                commonStyles.controlText,
                lightOn && commonStyles.activeText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              車燈
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              autoDriveOn && commonStyles.activeButton,
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
                commonStyles.controlText,
                autoDriveOn && commonStyles.activeText,
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
        <View style={styles.warningBar}>
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
              style={styles.warningIcon}
            />
          ))}
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  speedContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  speedText: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "200", // Tesla uses a very thin font for speed
  },
  unitText: {
    color: "#aaa",
    fontSize: 24,
    marginTop: -20,
  },
  gearIndicator: {
    flexDirection: "row",
    marginTop: 10,
  },
  gearText: {
    color: "#555",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  activeGear: {
    color: "#fff",
  },
  rangeContainer: {
    marginBottom: 20,
  },
  batteryInfoSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  rangeTextSmall: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 8,
    marginRight: 6,
  },
  batteryPercent: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 2,
  },
  vehicleVisual: {
    alignItems: "center",
    marginVertical: 20,
  },
  carImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
  },
  quickControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  controlButton: {
    alignItems: "center",
    padding: 10,
  },
  activeButton: {
    backgroundColor: "rgba(52, 152, 219, 0.15)",
  },
  controlText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },
  activeText: {
    color: "#3498db",
    fontWeight: "bold",
  },
  assistancePanel: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  assistanceButton: {
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    padding: 15,
    borderRadius: 10,
    width: "45%",
  },
  assistanceText: {
    color: "#3498db",
    marginTop: 5,
    fontSize: 16,
  },
  topCarVisualWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  topCarImage: {
    width: 180,
    height: 90,
    opacity: 0.95,
  },
  warningBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // backgroundColor: "#111",
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  warningIcon: {
    marginHorizontal: 5,
  },
});

export default VehicleInfoScreen;
