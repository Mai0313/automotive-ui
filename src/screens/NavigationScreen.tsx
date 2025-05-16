import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons, MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView, { Marker, Polyline } from '../components/MapView'; // Corrected import path
import useCurrentTime from '../hooks/useCurrentTime'; // Import the hook

const NavigationScreen: React.FC = () => {
  const currentTime = useCurrentTime(); // Use the hook
  // Mock navigation data
  const origin = { latitude: 25.0330, longitude: 121.5654 }; // Taipei
  const destination = { latitude: 24.1477, longitude: 120.6736 }; // Taichung
  const route = [
    origin,
    { latitude: 24.8138, longitude: 120.9675 }, // Somewhere in between
    destination
  ];
  
  // Mock navigation info
  const distance = '159 km';
  const eta = '1 hr 52 min';
  const arrivalTime = '12:13 PM';

  // Custom dark map style for Tesla-like UI
  const darkMapStyle = [
    {
      "elementType": "geometry",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "elementType": "labels.text.fill",
      "stylers": [{ "color": "#746855" }]
    },
    {
      "elementType": "labels.text.stroke",
      "stylers": [{ "color": "#242f3e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry",
      "stylers": [{ "color": "#38414e" }]
    },
    {
      "featureType": "road",
      "elementType": "geometry.stroke",
      "stylers": [{ "color": "#212a37" }]
    },
    {
      "featureType": "water",
      "elementType": "geometry",
      "stylers": [{ "color": "#17263c" }]
    }
  ];

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>導航</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusTemp}>25°C</Text>
          <Text style={styles.statusTime}>{currentTime}</Text> {/* Display real-time */}
        </View>
      </View>

      {/* Main Navigation Map */}
      <MapView
        style={styles.map}
        customMapStyle={darkMapStyle}
        initialRegion={{
          latitude: (origin.latitude + destination.latitude) / 2,
          longitude: (origin.longitude + destination.longitude) / 2,
          latitudeDelta: 0.5,
          longitudeDelta: 0.5,
        }}
      >
        <Marker coordinate={origin} pinColor="#3498db" />
        <Marker coordinate={destination} pinColor="#e74c3c" />
        <Polyline
          coordinates={route}
          strokeColor="#3498db"
          strokeWidth={4}
        />
      </MapView>

      {/* Navigation Info Panel */}
      <View style={styles.navigationPanel}>
        <View style={styles.routeInfo}>
          <View style={styles.directionItem}>
            <MaterialIcons name="directions" size={24} color="#3498db" />
            <View style={styles.directionText}>
              <Text style={styles.directionTitle}>國道一號</Text>
              <Text style={styles.directionDistance}>1.5 km</Text>
            </View>
          </View>
          
          <View style={styles.directionItem}>
            <MaterialIcons name="subdirectory-arrow-right" size={24} color="#3498db" />
            <View style={styles.directionText}>
              <Text style={styles.directionTitle}>新竹交流道</Text>
              <Text style={styles.directionDistance}>45 km</Text>
            </View>
          </View>
          
          <View style={styles.directionItem}>
            <MaterialIcons name="arrow-forward" size={24} color="#3498db" />
            <View style={styles.directionText}>
              <Text style={styles.directionTitle}>台中交流道</Text>
              <Text style={styles.directionDistance}>110 km</Text>
            </View>
          </View>
          
          <View style={styles.directionItem}>
            <MaterialCommunityIcons name="ev-station" size={24} color="#3498db" />
            <View style={styles.directionText}>
              <Text style={styles.directionTitle}>頭份充電站</Text>
              <Text style={styles.directionDistance}>35 km</Text>
            </View>
            <Text style={styles.chargerStatus}>72%</Text>
          </View>
        </View>

        <View style={styles.etaInfo}>
          <Text style={styles.etaText}>{distance} • {eta} • {arrivalTime}</Text>
          <TouchableOpacity style={styles.cancelButton}>
            <Text style={styles.cancelText}>取消導航</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Map Controls */}
      <View style={styles.mapControls}>
        <TouchableOpacity style={styles.mapControl}>
          <MaterialIcons name="add" size={30} color="#fff" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.mapControl}>
          <MaterialIcons name="remove" size={30} color="#fff" />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000',
  },
  statusBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
    zIndex: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusRight: {
    flexDirection: 'row',
  },
  statusTemp: {
    color: '#fff',
    marginRight: 20,
  },
  statusTime: {
    color: '#fff',
  },
  map: {
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height * 0.7,
  },
  navigationPanel: {
    position: 'absolute',
    top: 70,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    borderRadius: 10,
    padding: 15,
    width: '40%',
  },
  routeInfo: {
    marginBottom: 15,
  },
  directionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 15,
    backgroundColor: 'rgba(30, 30, 30, 0.9)',
    padding: 10,
    borderRadius: 5,
  },
  directionText: {
    marginLeft: 10,
    flex: 1,
  },
  directionTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  directionDistance: {
    color: '#aaa',
    fontSize: 14,
  },
  chargerStatus: {
    color: '#4CAF50',
    fontWeight: 'bold',
  },
  etaInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  etaText: {
    color: '#fff',
  },
  cancelButton: {
    backgroundColor: '#333',
    padding: 8,
    borderRadius: 5,
  },
  cancelText: {
    color: '#fff',
  },
  mapControls: {
    position: 'absolute',
    right: 20,
    top: Dimensions.get('window').height * 0.3,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 10,
    padding: 5,
  },
  mapControl: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default NavigationScreen;