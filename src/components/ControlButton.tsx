import React from "react";
import { TouchableOpacity, Text, ViewStyle, TextStyle } from "react-native";
import { MaterialCommunityIcons } from "@expo/vector-icons";

import commonStyles from "../styles/commonStyles";
import {
  useResponsiveStyles,
  useResponsiveButtonStyles,
} from "../hooks/useResponsiveStyles";

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
}) => {
  const scale = useResponsiveStyles();
  const buttonStyles = useResponsiveButtonStyles();

  return (
    <TouchableOpacity
      style={[
        commonStyles.controlButton,
        buttonStyles.controlButton,
        active && commonStyles.activeButton,
        style,
      ]}
      onPress={onPress}
    >
      <MaterialCommunityIcons
        color={active ? "#3498db" : "#fff"}
        name={iconName}
        size={scale.mediumIconSize}
      />
      {label && (
        <Text
          style={[
            commonStyles.controlText,
            buttonStyles.buttonText,
            active && commonStyles.activeText,
            textStyle,
          ]}
        >
          {label}
        </Text>
      )}
    </TouchableOpacity>
  );
};

export default ControlButton;
