<!-- Use this file to provide workspace-specific custom instructions to Copilot. For more details, visit https://code.visualstudio.com/docs/copilot/copilot-customization#_use-a-githubcopilotinstructionsmd-file -->

# 車機 UI Demo 專案需求（React Native + TypeScript）

確認需求 -> 編寫/修改程式碼 -> 將改動更新至 `.github/copilot-instructions.md`
`.github/copilot-instructions.md` 非常重要, 方便 Copilot 知道專案需求與上下文。

## 1. 專案目標

從零開始製作一個全新的車機 UI Demo，使用 TypeScript 搭配 React Native，方便未來跨平台（iOS/Android/Web UI）發展。
套件透過 `npm` 管理，並使用 `expo` 進行開發與測試。

---

## 2. 主要功能頁面

### 【核心功能】首頁車輛異常語音建議（Broadcast API + Realtime Voice）

- 當首頁偵測到車輛異常（如胎壓異常、引擎燈等）時，會自動將異常資訊透過 Broadcast API 發送到 Realtime Voice 伺服器，由 LLM 產生針對該異常的建議，再轉為語音並主動播報，無需進入車輛資訊頁即可即時提醒使用者。
- **智能播報邏輯**：每種異常會在燈號變成 true 時播報一次，若燈號關閉後重新出現，會再次播報；燈號持續亮起時不會重複播報。
- **動態記錄管理**：`spokenWarnings` 會記錄已播報的異常，當燈號變回 false 時自動清除對應記錄，確保下次異常出現時能重新播報。
- 建議內容由 LLM 動態生成，語氣親切且務實，能根據不同異常給出更貼近情境的建議。
- 採用統一的 Realtime Voice WebSocket 連線處理語音播報，透過 `/api/event/broadcast` API 觸發。
- **技術架構：** 前端 → Broadcast API → Realtime Voice 伺服器 → LLM + TTS → WebSocket 語音串流 → 前端播放。

### 【核心功能】Realtime Voice 即時語音互動系統

- **即時語音對話**：Web 平台開啟後自動開始錄音，實現真正的即時語音對話（麥克風錄音 → ASR 語音辨識 → LLM 處理 → TTS 語音合成 → 即時播放）
- **音訊處理**：使用 AudioContext 和 AudioWorklet 捕捉麥克風音訊，轉換為 PCM S16 格式後透過 protobuf 封包傳送
- **協議支援**：使用 protobuf 協議與後端語音伺服器通訊，支援 AudioRawFrame、TextFrame、TranscriptionFrame 三種訊息類型
- **跨平台支援**：Web 平台自動錄音，原生平台提供手動控制，統一使用 `useRealtimeVoice` Hook 處理
- **優化效能**：音訊緩衝機制調整為 20ms（320 samples），搭配低通濾波器減少高頻雜音
- **狀態指示**：提供清楚的連線與錄音狀態視覺回饋（綠色=已連線且錄音、紅色=錯誤或關閉錄音、wifi-off=未連線）
- **🔧 音質優化**：
  - 增益控制（0.8x）防止音訊裁切和失真
  - 改善時間同步機制，避免音訊片段重疊或間隙
  - 漸進式靜音/取消靜音，防止突然停止造成爆音
  - 完善的錯誤處理，避免單一音訊幀錯誤影響整體串流
  - 自動清理已完成的音訊源，防止記憶體洩漏
- **🔍 除錯工具**：
  - 內建音訊品質分析器，自動檢測靜音幀、裁切幀、音量異常
  - 實時統計監控：幀接收率、異常率、平均音量、峰值音量
  - 完整診斷工具（`voiceDiagnostics.ts`）檢測麥克風、網路、延遲等問題
  - 可匯出除錯日誌和音訊錄製檔案，方便問題追蹤

### 【核心功能】響應式設計系統

- **全面縮放**：使用 `useResponsiveStyles` Hook 根據螢幕尺寸自動計算按鈕、圖標、文字、間距等比例
- **設備支援**：支援手機（<600px）、平板（600-1200px）、桌面（>1200px）三種設備類型
- **縮放範圍**：0.6-2.0x，確保在各種設備上保持適當的操作體驗與視覺比例
- **跨域智能配置**：自動偵測當前 hostname，支援網路多設備訪問（localhost → 當前 IP，Android 模擬器 → 10.0.2.2）

