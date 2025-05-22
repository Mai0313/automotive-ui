<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->
---
applyTo: "**"
---

# 車機 UI Demo 專案需求（React Native + TypeScript）

每一次你進行功能修改/增減 請記得對應編輯這份文件 好讓其他人可以更快熟悉此專案
開發流程: 確認需求 -> 編寫/修改程式碼 -> 確認是運行報錯 -> 修改此文件並紀錄每一次的修改

## 1. 專案目標

從零開始製作一個全新的車機 UI Demo，使用 TypeScript 搭配 React Native，方便未來跨平台（iOS/Android/Web UI）發展。

---

## 2. 主要功能頁面

1. **首頁**
   - **新版設計重點：**
     - 首頁背景為全螢幕互動式地圖，未來將採用 Google Navigation React 套件實現（現階段可用假資料與地圖佈局預覽）。
     - 地圖四週保有黑色框線，強化車機風格。
     - 取消原底部分頁導航，主功能入口由底部黑色控制欄置入（簡約 icon 依序排列）。
     - 點擊「音樂」、「車輡資訊」、「空調」等入口，不是頁面跳轉，而是以懸浮浮層面板（overlay）的方式顯示於地圖正上方，並帶有流暢動畫。
     - 懸浮面板僅顯示一個，點擊其他控制 icon 時平滑切換，點擊地圖空白處或浮層右上角關閉鈕可收合面板。
     - 首頁預設浮現的面板為「車輛狀態卡片」，參照 Tesla 車機設計（如下補充）。
     - 地圖與各類浮層卡片皆需預留橫屏/直屏響應布局設計。

2. **導航頁**
   - 地圖展示、路線規劃（假資料）

3. **音樂播放頁**
   - 播放/暫停、曲目資訊、專輯封面

4. **車輛資訊頁**
   - 顯示速度、油量/電量、里程等（假資料）

5. **空調控制頁**
   - 溫度調整、風量設定、模式切換

6. **AI 助理頁**
   - 語音/文字互動，展示 AI 回應。
   - **新增功能：**
     - 支援麥克風錄音輸入 (`expo-audio`)。
     - 整合 OpenAI Whisper API 進行語音轉文字。
     - 整合 OpenAI TTS API (`tts-1-hd` 模型) 將 AI 文字回應轉為語音輸出。
     - 實現完整的語音輸入 -> AI 處理 -> 語音輸出流程。
     - Web 平台支援直接從 Base64 Data URL 播放 TTS 音訊，原生平台則儲存至檔案系統後播放 (`expo-file-system`)。

---

## 3. UI/UX 設計原則

- 參考特斯拉車機風格（極簡、黑白灰為主）
- 採用大按鈕與大字體設計
- 支援點擊、滑動切換頁面
- 主要操作按鈕置於底部或側邊，方便快速切換
- 操作步驟最少，資訊一目了然
- 支援橫/直屏響應式佈局：封面、控制區根據屏幕方向左右分欄或上下堆疊
- 統一頂部狀態欄（溫度與時間）文字樣式，使用 `statusInfo` 共用樣式
- Web 平台滑桿使用 `<input type="range">` fallback，以避免 `findDOMNode` 舊 API 錯誤
- **首頁地圖與浮層設計細節：**
  - 首頁地圖應覆蓋整個視窗，四周有黑色邊框。
  - 地圖下方設有黑色操作控制欄（底部功能 Bar），內含主要入口 icon（如：車輛、空調、音樂、語音...），排列及參照特斯拉車機 UI。
  - 點擊底部欄位任何 icon，皆以 overlay 懸浮面板（浮層卡片）形式在地圖上方顯示對應功能，非跳轉頁面；浮層面板可平順切換、點地圖空白區或按交互按鈕關閉。
  - 懸浮面板（浮層卡片）皆以半透明、圓角、陰影的 overlay 方式顯示，並帶有平滑淡入/滑動動畫。
  - 預設浮層卡片為「車輛狀態卡」：
    - 內容參照 Tesla 車機設計：左側車輛儀表板，上方為車輛警示/速度/能耗指示牌，中間位置大車輛俯視圖，底部三個主控按鈕（鎖車、空調開關、除霜），同時中間與左右延伸輪胎與語音控制等其他按鈕。
    - 車狀態卡內容可左右滑動切換不同分類內容，底部圓點指示當前頁。
    - 按鈕/圖示皆需具備互動回饋與流暢過場動畫。
  - 音樂與其他功能卡片設計參照下方浮層卡的布局，左側資訊/右側控制，並保留專輯圖片、進度條等。

