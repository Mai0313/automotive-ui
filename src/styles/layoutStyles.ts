import { StyleSheet, Platform } from "react-native";

// 集中管理所有螢幕的佈局樣式
export const layoutStyles = StyleSheet.create({
  // === HomeScreen 樣式 ===
  homeMapContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    width: undefined,
    height: undefined,
    backgroundColor: "transparent",
  },
  homeNotificationIcon: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    right: 20,
    zIndex: 150,
  },
  homeVoiceStatusIcon: {
    position: "absolute",
    top: Platform.OS === "web" ? 40 : 10,
    left: 20,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(0, 0, 0, 0.6)",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 150,
  },
  homeOverlayCard: {
    position: "absolute",
    // float between status bar and bottom buttons
    top: 80, // 原本 60，往下縮小
    bottom: 120, // 原本 100，往上縮小
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    boxShadow: "0 4px 24px rgba(0,0,0,0.5)", // web only, RN web 支援
    overflow: "hidden",
  },
  homeOverlayHeader: {
    position: "absolute",
    top: 10,
    left: 10,
    right: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    zIndex: 10,
  },
  homeBottomBar: {
    position: "absolute",
    bottom: 20,
    left: 20,
    right: 20,
    flexDirection: "row",
    justifyContent: "space-around",
    backgroundColor: "#121212",
    padding: 10,
    borderRadius: 28,
  },
  homeDragHandle: {
    position: "absolute",
    top: 0,
    bottom: 0,
    width: 20,
    backgroundColor: "transparent",
    zIndex: 5,
  },
  homeBottomBarBtn: {
    backgroundColor: "transparent",
    borderRadius: 20,
    padding: 10,
    marginHorizontal: 16, // 原本 6，調大間隔
    alignItems: "center",
    justifyContent: "center",
    minWidth: 44,
    minHeight: 44,
  },
  homeTempBarWrap: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "transparent",
    borderRadius: 20,
    marginHorizontal: 4,
    paddingHorizontal: 0,
    paddingVertical: 0,
    minWidth: 220, // 固定整個溫度區寬度，避免小數點時影響按鈕位置
    justifyContent: "center",
  },
  homeTempTextWrap: {
    width: 64, // 改為固定寬度，避免內容變動影響布局
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 16,
    backgroundColor: "transparent",
    minHeight: 36,
  },
  homeTempOff: {
    backgroundColor: "#2a0000",
    borderColor: "#e74c3c",
    borderWidth: 2,
  },
  homeTempOffContent: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
  },
  homeTempText: {
    color: "#fff",
    fontSize: 22,
    fontWeight: "bold",
  },
  homeTempTextOff: {
    color: "#e74c3c",
    fontSize: 22,
    fontWeight: "bold",
  },
  homeIconWithBadge: {
    position: "relative",
  },
  homeBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#e74c3c",
  },

  // === MusicScreen 樣式 ===
  musicStatusInfo: {
    color: "#fff",
    fontSize: 16,
  },
  musicContainer: {
    flex: 1,
    width: "100%", // full width for web responsiveness
    backgroundColor: "#000",
  },
  musicStatusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 10,
  },
  musicStatusText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  musicStatusRight: {
    // Added style for statusRight
    flexDirection: "row",
    alignItems: "center",
  },
  musicContent: {
    flex: 1,
    width: "100%",
    alignItems: "center",
    paddingHorizontal: 0, // no horizontal padding in portrait for center alignment
    paddingTop: 20,
  },
  musicContentLandscape: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 20, // margin from edges
  },
  musicContentPortrait: {
    paddingHorizontal: 0, // override for portrait
    maxWidth: 600, // limit width in portrait for centering
    alignSelf: "center", // center container
  },
  musicAlbumContainer: {
    // width is overridden per orientation
    maxWidth: 400, // limit size on wide displays
    aspectRatio: 1,
    marginBottom: 30,
    boxShadow: "0px 2px 10px rgba(52, 152, 219, 0.3)",
    elevation: 5,
  },
  musicAlbumContainerPortrait: {
    width: "80%", // wider in portrait
    alignSelf: "center", // center album cover horizontally
  },
  musicAlbumContainerLandscape: {
    width: "40%", // occupy left 40%
    marginLeft: 20, // from left edge
  },
  musicAlbumArt: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  musicRightContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center", // center in portrait
    paddingLeft: 0, // remove left offset
  },
  musicRightContainerPortrait: {
    width: "80%", // match album width in portrait
    alignSelf: "center", // center controls/info
  },
  musicRightContainerLandscape: {
    width: "60%", // occupy right 60% (from album edge to screen edge)
    alignItems: "center", // center content horizontally in landscape
  },
  musicInfoContainer: {
    alignItems: "center",
    marginBottom: 30,
    width: "100%",
  },
  musicSongTitle: {
    color: "#fff",
    fontSize: 28,
    fontWeight: "bold",
    marginBottom: 5,
  },
  musicArtistName: {
    color: "#ddd",
    fontSize: 22,
    marginBottom: 5,
  },
  musicAlbumName: {
    color: "#999",
    fontSize: 18,
  },
  musicProgressContainer: {
    width: "100%",
    marginBottom: 30,
  },
  musicProgressContainerLandscape: {
    width: "80%",
    alignSelf: "center",
    marginVertical: 20,
  },
  musicSlider: {
    width: "100%",
    height: 40,
  },
  musicTimeContainer: {
    flexDirection: "row",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 15,
  },
  musicTimeText: {
    color: "#aaa",
    fontSize: 14,
  },
  musicControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 30,
    width: "80%",
  },
  musicControlsLandscape: {
    width: "100%", // full width of right container
    justifyContent: "space-around",
    marginVertical: 20,
  },
  musicControlButton: {
    paddingHorizontal: 20,
  },
  musicPlayButton: {
    backgroundColor: "rgba(52, 152, 219, 0.2)",
    borderRadius: 50,
    width: 100,
    height: 100,
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  musicAdditionalControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    width: "80%",
    marginBottom: 20,
  },
  musicAdditionalControlsLandscape: {
    width: "100%", // full width of right container
    justifyContent: "space-around",
    marginBottom: 20,
  },
  musicAdditionalControlButton: {
    padding: 15,
  },
  musicOverlayCard: {
    backgroundColor: "rgba(0,0,0,0.8)",
    borderRadius: 20,
    margin: 20,
    padding: 0,
    justifyContent: "center",
    alignItems: "center",
    boxShadow: "0px 0px 10px rgba(0, 0, 0, 0.5)",
    elevation: 10,
  },

  // === AIAssistantScreen 樣式 ===
  aiContainer: {
    justifyContent: "center",
    alignItems: "center",
  },
  aiContent: {
    alignItems: "center",
    justifyContent: "center",
    flex: 1,
  },
  aiPrimaryButton: {
    backgroundColor: "#2c3e50",
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },

  // === VehicleInfoScreen 樣式 ===
  vehicleContent: {
    flex: 1,
    paddingHorizontal: 20,
  },
  vehicleSpeedContainer: {
    alignItems: "center",
    marginVertical: 20,
  },
  vehicleSpeedText: {
    color: "#fff",
    fontSize: 120,
    fontWeight: "200", // Tesla uses a very thin font for speed
  },
  vehicleUnitText: {
    color: "#aaa",
    fontSize: 24,
    marginTop: -20,
  },
  vehicleGearIndicator: {
    flexDirection: "row",
    marginTop: 10,
  },
  vehicleGearText: {
    color: "#555",
    fontSize: 24,
    fontWeight: "bold",
    marginHorizontal: 10,
  },
  vehicleActiveGear: {
    color: "#fff",
  },
  vehicleRangeContainer: {
    marginBottom: 20,
  },
  vehicleBatteryInfoSmall: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
  },
  vehicleRangeTextSmall: {
    color: "#fff",
    fontSize: 15,
    marginLeft: 8,
    marginRight: 6,
  },
  vehicleBatteryPercent: {
    color: "#4CAF50",
    fontSize: 13,
    fontWeight: "bold",
    marginLeft: 2,
  },
  vehicleVisual: {
    alignItems: "center",
    marginVertical: 20,
  },
  vehicleCarImage: {
    width: "100%",
    height: 150,
    resizeMode: "contain",
  },
  vehicleQuickControls: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  vehicleControlButton: {
    alignItems: "center",
    padding: 10,
  },
  vehicleActiveButton: {
    backgroundColor: "rgba(52, 152, 219, 0.15)",
  },
  vehicleControlText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },
  vehicleActiveText: {
    color: "#3498db",
    fontWeight: "bold",
  },
  vehicleAssistancePanel: {
    flexDirection: "row",
    justifyContent: "space-around",
    marginVertical: 20,
  },
  vehicleAssistanceButton: {
    alignItems: "center",
    backgroundColor: "rgba(52, 152, 219, 0.1)",
    padding: 15,
    borderRadius: 10,
    width: "45%",
  },
  vehicleAssistanceText: {
    color: "#3498db",
    marginTop: 5,
    fontSize: 16,
  },
  vehicleTopCarVisualWrap: {
    width: "100%",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 10,
  },
  vehicleTopCarImage: {
    width: 180,
    height: 90,
    opacity: 0.95,
  },
  vehicleWarningBar: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    // backgroundColor: "#111",
    padding: 10,
    borderRadius: 5,
    margin: 10,
  },
  vehicleWarningIcon: {
    marginHorizontal: 5,
  },

  // === ClimateScreen 樣式 ===
  climateControlsContainer: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  climateTempDisplay: {
    alignItems: "center",
    marginBottom: 40,
  },
  climateTempText: {
    color: "#fff",
    fontSize: 80,
    fontWeight: "300",
  },
  climateTempControls: {
    flexDirection: "row",
    marginTop: 20,
  },
  climateTempButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: "#333",
    justifyContent: "center",
    alignItems: "center",
    marginHorizontal: 20,
  },
  climateControlLabel: {
    color: "#fff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 15,
  },
  climateFanControl: {
    marginBottom: 30,
  },
  climateFanSliderContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  climateSlider: {
    flex: 1,
    height: 40,
    marginHorizontal: 10,
  },
  climateFanSpeedIndicator: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
  },
  climateFanSpeedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  climateActiveDot: {
    backgroundColor: "#3498db",
  },
  climateInactiveDot: {
    backgroundColor: "#333",
  },
  climateClimateControls: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 30,
  },
  climateAirFlowContainer: {
    marginBottom: 30,
  },
  climateAirFlowButtons: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  climateAirFlowButton: {
    alignItems: "center",
    padding: 15,
    borderRadius: 10,
    width: "30%",
  },
});
