import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, Image, TouchableOpacity, Platform } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import commonStyles from '../styles/commonStyles';

// Slider fallback for web with proper HTML attributes
const Slider = Platform.OS === 'web'
  ? ({ value, onValueChange, minimumValue = 0, maximumValue = 1, step = 0.01, style, ..._omit }: any) => (
      <input
        type="range"
        value={value}
        min={minimumValue}
        max={maximumValue}
        step={step}
        onChange={e => onValueChange(parseFloat(e.target.value))}
        style={StyleSheet.flatten(style)}
      />
    )
  : require('@react-native-community/slider').default;

import useCurrentTime from '../hooks/useCurrentTime'; // Import the hook

// Helper to format seconds to mm:ss
const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);
  return `${m}:${s < 10 ? '0' + s : s}`;
};

const MusicScreen: React.FC = () => {
  const currentTime = useCurrentTime(); // Use the hook
  const temperature = '28°C';

  // Mock music data
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0.3); // Current song progress (0-1)
  
  // Mock song info
  const songTitle = 'Alpha Omega';
  const artistName = 'Karnivool';
  const albumName = 'For Demo use'; // updated album name
  const totalTime = '5:12';
  // parse total duration once
  const [totalMinutes, totalSecondsStr] = totalTime.split(':').map(v => parseInt(v, 10));
  const totalSecondsAll = totalMinutes * 60 + totalSecondsStr;

  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
       {/* Album art */}
       <Image
        source={{ uri: 'https://via.placeholder.com/400x400.png?text=Album+Art' }}
        style={styles.albumArt}
      />

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
          style={styles.slider}
        />
        <View style={styles.timeContainer}>
          <Text style={styles.timeText}>{formatTime(progress * totalSecondsAll)}</Text>
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
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%', // full width for web responsiveness
    backgroundColor: '#000',
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