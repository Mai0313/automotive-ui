import React, { useRef, useState } from "react";
import { View, StyleSheet } from "react-native";

// Define props interface for the component
export interface MapViewProps {
  style?: any;
  customMapStyle?: any[];
  initialRegion?: {
    latitude: number;
    longitude: number;
    latitudeDelta: number;
    longitudeDelta: number;
  };
  children?: React.ReactNode;
}

// Generate the Google Maps URL with the given latitude, longitude, and zoom level
const getGoogleMapsUrl = (lat: number, lng: number, zoom = 13) =>
  `https://www.google.com/maps?q=${lat},${lng}&z=${zoom}&output=embed`;

// Default center coordinates
const DEFAULT_CENTER = { latitude: 25.0339639, longitude: 121.5644722 };

// A simplified web version that embeds a Google Maps iframe
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion }) => {
  const [center, setCenter] = useState<{
    latitude: number;
    longitude: number;
  }>(initialRegion || DEFAULT_CENTER);
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // 自動取得目前位置（不論 http/https 都嘗試）
  React.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setCenter({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
        },
        (_err) => {
          // 取得失敗則維持預設中心
        },
      );
    }
  }, []);

  return (
    <View style={[styles.container, style]}>
      {/* 已移除 toolbar 按鈕 */}
      {center && (
        <iframe
          ref={iframeRef}
          allowFullScreen
          loading="lazy"
          src={getGoogleMapsUrl(center.latitude, center.longitude)}
          style={styles.iframe}
          title="Google Map"
        />
      )}
    </View>
  );
};

// Stub components for web compatibility
export const Marker = () => null;
export const Polyline = () => null;

// Create a composite component that includes nested components
const MapViewComposite = WebMapView as typeof WebMapView & {
  Marker: typeof Marker;
  Polyline: typeof Polyline;
};

MapViewComposite.Marker = Marker;
MapViewComposite.Polyline = Polyline;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#242f3e",
  },
  iframe: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
});

export default MapViewComposite;
