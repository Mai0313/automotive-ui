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
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import MapView from "../components/MapView"; // Import MapView
import useCurrentLocation from "../hooks/useCurrentLocation";

import VehicleInfoScreen from "./VehicleInfoScreen";
import MusicScreen from "./MusicScreen";
import ClimateScreen from "./ClimateScreen";
import AIAssistantScreen from "./AIAssistantScreen";
// import NavigationScreen from "./NavigationScreen";

const HomeScreen: React.FC = () => {
  const [activeOverlay, setActiveOverlay] = useState<
    "vehicle" | "music" | "climate" | "ai" | null
  >(null);
  const [fullScreenOverlay, setFullScreenOverlay] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const screenW = Dimensions.get("window").width;
  const baseOverlayWidth = screenW * 0.45;
  // overlay width state for resizing
  const [overlayWidthState, setOverlayWidthState] = useState(baseOverlayWidth);
  const overlayWidth = fullScreenOverlay ? screenW : overlayWidthState;

  // 新增：溫度狀態與調整
  const [temperature, setTemperature] = useState(22);
  const increaseTemp = () => setTemperature((prev) => Math.min(prev + 0.5, 28));
  const decreaseTemp = () => setTemperature((prev) => Math.max(prev - 0.5, 16));

  // 新增：AC 開關狀態
  const [isAC, setIsAC] = useState(true);
  const toggleAC = () => setIsAC((prev) => !prev);

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

  // 地圖預設中心座標
  const { location: mapPreviewLocation, errorMsg } = useCurrentLocation();

  console.log("mapPreviewLocation", mapPreviewLocation);
  if (errorMsg) {
    console.error("Error getting location:", errorMsg);
  }

  // show white loading spinner until location fetched
  if (!mapPreviewLocation) {
    return (
      <View
        style={{
          flex: 1,
          backgroundColor: "#fff",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <ActivityIndicator size="large" />
      </View>
    );
  }

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
          {/* {activeOverlay === null && <NavigationScreen />} */}
        </View>
      </Animated.View>

      {/* Bottom control bar fixed at bottom */}
      <View style={styles.bottomBar}>
        {/* 車輛 icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => {
            if (activeOverlay === "vehicle") {
              setActiveOverlay(null);
            } else {
              setActiveOverlay("vehicle");
              setFullScreenOverlay(false);
            }
          }}
        >
          <MaterialCommunityIcons color="#fff" name="car" size={30} />
        </TouchableOpacity>
        {/* AC icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => {
            if (activeOverlay === "climate") {
              setActiveOverlay(null);
            } else {
              setActiveOverlay("climate");
              setFullScreenOverlay(false);
            }
          }}
        >
          <MaterialCommunityIcons color="#fff" name="air-conditioner" size={30} />
        </TouchableOpacity>
        {/* 溫度調整區（顯示溫度本身為 AC 開關按鈕，關閉時顯示紅色圓圈+icon） */}
        <View style={styles.tempBarWrap}>
          <TouchableOpacity style={styles.bottomBarBtn} onPress={decreaseTemp}>
            <MaterialCommunityIcons color="#fff" name="chevron-down" size={28} />
          </TouchableOpacity>
          <TouchableOpacity style={[styles.tempTextWrap, !isAC && styles.tempOff]} onPress={toggleAC}>
            {isAC ? (
              <Animated.Text style={styles.tempText}>{temperature}°C</Animated.Text>
            ) : (
              <View style={styles.tempOffContent}>
                <MaterialCommunityIcons name="power" color="#e74c3c" size={18} style={{ marginRight: 4 }} />
                <Animated.Text style={styles.tempTextOff}>{temperature}°C</Animated.Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.bottomBarBtn} onPress={increaseTemp}>
            <MaterialCommunityIcons color="#fff" name="chevron-up" size={28} />
          </TouchableOpacity>
        </View>
        {/* 音樂 icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => {
            if (activeOverlay === "music") {
              setActiveOverlay(null);
            } else {
              setActiveOverlay("music");
              setFullScreenOverlay(false);
            }
          }}
        >
          <MaterialIcons color="#fff" name="music-note" size={30} />
        </TouchableOpacity>
        {/* AI icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => {
            if (activeOverlay === "ai") {
              setActiveOverlay(null);
            } else {
              setActiveOverlay("ai");
              setFullScreenOverlay(false);
            }
          }}
        >
          <MaterialIcons color="#fff" name="mic" size={30} />
        </TouchableOpacity>
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
  // bottomBar 內新增溫度調整區樣式
  bottomBarBtn: {
    backgroundColor: "#222",
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 6,
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  tempBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 20,
    marginHorizontal: 4,
    paddingHorizontal: 0,
    paddingVertical: 0,
  },
  tempTextWrap: {
    minWidth: 48,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 16,
    backgroundColor: "#333",
    minHeight: 36,
  },
  tempOff: {
    backgroundColor: "#2a0000",
    borderColor: "#e74c3c",
    borderWidth: 2,
  },
  tempOffContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  tempText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  tempTextOff: {
    color: "#e74c3c",
    fontSize: 22,
    fontWeight: "bold",
  },
});

export default HomeScreen;
