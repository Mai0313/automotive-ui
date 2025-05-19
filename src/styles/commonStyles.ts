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
});
