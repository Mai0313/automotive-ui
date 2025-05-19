import React from "react";
import { NavigationContainer } from "@react-navigation/native";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { Provider as PaperProvider, DefaultTheme } from "react-native-paper";

import HomeScreen from "./src/screens/HomeScreen";
import FloatingStatusBar from "./src/components/FloatingStatusBar";

// Define the dark theme for Tesla-like UI
const darkTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: "#fff",
    accent: "#007aff",
    background: "#000",
    surface: "#121212",
    text: "#fff",
    disabled: "#666",
  },
};

export default function App() {
  return (
    <SafeAreaProvider>
      <PaperProvider theme={darkTheme}>
        <NavigationContainer>
          <StatusBar style="light" />
          <FloatingStatusBar />
          <HomeScreen />
        </NavigationContainer>
      </PaperProvider>
    </SafeAreaProvider>
  );
}
