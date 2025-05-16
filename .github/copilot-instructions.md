<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 車機 UI Demo 專案需求（React Native + TypeScript）

每一次你進行功能修改/增減 請記得對應編輯這份文件 好讓其他人可以更快熟悉此專案

## 1. 專案目標

從零開始製作一個全新的車機 UI Demo，使用 TypeScript 搭配 React Native，方便未來跨平台（iOS/Android/Web UI）發展。本 Demo 著重於界面與互動展示，不需實作實際功能。

---

## 2. 主要功能頁面

1. **首頁**
   - 功能入口，快速切換各功能

2. **導航頁**
   - 地圖展示、路線規劃（假資料）

3. **音樂播放頁**
   - 播放/暫停、曲目資訊、專輯封面

4. **車輛資訊頁**
   - 顯示速度、油量/電量、里程等（假資料）

5. **空調控制頁**
   - 溫度調整、風量設定、模式切換

6. **AI 助理頁**
   - 語音/文字互動，展示 AI 回應

---

## 3. UI/UX 設計原則

- 參考特斯拉車機風格（極簡、黑白灰為主）
- 採用大按鈕與大字體設計
- 支援點擊、滑動切換頁面
- 主要操作按鈕置於底部或側邊，方便快速切換
- 操作步驟最少，資訊一目了然

---

## 4. 技術規劃

- **主體框架**：React Native + TypeScript
- **UI**：React Native Paper 或 styled-components
- **導航**：React Navigation
- **資料**：全部功能可用假資料模擬
- **AI 部分**：以簡單對話框展示回應（類 ChatGPT 風格）

---

## 5. 專案結構建議

```
src/
  components/      # 共用元件
  screens/         # 各功能頁
  navigation/      # 導航設定
  assets/          # 圖片、icons
  types/           # 型別定義
App.tsx            # 專案入口
```

---

## 6. 開發流程建議

1. 初始化專案（React Native + TypeScript）
2. 設定 React Navigation
3. 建立首頁與底部導航
4. 依序實作各功能頁（導航、音樂、車輛資訊、空調、AI 助理）
5. 美化 UI，調整為特斯拉風格
6. 測試點擊與滑動互動切換