---

## 4. 技術規劃

- **主體框架**：React Native + TypeScript
- **UI**：React Native Paper 或 styled-components
- **導航**：React Navigation
- **資料**：全部功能可用假資料模擬
- **AI 部分**：
  - 以簡單對話框展示回應（類 ChatGPT 風格）。
  - **語音互動**：
    - 使用 `expo-audio` 進行錄音及播放。
    - 語音轉文字：OpenAI Whisper API。
    - 文字轉語音：OpenAI TTS API (`tts-1-hd` 模型)。
    - 使用 `expo-file-system` 處理音訊檔案（僅限原生平台）。
- **地圖元件與未來發展**：首頁全螢幕地圖預計用 Google Navigation React（或相容套件），現階段請以可佈局自訂浮層板且可外掛額外元件為主。需留意浮層疊加、互動與地圖手勢衝突的處理。

---

## 5. 專案結構建議

```
assets/            # 圖片、icons
src/
  components/      # 共用元件
  screens/         # 各功能頁
  navigation/      # 導航設定
  types/           # 型別定義
App.tsx            # 專案入口
```

---

## 6. 開發流程建議

1. 初始化專案（React Native + TypeScript）
2. 設定 React Navigation
3. 建立首頁與底部導航（新版可直接優化為全螢幕地圖 + 底部控制欄設計）
4. 依序實作各功能頁（導航、音樂、車輛資訊、空調、AI 助理）
5. 美化 UI，調整為特斯拉風格
6. 測試點擊與滑動互動切換
7. 實作響應式設計：依據 `useWindowDimensions` 檢測方向動態切換布局
8. 實作跨平台 web 滑桿 fallback，並統一事件與屬性映射

---

## 7. 【新增】首頁互動地圖與浮層設計細節

- 請參考 Tesla 車機實際介面風格（如下圖），首頁主畫面為一個全螢幕的深色互動地圖，四周有黑色框。
- 地圖下方設有黑色操作控制欄（底部功能 Bar），內含主要入口 icon（如：車輛、空調、音樂），排列及參照特斯拉車機 UI。
- 點擊底部欄位任何 icon，皆以 overlay 懸浮面板（浮層卡片）形式在地圖上方顯示對應功能，非跳轉頁面；浮層面板可平順切換、點地圖空白區或按交互按鈕關閉。
- 預設顯示「車輛狀態卡」，左側浮框內含車輛狀態資訊及快速操作，支持左右滑動檢視更多車況頁，主控三鈕（鎖車/空調/除霜）、大閃電（啟動）、胎壓、語音按鈕等。
- 音樂卡、空調卡等皆為半透明黑底浮層，資訊結構與現代車機一致。  
- 所有浮層動畫需平滑淡入淡出、收回、切換；全區塊和按鈕需有互動回饋。
- 地圖未來將用 Google navigation react 套件，並保持彈性以支持元件疊加與橫直屏響應。
- 色系僅黑/白/灰及極簡點綴，字體、布局及交互皆比照 Tesla 車機設計稿。

