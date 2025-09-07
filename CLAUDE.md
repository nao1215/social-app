# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development
- `yarn` - Install dependencies
- `yarn web` - Start web development server
- `yarn ios` - Run iOS app (requires Xcode setup)
- `yarn android` - Run Android app (requires Android Studio setup)
- `yarn start` - Start Expo development server with dev client
- `yarn prebuild` - Run Expo prebuild (required after native dependency changes)

### Testing
- `yarn test` - Run Jest unit tests
- `yarn test-watch` - Run Jest in watch mode
- `yarn test-ci` - Run tests in CI mode
- `yarn e2e:mock-server` - Start mock server for E2E tests
- `yarn e2e:metro` - Start Metro for E2E testing
- `yarn e2e:run` - Run Maestro E2E tests

### Code Quality
- `yarn lint` - Run ESLint
- `yarn typecheck` - Run TypeScript type checking
- `yarn intl:build` - Build internationalization files

### Performance Testing
- `yarn perf:measure` - Live performance testing with Flashlight
- `yarn perf:test:measure` - Run performance tests and generate results

## Project Architecture

### Frontend Structure
This is a React Native app built with Expo that supports iOS, Android, and Web platforms.

**Key Directories:**
- `src/` - Main application source code
  - `screens/` - Screen components organized by feature
  - `components/` - Reusable UI components
  - `state/` - Global state management (React Query, Zustand)
  - `lib/` - Utility libraries and helpers
  - `alf/` - Design system components
  - `view/` - Legacy view components (being migrated)
  - `locale/` - Internationalization files
  - `platform/` - Platform-specific implementations
  - `logger/` - Logging utilities

### Backend Services
- `bskyweb/` - Go web server for serving the production web app
- `bskyembed/` - TypeScript embed service
- `bskylink/` - Link preview service
- `bskyogcard/` - Open Graph card service

### Configuration Files
- `app.config.js` - Expo configuration
- `tsconfig.json` - TypeScript configuration with path aliases (`#/*` maps to `src/*`)
- `.eslintrc.js` - ESLint configuration with custom rules for Bluesky
- `babel.config.js` - Babel configuration
- `metro.config.js` - Metro bundler configuration

## Development Workflow

### Platform-Specific Files
The codebase uses platform-specific file extensions:
- `.native.tsx` - React Native (iOS/Android)
- `.web.tsx` - Web platform
- `.ios.tsx` - iOS specific
- `.android.tsx` - Android specific

### State Management
- Uses React Query (@tanstack/react-query) for server state
- Zustand for client-side state management
- MMKV for persistent storage

### Internationalization
- Uses Lingui for i18n
- Extract strings: `yarn intl:extract`
- Compile translations: `yarn intl:compile`

### Testing Strategy
- Jest for unit tests with React Native Testing Library
- Maestro for E2E testing
- Flashlight for performance testing
- Mock setups in `jest/jestSetup.js`

### Code Style
- TypeScript with strict configuration
- ESLint with custom rules for text wrapping and imports
- Prettier for formatting
- Import order enforced by simple-import-sort plugin

## Important Notes

### Environment Setup
- Copy `.env.example` to `.env` for local development
- Node.js 20+ required
- For iOS: Xcode with simulators configured
- For Android: Android Studio with SDK and emulator
- For E2E: Maestro CLI tool

### Native Development
- Run `npx expo prebuild` after changing native dependencies
- iOS requires proper code signing setup
- Android requires ANDROID_HOME environment variable

### Performance Considerations
- React Compiler is enabled (experimental)
- Uses Hermes for better performance
- Bundle analysis available with `yarn generate-webpack-stats-file`

### Build Process
- Web builds: `yarn build-web`
- Native builds use EAS Build: `yarn build-ios` or `yarn build-android`
- OTA updates supported via EAS Update

## 日本語コメント化作業進捗

React Nativeの理解を深めるため、全てのコメントを日本語化し、処理の意図をコメントで記録する作業を実施中。

### 作業完了ファイル
- [x] src/App.native.tsx - メインアプリケーションエントリーポイント（完了）
- [～] src/Navigation.tsx - ナビゲーション設定（インポート部分完了、1100行の大規模ファイル）
- [x] src/view/screens/Home.tsx - ホーム画面（インポート部分完了）
- [x] src/state/geolocation/config.ts - 位置情報設定管理（完了）
- [x] src/components/Divider.tsx - 区切り線コンポーネント（完了）
- [x] src/components/Loader.tsx - ローディングスピナー（完了）

### 作業詳細
#### src/App.native.tsx
- 全インポート文に日本語コメント追加
- プロバイダー構造の説明コメント追加
- 初期化処理の詳細説明追加
- アプリ起動フローの解説追加

#### src/Navigation.tsx（部分完了）
- 全インポート文（160行）に機能別グループ化と日本語コメント追加
- React Navigation関連インポートの詳細説明
- 大量の画面コンポーネント（80+画面）を機能別に分類・コメント化
- 設定画面の詳細分類（基本設定・通知設定・その他）

#### src/view/screens/Home.tsx（部分完了）
- インポート文を機能別にグループ化してコメント追加
- React基本機能、フック、状態管理、UIコンポーネントに分類

#### src/state/geolocation/config.ts（完了）
- 位置情報設定取得の仕組み理解
- リモートAPI取得、エラーハンドリング、フォールバック処理
- デバイスストレージへの永続化
- Fail-safe設計の実装パターン学習

#### 共通コンポーネント
- **Divider.tsx**: シンプルな区切り線コンポーネント、テーマシステム活用
- **Loader.tsx**: React Native Reanimatedを活用した回転アニメーション

### 作業開始日
2025年9月7日