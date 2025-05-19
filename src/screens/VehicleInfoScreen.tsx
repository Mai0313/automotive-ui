import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import useCurrentTime from "../hooks/useCurrentTime";
import commonStyles from "../styles/commonStyles";

const VehicleInfoScreen: React.FC = () => {
  const currentTime = useCurrentTime(); // Use the hook
  const temperature = "30°C";

  // Mock vehicle data
  const speed = 0;
  const range = "315 mi";
  const gear: string = "P"; // Drive mode
  const batteryLevel = 70; // percentage

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
          <View style={styles.batteryInfo}>
            <MaterialCommunityIcons
              color="#4CAF50"
              name={`battery-${batteryLevel}`}
              size={30}
            />
            <Text style={styles.rangeText}>{range}</Text>
          </View>
          <View style={styles.batteryBar}>
            <View
              style={[styles.batteryLevel, { width: `${batteryLevel}%` }]}
            />
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
          <TouchableOpacity style={styles.controlButton}>
            <MaterialCommunityIcons color="#fff" name="car-door" size={30} />
            <Text style={styles.controlText}>門鎖</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MaterialCommunityIcons
              color="#fff"
              name="car-light-high"
              size={30}
            />
            <Text style={styles.controlText}>車燈</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MaterialCommunityIcons color="#fff" name="car-battery" size={30} />
            <Text style={styles.controlText}>電量</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.controlButton}>
            <MaterialCommunityIcons color="#fff" name="tire" size={30} />
            <Text style={styles.controlText}>胎壓</Text>
          </TouchableOpacity>
        </View>

        {/* Driver Assistance */}
        <View style={styles.assistancePanel}>
          <TouchableOpacity style={styles.assistanceButton}>
            <MaterialCommunityIcons
              color="#3498db"
              name="speedometer"
              size={30}
            />
            <Text style={styles.assistanceText}>巡航控制</Text>
          </TouchableOpacity>

          <TouchableOpacity style={styles.assistanceButton}>
            <MaterialCommunityIcons
              color="#3498db"
              name="car-cruise-control"
              size={30}
            />
            <Text style={styles.assistanceText}>自動駕駛</Text>
          </TouchableOpacity>
        </View>
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
  batteryInfo: {
    flexDirection: "row",
    alignItems: "center",
  },
  rangeText: {
    color: "#fff",
    fontSize: 18,
    marginLeft: 10,
  },
  batteryBar: {
    height: 6,
    backgroundColor: "#333",
    borderRadius: 3,
    marginTop: 10,
    overflow: "hidden",
  },
  batteryLevel: {
    height: "100%",
    backgroundColor: "#4CAF50",
    borderRadius: 3,
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
  controlText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
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
});

export default VehicleInfoScreen;
