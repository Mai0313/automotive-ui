import { useState, useEffect, useRef } from "react";
import * as Haptics from "expo-haptics";

import { getWebSocketUrl, getHttpServerUrl } from "../utils/env";

export default function useClimateSettings() {
  const [acOn, setAcOn] = useState<boolean>(false);
  const [fanSpeed, setFanSpeed] = useState<number>(0);
  const [autoOn, setAutoOn] = useState<boolean>(false);
  const [frontDefrostOn, setFrontDefrostOn] = useState<boolean>(false);
  const [rearDefrostOn, setRearDefrostOn] = useState<boolean>(false);
  const [airFace, setAirFace] = useState<boolean>(true);
  const [airMiddle, setAirMiddle] = useState<boolean>(false);
  const [airFoot, setAirFoot] = useState<boolean>(false);

  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl());

    wsRef.current = ws;
    ws.onopen = () => {
      wsRef.current?.send(JSON.stringify({ action: "get_state" }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (typeof data.air_conditioning === "boolean")
          setAcOn(data.air_conditioning);
        if (typeof data.fan_speed === "number") setFanSpeed(data.fan_speed);
        if (typeof data.auto_on === "boolean") setAutoOn(data.auto_on);
        if (typeof data.front_defrost_on === "boolean")
          setFrontDefrostOn(data.front_defrost_on);
        if (typeof data.rear_defrost_on === "boolean")
          setRearDefrostOn(data.rear_defrost_on);
        if (typeof data.airflow_head_on === "boolean")
          setAirFace(data.airflow_head_on);
        if (typeof data.airflow_body_on === "boolean")
          setAirMiddle(data.airflow_body_on);
        if (typeof data.airflow_feet_on === "boolean")
          setAirFoot(data.airflow_feet_on);
      } catch (err) {
        console.error("Failed to parse WS data", err);
      }
    };
    ws.onerror = () => {
      fetch(`${getHttpServerUrl()}/state`)
        .then((res) => res.json())
        .then((data) => {
          setAcOn(data.air_conditioning);
          setFanSpeed(data.fan_speed);
          setAutoOn(data.auto_on);
          setFrontDefrostOn(data.front_defrost_on);
          setRearDefrostOn(data.rear_defrost_on);
          setAirFace(data.airflow_head_on);
          setAirMiddle(data.airflow_body_on);
          setAirFoot(data.airflow_feet_on);
        })
        .catch((err) => console.error("[HTTP] error", err));
    };
    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
      wsRef.current = null;
    };
  }, []);

  const send = (payload: object) => {
    wsRef.current?.send(JSON.stringify(payload));
  };

  const haptic = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  };

  const toggleAc = () => {
    const newVal = !acOn;

    setAcOn(newVal);
    haptic();
    send({ air_conditioning: newVal });
  };

  const increaseFan = () => {
    const newVal = Math.min(fanSpeed + 1, 10);

    setFanSpeed(newVal);
    send({ fan_speed: newVal });
  };

  const decreaseFan = () => {
    const newVal = Math.max(fanSpeed - 1, 0);

    setFanSpeed(newVal);
    send({ fan_speed: newVal });
  };

  const setFanSpeedSync = (val: number) => {
    setFanSpeed(val);
    send({ fan_speed: val });
  };

  const toggleAuto = () => {
    const newVal = !autoOn;

    setAutoOn(newVal);
    send({ auto_on: newVal });
  };

  const toggleFrontDefrost = () => {
    const newVal = !frontDefrostOn;

    setFrontDefrostOn(newVal);
    send({ front_defrost_on: newVal });
  };

  const toggleRearDefrost = () => {
    const newVal = !rearDefrostOn;

    setRearDefrostOn(newVal);
    send({ rear_defrost_on: newVal });
  };

  const toggleAirFace = () => {
    const newVal = !airFace;

    setAirFace(newVal);
    send({ airflow_head_on: newVal });
  };

  const toggleAirMiddle = () => {
    const newVal = !airMiddle;

    setAirMiddle(newVal);
    send({ airflow_body_on: newVal });
  };

  const toggleAirFoot = () => {
    const newVal = !airFoot;

    setAirFoot(newVal);
    send({ airflow_feet_on: newVal });
  };

  return {
    acOn,
    toggleAc,
    fanSpeed,
    increaseFan,
    decreaseFan,
    setFanSpeed: setFanSpeedSync,
    autoOn,
    toggleAuto,
    frontDefrostOn,
    toggleFrontDefrost,
    rearDefrostOn,
    toggleRearDefrost,
    airFace,
    toggleAirFace,
    airMiddle,
    toggleAirMiddle,
    airFoot,
    toggleAirFoot,
  };
}