1. **首頁**

   - **設計重點：**
     - 首頁背景為全螢幕互動式地圖，未來將採用 Google Navigation React 套件實現（現階段可用假資料與地圖佈局預覽）
     - 地圖四週保有黑色框線，強化車機風格
     - 取消原底部分頁導航，主功能入口由底部黑色控制欄置入（簡約 icon 依序排列）
     - 點擊「音樂」、「車輛資訊」、「空調」等入口，不是頁面跳轉，而是以懸浮浮層面板（overlay）的方式顯示於地圖正上方，並帶有流暢動畫
     - 懸浮面板僅顯示一個，點擊其他控制 icon 時平滑切換，點擊地圖空白處或浮層右上角關閉鈕可收合面板
     - 首頁預設浮現的面板為「車輛狀態卡片」，參照 Tesla 車機設計，包含車輛儀表板、警示燈號、主控按鈕等
     - 地圖與各類浮層卡片皆需預留橫屏/直屏響應布局設計
     - 地圖載入超時機制：10秒自動切換默認背景，避免載入卡頓
   - **Tesla 風格細節：**
     - 首頁地圖應覆蓋整個視窗，四周有黑色邊框
     - 地圖下方設有黑色操作控制欄（底部功能 Bar），內含主要入口 icon
     - 預設浮層卡片為「車輛狀態卡」：左側車輛儀表板，中間大車輛俯視圖，底部主控按鈕（鎖車、空調開關、除霜）
     - 車狀態卡內容可左右滑動切換不同分類內容，底部圓點指示當前頁
     - 所有浮層動畫需平滑淡入淡出、收回、切換；全區塊和按鈕需有互動回饋
     - 色系僅黑/白/灰及極簡點綴，字體、布局及交互皆比照 Tesla 車機設計稿

2. **音樂播放頁**

   - 播放/暫停、曲目資訊、專輯封面

3. **車輛資訊頁**

   - 顯示速度、油量/電量、里程等（假資料）

4. **空調控制頁**

   - 溫度調整、風量設定、模式切換
   - **即時同步功能**：透過 WebSocket/REST fallback 與資料庫即時同步所有空調狀態
   - **風扇控制**：0-5級精確控制，提供更好的使用體驗
   - **全面狀態管理**：自動模式、空調開關、除霜功能、出風方向控制等

5. **AI 助理頁**
   - **語音優先設計**：預設進入頁面為「語音模式」，僅顯示一個大錄音按鈕，適合車載環境；右上角可切換為「打字模式」方便開發測試
   - **即時語音互動**：整合 Realtime Voice 功能，透過 WebSocket 與後端語音伺服器連線實現即時對話
   - **跨平台支援**：Web 平台自動開始錄音，原生平台提供手動控制
   - **訊息去重**：語音辨識完成後僅新增一則使用者訊息，避免訊息重複

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
  - 以簡單對話框展示回應（類 ChatGPT 風格）
  - **語音互動**：統一使用 Realtime Voice WebSocket 連線處理所有語音功能
  - **音訊處理**：使用 `expo-audio` 進行錄音及播放（原生平台），Web 平台使用 AudioContext
  - **協議支援**：使用 protobuf 協議與後端語音伺服器通訊
- **地圖元件與未來發展**：首頁全螢幕地圖預計用 Google Navigation React（或相容套件），現階段請以可佈局自訂浮層板且可外掛額外元件為主。需留意浮層疊加、互動與地圖手勢衝突的處理。
- **響應式設計系統**：
  - 使用 `useResponsiveStyles` Hook 根據螢幕尺寸自動計算元件比例。
  - 支援手機（<600px）、平板（600-1200px）、桌面（>1200px）三種設備類型。
  - 縮放範圍 0.6-2.0x，確保按鈕、圖標、文字在各種螢幕尺寸下保持適當比例。
  - 所有按鈕、圖標、字體、間距皆使用響應式數值，避免固定尺寸。
  - 提供 `buttonSize`、`iconSize`、`fontSize`、`padding`、`margin` 等完整的響應式屬性。
- **集中式樣式管理**：
  - 所有螢幕樣式已遷移至 `src/styles/layoutStyles.ts` 統一管理
  - 採用 `screen*` 前綴命名規範：`home*`、`music*`、`vehicle*`、`climate*`、`ai*`
  - 禁止在螢幕組件中使用本地 `StyleSheet.create()`，統一引用 `layoutStyles`
  - 樣式變更僅需修改集中文件，便於主題切換和全域調整

---

## 5. 專案結構建議

---

## 【後端 AI 服務架構】

本專案已完全遷移至後端統一處理所有 AI 功能，前端無需配置 OpenAI API key 等敏感資訊。

### 核心架構

- **車輛異常語音建議**：前端 → `sendBroadcastMessage()` → Broadcast API (`/api/event/broadcast`) → Realtime Voice 伺服器 → LLM + TTS → WebSocket 語音串流
- **AI 助理對話**：前端 → Realtime Voice WebSocket → 即時語音處理伺服器 → ASR + LLM + TTS → 即時語音回應
- **統一 WebSocket 連線**：所有語音功能（對話 + 播報）皆透過 `useRealtimeVoice` Hook 處理

### 技術優勢

