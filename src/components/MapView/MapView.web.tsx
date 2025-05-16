import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

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

// A simplified web version that mimics MapView for web platforms
const WebMapView: React.FC<MapViewProps> = ({ style, initialRegion, children }) => {
  return (
    <View style={[styles.container, style]}>{[
      <Text key="title" style={styles.mapFallbackText}>導航地圖</Text>,
      <Text key="subtext" style={styles.mapFallbackSubtext}>
        {initialRegion ? `位置：${initialRegion.latitude.toFixed(4)}, ${initialRegion.longitude.toFixed(4)}` : '未設定位置'}
      </Text>,
      <View key="route" style={styles.routeSimulation}>
        <View style={styles.routeOriginDot} />
        <View style={styles.routeLine} />
        <View style={styles.routeWaypoint} />
        <View style={styles.routeLine} />
        <View style={styles.routeDestinationDot} />
      </View>
    ]}</View>
  );
};

// Stub components for web compatibility
export const Marker = ({ coordinate, pinColor }: any) => null;
export const Polyline = ({ coordinates, strokeColor, strokeWidth }: any) => null;

// Create a composite component that includes nested components
const MapViewComposite = WebMapView as typeof WebMapView & {
  Marker: typeof Marker;
  Polyline: typeof Polyline;
};

MapViewComposite.Marker = Marker;
MapViewComposite.Polyline = Polyline;

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#242f3e',
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  mapFallbackText: {
    color: '#fff',
    fontSize: 30,
    fontWeight: 'bold',
  },
  mapFallbackSubtext: {
    color: '#aaa',
    fontSize: 16,
    marginTop: 10,
  },
  routeSimulation: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 30,
    width: '60%',
  },
  routeOriginDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#3498db',
  },
  routeDestinationDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#e74c3c',
  },
  routeWaypoint: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#f39c12',
  },
  routeLine: {
    flex: 1,
    height: 4,
    backgroundColor: '#3498db',
    marginHorizontal: 5,
  },
});

export default MapViewComposite;