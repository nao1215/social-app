/**
 * =============================================================================
 * Android専用 スプラッシュスクリーン コンポーネント
 * =============================================================================
 *
 * このファイルは、Androidアプリ起動時のスプラッシュスクリーン（起動画面）を制御します。
 *
 * 📋 主な役割：
 * - アプリ初期化完了まで起動画面を表示
 * - 初期化完了後に自動的にスプラッシュスクリーンを非表示化
 *
 * 🎯 プラットフォーム固有実装：
 * - このファイルは `.android.tsx` という拡張子により、Androidでのみ使用されます
 * - React Nativeのプラットフォーム固有ファイル機能を利用しています
 * - iOS版は Splash.tsx が使用され、より複雑なアニメーションを含みます
 *
 * 💡 Go開発者向け補足：
 * - ファイル名の `.android.tsx` 拡張子はビルドタグ（build tags）に相当します
 * - Goでいう `// +build android` のような条件付きコンパイルと同じ概念です
 */

// React基本機能
import {useEffect} from 'react'
// Expo スプラッシュスクリーン制御
import * as SplashScreen from 'expo-splash-screen' // ネイティブのスプラッシュスクリーン制御API

/**
 * Propsの型定義
 *
 * 💡 Go開発者向け補足：
 * - typeはGoのtype aliasやstructの型定義に相当します
 * - `isReady: boolean` はGoでいう `IsReady bool` に相当します
 */
type Props = {
  isReady: boolean  // アプリの初期化完了フラグ
}

/**
 * Android専用スプラッシュスクリーンコンポーネント
 *
 * 🎯 動作：
 * 1. isReadyがtrueになるまでネイティブのスプラッシュスクリーンを表示
 * 2. isReadyがtrueになったらスプラッシュスクリーンを非表示化
 * 3. 子コンポーネント（メインアプリUI）を表示
 *
 * 💡 Go開発者向け補足：
 * - React.PropsWithChildren<Props> はGoでいう埋め込みフィールドに相当します
 * - childrenはこのコンポーネントの内側に配置された子要素を表します
 * - 関数コンポーネントはGoの構造体メソッドに似ていますが、UIを返す関数です
 *
 * @param isReady - アプリの初期化完了フラグ
 * @param children - 子コンポーネント（メインアプリUI）
 * @returns React要素（初期化完了後はchildren、未完了時はundefined）
 */
export function Splash({isReady, children}: React.PropsWithChildren<Props>) {
  /**
   * スプラッシュスクリーン制御のための副作用フック
   *
   * 💡 Go開発者向け補足：
   * - useEffectはReactのフックで、副作用（side effects）を実行します
   * - 第2引数の依存配列([isReady])が変更された時に実行されます
   * - Goには直接対応する機能はありませんが、概念的にはgoroutineでの監視処理に似ています
   */
  useEffect(() => {
    if (isReady) {
      // アプリの初期化が完了したらスプラッシュスクリーンを非表示化
      // 💡 この呼び出しは非同期ですが、結果を待つ必要がないため await していません
      SplashScreen.hideAsync()
    }
  }, [isReady])  // isReadyが変更された時に再実行

  /**
   * 初期化完了後のみ子コンポーネントを表示
   *
   * 💡 Go開発者向け補足：
   * - この条件分岐はGoのif文と同じです
   * - childrenを返すことで、メインアプリUIが表示されます
   * - undefinedを返すと何も表示されません（スプラッシュスクリーンのみが表示される状態）
   */
  if (isReady) {
    return children
  }
}
