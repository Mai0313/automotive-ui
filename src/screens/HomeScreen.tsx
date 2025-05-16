import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, StatusBar } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();

  // Mock data for status and time
  const batteryLevel = '315 km';
  const temperature = '17°C';
  const time = '10:21 AM';

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />

      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>{temperature}</Text>
        <Text style={styles.statusText}>{time}</Text>
      </View>

      {/* Main Content Grid */}
      <View style={styles.gridContainer}>
        <TouchableOpacity 
          style={styles.gridItem} 
          onPress={() => navigation.navigate('導航' as never)}
        >
          <MaterialIcons name="map" size={50} color="#fff" />
          <Text style={styles.gridText}>導航</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('音樂' as never)}
        >
          <MaterialIcons name="music-note" size={50} color="#fff" />
          <Text style={styles.gridText}>音樂</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('車輛資訊' as never)}
        >
          <MaterialCommunityIcons name="car" size={50} color="#fff" />
          <Text style={styles.gridText}>車輛資訊</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('空調' as never)}
        >
          <MaterialCommunityIcons name="air-conditioner" size={50} color="#fff" />
          <Text style={styles.gridText}>空調控制</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.gridItem}
          onPress={() => navigation.navigate('AI 助理' as never)}
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
