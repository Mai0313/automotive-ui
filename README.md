<center>

# Automotive UI Demo (React Native + TypeScript)

[![python](https://img.shields.io/badge/-Python_3.8_%7C_3.9_%7C_3.10%7C_3.11-blue?logo=python&logoColor=white)](https://github.com/pre-commit/pre-commit)
[![pytorch](https://img.shields.io/badge/PyTorch_2.0+-ee4c2c?logo=pytorch&logoColor=white)](https://pytorch.org/get-started/locally/)
[![React](https://img.shields.io/badge/-React_19.1-61DAFB?logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/-TypeScript_5.8-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Ruff](https://img.shields.io/endpoint?url=https://raw.githubusercontent.com/astral-sh/ruff/main/assets/badge/v2.json)](https://github.com/astral-sh/ruff)
[![tests](https://github.com/Mai0313/repo_template/actions/workflows/test.yml/badge.svg)](https://github.com/Mai0313/repo_template/actions/workflows/test.yml)
[![code-quality](https://github.com/Mai0313/repo_template/actions/workflows/code-quality-check.yml/badge.svg)](https://github.com/Mai0313/repo_template/actions/workflows/code-quality-check.yml)
[![codecov](https://codecov.io/gh/Mai0313/repo_template/branch/master/graph/badge.svg)](https://codecov.io/gh/Mai0313/repo_template)
[![license](https://img.shields.io/badge/License-MIT-green.svg?labelColor=gray)](https://github.com/Mai0313/repo_template/tree/master?tab=License-1-ov-file)
[![PRs](https://img.shields.io/badge/PRs-welcome-brightgreen.svg)](https://github.com/Mai0313/repo_template/pulls)
[![contributors](https://img.shields.io/github/contributors/Mai0313/repo_template.svg)](https://github.com/Mai0313/repo_template/graphs/contributors)

</center>

An in-vehicle UI demo built from scratch using React Native and TypeScript, designed for cross-platform support (iOS, Android, Web). This project showcases a full-screen interactive map home screen with overlay panels for music, climate control, vehicle information, and an AI assistant.

## Key Features

- **Home Screen**

  - Full-screen interactive map with a black bezel for a car-like experience.
  - Bottom control bar with icons for Vehicle Info, Climate, Music, and AI Assistant.
  - Overlay panels (cards) instead of traditional navigation—smooth slide-in/out animations and tap-to-close behavior.
  - Default vehicle status card modeled after Tesla’s center display (speed, warnings, quick actions).

- **Climate Control**

  - Real-time temperature adjustment, fan speed control, AC toggle, auto mode, front/rear defrost, and airflow direction.
  - WebSocket-based synchronization with PostgreSQL `ac_settings` table (HTTP REST fallback).
  - Custom `useClimateSettings` and `useHomeClimateSettings` hooks encapsulate communication logic.
  - Reusable `ControlButton` component for consistent UI across controls.

- **Vehicle Info**

  - Live warning indicators (engine, oil pressure, battery, TPMS, etc.) via WebSocket notifications.

- **Music Player**

  - Mock playback controls with album art, track info, and progress bar.
  - Spotify embed on Web; native UI on mobile.

- **AI Assistant**

  - Voice and text chat interface powered by OpenAI Whisper (speech-to-text), ChatGPT, and TTS (`tts-1-hd`).
  - Expo Audio + FileSystem integration for native recording/playback.

- **Navigation (Future)**
  - Placeholder for Google Navigation React integration and dummy route previews.

## Technology Stack

- React Native (Expo)
- TypeScript
- React Navigation
- React Native Community Slider
- Expo-Audio, Expo-FileSystem
- OpenAI Whisper & TTS APIs
- PostgreSQL with `pg_notify` triggers
- WebSocket server (`ws://localhost:4000`) + HTTP fallback (`http://localhost:4001`)
- Styled via shared `commonStyles` and reusable components

## Project Structure

```
assets/                # Icons & images
src/
  components/          # Reusable UI components (ControlButton, BottomBarButton, FloatingStatusBar, MapView)
  hooks/               # Custom hooks (useClimateSettings, useHomeClimateSettings, etc.)
  screens/             # Screen components (HomeScreen, ClimateScreen, VehicleInfoScreen, MusicScreen, AIAssistantScreen)
  styles/              # Shared style definitions (commonStyles)
  types/               # Type declarations
App.tsx                # Entry point for the React Native app
server.js              # WebSocket & REST fallback server
scripts/init_db.tsx    # Database schema, triggers & notification setup
README.md              # Project overview and setup instructions
```

## Getting Started

### Prerequisites

- Node.js (>=14)
- Yarn or npm
- Expo CLI (`npm install -g expo-cli`)
- PostgreSQL

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-org/AutomotiveUI.git
   cd AutomotiveUI
   ```
2. Install dependencies:
   ```bash
   yarn install
   ```
3. Initialize the database and triggers:
   ```bash
   npx ts-node scripts/init_db.tsx
   ```
4. Start the backend server (WebSocket + REST fallback):
   ```bash
   node server.js
   ```
5. Run the Expo application:
   ```bash
   expo start
   ```
   - Scan the QR code for iOS/Android.
   - Press `w` for Web mode.

## Development Workflow

1. Review requirements in `.github/copilot-instructions.md`.
2. Implement or update UI in `src/screens`, logic in `src/hooks`, or reusable components in `src/components`.
3. Test on mobile simulators and Web.
4. Update `.github/copilot-instructions.md` with a summary of your changes.
5. Commit, push, and open a pull request with a clear description.

## Contributing

Please see [CODEOWNERS](.github/CODEOWNERS) and `.github/copilot-instructions.md` for contribution guidelines and documentation standards.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE) for details.
