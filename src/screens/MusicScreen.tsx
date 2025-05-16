import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

// Use native slider on mobile, fallback to web input on web
const Slider = Platform.OS === 'web'
  ? ({ style, ...props }: any) => <input type="range" style={StyleSheet.flatten(style)} {...props} />
  : require('@react-native-community/slider').default;

import useCurrentTime from '../hooks/useCurrentTime'; // Import the hook

const MusicScreen: React.FC = () => {
  const currentTime = useCurrentTime(); // Use the hook
  // Mock music data
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3); // Current song progress (0-1)
  
  // Mock song info
  const songTitle = 'Alpha Omega';
  const artistName = 'Karnivool';
  const albumName = 'Asymmetry';
  const totalTime = '5:12';
  
  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };
  
  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>音樂</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusTemp}>25°C</Text>
          <Text style={styles.statusTime}>{currentTime}</Text>
        </View>
      </View>
      
      {/* Main Content */}
      <View style={styles.content}>
        {/* Album Art */}
        <View style={styles.albumContainer}>
          <Image 
            source={{ uri: 'https://via.placeholder.com/500x500/333/fff?text=Album+Art' }} 
            style={styles.albumArt} 
          />
        </View>
        
        {/* Song Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.songTitle}>{songTitle}</Text>
          <Text style={styles.artistName}>{artistName}</Text>
          <Text style={styles.albumName}>{albumName}</Text>
        </View>
        
        {/* Playback Progress */}
        <View style={styles.progressContainer}>
          <Slider
            value={progress}
            onValueChange={(value: number) => setProgress(value)}
            minimumTrackTintColor="#3498db"
            maximumTrackTintColor="#333"
            thumbTintColor="#fff"
            style={styles.slider}
          />
          <View style={styles.timeContainer}>
            <Text style={styles.timeText}>{currentTime}</Text>
            <Text style={styles.timeText}>{totalTime}</Text>
          </View>
        </View>
        
        {/* Playback Controls */}
        <View style={styles.controls}>
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="skip-previous" size={50} color="#fff" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.playButton} onPress={togglePlayback}>
            <MaterialIcons 
              name={isPlaying ? "pause" : "play-arrow"} 
              size={70} 
              color="#fff" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.controlButton}>
            <MaterialIcons name="skip-next" size={50} color="#fff" />
          </TouchableOpacity>
        </View>
        
        {/* Additional Controls */}
        <View style={styles.additionalControls}>
          <TouchableOpacity style={styles.additionalControlButton}>
            <MaterialIcons name="shuffle" size={25} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalControlButton}>
            <MaterialIcons name="repeat" size={25} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalControlButton}>
            <MaterialIcons name="queue-music" size={25} color="#888" />
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.additionalControlButton}>
            <MaterialIcons name="devices" size={25} color="#888" />
          </TouchableOpacity>
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
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  statusText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  statusRight: { // Added style for statusRight
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusTemp: { // Added style for statusTemp
    color: '#fff',
    fontSize: 16,
    marginRight: 10,
  },
  statusTime: {
    color: '#fff',
  },
  content: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  albumContainer: {
    width: '60%',
    aspectRatio: 1,
    marginBottom: 30,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  infoContainer: {
    alignItems: 'center',
    marginBottom: 30,
    width: '100%',
  },
  songTitle: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 5,
  },
  artistName: {
    color: '#ddd',
    fontSize: 22,
    marginBottom: 5,
  },
  albumName: {
    color: '#999',
    fontSize: 18,
  },
  progressContainer: {
    width: '100%',
    marginBottom: 30,
  },
  slider: {
    width: '100%',
    height: 40,
  },
  timeContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 15,
  },
  timeText: {
    color: '#aaa',
    fontSize: 14,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    width: '80%',
  },
  controlButton: {
    paddingHorizontal: 20,
  },
  playButton: {
    backgroundColor: 'rgba(52, 152, 219, 0.2)',
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 20,
  },
  additionalControls: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '80%',
    marginBottom: 20,
  },
  additionalControlButton: {
    padding: 15,
  },
});

export default MusicScreen;