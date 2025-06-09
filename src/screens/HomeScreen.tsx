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
import { useBroadcastMessage } from "../hooks/useBroadcastMessage";
import { getWebSocketUrl, getHttpServerUrl } from "../utils/env";
import { layoutStyles } from "../styles/layoutStyles";

import { warningIconMap } from "./VehicleInfoScreen";
import VehicleInfoScreen from "./VehicleInfoScreen";
import MusicScreen from "./MusicScreen";
import ClimateScreen from "./ClimateScreen";

const HomeScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();

  // Realtime voice功能 - 在web上自動開始
  const realtimeVoice = useRealtimeVoice({
    autoStart: Platform.OS === "web", // 僅在web上自動開始
  });

  // Broadcast message hook
  const { sendMessage: sendBroadcastMessage } = useBroadcastMessage();

  const [activeOverlay, setActiveOverlay] = React.useState<
    "vehicle" | "music" | "climate" | null
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

  useEffect(() => {
    const wsUrl = getWebSocketUrl();

    console.log("📝 Database connecting to", wsUrl);
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;
    ws.onopen = () => {
      console.log("📝 Database connected");
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
        console.error("❌ Database parsing error", err);
      }
    };
    ws.onerror = (err) => {
      console.error("❌ Database connection error", err);
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
        .catch((fetchErr) => console.error("❌ Database HTTP error", fetchErr));
    };
    ws.onclose = () => console.log("🔄 Database connection closed");

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

  // 監聽警告燈號變化，清除已關閉警告的播報記錄
  useEffect(() => {
    const warningKeys = Object.keys(vehicleWarnings);
    
    // 清除已關閉警告的播報記錄
    setSpokenWarnings((prev) => {
      const updated = { ...prev };
      let hasChanges = false;
      
      warningKeys.forEach((key) => {
        // 如果警告燈號變成false，且之前有播報記錄，則清除記錄
        if (!vehicleWarnings[key] && prev[key]) {
          delete updated[key];
          hasChanges = true;
          console.log(`🔄 [警告清除] ${key} 燈號關閉，清除播報記錄`);
        }
      });
      
      return hasChanges ? updated : prev;
    });
  }, [vehicleWarnings]);

  // 異常燈號語音播報
  useEffect(() => {
    // 若正在播報則不重複
    if (isSpeaking) return;

    // 找出尚未播報且目前為 true 的異常
    const newWarnings = Object.keys(vehicleWarnings).filter(
      (key) => vehicleWarnings[key] && !spokenWarnings[key],
    );

    if (newWarnings.length === 0) return;

    // 只播報第一個新異常
    const warningKey = newWarnings[0];

    setIsSpeaking(true);

    (async () => {
      try {
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
          `🔊 [車輛異常播報] 檢測到異常：${userPrompt}, using Broadcast API`,
        );

        // 組合異常建議訊息
        const message = `Vehicle anomaly detected: "${userPrompt}". Current location: ${
          mapPreviewLocation
            ? `Longitude ${mapPreviewLocation.longitude}, Latitude ${mapPreviewLocation.latitude}`
            : "Unknown"
        }. Please provide assistance and brief suggestions.`;

        // 使用新的 broadcast API 發送到 realtime voice
        const success = await sendBroadcastMessage(message);

        if (success) {
          console.log("✅ [車輛異常播報] Broadcast sent successfully");
        } else {
          console.error("❌ [車輛異常播報] Broadcast failed");
        }

        setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));
        setIsSpeaking(false);
      } catch (err) {
        console.error("🚫 [車輛異常播報] 播報失敗", err);
        setIsSpeaking(false);
        // 即使失敗也標記為已播報，避免持續重試
        setSpokenWarnings((prev) => ({ ...prev, [warningKey]: true }));
      }
    })();
  }, [vehicleWarnings, spokenWarnings, isSpeaking, mapPreviewLocation, sendBroadcastMessage]);

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

  // 取得語音狀態圖標和顏色
  const getVoiceIconAndColor = () => {
    if (!realtimeVoice.isConnected) {
      return { icon: "wifi-off" as const, color: "#ff4444" }; // 未連線 - 紅色 wifi-off
    }
    if (realtimeVoice.isMuted) {
      return { icon: "microphone-off" as const, color: "#ff4444" }; // 靜音 - 紅色 mic-off
    }

    return { icon: "microphone" as const, color: "#00ff00" }; // 已連線且未靜音 - 綠色 mic
  };

  const { icon: voiceIcon, color: voiceColor } = getVoiceIconAndColor();

  // Helper to toggle overlay selection
  const handleOverlayPress = (type: "vehicle" | "music" | "climate") => {
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
        currentTpmsWarning={vehicleWarnings.tpms_warning}
        locationError={errorMsg}
        realtimeVoice={{
          saveCurrentRecording: realtimeVoice.saveCurrentRecording,
          isConnected: realtimeVoice.isConnected,
        }}
        ws={wsRef.current}
      />

      {/* Notification icon for first active warning */}
      {activeWarningKeys.length > 0 && (
        <View style={layoutStyles.homeNotificationIcon}>
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
      <Animated.View style={[layoutStyles.homeMapContainer]}>
        <Pressable style={{ flex: 1 }} onPress={() => setActiveOverlay(null)}>
          <MapView initialRegion={mapPreviewLocation} style={{ flex: 1 }} />
        </Pressable>
      </Animated.View>

      {/* Drag handle between map and overlay for resizing */}
      {!fullScreenOverlay && activeOverlay && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[layoutStyles.homeDragHandle, { left: overlayWidth - 10 }]}
        />
      )}

      {/* Animated overlay panel */}
      <Animated.View
        style={[
          layoutStyles.homeOverlayCard,
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
          <View style={layoutStyles.homeOverlayHeader}>
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
        </View>
      </Animated.View>

      {/* Bottom control bar fixed at bottom */}
      <View style={layoutStyles.homeBottomBar}>
        {/* 車輛 icon */}
        <TouchableOpacity
          style={layoutStyles.homeBottomBarBtn}
          onPress={() => handleOverlayPress("vehicle")}
        >
          <View style={layoutStyles.homeIconWithBadge}>
            <MaterialCommunityIcons
              color="#fff"
              name="car"
              size={responsiveScale.largeIconSize}
            />
            {Object.values(vehicleWarnings).some((v) => v) && (
              <View style={layoutStyles.homeBadge} />
            )}
          </View>
        </TouchableOpacity>
        {/* AC icon */}
        <TouchableOpacity
          style={layoutStyles.homeBottomBarBtn}
          onPress={() => handleOverlayPress("climate")}
        >
          <MaterialCommunityIcons
            color="#fff"
            name="air-conditioner"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
        {/* 溫度調整區（顯示溫度本身為 AC 開關按鈕，關閉時顯示紅色圓圈+icon） */}
        <View style={layoutStyles.homeTempBarWrap}>
          {isAC && (
            <TouchableOpacity
              style={layoutStyles.homeBottomBarBtn}
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
            style={[layoutStyles.homeTempTextWrap, !isAC && layoutStyles.homeTempOff]}
            onPress={toggleAC}
          >
            {isAC ? (
              <Animated.Text
                style={[
                  layoutStyles.homeTempText,
                  { fontSize: responsiveScale.mediumFontSize },
                ]}
              >
                {temperature}°C
              </Animated.Text>
            ) : (
              <View style={layoutStyles.homeTempOffContent}>
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
              style={layoutStyles.homeBottomBarBtn}
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
          style={layoutStyles.homeBottomBarBtn}
          onPress={() => handleOverlayPress("music")}
        >
          <MaterialIcons
            color="#fff"
            name="music-note"
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
        {/* 語音控制 icon */}
        <TouchableOpacity
          style={layoutStyles.homeBottomBarBtn}
          onPress={() => {
            if (realtimeVoice.isConnected) {
              realtimeVoice.toggleMute();
            }
          }}
        >
          <MaterialCommunityIcons
            color={voiceColor}
            name={voiceIcon}
            size={responsiveScale.largeIconSize}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default HomeScreen;
