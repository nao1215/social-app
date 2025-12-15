/**
 * ホームヘッダーレイアウト エクスポート（モバイル専用）
 *
 * 【モジュール概要】
 * モバイルプラットフォーム向けのホームヘッダーレイアウトを再エクスポート。
 * React Nativeのプラットフォーム固有ファイル機能を活用し、
 * モバイル（iOS/Android）では本ファイル、Web では .web.tsx を自動選択。
 *
 * 【プラットフォーム分岐の仕組み】
 * - HomeHeaderLayout.tsx: モバイル用（iOS/Android）
 * - HomeHeaderLayout.web.tsx: Web用
 * Metro bundlerが実行環境に応じて適切なファイルを自動選択。
 *
 * 【Go開発者向け補足】
 * - export {...} from: 他モジュールの内容を再エクスポート
 *   （Goのパッケージ再エクスポートに類似）
 * - as: エクスポート名の変更（Goの import alias に類似）
 */
export {HomeHeaderLayoutMobile as HomeHeaderLayout} from './HomeHeaderLayoutMobile' // モバイル用レイアウトを HomeHeaderLayout として公開
