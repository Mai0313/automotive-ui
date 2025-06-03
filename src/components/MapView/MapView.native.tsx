import React, { useState, useEffect, useRef } from "react";
import { View, StyleSheet, Text, ActivityIndicator } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";
import RnmMapView, {
  Marker as RnmMarker,
  Polyline as RnmPolyline,
  MapViewProps as RnmMapViewProps,
} from "react-native-maps";

// Define props interface extending react-native-maps props
export interface MapViewProps extends RnmMapViewProps {
  style?: any;
  customMapStyle?: any[];
  children?: React.ReactNode;
}

// Load states for the map
type LoadState = 'loading' | 'loaded' | 'error' | 'timeout';

// Native MapView with timeout functionality
const NativeMapView: React.FC<MapViewProps> = ({ style, children, ...props }) => {
  const [loadState, setLoadState] = useState<LoadState>('loading');
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // 設置 10 秒超時機制
  useEffect(() => {
    // 開始計時 10 秒
    timeoutRef.current = setTimeout(() => {
      if (loadState === 'loading') {
        console.warn('React Native Maps 載入超時（10秒），切換到默認背景');
        setLoadState('timeout');
      }
    }, 10000); // 10 秒

    // 清理超時計時器
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [loadState]);

  // 處理地圖載入完成
  const handleMapReady = () => {
    console.log('React Native Maps 載入成功');
    setLoadState('loaded');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 處理地圖載入失敗 - 在超時後觸發
  const handleMapLoadError = () => {
    console.warn('React Native Maps 載入失敗或超時，切換到默認背景');
    setLoadState('error');
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }
  };

  // 渲染默認背景（當地圖載入失敗或超時時顯示）
  const renderDefaultBackground = () => (
    <View style={styles.defaultBackground}>
      <MaterialCommunityIcons 
        name="map-outline" 
        size={80} 
        color="#666" 
        style={styles.defaultIcon}
      />
      <Text style={styles.defaultText}>
        {loadState === 'timeout' ? '地圖載入超時' : '地圖載入失敗'}
      </Text>
      <Text style={styles.defaultSubText}>
        使用預設背景模式
      </Text>
    </View>
  );

  // 渲染載入中狀態
  const renderLoading = () => (
    <View style={styles.loadingContainer}>
      <ActivityIndicator size="large" color="#fff" />
      <Text style={styles.loadingText}>載入地圖中...</Text>
    </View>
  );

  return (
    <View style={[styles.container, style]}>
      {/* 根據載入狀態顯示不同內容 */}
      {loadState === 'loading' && renderLoading()}
      
      {(loadState === 'error' || loadState === 'timeout') && renderDefaultBackground()}
      
      {/* React Native Maps - 只有在載入中或載入成功時顯示 */}
      {(loadState === 'loading' || loadState === 'loaded') && (
        <RnmMapView
          {...props}
          style={[
            styles.map,
            { opacity: loadState === 'loaded' ? 1 : 0 }
          ] as any} // 載入完成前隱藏
          onMapReady={handleMapReady}
        >
          {children}
        </RnmMapView>
      )}
    </View>
  );
};

// Export markers and polylines
export const Marker = RnmMarker;
export const Polyline = RnmPolyline;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
    backgroundColor: "#242f3e",
  },
  map: {
    flex: 1,
    borderRadius: 8,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#242f3e",
  },
  loadingText: {
    color: '#fff',
    fontSize: 16,
    marginTop: 16,
    fontFamily: 'System',
  },
  defaultBackground: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: "#1a1a1a",
    borderRadius: 8,
  },
  defaultIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  defaultText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 8,
    fontFamily: 'System',
  },
  defaultSubText: {
    color: '#999',
    fontSize: 14,
    fontFamily: 'System',
  },
});

export default NativeMapView;
