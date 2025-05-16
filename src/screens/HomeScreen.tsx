import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from '../components/MapView'; // Import MapView
import useCurrentTime from '../hooks/useCurrentTime'; // Import the hook

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentTime = useCurrentTime(); // Use the hook

  // Mock data for status
  const batteryLevel = '315 km';
  const temperature = '17°C';
  // const time = '10:21 AM'; // Removed hardcoded time

  // Mock location for map preview (e.g., Taipei 101)
  const mapPreviewLocation = {
    latitude: 25.0339639,
    longitude: 121.5644722,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{temperature}</Text>
        <Text style={styles.statusText}>{currentTime}</Text> {/* Display real-time */}
      </View>

      {/* Main Content Grid */}
      <View style={styles.gridContainer}>
        <TouchableOpacity
          style={[styles.gridItem, styles.mapGridItem]} // Added mapGridItem for specific styling
          onPress={() => navigation.navigate('Navigation' as never)} // Corrected navigation name
        >
          <MapView
            style={styles.mapPreview}
            initialRegion={mapPreviewLocation}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          />
          <View style={styles.mapOverlay}>
            <MaterialIcons name="map" size={30} color="#fff" />
            <Text style={styles.gridText}>導航</Text>
          </View>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Music' as never)} // Corrected navigation name
        >
          <MaterialIcons name="music-note" size={50} color="#fff" />
          <Text style={styles.gridText}>音樂</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Vehicle' as never)} // Corrected navigation name
        >
          <MaterialCommunityIcons name="car" size={50} color="#fff" />
          <Text style={styles.gridText}>車輛資訊</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('Climate' as never)} // Corrected navigation name
        >
          <MaterialCommunityIcons name="air-conditioner" size={50} color="#fff" />
          <Text style={styles.gridText}>空調控制</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('AI' as never)} // Corrected navigation name
        >
          <MaterialCommunityIcons name="robot" size={50} color="#fff" />
          <Text style={styles.gridText}>AI 助理</Text>
        </TouchableOpacity>

        <View style={styles.gridItem}>
          <MaterialCommunityIcons name="cog" size={50} color="#fff" />
          <Text style={styles.gridText}>設定</Text>
        </View>
      </View>

      {/* Bottom Status */}
      <View style={styles.bottomStatus}>
        <View style={styles.batteryInfo}>
          <MaterialCommunityIcons name="battery-70" size={30} color="#4CAF50" />
          <Text style={styles.batteryText}>{batteryLevel}</Text>
        </View>
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
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  gridContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    padding: 20,
  },
  gridItem: {
    width: '45%',
    aspectRatio: 1.5,
    backgroundColor: '#121212',
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    overflow: 'hidden', // Needed for map preview
  },
  mapGridItem: { // Style for the map grid item specifically
    aspectRatio: 1.5, // Adjust as needed, or set fixed height/width
  },
  mapPreview: {
    ...StyleSheet.absoluteFillObject, // Make map fill the grid item
  },
  mapOverlay: { // To place icon and text over the map
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.3)', // Slight dark overlay for text visibility
  },
  gridText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 10,
  },
  bottomStatus: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  batteryInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  batteryText: {
    color: '#fff',
    fontSize: 18,
    marginLeft: 5,
  },
});

export default HomeScreen;
