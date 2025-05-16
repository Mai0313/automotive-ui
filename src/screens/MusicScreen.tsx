import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Dimensions, StatusBar, Platform, useWindowDimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';

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
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
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
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" />
      
      {/* Top Status Bar */}
      <View style={styles.statusBar}>
        <Text style={styles.statusText}>音樂</Text>
        <View style={styles.statusRight}>
          <Text style={styles.statusInfo}>25°C</Text>
          <Text style={[styles.statusInfo, { marginLeft: 10 }]}>{currentTime}</Text>
        </View>
      </View>
      
      {/* Main Content: responsive to orientation */}
      <View style={[styles.content, isLandscape ? styles.contentLandscape : styles.contentPortrait]}>
        <View style={[styles.albumContainer, isLandscape ? styles.albumContainerLandscape : styles.albumContainerPortrait]}>
          {/* full white album art placeholder */}
          <View style={[styles.albumArt, { backgroundColor: '#fff' }]} />
        </View>
        <View style={[styles.rightContainer, isLandscape ? styles.rightContainerLandscape : styles.rightContainerPortrait]}>
          {/* Song Info */}
          <View style={styles.infoContainer}>
            <Text style={styles.songTitle}>{songTitle}</Text>
            <Text style={styles.artistName}>{artistName}</Text>
            <Text style={styles.albumName}>{albumName}</Text>
          </View>
          
          {/* Playback Progress */}
          <View style={[styles.progressContainer, isLandscape && styles.progressContainerLandscape]}>
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
          <View style={[styles.controls, isLandscape && styles.controlsLandscape]}>
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
          <View style={[styles.additionalControls, isLandscape && styles.additionalControlsLandscape]}>
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  statusInfo: { color: '#fff', fontSize: 16 },
  container: {
    flex: 1,
    width: '100%', // full width for web responsiveness
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
  content: {
    flex: 1,
    width: '100%',
    alignItems: 'center',
    paddingHorizontal: 0,  // no horizontal padding in portrait for center alignment
    paddingTop: 20,
  },
  contentLandscape: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    paddingHorizontal: 20, // margin from edges
  },
  contentPortrait: {
    paddingHorizontal: 0,  // override for portrait
    maxWidth: 600,         // limit width in portrait for centering
    alignSelf: 'center',   // center container
  },
  albumContainer: {
    // width is overridden per orientation
    maxWidth: 400,  // limit size on wide displays
    aspectRatio: 1,
    marginBottom: 30,
    shadowColor: '#3498db',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 10,
    elevation: 5,
  },
  albumContainerPortrait: {
    width: '80%',     // wider in portrait
    alignSelf: 'center',  // center album cover horizontally
  },
  albumContainerLandscape: {
    width: '40%',      // occupy left 40%
    marginLeft: 20,    // from left edge
  },
  albumArt: {
    width: '100%',
    height: '100%',
    borderRadius: 8,
  },
  rightContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',  // center in portrait
    paddingLeft: 0,        // remove left offset
  },
  rightContainerPortrait: {
    width: '80%',      // match album width in portrait
    alignSelf: 'center',  // center controls/info
  },
  rightContainerLandscape: {
    width: '60%',      // occupy right 60% (from album edge to screen edge)
    alignItems: 'center', // center content horizontally in landscape
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
  progressContainerLandscape: {
    width: '80%',
    alignSelf: 'center',
    marginVertical: 20,
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
  controlsLandscape: {
    width: '100%',      // full width of right container
    justifyContent: 'space-around',
    marginVertical: 20,
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
  additionalControlsLandscape: {
    width: '100%',      // full width of right container
    justifyContent: 'space-around',
    marginBottom: 20,
  },
  additionalControlButton: {
    padding: 15,
  },
});

export default MusicScreen;