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

### 【新增】首頁車輛異常語音建議（LLM+TTS）

- 當首頁偵測到車輛異常（如胎壓異常、引擎燈等）時，會自動將異常資訊送進 chatCompletion，由 LLM 產生針對該異常的建議，再將建議內容轉為語音並主動播報，無需進入車輛資訊頁即可即時提醒使用者。
- 每種異常僅播報一次，避免重複提醒。
- 建議內容由 LLM 動態生成，語氣親切且務實，能根據不同異常給出更貼近情境的建議。
- 已整合 chatCompletion、textToSpeech 與 expo-av 音訊播放，無需額外安裝。
- **注意：** Web 平台自動播放 audio 可能因瀏覽器政策（需用戶互動）導致 NotAllowedError，這是瀏覽器安全限制，非程式錯誤。請於有用戶互動（如點擊）後再觸發語音，或於開發測試時手動觸發。

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
   - **互動模式說明（2025-05-26 更新）：**
     - 預設進入頁面為「語音模式」，僅顯示一個大錄音按鈕，點擊即可開始錄音，直到再次點擊停止。
     - 右上角有「切換模式」按鈕，可切換為「打字模式」：顯示原本的文字輸入框與送出按鈕，方便辦公室開發測試。
     - 兩種模式可隨時切換，駕駛時建議使用語音模式，開發時可用打字模式。
     - 語音辨識完成後，僅會新增一則使用者訊息（不會重複顯示），避免訊息重複。
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
- **全面響應式設計**：所有按鈕、圖標、文字、間距皆根據螢幕尺寸自動縮放，確保在手機、平板、桌面等不同設備上保持一致的使用者體驗
- **首頁地圖與浮層設計細節：**
  - 首頁地圖應覆蓋整個視窗，四周有黑色邊框。
  - 地圖下方設有黑色操作控制欄（底部功能 Bar），內含主要入口 icon（如：車輡、空調、音樂、語音...），排列及參照特斯拉車機 UI。
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
- **響應式設計系統**：
  - 使用 `useResponsiveStyles` Hook 根據螢幕尺寸自動計算元件比例。
  - 支援手機（<600px）、平板（600-1200px）、桌面（>1200px）三種設備類型。
  - 縮放範圍 0.6-2.0x，確保按鈕、圖標、文字在各種螢幕尺寸下保持適當比例。
  - 所有按鈕、圖標、字體、間距皆使用響應式數值，避免固定尺寸。
  - 提供 `buttonSize`、`iconSize`、`fontSize`、`padding`、`margin` 等完整的響應式屬性。

---

## 5. 專案結構建議

---

## 【AI Endpoint 需求】（這段會在後端處理）

本專案目前僅需以下三種 AI 服務端點（endpoint），請於開發/串接時依下表規格設計，未來如有新需求再補充。

| Endpoint         | Input 型態         | Output 型態        | 用途說明                                   |
|------------------|--------------------|--------------------|--------------------------------------------|
| Chat Completion  | text (訊息內容)    | text (AI 回應)     | 文字/語音對話、車輛異常建議、AI 助理回應   |
| Speech to Text   | audio (錄音檔)     | text (辨識文字)    | 語音輸入辨識（OpenAI Whisper API）         |
| Text to Speech   | text (AI 回應文字) | audio (語音檔/串流) | AI 回應語音化（OpenAI TTS API）            |

- Chat Completion：用於 AI 助理、車輛異常建議等所有自然語言理解與生成。
- Speech to Text：用於語音輸入，支援多平台錄音檔格式。
- Text to Speech：用於將 AI 回應轉為語音，支援 web 及原生平台播放。

---

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
- 地圖下方設有黑色操作控制欄（底部功能 Bar），內含主要入口 icon（如：車輡、空調、音樂），排列及參照特斯拉車機 UI。
- 點擊底部欄位任何 icon，皆以 overlay 懸浮面板（浮層卡片）形式在地圖上方顯示對應功能，非跳轉頁面；浮層面板可平順切換、點地圖空白區或按交互按鈕關閉。
- 預設顯示「車輛狀態卡」，左側浮框內含車輛狀態資訊及快速操作，支持左右滑動檢視更多車況頁，主控三鈕（鎖車/空調/除霜）、大閃電（啟動）、胎壓、語音按鈕等。
- 音樂卡、空調卡等皆為半透明黑底浮層，資訊結構與現代車機一致。  
- 所有浮層動畫需平滑淡入淡出、收回、切換；全區塊和按鈕需有互動回饋。
- 地圖未來將用 Google navigation react 套件，並保持彈性以支持元件疊加與橫直屏響應。
- 色系僅黑/白/灰及極簡點綴，字體、布局及交互皆比照 Tesla 車機設計稿。

