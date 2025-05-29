import React from "react";
import { TouchableOpacity, View, ViewStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import {
  useResponsiveStyles,
  useResponsiveButtonStyles,
} from "../hooks/useResponsiveStyles";

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
}) => {
  const scale = useResponsiveStyles();
  const buttonStyles = useResponsiveButtonStyles();

  return (
    <TouchableOpacity
      style={[buttonStyles.bottomBarButton, style]}
      onPress={onPress}
    >
      <View style={{ position: "relative" }}>
        <MaterialCommunityIcons
          color="#fff"
          name={iconName}
          size={scale.largeIconSize}
        />
        {badge && (
          <View
            style={{
              position: "absolute",
              top: -2,
              right: -2,
              width: scale.smallMargin,
              height: scale.smallMargin,
              borderRadius: scale.smallMargin / 2,
              backgroundColor: "#e74c3c",
            }}
          />
        )}
      </View>
    </TouchableOpacity>
  );
};

export default BottomBarButton;
