/**
 * プラットフォーム検出ユーティリティモジュール
 * Platform detection utility module
 *
 * このモジュールは、アプリが実行されているプラットフォームを検出し、
 * プラットフォーム固有の処理を条件分岐するための定数を提供します。
 *
 * This module detects the platform on which the app is running and
 * provides constants for conditional platform-specific processing.
 *
 * 【Goユーザー向け解説】
 * Goのruntime.GOOS、runtime.GOARCHに相当する機能です。
 * React Nativeでは同一コードがiOS/Android/Web上で動作するため、
 * プラットフォーム判定が重要になります。
 *
 * 使用例:
 * ```typescript
 * if (isIOS) {
 *   // iOS固有の処理
 * } else if (isAndroid) {
 *   // Android固有の処理
 * } else if (isWeb) {
 *   // Web固有の処理
 * }
 * ```
 *
 * 検出可能なプラットフォーム:
 * - iOS (iPhone/iPad)
 * - Android
 * - Web (ブラウザ)
 * - Mobile Web (モバイルブラウザ)
 * - iPhone Web (iPhoneのSafari/ブラウザ)
 */

// プラットフォーム検出ユーティリティ
// Platform detection utilities

// React NativeのPlatform APIをインポート
// Import React Native's Platform API
import {Platform} from 'react-native' // React Nativeプラットフォーム情報

/**
 * iOSプラットフォームかどうか
 * Whether the platform is iOS
 *
 * iPhone、iPadで動作するReact Nativeアプリの場合にtrue
 * True for React Native apps running on iPhone/iPad
 *
 * @constant {boolean}
 */
// プラットフォーム判定定数
// Platform detection constants
export const isIOS = Platform.OS === 'ios'              // iOSかどうか

/**
 * Androidプラットフォームかどうか
 * Whether the platform is Android
 *
 * Androidデバイスで動作するReact Nativeアプリの場合にtrue
 * True for React Native apps running on Android devices
 *
 * @constant {boolean}
 */
export const isAndroid = Platform.OS === 'android'      // Androidかどうか

/**
 * ネイティブプラットフォームかどうか（iOS または Android）
 * Whether the platform is native (iOS or Android)
 *
 * React Nativeアプリ（iOS/Android）の場合にtrue
 * Web版の場合はfalse
 *
 * True for React Native apps (iOS/Android)
 * False for Web version
 *
 * @constant {boolean}
 */
export const isNative = isIOS || isAndroid              // ネイティブアプリかどうか

/**
 * Webプラットフォームかどうか
 * Whether the platform is Web
 *
 * ブラウザで動作するReact Native Webの場合にtrue
 * True for React Native Web running in browsers
 *
 * @constant {boolean}
 */
export const isWeb = !isNative                          // Webかどうか

/**
 * モバイルWeb判定用メディアクエリ
 * Media query for mobile web detection
 *
 * 画面幅1300px以下をモバイルWebと判定します。
 * Screens with width <= 1300px are considered mobile web.
 *
 * @constant {string}
 */
export const isMobileWebMediaQuery = 'only screen and (max-width: 1300px)' // モバイルWebメディアクエリ

/**
 * モバイルWebかどうか
 * Whether the platform is mobile web
 *
 * Web版で、かつ画面幅が1300px以下の場合にtrue
 * レスポンシブデザインで、モバイルUI/デスクトップUIを切り替えるために使用
 *
 * True for Web version with screen width <= 1300px
 * Used to switch between mobile UI and desktop UI in responsive design
 *
 * 【仕組み】
 * window.matchMedia()を使用してメディアクエリを評価します。
 * Uses window.matchMedia() to evaluate media query.
 *
 * @constant {boolean}
 */
export const isMobileWeb =                              // モバイルWebかどうかの判定
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches

/**
 * iPhone Webかどうか
 * Whether the platform is iPhone Web
 *
 * Web版で、かつユーザーエージェントにiPhoneが含まれる場合にtrue
 * iPhone特有のUIや挙動の調整に使用
 *
 * True for Web version with "iPhone" in user agent
 * Used for iPhone-specific UI adjustments
 *
 * 【注意】
 * navigator.userAgentは偽装可能なため、完全に信頼できません。
 * あくまで補助的な判定として使用してください。
 *
 * navigator.userAgent can be spoofed, so this is not completely reliable.
 * Use this as a supplementary detection only.
 *
 * @constant {boolean}
 */
export const isIPhoneWeb = isWeb && /iPhone/.test(navigator.userAgent) // iPhone Web版かどうか
