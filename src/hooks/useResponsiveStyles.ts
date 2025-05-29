import { useMemo } from "react";
import { useWindowDimensions } from "react-native";

interface ResponsiveScale {
  // 基础尺寸缩放
  buttonSize: number;
  iconSize: number;
  fontSize: number;
  padding: number;
  margin: number;
  borderRadius: number;

  // 特定按钮类型的缩放
  primaryButtonSize: number;
  secondaryButtonSize: number;
  smallButtonSize: number;

  // Icon 尺寸
  smallIconSize: number;
  mediumIconSize: number;
  largeIconSize: number;

  // 文字尺寸
  smallFontSize: number;
  mediumFontSize: number;
  largeFontSize: number;
  extraLargeFontSize: number;

  // 间距
  smallPadding: number;
  mediumPadding: number;
  largePadding: number;

  smallMargin: number;
  mediumMargin: number;
  largeMargin: number;
}

/**
 * 响应式样式 Hook
 * 根据屏幕尺寸计算适当的缩放比例
 */
export const useResponsiveStyles = (): ResponsiveScale => {
  const { width, height } = useWindowDimensions();

  return useMemo(() => {
    // 基准尺寸 (iPhone 12 Pro: 390x844)
    const baseWidth = 390;
    const baseHeight = 844;

    // 计算缩放比例，使用较小的维度来避免过度缩放
    const widthRatio = width / baseWidth;
    const heightRatio = height / baseHeight;
    const scale = Math.min(widthRatio, heightRatio);

    // 限制缩放范围，避免过小或过大
    const minScale = 0.6;
    const maxScale = 2.0;
    const constrainedScale = Math.max(minScale, Math.min(maxScale, scale));

    // 根据屏幕类型调整缩放策略
    const isTablet = width > 768;
    const isDesktop = width > 1024;

    let finalScale = constrainedScale;

    if (isDesktop) {
      // 桌面端稍微减少缩放，避免按钮过大
      finalScale = Math.max(0.8, Math.min(1.3, constrainedScale));
    } else if (isTablet) {
      // 平板端适中缩放
      finalScale = Math.max(0.7, Math.min(1.5, constrainedScale));
    }

    return {
      // 基础尺寸缩放
      buttonSize: Math.round(44 * finalScale), // 最小点击目标 44pt
      iconSize: Math.round(24 * finalScale),
      fontSize: Math.round(16 * finalScale),
      padding: Math.round(10 * finalScale),
      margin: Math.round(8 * finalScale),
      borderRadius: Math.round(8 * finalScale),

      // 特定按钮类型
      primaryButtonSize: Math.round(60 * finalScale),
      secondaryButtonSize: Math.round(50 * finalScale),
      smallButtonSize: Math.round(36 * finalScale),

      // Icon 尺寸
      smallIconSize: Math.round(16 * finalScale),
      mediumIconSize: Math.round(24 * finalScale),
      largeIconSize: Math.round(32 * finalScale),

      // 文字尺寸
      smallFontSize: Math.round(12 * finalScale),
      mediumFontSize: Math.round(16 * finalScale),
      largeFontSize: Math.round(20 * finalScale),
      extraLargeFontSize: Math.round(24 * finalScale),

      // 间距
      smallPadding: Math.round(6 * finalScale),
      mediumPadding: Math.round(10 * finalScale),
      largePadding: Math.round(16 * finalScale),

      smallMargin: Math.round(4 * finalScale),
      mediumMargin: Math.round(8 * finalScale),
      largeMargin: Math.round(16 * finalScale),
    };
  }, [width, height]);
};

/**
 * 通用响应式按钮样式生成器
 */
export const useResponsiveButtonStyles = () => {
  const scale = useResponsiveStyles();

  return useMemo(
    () => ({
      // 主要按钮样式
      primaryButton: {
        minWidth: scale.primaryButtonSize,
        minHeight: scale.primaryButtonSize,
        padding: scale.mediumPadding,
        borderRadius: scale.borderRadius,
      },

      // 次要按钮样式
      secondaryButton: {
        minWidth: scale.secondaryButtonSize,
        minHeight: scale.secondaryButtonSize,
        padding: scale.smallPadding,
        borderRadius: scale.borderRadius,
      },

      // 小按钮样式
      smallButton: {
        minWidth: scale.smallButtonSize,
        minHeight: scale.smallButtonSize,
        padding: scale.smallPadding,
        borderRadius: Math.round(scale.borderRadius * 0.7),
      },

      // 图标按钮样式
      iconButton: {
        width: scale.buttonSize,
        height: scale.buttonSize,
        borderRadius: scale.buttonSize / 2,
        padding: scale.smallPadding,
      },

      // 底部栏按钮样式
      bottomBarButton: {
        minWidth: scale.buttonSize,
        minHeight: scale.buttonSize,
        padding: scale.mediumPadding,
        margin: scale.mediumMargin,
        borderRadius: scale.borderRadius,
      },

      // 控制按钮样式 (ClimateScreen 等)
      controlButton: {
        padding: scale.mediumPadding,
        borderRadius: scale.borderRadius,
        minWidth: scale.secondaryButtonSize,
        minHeight: scale.secondaryButtonSize,
      },

      // 文字样式
      buttonText: {
        fontSize: scale.mediumFontSize,
      },

      smallButtonText: {
        fontSize: scale.smallFontSize,
      },

      largeButtonText: {
        fontSize: scale.largeFontSize,
      },
    }),
    [scale],
  );
};

export default useResponsiveStyles;
