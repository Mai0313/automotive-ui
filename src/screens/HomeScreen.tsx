import React, { useRef, useEffect, useState } from "react";
import { Platform } from "react-native"; // ensure Platform is imported
import {
  View,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Pressable,
  Dimensions,
  PanResponder,
  ActivityIndicator,
} from "react-native";
import { MaterialCommunityIcons, MaterialIcons } from "@expo/vector-icons";

import MapView from "../components/MapView"; // Import MapView
import DemoButtons from "../components/DemoButtons";
import useCurrentLocation from "../hooks/useCurrentLocation";
import useHomeClimateSettings from "../hooks/useHomeClimateSettings";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";
import { useRealtimeVoice } from "../hooks/useRealtimeVoice";
import { useRealtimeTTS } from "../hooks/useRealtimeTTS";
import {
  getWebSocketUrl,
  getHttpServerUrl,
  isOpenAIConfigured,
} from "../utils/env";

import { warningIconMap } from "./VehicleInfoScreen";
import VehicleInfoScreen from "./VehicleInfoScreen";
import MusicScreen from "./MusicScreen";
import ClimateScreen from "./ClimateScreen";
import AIAssistantScreen from "./AIAssistantScreen";

const HomeScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();

  // Realtime voice功能 - 在web上自動開始
  const realtimeVoice = useRealtimeVoice({
    autoStart: Platform.OS === "web", // 僅在web上自動開始
  });

  // Realtime TTS 功能
  const realtimeTTS = useRealtimeTTS({
    onStatusChange: (status) => {
      console.log("🔊 [RealtimeTTS] Status changed:", status);
    },
    onError: (error) => {
      console.error("🚫 [RealtimeTTS] Error:", error);
    },
    onSpeakingComplete: () => {
      console.log("✅ [RealtimeTTS] Speaking completed");
      setIsSpeaking(false);
    },
  });

  const [activeOverlay, setActiveOverlay] = React.useState<
    "vehicle" | "music" | "climate" | "ai" | null
  >(null);
  const [fullScreenOverlay, setFullScreenOverlay] =
    React.useState<boolean>(false);
  const anim = useRef(new Animated.Value(0)).current;
  const screenW = Dimensions.get("window").width;
  const baseOverlayWidth = screenW * 0.45;
  // overlay width state for resizing
  const [overlayWidthState, setOverlayWidthState] =
    React.useState<number>(baseOverlayWidth);
  const overlayWidth = fullScreenOverlay ? screenW : overlayWidthState;

  // 使用自定義 hook 同步溫度與空調狀態
  const { temperature, isAC, increaseTemp, decreaseTemp, toggleAC } =
    useHomeClimateSettings();

  // 车辆警示灯状态
  const [vehicleWarnings, setVehicleWarnings] = React.useState<
    Record<string, boolean>
  >({
    engine_warning: false,
    oil_pressure_warning: false,
    battery_warning: false,
    coolant_temp_warning: false,
    brake_warning: false,
    abs_warning: false,
    tpms_warning: false,
    airbag_warning: false,
    low_fuel_warning: false,
    door_ajar_warning: false,
    seat_belt_warning: false,
    exterior_light_failure_warning: false,
  });

  // 已播報過的異常
  const [spokenWarnings, setSpokenWarnings] = useState<Record<string, boolean>>(
    {},
  );

  // 正在播報語音
  const [isSpeaking, setIsSpeaking] = useState(false);

  // WebSocket ref
  const wsRef = useRef<WebSocket | null>(null);

  // 初始化 Realtime TTS 連接
  useEffect(() => {
    // 自動連接到 TTS 服務器
    realtimeTTS.connect();

    return () => {
      // 組件卸載時斷開連接
      realtimeTTS.disconnect();
    };
  }, []);

  // Setup WS to sync temperature and AC
  // 異常燈號語音播報
  useEffect(() => {
    // 若正在播報則不重複
    if (isSpeaking) return;

    // 找出尚未播報且目前為 true 的異常
    const newWarnings = Object.keys(vehicleWarnings).filter(
      (key) => vehicleWarnings[key] && !spokenWarnings[key],
    );

    if (newWarnings.length === 0) return;

    // 檢查 OpenAI 配置
    // if (!isOpenAIConfigured()) {
    //   console.warn("🚫 [車輛異常播報] OpenAI 未配置，跳過語音播報功能");
    //   // 標記為已播報，避免重複檢查
    //   const warningKey = newWarnings[0];

    //   setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));

    //   return;
    // }

    // 只播報第一個新異常
    const warningKey = newWarnings[0];

    setIsSpeaking(true);

    (async () => {
      try {
        // 檢查 OpenAI 配置
        if (!isOpenAIConfigured()) {
          console.warn("🚫 [車輛異常播報] OpenAI 未配置，跳過語音播報功能");
          // 標記為已播報，避免重複檢查
          setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));
          setIsSpeaking(false);

          return;
        }

        // 將異常 key 轉為中文描述
        const warningNameMap: Record<string, string> = {
          tpms_warning: "Tire Pressure Abnormal",
          engine_warning: "Engine Warning Light On",
          oil_pressure_warning: "Oil Pressure Abnormal",
          battery_warning: "Battery Voltage Abnormal",
          coolant_temp_warning: "Coolant Temperature Too High",
          brake_warning: "Brake System Abnormal",
          abs_warning: "ABS (Anti-lock Braking System) Abnormal",
          airbag_warning: "Airbag System Abnormal",
          low_fuel_warning: "Low Fuel Level",
          door_ajar_warning: "Door Not Closed Properly",
          seat_belt_warning: "Seat Belt Not Fastened",
          exterior_light_failure_warning: "Exterior Light Failure",
        };
        const userPrompt = warningNameMap[warningKey] || warningKey;

        console.log(
          `🔊 [車輛異常播報] 檢測到異常：${userPrompt}, using Realtime TTS`,
        );

        // 組 prompt
        const assistantPrompt =
          "You are a vehicle assistant. Please provide specific suggestions for vehicle anomalies in a friendly and practical manner. Limit your reply to within 50 words.";

        // 使用 Realtime TTS 進行流式對話 + TTS
        await realtimeTTS.processConversation(
          [
            { role: "assistant", content: assistantPrompt },
            {
              role: "user",
              content: `
                Vehicle anomaly detected: "${userPrompt}"
                Current location: ${
                  mapPreviewLocation
                    ? `Longitude ${mapPreviewLocation.longitude}, Latitude ${mapPreviewLocation.latitude}`
                    : "Unknown"
                }
                Please interact with the user to confirm if they need assistance and provide a brief suggestion.
                For example: "An XX anomaly has been detected. Would you like me to help you find the nearest XXX to resolve the issue?"
              `,
            },
          ],
          {
            onDelta: (delta: string) => {
              console.log("🔊 [車輛異常播報] Received delta:", delta);
            },
          },
        );

        setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));
      } catch (err) {
        console.error("🚫 [車輛異常播報] 播報失敗", err);
        console.log("🔄 [車輛異常播報] 使用 demo.wav 作為 fallback");
        
        // 使用 demo.wav 作為 fallback
        try {
          if (Platform.OS === "web") {
            // Web 平台：直接播放 demo.wav
            const audio = new window.Audio("/demo.wav");
            audio.play().catch(console.error);
            
            audio.onended = () => {
              setIsSpeaking(false);
            };
          } else {
            // 原生平台：使用 realtimeTTS 的 playDemoFallback 方法
            realtimeTTS.playDemoFallback();
            setIsSpeaking(false);
          }
        } catch (fallbackErr) {
          console.error("🚫 [車輛異常播報] Demo fallback 也失敗", fallbackErr);
          setIsSpeaking(false);
        }
        
        // 即使失敗也標記為已播報，避免持續重試
        setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));
      }
    })();
  }, [vehicleWarnings]);

  useEffect(() => {
    const wsUrl = getWebSocketUrl();

    console.log("[Home WS] connecting to", wsUrl);
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;
    ws.onopen = () => {
      console.log("[Home WS] connected");
      ws.send(JSON.stringify({ action: "get_state" }));
    };
    ws.onmessage = (event) => {
      // 處理車輛警示燈狀態
      try {
        const data = JSON.parse(event.data);
        const warningKeys = Object.keys(vehicleWarnings);

        warningKeys.forEach((key) => {
          if (key in data && typeof data[key] === "boolean") {
            setVehicleWarnings((prev) => ({ ...prev, [key]: data[key] }));
          }
        });
      } catch (err) {
        console.error("[Home WS] parse error", err);
      }
    };
    ws.onerror = (err) => {
      console.error("[Home WS] error", err);
      // Fetch fallback
      fetch(`${getHttpServerUrl()}/state`)
        .then((res) => res.json())
        .then((data) => {
          // 處理車輛警示燈狀態 fallback
          const warningKeys = Object.keys(vehicleWarnings);

          warningKeys.forEach((key) => {
            if (key in data && typeof data[key] === "boolean") {
              setVehicleWarnings((prev) => ({ ...prev, [key]: data[key] }));
            }
          });
        })
        .catch((fetchErr) => console.error("[Home HTTP] error", fetchErr));
    };
    ws.onclose = () => console.log("[Home WS] closed");

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  useEffect(() => {
    Animated.timing(anim, {
      toValue: activeOverlay ? 1 : 0,
      duration: 300,
      useNativeDriver: Platform.OS !== "web", // web 平台設為 false，避免警告
    }).start();
  }, [activeOverlay, fullScreenOverlay]);
  // 不再需要手動 WS，已在 hook 中處理

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

  // Helper to toggle overlay selection
  const handleOverlayPress = (type: "vehicle" | "music" | "climate" | "ai") => {
    if (activeOverlay === type) {
      setActiveOverlay(null);
    } else {
      setActiveOverlay(type);
      setFullScreenOverlay(false);
    }
  };
  // Active warning keys for notification icon
  const activeWarningKeys = Object.keys(vehicleWarnings).filter(
    (key) => vehicleWarnings[key],
  );

  return (
    <View style={{ flex: 1 }}>
      {/* Demo-only buttons to trigger vehicle warnings */}
      <DemoButtons
        locationError={errorMsg}
        realtimeVoice={{
          isConnected: realtimeVoice.isConnected,
          isRecording: realtimeVoice.isRecording,
          error: realtimeVoice.error,
          startAudio: realtimeVoice.startAudio,
          stopAudio: realtimeVoice.stopAudio,
        }}
        ws={wsRef.current}
      />

      {/* Notification icon for first active warning */}
      {activeWarningKeys.length > 0 && (
        <View style={styles.notificationIcon}>
          <MaterialCommunityIcons
            color="#e74c3c"
            name={
              (warningIconMap[activeWarningKeys[0]] ||
                "alert-circle-outline") as React.ComponentProps<
                typeof MaterialCommunityIcons
              >["name"]
            }
            size={responsiveScale.largeIconSize}
          />
        </View>
      )}
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
              <MaterialIcons
                color="#fff"
                name="close"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => setFullScreenOverlay(!fullScreenOverlay)}
            >
              <MaterialIcons
                color="#fff"
                name={fullScreenOverlay ? "fullscreen-exit" : "fullscreen"}
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>
          </View>
          {/* Render corresponding screen inside overlay */}
          {activeOverlay === "vehicle" && (
            <VehicleInfoScreen vehicleWarnings={vehicleWarnings} />
          )}
          {activeOverlay === "music" && <MusicScreen />}
          {activeOverlay === "climate" && <ClimateScreen />}
          {activeOverlay === "ai" && <AIAssistantScreen />}
        </View>
      </Animated.View>

      {/* Bottom control bar fixed at bottom */}
      <View style={styles.bottomBar}>
        {/* 車輛 icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => handleOverlayPress("vehicle")}
        >
          <View style={styles.iconWithBadge}>
            <MaterialCommunityIcons
              color="#fff"
              name="car"
              size={responsiveScale.largeIconSize}
            />
            {Object.values(vehicleWarnings).some((v) => v) && (
              <View style={styles.badge} />
            )}
          </View>
        </TouchableOpacity>
        {/* AC icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => handleOverlayPress("climate")}
        >
          <MaterialCommunityIcons
            color="#fff"
            name="air-conditioner"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
        {/* 溫度調整區（顯示溫度本身為 AC 開關按鈕，關閉時顯示紅色圓圈+icon） */}
        <View style={styles.tempBarWrap}>
          {isAC && (
            <TouchableOpacity
              style={styles.bottomBarBtn}
              onPress={increaseTemp}
            >
              <MaterialCommunityIcons
                color="#fff"
                name="chevron-up"
                size={responsiveScale.largeIconSize}
              />
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.tempTextWrap, !isAC && styles.tempOff]}
            onPress={toggleAC}
          >
            {isAC ? (
              <Animated.Text
                style={[
                  styles.tempText,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                {temperature}°C
              </Animated.Text>
            ) : (
              <View style={styles.tempOffContent}>
                <MaterialCommunityIcons
                  color="#e74c3c"
                  name="power"
                  size={responsiveScale.largeIconSize}
                  style={{ marginRight: 4 }}
                />
              </View>
            )}
          </TouchableOpacity>
          {isAC && (
            <TouchableOpacity
              style={styles.bottomBarBtn}
              onPress={decreaseTemp}
            >
              <MaterialCommunityIcons
                color="#fff"
                name="chevron-down"
                size={responsiveScale.largeIconSize}
              />
            </TouchableOpacity>
          )}
        </View>
        {/* 音樂 icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => handleOverlayPress("music")}
        >
          <MaterialIcons
            color="#fff"
            name="music-note"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
        {/* AI icon */}
        <TouchableOpacity
          style={styles.bottomBarBtn}
          onPress={() => handleOverlayPress("ai")}
        >
          <MaterialIcons
            color="#fff"
            name="mic"
            size={responsiveScale.largeIconSize}
          />
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
  notificationIcon: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    right: 20,
    zIndex: 150,
  },
  voiceStatusIcon: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 150,
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
    borderRadius: 28,
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
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 16, // 原本 6，調大間隔
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
    minWidth: 220, // 固定整個溫度區寬度，避免小數點時影響按鈕位置
    justifyContent: "center",
  },
  tempTextWrap: {
    width: 64, // 改為固定寬度，避免內容變動影響布局
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 16,
    backgroundColor: "transparent",
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
  iconWithBadge: {
    position: "relative",
  },
  badge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
  },
});

export default HomeScreen;
