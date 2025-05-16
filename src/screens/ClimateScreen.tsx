import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import Slider from '@react-native-community/slider'; // Changed import

const ClimateScreen: React.FC = () => {
  // State for climate controls
  const [temperature, setTemperature] = useState(20);
  const [fanSpeed, setFanSpeed] = useState(3);
  const [isAuto, setIsAuto] = useState(true);
  const [isAC, setIsAC] = useState(true);
  const [isFrontDefrost, setIsFrontDefrost] = useState(false);
  const [isRearDefrost, setIsRearDefrost] = useState(false);
  
  // Temperature controls
  const increaseTemp = () => setTemperature(prev => Math.min(prev + 0.5, 28));
  const decreaseTemp = () => setTemperature(prev => Math.max(prev - 0.5, 16));
  
  // Fan speed controls
  const increaseFan = () => setFanSpeed(prev => Math.min(prev + 1, 10));
  const decreaseFan = () => setFanSpeed(prev => Math.max(prev - 1, 0));
  
  // Toggle functions
  const toggleAuto = () => setIsAuto(!isAuto);
  const toggleAC = () => setIsAC(!isAC);
  const toggleFrontDefrost = () => setIsFrontDefrost(!isFrontDefrost);
  const toggleRearDefrost = () => setIsRearDefrost(!isRearDefrost);
  
  return (
    <SafeAreaView style={styles.container}>
      {/* Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>空調控制</Text>
        <Text style={styles.statusTime}>10:21 AM</Text>
      </View>
      
      <View style={styles.content}>
        {/* Temperature Display */}
        <View style={styles.tempDisplay}>
          <Text style={styles.tempText}>{temperature}°C</Text>
          
          <View style={styles.tempControls}>
            <TouchableOpacity style={styles.tempButton} onPress={decreaseTemp}>
              <MaterialCommunityIcons name="minus" size={30} color="#fff" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.tempButton} onPress={increaseTemp}>
              <MaterialCommunityIcons name="plus" size={30} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Fan Speed Control */}
        <View style={styles.fanControl}>
          <Text style={styles.controlLabel}>風速控制</Text>
          
          <View style={styles.fanSliderContainer}>
            <TouchableOpacity onPress={decreaseFan}>
              <MaterialCommunityIcons name="fan-off" size={24} color="#aaa" />
            </TouchableOpacity>
            
            <Slider
              style={styles.slider}
              value={fanSpeed}
              minimumValue={0}
              maximumValue={10}
              step={1}
              minimumTrackTintColor="#3498db"
              maximumTrackTintColor="#333"
              thumbTintColor="#fff"
              onValueChange={(value: number) => setFanSpeed(value)}
            />
            
            <TouchableOpacity onPress={increaseFan}>
              <MaterialCommunityIcons name="fan" size={24} color="#fff" />
            </TouchableOpacity>
          </View>
          
          <View style={styles.fanSpeedIndicator}>
            {[...Array(10)].map((_, i) => (
              <View 
                key={i}
                style={[
                  styles.fanSpeedDot, 
                  i < fanSpeed ? styles.activeDot : styles.inactiveDot
                ]}
              />
            ))}
          </View>
        </View>
        
        {/* Climate Controls */}
        <View style={styles.climateControls}>
          <TouchableOpacity 
            style={[styles.climateButton, isAuto && styles.activeButton]} 
            onPress={toggleAuto}
          >
            <MaterialCommunityIcons 
              name="auto-fix" 
              size={24} 
              color={isAuto ? "#fff" : "#aaa"} 
            />
            <Text style={[styles.buttonText, isAuto && styles.activeText]}>
              自動
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.climateButton, isAC && styles.activeButton]}
            onPress={toggleAC}
          >
            <MaterialCommunityIcons 
              name="snowflake" 
              size={24} 
              color={isAC ? "#fff" : "#aaa"} 
            />
            <Text style={[styles.buttonText, isAC && styles.activeText]}>
              AC
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.climateButton, isFrontDefrost && styles.activeButton]}
            onPress={toggleFrontDefrost}
          >
            <MaterialCommunityIcons 
              name="car-defrost-front" 
              size={24} 
              color={isFrontDefrost ? "#fff" : "#aaa"} 
            />
            <Text style={[styles.buttonText, isFrontDefrost && styles.activeText]}>
              前除霜
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={[styles.climateButton, isRearDefrost && styles.activeButton]}
            onPress={toggleRearDefrost}
          >
            <MaterialCommunityIcons 
              name="car-defrost-rear" 
              size={24} 
              color={isRearDefrost ? "#fff" : "#aaa"} 
            />
            <Text style={[styles.buttonText, isRearDefrost && styles.activeText]}>
              後除霜
            </Text>
          </TouchableOpacity>
        </View>
        
        {/* Air Flow Direction */}
        <View style={styles.airFlowContainer}>
          <Text style={styles.controlLabel}>出風方向</Text>
          
          <View style={styles.airFlowButtons}>
            <TouchableOpacity style={[styles.airFlowButton, styles.activeButton]}>
              <MaterialCommunityIcons name="emoticon-outline" size={24} color="#fff" />
              <Text style={[styles.buttonText, styles.activeText]}>面部</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.airFlowButton}>
              <MaterialCommunityIcons name="car-seat" size={24} color="#aaa" />
              <Text style={styles.buttonText}>中間</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.airFlowButton}>
              <MaterialCommunityIcons name="shoe-print" size={24} color="#aaa" />
              <Text style={styles.buttonText}>腳部</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Power Button */}
        <TouchableOpacity style={styles.powerButton}>
          <MaterialCommunityIcons name="power" size={30} color="#e74c3c" />
          <Text style={styles.powerText}>關閉空調</Text>
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
  },
  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusTime: {
    color: '#fff',
    fontSize: 16,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  tempDisplay: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tempText: {
    color: '#fff',
    fontSize: 80,
    fontWeight: '300',
  },
  tempControls: {
    flexDirection: 'row',
    marginTop: 20,
  },
  tempButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  controlLabel: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  fanControl: {
    marginBottom: 30,
  },
  fanSliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  slider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  fanSpeedIndicator: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 10,
  },
  fanSpeedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  activeDot: {
    backgroundColor: '#3498db',
  },
  inactiveDot: {
    backgroundColor: '#333',
  },
  climateControls: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 30,
  },
  climateButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#121212',
  },
  activeButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
  },
  buttonText: {
    color: '#aaa',
    marginTop: 5,
  },
  activeText: {
    color: '#fff',
  },
  airFlowContainer: {
    marginBottom: 30,
  },
  airFlowButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  airFlowButton: {
    alignItems: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: '#121212',
    width: '30%',
  },
  powerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 15,
    borderRadius: 10,
    backgroundColor: 'rgba(231, 76, 60, 0.2)',
    marginTop: 20,
  },
  powerText: {
    color: '#e74c3c',
    fontWeight: 'bold',
    marginLeft: 10,
    fontSize: 16,
  },
});

export default ClimateScreen;