> ![Sample Tesla UI](https://techcrunch.com/wp-content/uploads/2017/08/tesla-model-3-in-car-ux.jpg)

---

## 8. 【新增】空調設定

- 汽車空調設定將透過資料庫即時同步（WebSocket/REST fallback）
- ac_settings table 欄位設計如下：

  | 欄位名稱             | 型態     | 預設值   | 說明                       |
  |----------------------|----------|----------|----------------------------|
  | air_conditioning     | BOOLEAN  | true     | 空調開關                   |
  | fan_speed           | INTEGER  | 2        | 風速等級 (0-10)            |
  | airflow_head_on     | BOOLEAN  | false    | 出風至頭部                 |
  | airflow_body_on     | BOOLEAN  | false    | 出風至身體                 |
  | airflow_feet_on     | BOOLEAN  | true     | 出風至腳部                 |
  | temperature         | FLOAT    | 22.0     | 溫度設定 (16.0~30.0°C)     |
  | created_at          | TIMESTAMP| now()    | 建立時間                   |
  | updated_at          | TIMESTAMP| now()    | 最後更新時間               |

- 前端（HomeScreen、ClimateScreen）會自動透過 WebSocket 連線至 ws://localhost:4000（Android 模擬器為 ws://10.0.2.2:4000），連線後主動送出 { action: 'get_state' } 取得資料庫最新狀態。
- 後端 server.js 監聽 PostgreSQL ac_settings 資料表的 LISTEN/NOTIFY，資料異動時即時推播給所有前端。
- 若 WebSocket 連線失敗，前端會自動 fallback 以 HTTP GET http://localhost:4001/state 取得狀態。
- **所有空調相關狀態（溫度、AC開關、風速、出風方向等）皆會根據資料庫 ac_settings table 的即時資料自動同步顯示，並非僅溫度。**
- 所有溫度（temperature）欄位皆假設為 float 型態，前端已移除 parseFloat 步驟，請確保資料庫 schema 設定正確（FLOAT/REAL/DOUBLE PRECISION）。
- 前端調整溫度/AC 狀態時，會即時送出 JSON 給 WS，後端自動更新資料庫並廣播。
- 任何時候都能直接用 psql UPDATE ac_settings SET temperature=xx.x; 測試即時同步。

---

### ac_settings table 觸發器（Trigger）說明

- **notify_ac_settings_update_trigger**
  - 角色：即時推播資料異動。
  - 用途：當 ac_settings 資料表有 INSERT 或 UPDATE 時，會呼叫 notify_ac_settings_update() function，進而用 `pg_notify` 把最新 row 的內容（JSON 格式）推送到 PostgreSQL 的通知頻道（ac_settings_update）。
  - 作用：讓 WebSocket server 能即時收到資料異動，並推播給所有前端，實現前後端即時同步。

- **update_ac_settings_timestamp**
  - 角色：自動更新時間戳。
  - 用途：當 ac_settings 資料表有 UPDATE 時，會自動把 updated_at 欄位設為當下時間（CURRENT_TIMESTAMP）。
  - 作用：確保每次資料異動都會自動記錄最後更新時間，方便追蹤資料變動。

- 兩者配合，讓資料異動既有時間戳記，也能即時同步到前端。

---

## 9. 【資料庫觸發器/通知通用化】

- 2025-05-22: 所有 PostgreSQL function 與 trigger 已整合進 `scripts/init_db.tsx`，統一命名：
  - `update_timestamp_generic`：自動更新所有表的 `updated_at` 欄位。
  - `notify_table_update`：所有表的 INSERT/UPDATE 皆自動推播 `pg_notify(<table>_update, row_to_json(NEW))`。
- 各資料表只需：
  - `CREATE TRIGGER update_<table>_timestamp BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION update_timestamp_generic();`
  - `CREATE TRIGGER notify_<table>_update_trigger AFTER INSERT OR UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION notify_table_update();`
- `init_db.tsx` 會自動建立 function 並為 ac_settings、vehicle_info 等表加上通用 trigger，無需手動執行額外 SQL。

---

## 更新紀錄
- 2025-05-16: 調整 HomeScreen overlay 懸浮位置（top:60, bottom:100），使浮層顯示介於頂部狀態欄與底部按鈕區之間；新增底部按鈕重複點擊可收回浮層功能。
- 2025-05-19: MusicScreen web 版改為直接嵌入 Spotify 播放器 iframe，並以特斯拉車機風格半透明黑底浮層包覆，僅 web 顯示，行動裝置維持原假資料 UI。
- 2025-05-19: HomeScreen 地圖鋪滿全畫面，overlayCard 上下空間皆為地圖，不再出現黑色背景區塊。
- 2025-05-19: MapView.web.tsx 移除 border 樣式，修正 React Native StyleSheet 型別錯誤。
- 2025-05-19: ESLint 設定升級為 Flat Config，並針對專案結構簡化 ignore 與 plugin 設定。
- 2025-05-19: 所有未使用變數與 import lint warning 已清除，專案維持乾淨。
- 2025-05-19: AI 助理頁面新增完整語音互動功能：整合麥克風錄音 (`expo-audio`)、OpenAI Whisper 語音轉文字、Chat Completion 文字理解與回應、OpenAI TTS (`tts-1-hd`) 文字轉語音播放。區分 Web 與原生平台 TTS 音訊處理方式。
- 2025-05-20: 調整首頁底部溫度控制區與空調開關設計，詳見最上方補充說明。
- 2025-05-21: 新增資料庫即時同步（WebSocket/REST fallback）功能，HomeScreen/ClimateScreen 支援自動取得與推送溫度、AC 狀態，並處理 Postgres FLOAT 型態字串轉換。
- 2025-05-22: HomeScreen 溫度調整 chevron-down/chevron-up 按鈕僅於 AC 開啟 (isAC=true) 時顯示，AC 關閉時不顯示溫度調整按鈕，僅顯示關閉狀態。
- 2025-05-22: 所有 PostgreSQL function 與 trigger 已整合進 `scripts/init_db.tsx`，統一命名，並更新相關說明文件。