> ![Sample Tesla UI](https://techcrunch.com/wp-content/uploads/2017/08/tesla-model-3-in-car-ux.jpg)

---

## 8. 【新增】空調設定

- 汽車空調設定將透過資料庫即時同步（WebSocket/REST fallback），所有狀態皆以 ac_settings table 為主，前端會根據資料庫內容自動顯示與控制。

- ac_settings table 欄位設計如下（對應 ClimateScreen.tsx 之 UI 控制）：

  | 欄位名稱         | 型態      | 預設值 | 說明                   | UI 對應名稱/按鈕         |
  |------------------|-----------|--------|------------------------|--------------------------|
  | auto_on          | BOOLEAN   | false  | 自動開啟               | 自動（autoOn）           |
  | air_conditioning | BOOLEAN   | true   | 空調開關               | 空調（acOn）             |
  | fan_speed        | INTEGER   | 2      | 風速等級 (0-10)        | 風速控制（fanSpeed）      |
  | front_defrost_on | BOOLEAN   | false  | 前擋風玻璃除霜         | 前除霜（frontDefrostOn）  |
  | rear_defrost_on  | BOOLEAN   | false  | 後擋風玻璃除霜         | 後除霜（rearDefrostOn）   |
  | airflow_head_on  | BOOLEAN   | false  | 出風至頭部             | 面部（airFace）           |
  | airflow_body_on  | BOOLEAN   | false  | 出風至身體             | 中間（airMiddle）         |
  | airflow_feet_on  | BOOLEAN   | true   | 出風至腳部             | 腳部（airFoot）           |
  | temperature      | FLOAT     | 22.0   | 溫度設定 (16.0~30.0°C) | 溫度顯示/調整（其他區塊） |
  | created_at       | TIMESTAMP | now()  | 建立時間               |                          |
  | updated_at       | TIMESTAMP | now()  | 最後更新時間           |                          |

- 說明：
  - fan_speed 範圍為 0~10，對應 UI 風速滑桿與指示點。
  - airflow_head_on、airflow_body_on、airflow_feet_on 對應 UI 的「面部」、「中間」、「腳部」三個出風方向按鈕，分別為 airFace、airMiddle、airFoot。
  - 溫度（temperature）欄位雖在 ac_settings table，實際顯示與調整可能於 HomeScreen 或底部溫度顯示區，ClimateScreen 目前未直接顯示溫度調整。
  - 所有狀態皆會根據 ac_settings table 的即時資料自動同步顯示與控制，並非僅溫度。
  - 前端（HomeScreen、ClimateScreen）會自動透過 WebSocket 連線至 ws://localhost:4000（Android 模擬器為 ws://10.0.2.2:4000），連線後主動送出 { action: 'get_state' } 取得資料庫最新狀態。
  - 後端 server.js 監聽 PostgreSQL ac_settings 資料表的 LISTEN/NOTIFY，資料異動時即時推播給所有前端。
  - 若 WebSocket 連線失敗，前端會自動 fallback 以 HTTP GET <http://localhost:4001/state> 取得狀態。
  - 所有溫度（temperature）欄位皆假設為 float 型態，前端已移除 parseFloat 步驟，請確保資料庫 schema 設定正確（FLOAT/REAL/DOUBLE PRECISION）。
  - 前端調整溫度/AC 狀態時，會即時送出 JSON 給 WS，後端自動更新資料庫並廣播。
  - 任何時候都能直接用 psql UPDATE ac_settings SET temperature=xx.x; 測試即時同步。

---

## 【新增】車輛警示燈號（vehicle_warnings table）

- 車輛警示燈號皆以 BOOLEAN 型態儲存於 vehicle_warnings table，預設值為 false，代表無異常。前端會根據這些欄位顯示對應警示 icon，並以紅色高亮。
- 欄位說明如下：

  | 欄位名稱                      | 型態    | 預設值 | Icon 名稱（MaterialCommunityIcons） | 說明（中文）           | 說明（英文）                |
  |-------------------------------|---------|--------|--------------------------------------|------------------------|-----------------------------|
  | engine_warning                | BOOLEAN | false  | engine                               | 引擎異常               | Engine malfunction          |
  | oil_pressure_warning          | BOOLEAN | false  | oil-temperature                      | 機油壓力異常           | Oil pressure abnormal       |
  | battery_warning               | BOOLEAN | false  | car-battery                          | 電瓶異常               | Battery issue               |
  | coolant_temp_warning          | BOOLEAN | false  | thermometer                          | 冷卻液溫度過高         | Coolant temperature high    |
  | brake_warning                 | BOOLEAN | false  | car-brake-alert                      | 煞車系統異常           | Brake system warning        |
  | abs_warning                   | BOOLEAN | false  | car-brake-abs                        | ABS 防鎖死系統異常     | ABS system warning          |
  | tpms_warning                  | BOOLEAN | false  | car-tire-alert                       | 胎壓異常               | Tire pressure abnormal      |
  | airbag_warning                | BOOLEAN | false  | airbag                               | 安全氣囊異常           | Airbag warning              |
  | low_fuel_warning              | BOOLEAN | false  | fuel                                 | 油量過低               | Low fuel                    |
  | door_ajar_warning             | BOOLEAN | false  | door-open                            | 車門未關妥             | Door ajar                   |
  | seat_belt_warning             | BOOLEAN | false  | seatbelt                             | 安全帶未繫上           | Seat belt unfastened        |
  | exterior_light_failure_warning| BOOLEAN | false  | lightbulb-outline                    | 外部燈光故障           | Exterior light failure      |

- 當任一欄位為 true，前端會於車輛資訊頁（VehicleInfoScreen）下方顯示對應 icon，並以紅色高亮提示駕駛注意。
- 欄位名稱與 icon 對應請參考 src/screens/VehicleInfoScreen.tsx 的 warningIconMap。
- 欄位可依實際車型擴充，若資料庫有新增欄位，請同步更新本表格與前端 warningIconMap。

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
- 2025-05-26: 將 ClimateScreen.tsx 與 HomeScreen.tsx 中的 WebSocket 通訊與狀態管理邏輯抽取至自訂 Hook (`useClimateSettings`、`useHomeClimateSettings`)，並移除畫面元件內多餘重複程式碼。
- 2025-05-26: 新增 `src/components/ControlButton.tsx` 統一 ClimateScreen 控制按鈕樣式，並在 ClimateScreen 中替換原有冗長的 `TouchableOpacity + Icon + Text` 寫法。
- 2025-05-26: 在 HomeScreen 底部控制欄中加入 `handleOverlayPress` 函式，精簡各按鈕的開/關浮層邏輯判斷，使程式碼更易維護。
- 2025-05-26: 新增 Demo 按鈕 首頁右下方會出現一個按鈕以模擬當車輛出現胎壓問題時的應對 尚未完成當按鈕變成True以後要做的事情
- 2025-05-26: AI 助理頁面大幅改版，預設為語音模式（僅顯示大錄音按鈕），右上角可切換打字模式。語音辨識完成後僅新增一則訊息，避免訊息重複。兩種模式可隨時切換，適合車載語音優先與辦公室開發。
- 2025-05-26: 【重大】首頁車輛異常語音建議功能升級：偵測到車輛異常時，會自動將異常資訊送進 chatCompletion，由 LLM 產生建議，再用 textToSpeech 轉語音自動播報。每種異常僅播報一次，建議內容由 LLM 動態生成。Web 平台自動播放 audio 可能因瀏覽器政策（需用戶互動）導致 NotAllowedError，這是瀏覽器安全限制，非程式錯誤。
- 2025-05-29: 【重大】實現全面響應式按鈕系統：新增 `useResponsiveStyles` Hook，根據螢幕尺寸自動計算按鈕、圖標、文字、間距等比例。所有元件（HomeScreen、ClimateScreen、VehicleInfoScreen、MusicScreen、NavigationScreen、AIAssistantScreen、ControlButton、BottomBarButton、FloatingStatusBar、DemoButtons）皆已更新為響應式設計，支援手機、平板、桌面等不同螢幕尺寸自動縮放，縮放範圍 0.6-2.0x，確保在各種設備上保持適當的操作體驗與視覺比例。
- 2025-06-02: Demo 按鈕優化：將原本較大的「Trigger Tire Pressure Warning」按鈕改為左上角小圖標形式，與實時語音圖標並列顯示，提供更簡潔的測試介面。
- 2025-06-03: 【重大】新增 Realtime Voice 即時語音互動功能：整合基於 WebSocket + protobuf 的即時語音通訊，Web 平台開啟後自動開始錄音，透過 ws://localhost:8100/ws/{uuid} 與後端語音伺服器即時傳輸音訊。支援 PCM S16 格式音訊編碼、自動音訊解碼播放、連線狀態指示。新增左上角 Debug 按鈕可手動控制錄音開關。使用 `useRealtimeVoice` Hook 處理核心邏輯，整合至 HomeScreen 與 DemoButtons。原生平台目前支援基礎錄音，即時串流功能待後續完善。
- 2025-06-03: 【新增】Realtime Voice 即時語音互動功能
  - 整合基於 WebSocket 的即時語音互動功能，使用 protobuf 協議與後端語音伺服器 (ws://localhost:8100/ws) 通訊。
  - 功能特色：
    - Web 平台：網頁開啟後自動開始錄音，實現真正的即時語音對話。
    - 音訊處理：使用 AudioContext 和 ScriptProcessor 捕捉麥克風音訊，轉換為 PCM S16 格式後透過 protobuf 封包傳送。
    - 即時播放：接收後端傳回的音訊串流，自動解碼並播放語音回應。
    - 左上角 Debug 按鈕：提供手動開啟/關閉錄音功能，方便開發測試。
    - 協議支援：使用 public/frames.proto 定義的 Frame 格式，支援 AudioRawFrame、TextFrame、TranscriptionFrame 三種訊息類型。
    - UUID 連線：每次連線自動產生 8 位數 UUID，確保 WebSocket 連線的唯一性 (ws://localhost:8100/ws/{uuid})。
    - 狀態指示：Debug 按鈕顏色會根據連線狀態變化（綠色=已連線、紅色=錯誤、白色=離線）。
  - 實作檔案：
    - `src/hooks/useRealtimeVoice.ts`：核心 Hook，處理 WebSocket 連線、音訊錄製/播放、protobuf 編解碼。
    - `src/components/DemoButtons.tsx`：整合 realtime voice debug 控制按鈕。
    - `src/screens/HomeScreen.tsx`：在首頁整合並啟用 realtime voice 功能。
  - 技術依賴：
    - protobufjs：處理 .proto 檔案解析與二進位編解碼。
    - expo-audio：原生平台錄音支援（目前簡化實作）。
    - AudioContext：Web 平台即時音訊處理。
  - 注意事項：
    - Web 平台需要 HTTPS 或 localhost 才能存取麥克風。
    - 原生平台目前僅支援基礎錄音，即時串流功能待後續完善。
    - 後端需搭配支援 pipecat.Frame 協議的語音伺服器。
- 2025-06-03: 【重大】環境變數重構：將所有硬編碼的伺服器 URL 重構為可配置的環境變數，提升部署靈活性與安全性。
  - 新增環境變數配置：
    - `EXPO_PUBLIC_WS_SERVER_URL`：WebSocket 即時資料同步伺服器 URL (預設: ws://localhost:4000)
    - `EXPO_PUBLIC_HTTP_SERVER_URL`：HTTP REST API fallback 伺服器 URL (預設: http://localhost:4001)
    - `EXPO_PUBLIC_REALTIME_VOICE_URL`：即時語音 WebSocket 伺服器 URL (預設: ws://localhost:8100/ws)
    - `WS_SERVER_PORT`：後端 WebSocket 伺服器連接埠 (預設: 4000)
    - `HTTP_SERVER_PORT`：後端 HTTP 伺服器連接埠 (預設: 4001)
  - 技術改進：
    - 修改 `server.js` 加入 `dotenv` 環境變數載入，並加入必要環境變數驗證，若未設定會報錯退出。
    - 新增 `src/utils/env.ts` 環境變數管理工具，提供 `getWebSocketUrl()`、`getHttpServerUrl()`、`getRealtimeVoiceUrl()` 函式，支援 Android 模擬器自動 localhost → 10.0.2.2 轉換。
    - 更新所有相關 Hook 與元件：`useClimateSettings`、`useHomeClimateSettings`、`useRealtimeVoice`、`HomeScreen` 等，移除硬編碼 URL。
    - 更新 `.env.example` 文件，提供完整的環境變數配置範例與說明。
  - 重構檔案：
    - `server.js`：加入環境變數載入與驗證
    - `src/utils/env.ts`：環境變數管理工具（新增）
    - `src/hooks/useClimateSettings.ts`：使用環境變數取代硬編碼 URL
    - `src/hooks/useHomeClimateSettings.ts`：使用環境變數取代硬編碼 URL
    - `src/hooks/useRealtimeVoice.ts`：使用環境變數取代硬編碼 URL
    - `src/screens/HomeScreen.tsx`：移除硬編碼 serverUrl 參數
    - `.env` 與 `.env.example`：新增所有伺服器 URL 環境變數配置
  - 優勢：
    - 支援不同環境（開發、測試、生產）的靈活配置
    - 提升安全性，避免硬編碼敏感資訊
    - 環境變數未設定時自動報錯，避免靜默失敗
    - 自動處理 Android 模擬器網路映射 (localhost → 10.0.2.2)
    - 統一的環境變數管理與驗證機制
- 2025-06-03: 【重大】解決跨域連線問題：修改前端和後端伺服器配置，支援網路多設備訪問。
  - **問題背景**：當從 `http://mtktma:8081` 或其他網路地址訪問時，WebSocket 和 HTTP 請求仍指向 `localhost:4000/4001`，導致跨域連線失敗。
  - **統一配置解決方案**：
    - **環境變數統一**：將原本分離的 `WS_SERVER_PORT`/`HTTP_SERVER_PORT` 改為完整 URL 配置：
      - `WS_SERVER_URL=ws://localhost:4000`
      - `HTTP_SERVER_URL=http://localhost:4001`
      - `REALTIME_VOICE_URL=ws://localhost:8100/ws`
    - **動態主機偵測**：修改 `src/utils/env.ts` 新增：
      - `getCurrentHostname()`：自動偵測當前網頁的 hostname
      - `replaceLocalhostWithHostname()`：智能URL轉換函數
    - **前端配置**：修改 `package.json` 的 `npm run web` 腳本為 `--host lan --port 8081`，讓 Expo 在網路介面提供服務。
    - **後端配置**：修改 `server.js` 新增：
      - `replaceLocalhostForServerBinding()`：自動將 localhost 轉換為 0.0.0.0 進行伺服器綁定
      - 完整 URL 解析：從環境變數解析 hostname 和 port，而非僅解析 port
  - **智能URL轉換機制**：
    - **Web 平台**：`localhost` → 當前 hostname（如 `mtktma` 或 `172.21.140.52`）
    - **Android 模擬器**：`localhost` → `10.0.2.2`
    - **其他平台**：保持原始 URL
    - **伺服器綁定**：`localhost` → `0.0.0.0`（監聽所有網路介面）
  - **使用方式**：
    - 啟動後端：`npm run ws`（自動監聽 0.0.0.0:4000/4001）
    - 啟動前端：`npm run web`（服務於網路介面，如 172.21.140.52:8081）
    - 多設備訪問：可從任何網路設備訪問 `http://[IP]:8081`，自動解決跨域問題
  - **實作檔案更新**：
    - `src/utils/env.ts`：新增動態主機偵測與URL轉換函數
    - `server.js`：新增URL解析與伺服器綁定邏輯
    - `package.json`：修改 web 腳本支援 LAN 訪問
    - `.env` & `.env.example`：更新為統一的 localhost URL 配置
  - **技術優勢**：
    - **統一配置**：前後端皆使用 localhost URL，自動轉換為適當的綁定地址
    - **自動跨域解決**：無需手動配置 CORS，智能檢測並調整連線地址
    - **多設備支援**：支援開發環境多設備測試（手機、平板、其他電腦）
    - **向下相容**：localhost 訪問仍正常運作，不影響現有工作流程
    - **平台智能檢測**：Android 模擬器自動使用 10.0.2.2，Web 平台自動使用當前 hostname
    - **除錯友善**：新增主機偵測的 debug logging，方便故障排除
