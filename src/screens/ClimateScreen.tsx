// TODO: 若需感測器數據請用 expo-sensors
// import { Accelerometer, Gyroscope, Magnetometer, Barometer } from "expo-sensors";
// 參考：https://docs.expo.dev/versions/latest/sdk/sensors/

import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
} from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider"; // Ensure this is installed or use a different slider
import { SafeAreaView } from "react-native-safe-area-context";
import { Accelerometer } from "expo-sensors";
import * as Haptics from "expo-haptics";

import commonStyles from "../styles/commonStyles";

const ClimateScreen: React.FC = () => {
  // Initial states default to match DB defaults until WS pushes actual values
  const [acOn, setAcOn] = useState(false);
  const wsRef = useRef<WebSocket | null>(null);
  const [fanSpeed, setFanSpeed] = useState(0);
  const [isAuto, setIsAuto] = useState(false);
  const [isFrontDefrost, setIsFrontDefrost] = useState(false);
  const [isRearDefrost, setIsRearDefrost] = useState(false);
  const [accel, setAccel] = useState({ x: 0, y: 0, z: 0 });

  // Temperature state (initial from DB)
  // Temperature setting in Celsius
  const [temperature, setTemperature] = useState(22.0);

  // 新增：每個空調控制按鈕的開關狀態
  const [autoOn, setAutoOn] = useState(isAuto);
  const [frontDefrostOn, setFrontDefrostOn] = useState(isFrontDefrost);
  const [rearDefrostOn, setRearDefrostOn] = useState(isRearDefrost);

  // 新增：出風方向三個按鈕的開關狀態
  const [airFace, setAirFace] = useState(true);
  const [airMiddle, setAirMiddle] = useState(false);
  const [airFoot, setAirFoot] = useState(false);

  useEffect(() => {
    if (Platform.OS === "web") return;
    const sub = Accelerometer.addListener(setAccel);

    return () => sub && sub.remove();
  }, []);

  // Add WebSocket connection for real-time updates
  useEffect(() => {
    // Choose WS URL based on platform (Android emulator requires 10.0.2.2)
    const wsUrl =
      Platform.OS === "android" ? "ws://10.0.2.2:4000" : "ws://localhost:4000";

    console.log("[WS] connecting to", wsUrl);
    const ws = new WebSocket(wsUrl);

    wsRef.current = ws;
    ws.onopen = () => {
      console.log("[WS] connected");
      // Request initial state from server
      wsRef.current?.send(JSON.stringify({ action: "get_state" }));
    };
    ws.onerror = (err) => console.error("[WS] error", err);
    ws.onclose = () => console.log("[WS] closed");
    ws.onmessage = (event) => {
      console.log("[WS] message", event.data);
      try {
        const data = JSON.parse(event.data);

        setAcOn(data.air_conditioning);
        setFanSpeed(data.fan_speed);
        setAirFace(data.airflow_head_on);
        setAirMiddle(data.airflow_body_on);
        setAirFoot(data.airflow_feet_on);
        setTemperature(data.temperature);
        // 新增同步除霜狀態
        setFrontDefrostOn(data.front_defrost_on);
        setRearDefrostOn(data.rear_defrost_on);
      } catch (err) {
        console.error("Failed to parse WS data", err);
      }
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  // 震動回饋
  const vibrate = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  // Fan speed controls
  const increaseFan = () => setFanSpeed((prev) => Math.min(prev + 1, 10));
  const decreaseFan = () => setFanSpeed((prev) => Math.max(prev - 1, 0));

  // AC toggle
  const toggleAC = () => {
    const newState = !acOn;

    setAcOn(newState);
    vibrate();
    wsRef.current?.send(JSON.stringify({ air_conditioning: newState }));
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Main Climate Controls */}
      <View style={styles.controlsContainer}>
        {/* AC On/Off Toggle */}
        <TouchableOpacity
          style={[
            commonStyles.controlButton,
            acOn && commonStyles.activeButton,
          ]}
          onPress={toggleAC}
        >
          <MaterialCommunityIcons
            color={acOn ? "#3498db" : "#fff"}
            name="snowflake"
            size={24}
          />
          <Text
            style={[commonStyles.controlText, acOn && commonStyles.activeText]}
          >
            空調
          </Text>
        </TouchableOpacity>

        {/* Fan Speed Control */}
        <View style={styles.fanControl}>
          <Text style={styles.controlLabel}>風速控制</Text>

          <View style={styles.fanSliderContainer}>
            <TouchableOpacity onPress={decreaseFan}>
              <MaterialCommunityIcons color="#aaa" name="fan-off" size={24} />
            </TouchableOpacity>

            <Slider
              maximumTrackTintColor="#333"
              maximumValue={10}
              minimumTrackTintColor="#3498db"
              minimumValue={0}
              step={1}
              style={styles.slider}
              thumbTintColor="#fff"
              value={fanSpeed}
              onValueChange={(val) => {
                setFanSpeed(val);
                wsRef.current?.send(JSON.stringify({ fan_speed: val }));
              }}
            />

            <TouchableOpacity onPress={increaseFan}>
              <MaterialCommunityIcons color="#fff" name="fan" size={24} />
            </TouchableOpacity>
          </View>

          <View style={styles.fanSpeedIndicator}>
            {[...Array(10)].map((_, i) => (
              <View
                key={i}
                style={[
                  styles.fanSpeedDot,
                  i < fanSpeed ? styles.activeDot : styles.inactiveDot,
                ]}
              />
            ))}
          </View>
        </View>

        {/* Climate Controls */}
        <View style={styles.climateControls}>
          {/* Auto */}
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              autoOn && commonStyles.activeButton,
            ]}
            onPress={() => {
              setAutoOn((v) => !v);
              setIsAuto((v) => !v);
            }}
          >
            <MaterialCommunityIcons
              color={autoOn ? "#3498db" : "#fff"}
              name="auto-fix"
              size={24}
            />
            <Text
              style={[
                commonStyles.controlText,
                autoOn && commonStyles.activeText,
              ]}
            >
              自動
            </Text>
          </TouchableOpacity>
          {/* Defrost */}
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              frontDefrostOn && commonStyles.activeButton,
            ]}
            onPress={() => {
              setFrontDefrostOn((v) => {
                const newVal = !v;
                wsRef.current?.send(
                  JSON.stringify({ front_defrost_on: newVal })
                );
                setIsFrontDefrost(newVal);
                return newVal;
              });
            }}
          >
            <MaterialCommunityIcons
              color={frontDefrostOn ? "#3498db" : "#fff"}
              name="car-defrost-front"
              size={24}
            />
            <Text
              style={[
                commonStyles.controlText,
                frontDefrostOn && commonStyles.activeText,
              ]}
            >
              前除霜
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[
              commonStyles.controlButton,
              rearDefrostOn && commonStyles.activeButton,
            ]}
            onPress={() => {
              setRearDefrostOn((v) => {
                const newVal = !v;
                wsRef.current?.send(
                  JSON.stringify({ rear_defrost_on: newVal })
                );
                setIsRearDefrost(newVal);
                return newVal;
              });
            }}
          >
            <MaterialCommunityIcons
              color={rearDefrostOn ? "#3498db" : "#fff"}
              name="car-defrost-rear"
              size={24}
            />
            <Text
              style={[
                commonStyles.controlText,
                rearDefrostOn && commonStyles.activeText,
              ]}
            >
              後除霜
            </Text>
          </TouchableOpacity>
        </View>

        {/* Air Flow Direction */}
        <View style={styles.airFlowContainer}>
          <Text style={styles.controlLabel}>出風方向</Text>

          <View style={styles.airFlowButtons}>
            <TouchableOpacity
              style={[
                styles.airFlowButton,
                airFace && commonStyles.activeButton,
              ]}
              onPress={() => {
                setAirFace((v) => {
                  const newVal = !v;

                  wsRef.current?.send(
                    JSON.stringify({ airflow_head_on: newVal }),
                  );

                  return newVal;
                });
              }}
            >
              <MaterialCommunityIcons
                color={airFace ? "#3498db" : "#fff"}
                name="emoticon-outline"
                size={24}
              />
              <Text
                style={[
                  commonStyles.controlText,
                  airFace && commonStyles.activeText,
                ]}
              >
                面部
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.airFlowButton,
                airMiddle && commonStyles.activeButton,
              ]}
              onPress={() => {
                setAirMiddle((v) => {
                  const newVal = !v;

                  wsRef.current?.send(
                    JSON.stringify({ airflow_body_on: newVal }),
                  );

                  return newVal;
                });
              }}
            >
              <MaterialCommunityIcons
                color={airMiddle ? "#3498db" : "#fff"}
                name="car-seat"
                size={24}
              />
              <Text
                style={[
                  commonStyles.controlText,
                  airMiddle && commonStyles.activeText,
                ]}
              >
                中間
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.airFlowButton,
                airFoot && commonStyles.activeButton,
              ]}
              onPress={() => {
                setAirFoot((v) => {
                  const newVal = !v;

                  wsRef.current?.send(
                    JSON.stringify({ airflow_feet_on: newVal }),
                  );

                  return newVal;
                });
              }}
            >
              <MaterialCommunityIcons
                color={airFoot ? "#3498db" : "#fff"}
                name="shoe-print"
                size={24}
              />
              <Text
                style={[
                  commonStyles.controlText,
                  airFoot && commonStyles.activeText,
                ]}
              >
                腳部
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Power Button */}
        {/* 已整合至底部溫度顯示區，這裡移除關閉空調按鈕 */}
      </View>

      {/* 加速度感測器數據展示與震動回饋按鈕 */}
      {Platform.OS !== "web" ? (
        <View style={{ margin: 20, alignItems: "center" }}>
          <Text style={{ color: "#fff" }}>加速度感測 (expo-sensors):</Text>
          <Text
            style={{ color: "#fff" }}
          >{`x: ${accel.x.toFixed(2)} y: ${accel.y.toFixed(2)} z: ${accel.z.toFixed(2)}`}</Text>
          <TouchableOpacity
            style={{
              marginTop: 10,
              backgroundColor: "#e67e22",
              padding: 10,
              borderRadius: 8,
            }}
            onPress={vibrate}
          >
            <Text style={{ color: "#fff" }}>震動回饋 (expo-haptics)</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <View style={{ margin: 20, alignItems: "center" }}>
          <Text style={{ color: "#fff" }}>加速度感測（僅支援行動裝置）</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  controlsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tempDisplay: {
    alignItems: "center",
    marginBottom: 40,
  },
  tempText: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "300",
  },
  tempControls: {
    flexDirection: "row",
    marginTop: 20,
  },
  tempButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  controlLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  fanControl: {
    marginBottom: 30,
  },
  fanSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  fanSpeedIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  fanSpeedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: "#3498db",
  },
  inactiveDot: {
    backgroundColor: "#333",
  },
  climateControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  airFlowContainer: {
    marginBottom: 30,
  },
  airFlowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  airFlowButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    width: "30%",
  },
});

export default ClimateScreen;
