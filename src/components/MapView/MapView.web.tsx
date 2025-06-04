import React, { useRef, useState, useEffect } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

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

// Load states for the map
type LoadState = "loading" | "loaded" | "error" | "timeout";

// A simplified web version that embeds a Google Maps iframe
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion }) => {
  const [center, setCenter] = useState<{
    latitude: number;
    longitude: number;
  }>(initialRegion || DEFAULT_CENTER);
  const [loadState, setLoadState] = useState<LoadState>("loading");
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const contentCheckRef = useRef<NodeJS.Timeout | null>(null);

  // 設置 10 秒超時機制
  useEffect(() => {
    // 開始計時 10 秒
    timeoutRef.current = setTimeout(() => {
      if (loadState === "loading") {
        console.warn("Google Maps 載入超時，切換到默認背景");
        setLoadState("timeout");
      }
    }, 5000); // 5 秒

    // 定期檢查 iframe 內容（每秒檢查一次，最多檢查 10 次）
    let checkCount = 0;
    const maxChecks = 10;

    const intervalCheck = () => {
      if (loadState === "loading" && checkCount < maxChecks) {
        checkCount++;
        if (checkIframeContent()) {
          console.warn("檢測到 Google Maps 錯誤頁面，切換到默認背景");
          setLoadState("error");

          return;
        }

        // 繼續檢查
        contentCheckRef.current = setTimeout(intervalCheck, 1000);
      }
    };

    // 開始第一次檢查（載入後 2 秒開始）
    contentCheckRef.current = setTimeout(intervalCheck, 2000);

    // 清理計時器
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (contentCheckRef.current) {
        clearTimeout(contentCheckRef.current);
      }
    };
  }, [loadState]);

  // 檢測 iframe 內容是否為錯誤頁面
  const checkIframeContent = () => {
    try {
      const iframe = iframeRef.current;

      if (!iframe || !iframe.contentDocument) return false;

      const doc = iframe.contentDocument;
      const body = doc.body;
      const title = doc.title;

      // 檢測常見的錯誤頁面內容
      const errorIndicators = [
        "refused to connect",
        "took too long to respond",
        "connection was reset",
        "could not load",
        "this site can't be reached",
        "server dns address could not be found",
        "err_connection_refused",
        "err_connection_timed_out",
        "err_name_not_resolved",
      ];

      const bodyText = body?.textContent?.toLowerCase() || "";
      const titleText = title?.toLowerCase() || "";

      return errorIndicators.some(
        (indicator) =>
          bodyText.includes(indicator) || titleText.includes(indicator),
      );
    } catch {
      // 跨域限制可能導致無法訪問 contentDocument
      // 這種情況下假設載入成功
      return false;
    }
  };

  // 處理 iframe 載入事件
  const handleIframeLoad = () => {
    // 短暫延遲後檢查內容，確保錯誤頁面已完全載入
    setTimeout(() => {
      if (checkIframeContent()) {
        console.warn("Google Maps 載入錯誤頁面，切換到默認背景");
        setLoadState("error");
      } else {
        console.log("Google Maps 載入成功");
        setLoadState("loaded");
      }

      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    }, 100);
  };

  // 處理 iframe 載入失敗
  const handleIframeError = () => {
    console.warn("Google Maps 載入失敗，切換到默認背景");
    setLoadState("error");
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 自動取得目前位置（不論 http/https 都嘗試）
  useEffect(() => {
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

  // 渲染默認背景（當地圖載入失敗或超時時顯示）
  const renderDefaultBackground = () => (
    <View style={styles.defaultBackground}>
      <MaterialCommunityIcons
        color="#666"
        name="map-outline"
        size={80}
        style={styles.defaultIcon}
      />
      <Text style={styles.defaultText}>
        {loadState === "timeout" ? "地圖載入超時" : "地圖載入失敗"}
      </Text>
      <Text style={styles.defaultSubText}>使用預設背景模式</Text>
    </View>
  );

  // 渲染載入中狀態
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator color="#fff" size="large" />
      <Text style={styles.loadingText}>載入地圖中...</Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* 根據載入狀態顯示不同內容 */}
      {loadState === "loading" && renderLoading()}

      {(loadState === "error" || loadState === "timeout") &&
        renderDefaultBackground()}

      {/* Google Maps iframe - 載入中時顯示但透明，載入成功時顯示且不透明 */}
      {center && (
        <iframe
          ref={iframeRef}
          allowFullScreen
          loading="lazy"
          src={getGoogleMapsUrl(center.latitude, center.longitude)}
          style={{
            ...styles.iframe,
            opacity: loadState === "loaded" ? 1 : 0, // 載入完成前隱藏
            display:
              loadState === "error" || loadState === "timeout"
                ? "none"
                : "block", // 錯誤時完全隱藏
            pointerEvents: loadState === "loaded" ? "auto" : "none", // 載入完成前禁用交互
          }}
          title="Google Map"
          onError={handleIframeError}
          onLoad={handleIframeLoad}
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
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#242f3e",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 16,
    fontFamily: "System",
  },
  defaultBackground: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  defaultIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  defaultText: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 8,
    fontFamily: "System",
  },
  defaultSubText: {
    color: "#999",
    fontSize: 14,
    fontFamily: "System",
  },
});

export default MapViewComposite;
