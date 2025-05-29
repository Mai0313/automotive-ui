import React from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from "react-native";
import { MaterialIcons, MaterialCommunityIcons } from "@expo/vector-icons";
import { SafeAreaView as RNSafeAreaView } from "react-native-safe-area-context";

import MapView, { Marker, Polyline } from "../components/MapView"; // Corrected import path
import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";

const NavigationScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();

  // Mock navigation data
  const origin = { latitude: 25.033, longitude: 121.5654 }; // Taipei
  const destination = { latitude: 24.1477, longitude: 120.6736 }; // Taichung
  const route = [
    origin,
    { latitude: 24.8138, longitude: 120.9675 }, // Somewhere in between
    destination,
  ];

  // Mock navigation info
  const distance = "159 km";
  const eta = "1 hr 52 min";
  const arrivalTime = "12:13 PM";

  // Custom dark map style for Tesla-like UI
  const darkMapStyle = [
    {
      elementType: "geometry",
      stylers: [{ color: "#242f3e" }],
    },
    {
      elementType: "labels.text.fill",
      stylers: [{ color: "#746855" }],
    },
    {
      elementType: "labels.text.stroke",
      stylers: [{ color: "#242f3e" }],
    },
    {
      featureType: "road",
      elementType: "geometry",
      stylers: [{ color: "#38414e" }],
    },
    {
      featureType: "road",
      elementType: "geometry.stroke",
      stylers: [{ color: "#212a37" }],
    },
    {
      featureType: "water",
      elementType: "geometry",
      stylers: [{ color: "#17263c" }],
    },
  ];

  return (
    <RNSafeAreaView style={commonStyles.container}>
      {/* Main Navigation Map */}
      <MapView
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
        style={styles.map}
      >
        <Marker coordinate={origin} pinColor="#3498db" />
        <Marker coordinate={destination} pinColor="#e74c3c" />
        <Polyline coordinates={route} strokeColor="#3498db" strokeWidth={4} />
      </MapView>

      {/* Navigation Info Panel */}
      <View style={styles.navigationPanel}>
        <View style={styles.routeInfo}>
          <View style={styles.directionItem}>
            {" "}
            <MaterialIcons
              color="#3498db"
              name="directions"
              size={responsiveScale.mediumIconSize}
            />
            <View style={styles.directionText}>
              <Text
                style={[
                  styles.directionTitle,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                國道一號
              </Text>
              <Text
                style={[
                  styles.directionDistance,
                  { fontSize: responsiveScale.smallFontSize },
                ]}
              >
                1.5 km
              </Text>
            </View>
          </View>

          <View style={styles.directionItem}>
            <MaterialIcons
              color="#3498db"
              name="subdirectory-arrow-right"
              size={responsiveScale.mediumIconSize}
            />
            <View style={styles.directionText}>
              <Text
                style={[
                  styles.directionTitle,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                新竹交流道
              </Text>
              <Text
                style={[
                  styles.directionDistance,
                  { fontSize: responsiveScale.smallFontSize },
                ]}
              >
                45 km
              </Text>
            </View>
          </View>

          <View style={styles.directionItem}>
            <MaterialIcons
              color="#3498db"
              name="arrow-forward"
              size={responsiveScale.mediumIconSize}
            />
            <View style={styles.directionText}>
              <Text
                style={[
                  styles.directionTitle,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                台中交流道
              </Text>
              <Text
                style={[
                  styles.directionDistance,
                  { fontSize: responsiveScale.smallFontSize },
                ]}
              >
                110 km
              </Text>
            </View>
          </View>

          <View style={styles.directionItem}>
            <MaterialCommunityIcons
              color="#3498db"
              name="ev-station"
              size={responsiveScale.mediumIconSize}
            />{" "}
            <View style={styles.directionText}>
              <Text
                style={[
                  styles.directionTitle,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                頭份充電站
              </Text>
              <Text
                style={[
                  styles.directionDistance,
                  { fontSize: responsiveScale.smallFontSize },
                ]}
              >
                35 km
              </Text>
            </View>
            <Text
              style={[
                styles.chargerStatus,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              72%
            </Text>
          </View>
        </View>

        <View style={styles.etaInfo}>
          <Text
            style={[
              styles.etaText,
              { fontSize: responsiveScale.smallFontSize },
            ]}
          >
            {distance} • {eta} • {arrivalTime}
          </Text>
          <TouchableOpacity
            style={[
              styles.cancelButton,
              {
                padding: responsiveScale.smallPadding,
                borderRadius: responsiveScale.borderRadius,
              },
            ]}
          >
            <Text
              style={[
                styles.cancelText,
                { fontSize: responsiveScale.smallFontSize },
              ]}
            >
              取消導航
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Controls */}
      <View
        style={[
          styles.mapControls,
          {
            borderRadius: responsiveScale.borderRadius,
            padding: responsiveScale.smallPadding,
          },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.mapControl,
            {
              width: responsiveScale.buttonSize,
              height: responsiveScale.buttonSize,
            },
          ]}
        >
          <MaterialIcons
            color="#fff"
            name="add"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.mapControl,
            {
              width: responsiveScale.buttonSize,
              height: responsiveScale.buttonSize,
            },
          ]}
        >
          <MaterialIcons
            color="#fff"
            name="remove"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
      </View>
    </RNSafeAreaView>
  );
};

const styles = StyleSheet.create({
  map: {
    width: Dimensions.get("window").width,
    height: Dimensions.get("window").height * 0.7,
  },
  navigationPanel: {
    position: "absolute",
    top: 70,
    left: 10,
    backgroundColor: "rgba(0, 0, 0, 0.8)",
    borderRadius: 10,
    padding: 15,
    width: "40%",
  },
  routeInfo: {
    marginBottom: 15,
  },
  directionItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 15,
    backgroundColor: "rgba(30, 30, 30, 0.9)",
    padding: 10,
    borderRadius: 5,
  },
  directionText: {
    marginLeft: 10,
    flex: 1,
  },
  directionTitle: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  directionDistance: {
    color: "#aaa",
    fontSize: 14,
  },
  chargerStatus: {
    color: "#4CAF50",
    fontWeight: "bold",
  },
  etaInfo: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  etaText: {
    color: "#fff",
  },
  cancelButton: {
    backgroundColor: "#333",
    padding: 8,
    borderRadius: 5,
  },
  cancelText: {
    color: "#fff",
  },
  mapControls: {
    position: "absolute",
    right: 20,
    top: Dimensions.get("window").height * 0.3,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    borderRadius: 10,
    padding: 5,
  },
  mapControl: {
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
  },
});

export default NavigationScreen;
