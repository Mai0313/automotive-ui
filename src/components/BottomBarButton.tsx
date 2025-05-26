import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

interface BottomBarButtonProps {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  onPress: () => void;
  style?: ViewStyle;
  badge?: boolean;
}

const BottomBarButton: React.FC<BottomBarButtonProps> = ({
  iconName,
  onPress,
  style,
  badge = false,
}) => (
  <TouchableOpacity style={style} onPress={onPress}>
    <View style={{ position: "relative" }}>
      <MaterialCommunityIcons color="#fff" name={iconName} size={28} />
      {badge && (
        <View
          style={{
            position: "absolute",
            top: -2,
            right: -2,
            width: 8,
            height: 8,
            borderRadius: 4,
            backgroundColor: "#e74c3c",
          }}
        />
      )}
    </View>
  </TouchableOpacity>
);

export default BottomBarButton;
