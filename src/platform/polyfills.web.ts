/**
 * Web プラットフォーム向けポリフィルモジュール
 * Polyfills module for Web platform
 *
 * このモジュールは、React Native Webで不足している機能や、開発中の
 * デバッグ体験を向上させるためのポリフィルを提供します。
 *
 * This module provides polyfills for missing features in React Native Web
 * and improves the debugging experience during development.
 *
 * 【Goユーザー向け解説】
 * JavaScriptのポリフィルは、Goでいうshim層に相当します。
 * 古いブラウザや環境で不足している機能を補完するコードです。
 * Web環境特有のファイル（.web.ts拡張子）は、Web版ビルド時のみバンドルされます。
 *
 * 主な機能:
 * - Array.prototype.findLast のポリフィル（古いブラウザ対応）
 * - setImmediateのWeb実装（Node.jsのsetImmediateをsetTimeoutでエミュレート）
 * - 開発環境でのReact Native Web警告の強化（console.errorをエラーに変換）
 *
 * @see https://github.com/es-shims/Array.prototype.findlast
 */

// Array.prototype.findLastのポリフィルをインポート（ES2023機能）
// Import polyfill for Array.prototype.findLast (ES2023 feature)
import 'array.prototype.findlast/auto'
/// <reference lib="dom" />

/**
 * setImmediateのWeb実装
 * Web implementation of setImmediate
 *
 * Node.jsのsetImmediate関数をWeb環境でエミュレートします。
 * React NativeではNode.js APIの一部が期待されるため、これが必要です。
 *
 * Emulates Node.js setImmediate function in Web environment.
 * This is needed because React Native expects some Node.js APIs.
 *
 * 実装: setTimeout(cb, 0)を使用して次のイベントループで実行
 * Implementation: Uses setTimeout(cb, 0) to execute in the next event loop
 */
// @ts-ignore whatever typescript wants to complain about here, I dont care about -prf
window.setImmediate = (cb: () => void) => setTimeout(cb, 0)

/**
 * 開発環境専用: React Native Webの警告強化
 * Development-only: Enhanced warnings for React Native Web
 *
 * React Native Webの<View>コンポーネントは、テキストが<Text>でラップされているか
 * 検証しますが、console.errorでしか警告しないため見逃しやすいです。
 * この処理は、開発中にエラーを早期に検出できるよう、警告を例外に変換します。
 *
 * React Native Web's <View> component validates that text is wrapped in <Text>,
 * but only warns via console.error, making it easy to miss.
 * This converts those warnings to exceptions for early detection during development.
 *
 * 【Goユーザー向け解説】
 * これはGoのpanicに似た動作です。開発中のみ、特定のエラーを
 * 実行時例外として扱うことで、問題を早期発見します。
 */
if (process.env.NODE_ENV !== 'production') {
  // In development, react-native-web's <View> tries to validate that
  // text is wrapped into <Text>. It doesn't catch all cases but is useful.
  // Unfortunately, it only does that via console.error so it's easy to miss.
  // This is a hack to get it showing as a redbox on the web so we catch it early.

  // オリジナルのconsole.errorを保存
  // Save the original console.error
  const realConsoleError = console.error

  // 既に投げられたエラーを追跡（無限ループ防止）
  // Track already thrown errors (prevent infinite loops)
  const thrownErrors = new WeakSet()

  /**
   * console.errorラッパー関数
   * console.error wrapper function
   *
   * "Unexpected text node"エラーを検出し、例外として投げます。
   * 偽陽性（空文字列による警告）は無視します。
   *
   * Detects "Unexpected text node" errors and throws them as exceptions.
   * Ignores false positives (warnings from empty strings).
   */
  console.error = function consoleErrorWrapper(msgOrError) {
    // "Unexpected text node"で始まる文字列エラーをチェック
    // Check for string errors starting with "Unexpected text node"
    if (
      typeof msgOrError === 'string' &&
      msgOrError.startsWith('Unexpected text node')
    ) {
      // 偽陽性: 空文字列による警告を無視
      // False positive: Ignore warnings from empty strings
      if (
        msgOrError ===
        'Unexpected text node: . A text node cannot be a child of a <View>.'
      ) {
        // This is due to a stray empty string.
        // React already handles this fine, so RNW warning is a false positive. Ignore.
        return
      }

      // 警告メッセージからエラーオブジェクトを作成
      // Create an error object from the warning message
      const err = new Error(msgOrError)

      // エラーを追跡セットに追加（再スロー防止）
      // Add error to tracking set (prevent re-throwing)
      thrownErrors.add(err)

      // 例外として投げる（開発環境でredboxとして表示される）
      // Throw as exception (will show as redbox in development)
      throw err
    } else if (!thrownErrors.has(msgOrError)) {
      // それ以外のエラーは通常通り処理
      // Handle other errors normally
      return realConsoleError.apply(this, arguments as any)
    }
  }
}
