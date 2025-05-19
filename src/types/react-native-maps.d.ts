declare module "react-native-maps" {
  import * as React from "react";
  import { ViewProps, ViewStyle, ImageSourcePropType } from "react-native";

  export interface LatLng {
    latitude: number;
    longitude: number;
  }

  export interface Region extends LatLng {
    latitudeDelta: number;
    longitudeDelta: number;
  }

  export interface Point {
    x: number;
    y: number;
  }

  export interface MapViewProps extends ViewProps {
    provider?: "google" | null;
    style?: ViewStyle;
    customMapStyle?: Array<any>;
    initialRegion?: Region;
    region?: Region;
    onRegionChange?: (region: Region) => void;
    onRegionChangeComplete?: (region: Region) => void;
    showsUserLocation?: boolean;
    userLocationAnnotationTitle?: string;
    showsMyLocationButton?: boolean;
    followsUserLocation?: boolean;
    showsPointsOfInterest?: boolean;
    showsCompass?: boolean;
    zoomEnabled?: boolean;
    zoomControlEnabled?: boolean;
    rotateEnabled?: boolean;
    scrollEnabled?: boolean;
    pitchEnabled?: boolean;
    toolbarEnabled?: boolean;
    loadingEnabled?: boolean;
    loadingIndicatorColor?: string;
    loadingBackgroundColor?: string;
    moveOnMarkerPress?: boolean;
    onMapReady?: () => void;
    onPress?: (event: {
      nativeEvent: { coordinate: LatLng; position: Point };
    }) => void;
    // Add other props as needed from the library's documentation
  }

  export interface MarkerProps {
    coordinate: LatLng;
    title?: string;
    description?: string;
    pinColor?: string;
    image?: ImageSourcePropType;
    anchor?: Point;
    calloutAnchor?: Point;
    flat?: boolean;
    draggable?: boolean;
    onDragStart?: (event: any) => void;
    onDrag?: (event: any) => void;
    onDragEnd?: (event: any) => void;
    onPress?: (event: any) => void;
    // Add other props
  }

  export class Marker extends React.Component<MarkerProps> {}

  export interface PolylineProps {
    coordinates: LatLng[];
    strokeColor?: string;
    strokeWidth?: number;
    lineCap?: "butt" | "round" | "square";
    lineJoin?: "miter" | "round" | "bevel";
    miterLimit?: number;
    geodesic?: boolean;
    lineDashPattern?: number[];
    onPress?: (event: any) => void;
    // Add other props
  }

  export class Polyline extends React.Component<PolylineProps> {}

  // Add other components like Callout, Polygon, Circle etc. if needed

  export default class MapView extends React.Component<MapViewProps> {
    static Marker: typeof Marker;
    static Polyline: typeof Polyline;
    // Add other static members if needed
  }
}
