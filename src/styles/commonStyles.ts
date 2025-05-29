import { StyleSheet } from "react-native";

// 注意：这个文件现在主要作为基础样式模板
// 实际的响应式尺寸请使用 useResponsiveStyles hook

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
    fontSize: 20, // 将被响应式样式覆盖
    fontWeight: "bold",
  },
  statusInfo: {
    color: "#fff",
    fontSize: 16, // 将被响应式样式覆盖
  },
  statusRight: {
    flexDirection: "row",
    alignItems: "center",
  },
  // 通用按鈕樣式 - 现在使用响应式尺寸
  controlButton: {
    alignItems: "center",
    padding: 10, // 将被响应式样式覆盖
    borderRadius: 10, // 将被响应式样式覆盖
  },
  activeButton: {
    backgroundColor: "rgba(52, 152, 219, 0.15)",
  },
  controlText: {
    color: "#fff",
    marginTop: 5,
    fontSize: 14, // 将被响应式样式覆盖
  },
  activeText: {
    color: "#3498db",
    fontWeight: "bold",
  },
});
