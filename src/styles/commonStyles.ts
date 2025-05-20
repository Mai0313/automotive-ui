import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
  },
  statusBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 5,
  },
  statusText: {
    color: "#fff",
    fontSize: 20,
    fontWeight: "bold",
  },
  statusInfo: {
    color: "#fff",
    fontSize: 16,
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  // 通用按鈕樣式
  controlButton: {
    alignItems: "center",
    padding: 10,
    borderRadius: 10,
  },
  activeButton: {
    backgroundColor: "rgba(52, 152, 219, 0.15)",
  },
  controlText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14,
  },
  activeText: {
    color: "#3498db",
    fontWeight: "bold",
  },
});
