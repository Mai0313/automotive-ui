import React, { useState, useRef, useEffect } from "react";
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
  PanResponder,
  Platform,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";
import { useNavigation } from "@react-navigation/native";

import MapView from "../components/MapView"; // Import MapView
import useCurrentTime from "../hooks/useCurrentTime"; // Import the hook

import VehicleInfoScreen from "./VehicleInfoScreen";
import MusicScreen from "./MusicScreen";
import ClimateScreen from "./ClimateScreen";
import AIAssistantScreen from "./AIAssistantScreen";

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentTime = useCurrentTime(); // Use the hook
  const temperature = "30°C";
  const mapPreviewLocation = {
    latitude: 25.0339639,
    longitude: 121.5644722,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // overlay state and animation
  const [activeOverlay, setActiveOverlay] = useState<
    "vehicle" | "music" | "climate" | "ai" | null
  >(null);
  const [fullScreenOverlay, setFullScreenOverlay] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const screenH = Dimensions.get("window").height;
  const screenW = Dimensions.get("window").width;
  const baseOverlayWidth = screenW * 0.45;
  // overlay width state for resizing
  const [overlayWidthState, setOverlayWidthState] = useState(baseOverlayWidth);
  const overlayWidth = fullScreenOverlay ? screenW : overlayWidthState;

  useEffect(() => {
    Animated.timing(anim, {
      toValue: activeOverlay ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== "web", // web 平台設為 false，避免警告
    }).start();
  }, [activeOverlay, fullScreenOverlay]);
  // panel slides in/out horizontally from left
  const translateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [-overlayWidth, 0],
  });
  // map shifts right to share space
  const mapTranslateX = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, overlayWidth],
  });
  const mapWidth = anim.interpolate({
    inputRange: [0, 1],
    outputRange: [screenW, screenW - overlayWidth],
  });

  // add PanResponder for horizontal resize
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !fullScreenOverlay,
      onPanResponderMove: (_, gesture) => {
        // clamp between 20% and 80%
        const minW = screenW * 0.2;
        const maxW = screenW * 0.8;
        const newW = Math.min(Math.max(gesture.moveX, minW), maxW);

        setOverlayWidthState(newW);
      },
      onPanResponderTerminationRequest: () => false,
    }),
  ).current;

  return (
    <View style={{ flex: 1 }}>
      {/* Map 絕對鋪滿全畫面 */}
      <Animated.View style={[styles.mapContainer]}>
        <Pressable style={{ flex: 1 }} onPress={() => setActiveOverlay(null)}>
          <MapView initialRegion={mapPreviewLocation} style={{ flex: 1 }} />
        </Pressable>
      </Animated.View>

      {/* Drag handle between map and overlay for resizing */}
      {!fullScreenOverlay && activeOverlay && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.dragHandle, { left: overlayWidth - 10 }]}
        />
      )}

      {/* Animated overlay panel */}
      <Animated.View
        style={[
          styles.overlayCard,
          {
            width: overlayWidth,
            opacity: anim,
            left: 0,
            transform: [{ translateX }],
          },
        ]}
      >
        <View
          style={{ flex: 1, pointerEvents: activeOverlay ? "auto" : "none" }}
        >
          {/* Header with close and expand */}
          <View style={styles.overlayHeader}>
            <TouchableOpacity onPress={() => setActiveOverlay(null)}>
              <MaterialIcons color="#fff" name="close" size={24} />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFullScreenOverlay(!fullScreenOverlay)}
            >
              <MaterialIcons
                color="#fff"
                name={fullScreenOverlay ? "fullscreen-exit" : "fullscreen"}
                size={24}
              />
            </TouchableOpacity>
          </View>
          {/* Render corresponding screen inside overlay */}
          {activeOverlay === "vehicle" && <VehicleInfoScreen />}
          {activeOverlay === "music" && <MusicScreen />}
          {activeOverlay === "climate" && <ClimateScreen />}
          {activeOverlay === "ai" && <AIAssistantScreen />}
        </View>
      </Animated.View>

      {/* Bottom control bar fixed at bottom */}
      <View style={styles.bottomBar}>
        {/* Shared control buttons */}
        {[
          {
            key: "vehicle",
            icon: <MaterialCommunityIcons color="#fff" name="car" size={30} />,
          },
          {
            key: "climate",
            icon: (
              <MaterialCommunityIcons
                color="#fff"
                name="air-conditioner"
                size={30}
              />
            ),
          },
          {
            key: "music",
            icon: <MaterialIcons color="#fff" name="music-note" size={30} />,
          },
          {
            key: "ai",
            icon: <MaterialIcons color="#fff" name="mic" size={30} />,
          },
        ].map((btn) => (
          <TouchableOpacity
            key={btn.key}
            onPress={() => {
              if (activeOverlay === btn.key) {
                setActiveOverlay(null);
              } else {
                setActiveOverlay(btn.key as any);
                // initial overlay always in portrait mode
                setFullScreenOverlay(false);
              }
            }}
          >
            {btn.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: undefined,
    height: undefined,
    backgroundColor: "transparent",
  },
  overlayCard: {
    position: "absolute",
    // float between status bar and bottom buttons
    top: 80, // 原本 60，往下縮小
    bottom: 120, // 原本 100，往上縮小
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)", // web only, RN web 支援
    overflow: "hidden",
  },
  overlayHeader: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  bottomBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#121212",
    padding: 10,
    borderRadius: 30,
  },
  dragHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "transparent",
    zIndex: 5,
  },
});

export default HomeScreen;
