import { useState, useEffect, useRef } from "react";

import { getWebSocketUrl, getHttpServerUrl } from "../utils/env";

export default function useHomeClimateSettings() {
  const [temperature, setTemperature] = useState<number>(26);
  const [isAC, setIsAC] = useState<boolean>(true);
  const wsRef = useRef<WebSocket | null>(null);

  useEffect(() => {
    const ws = new WebSocket(getWebSocketUrl());

    wsRef.current = ws;
    ws.onopen = () => {
      ws.send(JSON.stringify({ action: "get_state" }));
    };
    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (typeof data.temperature === "number")
          setTemperature(data.temperature);
        if (typeof data.air_conditioning === "boolean")
          setIsAC(data.air_conditioning);
      } catch (err) {
        console.error("[HomeHook WS] parse error", err);
      }
    };
    ws.onerror = () => {
      fetch(`${getHttpServerUrl()}/state`)
        .then((res) => res.json())
        .then((data) => {
          setTemperature(data.temperature);
          setIsAC(data.air_conditioning);
        })
        .catch((err) => console.error("[HomeHook HTTP] error", err));
    };
    ws.onclose = () => {
      wsRef.current = null;
    };

    return () => {
      ws.close();
    };
  }, []);

  const increaseTemp = () => {
    setTemperature((prev) => {
      const newVal = Math.min(prev + 0.5, 28);

      wsRef.current?.send(JSON.stringify({ temperature: newVal }));

      return newVal;
    });
  };

  const decreaseTemp = () => {
    setTemperature((prev) => {
      const newVal = Math.max(prev - 0.5, 16);

      wsRef.current?.send(JSON.stringify({ temperature: newVal }));

      return newVal;
    });
  };

  const toggleAC = () => {
    setIsAC((prev) => {
      const newVal = !prev;

      wsRef.current?.send(JSON.stringify({ air_conditioning: newVal }));

      return newVal;
    });
  };

  return { temperature, isAC, increaseTemp, decreaseTemp, toggleAC };
}
