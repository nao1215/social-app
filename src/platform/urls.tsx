/**
 * プラットフォーム別URL処理モジュール
 * Platform-specific URL handling module
 *
 * このモジュールは、iOS/Android/Web各プラットフォームでのURL取得と操作を
 * 統一されたインターフェースで提供します。
 *
 * This module provides unified interface for URL retrieval and manipulation
 * across iOS/Android/Web platforms.
 *
 * 【Goユーザー向け解説】
 * プラットフォームごとに異なるURL取得方法を抽象化しています。
 * Goでのビルドタグ（// +build ios, android, web）による条件コンパイルに似た
 * アプローチで、実行時にプラットフォームを判定して処理を切り替えます。
 *
 * 主な機能:
 * - getInitialURL(): アプリ起動時のディープリンクURL取得
 * - clearHash(): WebのURLハッシュをクリア
 *
 * プラットフォーム別の動作:
 * - iOS/Android: Linking.getInitialURL()でディープリンク取得
 * - Web: window.location.pathnameから現在のパスを取得
 */

// React NativeのLinking APIをインポート（ディープリンク処理用）
// Import React Native's Linking API (for deep link handling)
import {Linking} from 'react-native'

// プラットフォーム検出ユーティリティをインポート
// Import platform detection utilities
import {isNative, isWeb} from './detection'

/**
 * アプリの初期URLを取得
 * Get the initial URL for the app
 *
 * アプリが起動されたときのディープリンクURLを取得します。
 * プラットフォームごとに異なる方法で実装されています。
 *
 * Retrieves the deep link URL when the app is launched.
 * Implementation varies by platform.
 *
 * 【プラットフォーム別の動作】
 *
 * iOS/Android:
 * - Linking.getInitialURL()を使用
 * - ディープリンク（myapp://path）やユニバーサルリンク（https://example.com/path）
 *   からアプリが起動された場合、そのURLを返す
 * - 通常起動の場合はundefinedを返す
 *
 * Web:
 * - window.location.pathnameを使用
 * - ルートパス（'/'）以外の場合、そのパスを返す
 * - ルートパスの場合はundefinedを返す
 *
 * 【Goユーザー向け解説】
 * これはWebサーバーの最初のリクエストパスを取得する処理に相当します。
 * SPAアプリケーションのルーティングや、ディープリンクからの復帰に使用されます。
 *
 * @returns Promise<string | undefined> - 初期URL、または存在しない場合はundefined
 *
 * @example
 * ```typescript
 * const url = await getInitialURL()
 * if (url) {
 *   console.log('App launched with URL:', url)
 *   // URLに基づいてナビゲーション
 * }
 * ```
 */
export async function getInitialURL(): Promise<string | undefined> {
  // ネイティブプラットフォーム（iOS/Android）の場合
  // For native platforms (iOS/Android)
  if (isNative) {
    // Linking APIで初期URLを取得（ディープリンク）
    // Get initial URL with Linking API (deep link)
    const url = await Linking.getInitialURL()
    if (url) {
      return url
    }
    return undefined
  } else {
    // Webプラットフォームの場合
    // For Web platform
    // @ts-ignore window exists -prf
    // ルートパス以外の場合、現在のパス名を返す
    // Return current pathname if not root path
    if (window.location.pathname !== '/') {
      return window.location.pathname
    }
    return undefined
  }
}

/**
 * URLハッシュをクリア
 * Clear the URL hash
 *
 * Web版でのみ動作し、URLのハッシュ部分（#以降）を削除します。
 * iOS/Androidでは何もしません。
 *
 * Only works on Web version, removes the hash portion (#...) of the URL.
 * Does nothing on iOS/Android.
 *
 * 【用途】
 * - OAuth認証後のリダイレクト時に残るハッシュをクリア
 * - 古いハッシュルーティングの痕跡を削除
 * - URLを綺麗にして、ブックマークやシェアに適した形にする
 *
 * Use cases:
 * - Clear hash remaining after OAuth redirect
 * - Remove traces of old hash routing
 * - Clean up URL for bookmarking and sharing
 *
 * 【Goユーザー向け解説】
 * これはHTTPリダイレクト後のクエリパラメータクリーンアップに似ています。
 * ブラウザの履歴を汚さずにURLを更新します。
 *
 * @example
 * ```typescript
 * // Before: https://example.com/path#section
 * clearHash()
 * // After: https://example.com/path
 * ```
 */
export function clearHash() {
  // Web版の場合のみ実行
  // Execute only on Web version
  if (isWeb) {
    // @ts-ignore window exists -prf
    // URLハッシュを空文字列に設定（#以降を削除）
    // Set URL hash to empty string (remove #... portion)
    window.location.hash = ''
  }
}
