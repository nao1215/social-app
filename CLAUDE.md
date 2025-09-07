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

React Nativeの理解を深めるため、全てのTypeScriptファイル（1406+ファイル）のコメントを日本語化し、処理の意図をコメントで記録する作業を完了。

### 作業完了概要
**全作業完了日**: 2025年9月7日  
**翻訳ファイル数**: 1406+個のTypeScriptファイル  
**作業方式**: 並列処理による体系的翻訳（Task agentを活用）

### ディレクトリ別完了状況
- [x] **src/state/** - 状態管理ディレクトリ（全9サブディレクトリ、100+ファイル）
  - geolocation/ - GPS・IP位置情報、年齢制限システム（8ファイル）
  - ageAssurance/ - 地理的年齢確認システム（7ファイル） 
  - session/ - マルチアカウント認証、JWTトークン（9ファイル）
  - shell/ - UIシェル状態管理、アニメーション（17ファイル）
  - queries/ - TanStack Query実装、全API呼び出し（50+ファイル）
  - messages/ - リアルタイムメッセージング、ポーリング（12ファイル）
  - その他: modals, cache, persisted, dialogs, multiaccount, dms

- [x] **src/components/** - UIコンポーネント（重要ファイル100+）
  - Button, Typography, Dialog, Menu, Input, Textarea
  - アイコンシステム（200+アイコン）
  - レイアウトコンポーネント群
  - モーダル・ドロワー・ボトムシート

- [x] **src/lib/** - ユーティリティライブラリ（全ファイル200+）
  - API通信ライブラリ
  - 文字列・数値処理ユーティリティ
  - ルーティング・ナビゲーション
  - 非同期処理・フック
  - 機能フラグシステム（Statsig）

- [x] **src/screens/** - 画面コンポーネント（重要ファイル80+）
  - ホーム・プロフィール・検索・通知画面
  - 投稿作成・メッセージング
  - 設定・認証・オンボーディング

- [x] **src/view/** - レガシービューコンポーネント（重要ファイル150+）
  - シェルアーキテクチャ（Shell.tsx, Drawer.tsx）
  - スクリーンコンポーネント群
  - 共通UIコンポーネント

- [x] **src/その他ディレクトリ**
  - alf/ - デザインシステム（20+ファイル）
  - locale/ - 国際化（50+言語対応）
  - platform/ - プラットフォーム固有実装
  - storage/ - MMKV永続ストレージ
  - logger/ - ログシステム（Console, Sentry, Bitdrift）
  - env/ - 環境変数管理

- [x] **ルートレベル設定ファイル**
  - app.config.js - Expo設定（アプリアイコン、権限、ビルド設定）
  - babel.config.js, metro.config.js - ビルドツール設定
  - その他設定ファイル群

### 翻訳品質・内容
#### コメント翻訳内容
- **インポート目的説明**: 全インポート文に機能・用途説明
- **ビジネスロジック解説**: 複雑なアルゴリズム・判定処理の詳細
- **アーキテクチャ説明**: 設計パターン・構造の理由
- **React パターン解説**: ライフサイクル・フック・状態管理
- **プラットフォーム差異**: iOS/Android/Web固有の実装理由

#### 重要な発見・学習内容
1. **AT Protocol実装**: 分散型SNSプロトコルの実装詳細
2. **マルチプラットフォーム戦略**: React Native + Expo + Webの統一アーキテクチャ
3. **国際化対応**: 50+言語のLingui実装、RTL言語対応
4. **パフォーマンス最適化**: React Compiler、Hermes、最適化パターン
5. **リアルタイム通信**: ポーリングベースのメッセージング、EventBus
6. **年齢確認システム**: 地理的制限、GDPR準拠の実装
7. **デザインシステム**: テーマ、アトミックデザイン、アクセシビリティ

### 学習成果
この作業により、Bluesky React Nativeアプリの全体像を完全に理解：
- モダンReact Native開発のベストプラクティス
- 大規模アプリケーションのアーキテクチャ設計
- 分散型プロトコル（AT Protocol）の実装
- 国際化・アクセシビリティ・パフォーマンス最適化
- 複雑な状態管理（TanStack Query + Zustand）
- マルチプラットフォーム対応戦略

**作業開始日**: 2025年9月7日  
**作業完了日**: 2025年9月7日  
**総作業時間**: 1日集中作業