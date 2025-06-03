import { useState, useEffect } from "react";
import { Platform } from "react-native";

export interface PermissionHelpConfig {
  showHelp: boolean;
  hasPermissionIssues: boolean;
  hasOpenAIIssues: boolean;
  hasRealtimeVoiceIssues: boolean;
  realtimeVoiceError: string | null;
  locationError: string | null;
  openAIErrors: string[];
  realtimeVoiceStatus: string;
  currentOrigin: string;
}

interface UsePermissionHelpProps {
  realtimeVoiceError?: string | null | undefined;
  locationError?: string | null | undefined;
  openAIErrors?: string[];
  isRealtimeVoiceConnected?: boolean;
  realtimeVoiceConnectionStatus?: string;
}

export const usePermissionHelp = ({
  realtimeVoiceError,
  locationError,
  openAIErrors = [],
  isRealtimeVoiceConnected = false,
  realtimeVoiceConnectionStatus = "未連線",
}: UsePermissionHelpProps) => {
  const [showHelp, setShowHelp] = useState(false);

  // 檢查權限問題
  const hasPermissionIssues = Boolean(
    (realtimeVoiceError && realtimeVoiceError.includes("權限")) ||
      (locationError && locationError.includes("權限")),
  );

  // 檢查 OpenAI API 問題
  const hasOpenAIIssues = openAIErrors.length > 0;

  // 檢查 Realtime Voice 連線問題
  const hasRealtimeVoiceIssues = Boolean(
    !isRealtimeVoiceConnected ||
      (realtimeVoiceError && !realtimeVoiceError.includes("權限")) ||
      realtimeVoiceConnectionStatus.includes("失敗") ||
      realtimeVoiceConnectionStatus.includes("錯誤"),
  );

  // 檢查是否有任何問題需要顯示說明
  const hasAnyIssues =
    hasPermissionIssues || hasOpenAIIssues || hasRealtimeVoiceIssues;

  // 取得當前網址 origin
  const currentOrigin =
    typeof window !== "undefined" ? window.location.origin : "";

  // 如果有問題且在 web 平台，自動顯示說明
  useEffect(() => {
    if (hasAnyIssues && Platform.OS === "web") {
      setShowHelp(true);
    }
  }, [hasAnyIssues]);

  const config: PermissionHelpConfig = {
    showHelp,
    hasPermissionIssues,
    hasOpenAIIssues,
    hasRealtimeVoiceIssues,
    realtimeVoiceError: realtimeVoiceError || null,
    locationError: locationError || null,
    openAIErrors,
    realtimeVoiceStatus: realtimeVoiceConnectionStatus,
    currentOrigin,
  };

  return {
    config,
    setShowHelp,
    hasAnyIssues,
  };
};
