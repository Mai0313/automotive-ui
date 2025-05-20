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
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";

import commonStyles from "../styles/commonStyles";

const VehicleInfoScreen: React.FC = () => {
  // Mock vehicle data
  const speed = 0;
  const range = "315 mi";
  const gear: string = "P"; // Drive mode
  const batteryLevel = 70; // percentage

  const [pickedImage, setPickedImage] = useState<string | null>(null);

  // 新增：每個 quick control 的開關狀態
  const [lockOn, setLockOn] = useState(false);
  const [lightOn, setLightOn] = useState(false);
  const [batteryOn, setBatteryOn] = useState(false);
  const [tireOn, setTireOn] = useState(false);
  const [autoDriveOn, setAutoDriveOn] = useState(false);

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
        {/* 車輛俯視圖（新增，置於最上方） */}
        <View style={styles.topCarVisualWrap}>
          <Image
            source={{
              uri: "https://cdn.pixabay.com/photo/2013/07/12/13/58/car-148317_1280.png",
            }}
            style={styles.topCarImage}
            resizeMode="contain"
          />
        </View>
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
            <MaterialCommunityIcons
              color="#4CAF50"
              name={`battery-${batteryLevel}`}
              size={22}
            />
            <Text style={styles.rangeTextSmall}>{range}</Text>
          </View>
        </View>

        {/* Vehicle Visualization */}
        <View style={styles.vehicleVisual}>
          <Image
            source={{
              uri: "https://via.placeholder.com/800x400/111/fff?text=Car+Visual",
            }}
            style={styles.carImage}
          />

          <View style={styles.safetyFeatures}>
            <View style={styles.sensorLines}>
              <View style={[styles.sensorLine, styles.leftLine]} />
              <View style={[styles.sensorLine, styles.rightLine]} />
              <View style={[styles.sensorLine, styles.frontLine]} />
              <View style={[styles.sensorLine, styles.rearLine]} />
            </View>
          </View>
        </View>

        {/* Quick Controls */}
        <View style={styles.quickControls}>
          <TouchableOpacity
            style={[styles.controlButton, lockOn && styles.activeButton]}
            onPress={() => setLockOn((v) => !v)}
          >
            <MaterialCommunityIcons
              color={lockOn ? "#3498db" : "#fff"}
              name="car-door"
              size={30}
            />
            <Text
              style={[styles.controlText, lockOn && styles.activeText]}
            >
              門鎖
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, lightOn && styles.activeButton]}
            onPress={() => setLightOn((v) => !v)}
          >
            <MaterialCommunityIcons
              color={lightOn ? "#3498db" : "#fff"}
              name="car-light-high"
              size={30}
            />
            <Text
              style={[styles.controlText, lightOn && styles.activeText]}
            >
              車燈
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, batteryOn && styles.activeButton]}
            onPress={() => setBatteryOn((v) => !v)}
          >
            <MaterialCommunityIcons
              color={batteryOn ? "#3498db" : "#fff"}
              name="car-battery"
              size={30}
            />
            <Text
              style={[styles.controlText, batteryOn && styles.activeText]}
            >
              電量
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, tireOn && styles.activeButton]}
            onPress={() => setTireOn((v) => !v)}
          >
            <MaterialCommunityIcons
              color={tireOn ? "#3498db" : "#fff"}
              name="tire"
              size={30}
            />
            <Text
              style={[styles.controlText, tireOn && styles.activeText]}
            >
              胎壓
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.controlButton, autoDriveOn && styles.activeButton]}
            onPress={() => setAutoDriveOn((v) => !v)}
          >
            <MaterialCommunityIcons
              color={autoDriveOn ? "#3498db" : "#fff"}
              name="car-cruise-control"
              size={30}
            />
            <Text
              style={[styles.controlText, autoDriveOn && styles.activeText]}
            >
              自動駕駛
            </Text>
          </TouchableOpacity>
        </View>

        {/* Image Picker Button (Mobile Only) */}
        {Platform.OS !== "web" && (
          <TouchableOpacity
            style={{
              margin: 20,
              backgroundColor: "#3498db",
              padding: 10,
              borderRadius: 8,
            }}
            onPress={pickImage}
          >
            <Text style={{ color: "#fff" }}>選取圖片 (expo-image-picker)</Text>
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
  safetyFeatures: {
    position: "absolute",
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  sensorLines: {
    position: "relative",
    width: "80%",
    height: "80%",
  },
  sensorLine: {
    position: "absolute",
    backgroundColor: "#3498db",
    opacity: 0.3,
  },
  leftLine: {
    width: 2,
    height: "60%",
    left: 0,
    top: "20%",
  },
  rightLine: {
    width: 2,
    height: "60%",
    right: 0,
    top: "20%",
  },
  frontLine: {
    width: "100%",
    height: 2,
    top: 0,
  },
  rearLine: {
    width: "100%",
    height: 2,
    bottom: 0,
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
});

export default VehicleInfoScreen;
