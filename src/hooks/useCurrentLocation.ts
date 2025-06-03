import { useEffect, useState } from "react";
import * as Location from "expo-location";

export interface LocationRegion {
  latitude: number;
  longitude: number;
  latitudeDelta: number;
  longitudeDelta: number;
}

const DEFAULT_LOCATION: LocationRegion = {
  latitude: 25.0339639, // 台北101
  longitude: 121.5644722,
  latitudeDelta: 0.01,
  longitudeDelta: 0.01,
};

const useCurrentLocation = () => {
  const [location, setLocation] = useState<LocationRegion | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();

        if (status !== "granted") {
          const errorMessage =
            typeof window !== "undefined" && !window.isSecureContext
              ? "定位權限被拒絕。在非安全上下文中需要在 Chrome flags 設定 'Insecure origins treated as secure' 加入: " +
                window.location.origin
              : "定位權限被拒絕。請允許網站存取位置資訊。";

          setErrorMsg(errorMessage);
          setLocation(DEFAULT_LOCATION);

          return;
        }
        let loc = await Location.getCurrentPositionAsync({});

        setLocation({
          latitude: loc.coords.latitude,
          longitude: loc.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        });
      } catch (e) {
        setErrorMsg("取得定位失敗");
        setLocation(DEFAULT_LOCATION);
        console.error("Error getting location:", e);
      }
    })();
  }, []);

  return { location, errorMsg };
};

export default useCurrentLocation;