- 前端部署簡化，無需配置 AI 相關敏感資訊
- 統一後端 AI 處理，便於版本控制和模型切換
- 減少環境變數配置複雜度，降低部署錯誤機率
- 符合 Serverless 和容器化部署最佳實務

---

```
assets/            # 圖片、icons
src/
  components/      # 共用元件
  screens/         # 各功能頁（已移除本地 StyleSheet，統一使用 layoutStyles）
  styles/          # 集中式樣式管理（layoutStyles.ts 為主要樣式文件）
  hooks/           # 自定義 Hook
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

## 7. 空調控制與即時同步系統

- 汽車空調設定將透過資料庫即時同步（WebSocket/REST fallback），所有狀態皆以 ac_settings table 為主，前端會根據資料庫內容自動顯示與控制。

- ac_settings table 欄位設計如下（對應 ClimateScreen.tsx 之 UI 控制）：

  | 欄位名稱         | 型態      | 預設值 | 說明                   | UI 對應名稱/按鈕          |
  | ---------------- | --------- | ------ | ---------------------- | ------------------------- |
  | auto_on          | BOOLEAN   | false  | 自動開啟               | 自動（autoOn）            |
  | air_conditioning | BOOLEAN   | true   | 空調開關               | 空調（acOn）              |
  | fan_speed        | INTEGER   | 2      | 風速等級 (0-5)         | 風速控制（fanSpeed）      |
  | front_defrost_on | BOOLEAN   | false  | 前擋風玻璃除霜         | 前除霜（frontDefrostOn）  |
  | rear_defrost_on  | BOOLEAN   | false  | 後擋風玻璃除霜         | 後除霜（rearDefrostOn）   |
  | airflow_head_on  | BOOLEAN   | false  | 出風至頭部             | 面部（airFace）           |
  | airflow_body_on  | BOOLEAN   | false  | 出風至身體             | 中間（airMiddle）         |
  | airflow_feet_on  | BOOLEAN   | true   | 出風至腳部             | 腳部（airFoot）           |
  | temperature      | FLOAT     | 22.0   | 溫度設定 (16.0~30.0°C) | 溫度顯示/調整（其他區塊） |
  | created_at       | TIMESTAMP | now()  | 建立時間               |                           |
  | updated_at       | TIMESTAMP | now()  | 最後更新時間           |                           |

- 說明：
  - fan_speed 範圍為 0~5，對應 UI 風速滑桿與指示點。
  - airflow_head_on、airflow_body_on、airflow_feet_on 對應 UI 的「面部」、「中間」、「腳部」三個出風方向按鈕，分別為 airFace、airMiddle、airFoot。
  - 溫度（temperature）欄位雖在 ac_settings table，實際顯示與調整可能於 HomeScreen 或底部溫度顯示區，ClimateScreen 目前未直接顯示溫度調整。
  - 所有狀態皆會根據 ac_settings table 的即時資料自動同步顯示與控制，並非僅溫度。
  - 前端（HomeScreen、ClimateScreen）會自動透過 WebSocket 連線至 ws://localhost:4000（Android 模擬器為 ws://10.0.2.2:4000），連線後主動送出 { action: 'get_state' } 取得資料庫最新狀態。
  - 後端 server.js 監聽 PostgreSQL ac_settings 資料表的 LISTEN/NOTIFY，資料異動時即時推播給所有前端。
  - 若 WebSocket 連線失敗，前端會自動 fallback 以 HTTP GET <http://localhost:4001/state> 取得狀態。
  - 所有溫度（temperature）欄位皆假設為 float 型態，前端已移除 parseFloat 步驟，請確保資料庫 schema 設定正確（FLOAT/REAL/DOUBLE PRECISION）。
  - 前端調整溫度/AC 狀態時，會即時送出 JSON 給 WS，後端自動更新資料庫並廣播。
  - 任何時候都能直接用 psql UPDATE ac_settings SET temperature=xx.x; 測試即時同步。

## 8. 車輛警示燈號系統（vehicle_warnings table）

- 車輛警示燈號皆以 BOOLEAN 型態儲存於 vehicle_warnings table，預設值為 false，代表無異常。前端會根據這些欄位顯示對應警示 icon，並以紅色高亮。
- 欄位說明如下：

  | 欄位名稱                       | 型態    | 預設值 | Icon 名稱（MaterialCommunityIcons） | 說明（中文）       | 說明（英文）             |
  | ------------------------------ | ------- | ------ | ----------------------------------- | ------------------ | ------------------------ |
  | engine_warning                 | BOOLEAN | false  | engine                              | 引擎異常           | Engine malfunction       |
  | oil_pressure_warning           | BOOLEAN | false  | oil-temperature                     | 機油壓力異常       | Oil pressure abnormal    |
  | battery_warning                | BOOLEAN | false  | car-battery                         | 電瓶異常           | Battery issue            |
  | coolant_temp_warning           | BOOLEAN | false  | thermometer                         | 冷卻液溫度過高     | Coolant temperature high |
  | brake_warning                  | BOOLEAN | false  | car-brake-alert                     | 煞車系統異常       | Brake system warning     |
  | abs_warning                    | BOOLEAN | false  | car-brake-abs                       | ABS 防鎖死系統異常 | ABS system warning       |
  | tpms_warning                   | BOOLEAN | false  | car-tire-alert                      | 胎壓異常           | Tire pressure abnormal   |
  | airbag_warning                 | BOOLEAN | false  | airbag                              | 安全氣囊異常       | Airbag warning           |
  | low_fuel_warning               | BOOLEAN | false  | fuel                                | 油量過低           | Low fuel                 |
  | door_ajar_warning              | BOOLEAN | false  | door-open                           | 車門未關妥         | Door ajar                |
  | seat_belt_warning              | BOOLEAN | false  | seatbelt                            | 安全帶未繫上       | Seat belt unfastened     |
  | exterior_light_failure_warning | BOOLEAN | false  | lightbulb-outline                   | 外部燈光故障       | Exterior light failure   |

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

## 9. 資料庫觸發器與通知系統

- 所有 PostgreSQL function 與 trigger 已整合進 `scripts/init_db.tsx`，統一命名：
  - `update_timestamp_generic`：自動更新所有表的 `updated_at` 欄位。
  - `notify_table_update`：所有表的 INSERT/UPDATE 皆自動推播 `pg_notify(<table>_update, row_to_json(NEW))`。
- 各資料表只需：
  - `CREATE TRIGGER update_<table>_timestamp BEFORE UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION update_timestamp_generic();`
  - `CREATE TRIGGER notify_<table>_update_trigger AFTER INSERT OR UPDATE ON <table> FOR EACH ROW EXECUTE FUNCTION notify_table_update();`
- `init_db.tsx` 會自動建立 function 並為 ac_settings、vehicle_info 等表加上通用 trigger，無需手動執行額外 SQL。

---

## 更新紀錄

### 📅 2025-06-09

#### 🎨 StyleSheet 集中管理架構優化
- **完成 StyleSheet 集中化遷移**：將所有螢幕組件（HomeScreen、MusicScreen、AIAssistantScreen、VehicleInfoScreen、ClimateScreen）的本地樣式定義完全遷移至 `src/styles/layoutStyles.ts`
- **樣式命名規範標準化**：採用 `screen*` 前綴系統：`home*`、`music*`、`vehicle*`、`climate*`、`ai*`，總計 100+ 樣式定義統一管理
- **清理冗餘代碼**：移除所有螢幕文件中的 `StyleSheet.create()` 區塊和 StyleSheet import，確保零本地樣式定義
- **樣式可維護性大幅提升**：全面集中管理使主題切換、響應式調整、全域樣式變更變得極其便利
- **架構一致性**：統一使用 `import { layoutStyles } from "../styles/layoutStyles"` 和 `layoutStyles.*` 引用模式

### 🏗️ 架構重大變更

- **Broadcast API 架構遷移**：完全移除 OpenAI 環境變數，統一後端 AI 處理
- **Realtime Voice 系統**：即時語音互動功能，Web 平台自動錄音，支援 protobuf 協議
- **環境變數重構**：支援跨域連線與多設備訪問，智能 hostname 檢測
- **響應式設計系統**：0.6-2.0x 縮放範圍，全面支援多設備

### ⚡ 功能優化

- **風扇控制精度**：從10級調整為5級，提供更精確控制
- **音訊緩衝優化**：減少 74% 網路請求，大幅降低延遲
- **地圖載入優化**：10秒超時機制，自動切換默認背景
- **語音建議功能**：LLM 動態生成建議並自動播報

### 🎨 UI/UX 改進

- **權限管理優化**：Chrome flags 設定指引與錯誤診斷
- **語音優先設計**：AI 助理預設語音模式，適合車載環境
- **即時同步**：WebSocket/REST fallback，空調溫度狀態實時更新
- **樣式集中管理**：所有 StyleSheet 從各螢幕文件遷移至 `src/styles/layoutStyles.ts` 統一管理

### 🔧 代碼架構優化

- **StyleSheet 集中化**：將所有螢幕組件的本地樣式定義遷移至集中式樣式管理
- **命名規範標準化**：採用 `screen*` 前綴命名（如 `home*`、`music*`、`vehicle*`、`climate*`、`ai*`）
- **樣式可維護性提升**：100+ 樣式定義統一管理，便於主題切換和響應式調整
- **清理冗餘代碼**：移除所有螢幕文件中的 `StyleSheet.create()` 區塊和本地樣式引用
