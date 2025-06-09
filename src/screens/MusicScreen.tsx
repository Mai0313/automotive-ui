import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Platform,
  useWindowDimensions,
} from "react-native";
import { MaterialIcons } from "@expo/vector-icons";
import { SafeAreaView } from "react-native-safe-area-context";

import commonStyles from "../styles/commonStyles";
import { useResponsiveStyles } from "../hooks/useResponsiveStyles";
import { layoutStyles } from "../styles/layoutStyles";

// Slider fallback for web with proper HTML attributes
const Slider =
  Platform.OS === "web"
    ? ({
        value,
        onValueChange,
        minimumValue = 0,
        maximumValue = 1,
        step = 0.01,
        style,
        ..._omit
      }: any) => (
        <input
          max={maximumValue}
          min={minimumValue}
          step={step}
          style={StyleSheet.flatten(style)}
          type="range"
          value={value}
          onChange={(e) => onValueChange(parseFloat(e.target.value))}
        />
      )
    : require("@react-native-community/slider").default;

// Helper to format seconds to mm:ss
const formatTime = (secs: number) => {
  const m = Math.floor(secs / 60);
  const s = Math.floor(secs % 60);

  return `${m}:${s < 10 ? "0" + s : s}`;
};

const MusicScreen: React.FC = () => {
  const responsiveScale = useResponsiveStyles();
  const { width, height } = useWindowDimensions();
  const isLandscape = width > height;
  // Mock music data
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [progress, setProgress] = useState<number>(0.3);

  // Mock song info
  const songTitle = "Demo Music";
  const artistName = "Demo Artist";
  const albumName = "Demo Album"; // updated album name
  const totalTime = "8:07";
  // parse total duration once
  const [totalMinutes, totalSecondsStr] = totalTime
    .split(":")
    .map((v) => parseInt(v, 10));
  const totalSecondsAll = totalMinutes * 60 + totalSecondsStr;

  // Toggle play/pause
  const togglePlayback = () => {
    setIsPlaying(!isPlaying);
  };

  return (
    <SafeAreaView style={commonStyles.container}>
      {/* Main Content: responsive to orientation */}
      <View
        style={[
          layoutStyles.musicContent,
          isLandscape
            ? layoutStyles.musicContentLandscape
            : layoutStyles.musicContentPortrait,
        ]}
      >
        <View
          style={[
            layoutStyles.musicAlbumContainer,
            isLandscape
              ? layoutStyles.musicAlbumContainerLandscape
              : layoutStyles.musicAlbumContainerPortrait,
          ]}
        >
          {/* full white album art placeholder */}
          <View
            style={[layoutStyles.musicAlbumArt, { backgroundColor: "#fff" }]}
          />
        </View>
        <View
          style={[
            layoutStyles.musicRightContainer,
            isLandscape
              ? layoutStyles.musicRightContainerLandscape
              : layoutStyles.musicRightContainerPortrait,
          ]}
        >
          {/* Song Info */}
          <View style={layoutStyles.musicInfoContainer}>
            <Text style={layoutStyles.musicSongTitle}>{songTitle}</Text>
            <Text style={layoutStyles.musicArtistName}>{artistName}</Text>
            <Text style={layoutStyles.musicAlbumName}>{albumName}</Text>
          </View>

          {/* Playback Progress */}
          <View
            style={[
              layoutStyles.musicProgressContainer,
              isLandscape && layoutStyles.musicProgressContainerLandscape,
            ]}
          >
            <Slider
              style={layoutStyles.musicSlider}
              value={progress}
              onValueChange={(value: number) => setProgress(value)}
            />
            <View style={layoutStyles.musicTimeContainer}>
              <Text style={layoutStyles.musicTimeText}>
                {formatTime(progress * totalSecondsAll)}
              </Text>
              <Text style={layoutStyles.musicTimeText}>{totalTime}</Text>
            </View>
          </View>

          {/* Playback Controls */}
          <View
            style={[
              layoutStyles.musicControls,
              isLandscape && layoutStyles.musicControlsLandscape,
            ]}
          >
            <TouchableOpacity style={layoutStyles.musicControlButton}>
              <MaterialIcons
                color="#fff"
                name="skip-previous"
                size={responsiveScale.largeIconSize * 1.5}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={layoutStyles.musicPlayButton}
              onPress={togglePlayback}
            >
              <MaterialIcons
                color="#fff"
                name={isPlaying ? "pause" : "play-arrow"}
                size={responsiveScale.largeIconSize * 2.2}
              />
            </TouchableOpacity>

            <TouchableOpacity style={layoutStyles.musicControlButton}>
              <MaterialIcons
                color="#fff"
                name="skip-next"
                size={responsiveScale.largeIconSize * 1.5}
              />
            </TouchableOpacity>
          </View>

          {/* Additional Controls */}
          <View
            style={[
              layoutStyles.musicAdditionalControls,
              isLandscape && layoutStyles.musicAdditionalControlsLandscape,
            ]}
          >
            <TouchableOpacity style={layoutStyles.musicAdditionalControlButton}>
              <MaterialIcons
                color="#888"
                name="shuffle"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>

            <TouchableOpacity style={layoutStyles.musicAdditionalControlButton}>
              <MaterialIcons
                color="#888"
                name="repeat"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>

            <TouchableOpacity style={layoutStyles.musicAdditionalControlButton}>
              <MaterialIcons
                color="#888"
                name="queue-music"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>

            <TouchableOpacity style={layoutStyles.musicAdditionalControlButton}>
              <MaterialIcons
                color="#888"
                name="devices"
                size={responsiveScale.mediumIconSize}
              />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      {Platform.OS !== "web" && (
        <TouchableOpacity
          style={{
            margin: 20,
            backgroundColor: "#3498db",
            padding: 10,
            borderRadius: 8,
          }}
        />
      )}
    </SafeAreaView>
  );
};

export default MusicScreen;
