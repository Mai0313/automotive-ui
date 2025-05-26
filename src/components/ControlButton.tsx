import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import commonStyles from "../styles/commonStyles";

interface ControlButtonProps {
  iconName: React.ComponentProps<typeof MaterialCommunityIcons>["name"];
  label?: string;
  active?: boolean;
  onPress: () => void;
  style?: ViewStyle;
  textStyle?: TextStyle;
}

const ControlButton: React.FC<ControlButtonProps> = ({
  iconName,
  label,
  active = false,
  onPress,
  style,
  textStyle,
}) => (
  <TouchableOpacity
    style={[
      commonStyles.controlButton,
      active && commonStyles.activeButton,
      style,
    ]}
    onPress={onPress}
  >
    <MaterialCommunityIcons
      color={active ? "#3498db" : "#fff"}
      name={iconName}
      size={24}
    />
    {label && (
      <Text
        style={[
          commonStyles.controlText,
          active && commonStyles.activeText,
          textStyle,
        ]}
      >
        {label}
      </Text>
    )}
  </TouchableOpacity>
);

export default ControlButton;
