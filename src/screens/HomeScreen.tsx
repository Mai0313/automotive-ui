import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, TouchableWithoutFeedback, Dimensions, PanResponder } from 'react-native';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView } from 'react-native-safe-area-context';
import MapView from '../components/MapView'; // Import MapView
import useCurrentTime from '../hooks/useCurrentTime'; // Import the hook
import commonStyles from '../styles/commonStyles';
import VehicleInfoScreen from './VehicleInfoScreen';
import MusicScreen from './MusicScreen';
import ClimateScreen from './ClimateScreen';
import AIAssistantScreen from './AIAssistantScreen';

const HomeScreen: React.FC = () => {
  const navigation = useNavigation();
  const currentTime = useCurrentTime(); // Use the hook
  const temperature = '30°C';
  const mapPreviewLocation = {
    latitude: 25.0339639,
    longitude: 121.5644722,
    latitudeDelta: 0.01,
    longitudeDelta: 0.01,
  };

  // overlay state and animation
  const [activeOverlay, setActiveOverlay] = useState<'vehicle'|'music'|'climate'|'ai'|null>(null);
  const [fullScreenOverlay, setFullScreenOverlay] = useState(false);
  const anim = useRef(new Animated.Value(0)).current;
  const screenH = Dimensions.get('window').height;
  const screenW = Dimensions.get('window').width;
  const baseOverlayWidth = screenW * 0.45;
  // overlay width state for resizing
  const [overlayWidthState, setOverlayWidthState] = useState(baseOverlayWidth);
  const overlayWidth = fullScreenOverlay ? screenW : overlayWidthState;

  useEffect(() => {
    Animated.timing(anim, { toValue: activeOverlay ? 1 : 0, duration: 300, useNativeDriver: true }).start();
  }, [activeOverlay, fullScreenOverlay]);
  // panel slides in/out horizontally from left
  const translateX = anim.interpolate({ inputRange: [0,1], outputRange: [-overlayWidth, 0] });
  // map shifts right to share space
  const mapTranslateX = anim.interpolate({ inputRange: [0,1], outputRange: [0, overlayWidth] });
  const mapWidth = anim.interpolate({ inputRange: [0,1], outputRange: [screenW, screenW - overlayWidth] });

  // add PanResponder for horizontal resize
  const panResponder = useRef(PanResponder.create({
    onStartShouldSetPanResponder: () => !fullScreenOverlay,
    onPanResponderMove: (_, gesture) => {
      // clamp between 20% and 80%
      const minW = screenW * 0.2;
      const maxW = screenW * 0.8;
      const newW = Math.min(Math.max(gesture.moveX, minW), maxW);
      setOverlayWidthState(newW);
    },
    onPanResponderTerminationRequest: () => false,
  })).current;

  return (
    <View style={commonStyles.container}>
      {/* Map area shrinks when overlay is active */}
      <Animated.View style={[styles.mapContainer, { width: mapWidth, transform: [{ translateX: mapTranslateX }] }]}>          
        <TouchableWithoutFeedback onPress={() => setActiveOverlay(null)}>
          <MapView style={{ flex: 1 }} initialRegion={mapPreviewLocation} />
        </TouchableWithoutFeedback>
      </Animated.View>

      {/* Drag handle between map and overlay for resizing */}
      {!fullScreenOverlay && activeOverlay && (
        <Animated.View
          {...panResponder.panHandlers}
          style={[styles.dragHandle, { left: overlayWidth - 10 }]}
        />
      )}

      {/* Animated overlay panel */}
      <Animated.View
        pointerEvents={activeOverlay ? 'auto' : 'none'}
        style={[
          styles.overlayCard,
          { width: overlayWidth, opacity: anim, left: 0, transform: [{ translateX }] }
        ]}
      >
        {/* Header with close and expand */}
        <View style={styles.overlayHeader}>
          <TouchableOpacity onPress={() => setActiveOverlay(null)}>
            <MaterialIcons name="close" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => setFullScreenOverlay(!fullScreenOverlay)}>
            <MaterialIcons name={fullScreenOverlay ? "fullscreen-exit" : "fullscreen"} size={24} color="#fff" />
          </TouchableOpacity>
        </View>
        {/* Render corresponding screen inside overlay */}
        {activeOverlay === 'vehicle' && <VehicleInfoScreen />}
        {activeOverlay === 'music'   && <MusicScreen />}
        {activeOverlay === 'climate' && <ClimateScreen />}
        {activeOverlay === 'ai'      && <AIAssistantScreen />}
      </Animated.View>

      {/* Bottom control bar fixed at bottom */}
      <View style={styles.bottomBar}>  
        {/* Shared control buttons */}
        {[
          { key: 'vehicle', icon: <MaterialCommunityIcons name="car" size={30} color="#fff" /> },
          { key: 'climate', icon: <MaterialCommunityIcons name="air-conditioner" size={30} color="#fff" /> },
          { key: 'music',   icon: <MaterialIcons name="music-note" size={30} color="#fff" /> },
          { key: 'ai',      icon: <MaterialIcons name="mic" size={30} color="#fff" /> },
        ].map(btn => (
          <TouchableOpacity
            key={btn.key}
            onPress={() => {
              // toggle overlay on repeat click
              if (activeOverlay === btn.key) {
                setActiveOverlay(null);
              } else {
                setActiveOverlay(btn.key as any);
                setFullScreenOverlay(false);
              }
            }}
          >
            {btn.icon}
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mapContainer: {
    height: '100%',
    backgroundColor: '#000',
  },
  overlayCard: {
    position: 'absolute',
    // float between status bar and bottom buttons
    top: 60,
    bottom: 100,
    backgroundColor: 'rgba(0,0,0,0.8)',
    borderRadius: 20,
    shadowColor: '#000',
    shadowOpacity: 0.5,
    shadowRadius: 10,
    elevation: 10,
    overflow: 'hidden',
  },
  overlayHeader: {
    position: 'absolute',
    top: 10,
    left: 10,
    right: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 10,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-around',
    backgroundColor: '#121212',
    padding: 10,
    borderRadius: 30,
  },
  dragHandle: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: 'transparent',
    zIndex: 5,
  },
});

export default HomeScreen;
