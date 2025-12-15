/**
 * Webバンドル開始時間マーカー
 * Web bundle start time marker
 *
 * このファイルは、Webアプリケーションのバンドル読み込み開始時刻を記録します。
 * パフォーマンス測定やアプリ起動時間の分析に使用されます。
 *
 * This file records the start time of web application bundle loading.
 * Used for performance measurement and app startup time analysis.
 *
 * 【Goユーザー向け解説】
 * これはパフォーマンス計測の基準点となるタイムスタンプです。
 * Goでいうtime.Now()の記録に相当し、後続の処理時間を測定するための
 * 開始地点となります。
 *
 * Web環境特有の実装:
 * - .web.ts拡張子: Web版ビルド時のみバンドル
 * - React Native版では、Metroバンドラーが自動設定
 * - performance.now(): ページ読み込みからの経過ミリ秒
 *
 * 使用例:
 * ```typescript
 * const loadTime = performance.now() - window.__BUNDLE_START_TIME__
 * console.log(`Bundle loaded in ${loadTime}ms`)
 * ```
 *
 * @see performance.now() - Web Performance API
 */

/**
 * バンドル開始時刻をグローバル変数に記録
 * Record bundle start time in global variable
 *
 * window.__BUNDLE_START_TIME__にperformance.now()の値を設定します。
 * この値はページ読み込み開始からのミリ秒数です。
 *
 * Sets performance.now() value to window.__BUNDLE_START_TIME__.
 * This value is milliseconds since page load start.
 *
 * 【注意】
 * React Native版では、Metroバンドラーがこの値を自動的に設定するため、
 * このファイルは使用されません。
 *
 * In React Native version, Metro bundler automatically sets this value,
 * so this file is not used.
 *
 * @global
 * @type {number}
 */
// @ts-ignore Web-only. On RN, this is set by Metro.
window.__BUNDLE_START_TIME__ = performance.now()
