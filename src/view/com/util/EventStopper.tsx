/**
 * イベント伝播停止コンポーネント
 * Event Propagation Stopper Component
 *
 * 【概要】
 * 子要素で発生したイベントが親要素に伝播するのを防ぐラッパーコンポーネント。
 * 入れ子になったインタラクティブ要素で、親のハンドラーが誤って呼ばれるのを防ぐ。
 *
 * 【使用場面】
 * - リストアイテム内のボタン（タップ時にリストアイテム全体が反応しないように）
 * - モーダル内のクリック（背景クリックでモーダルが閉じないように）
 * - ネストしたプレス可能要素
 *
 * 【Goユーザー向け補足】
 * - stopPropagation: イベントバブリング停止（Goにはない概念）
 * - イベントバブリング: DOMイベントが子から親へ伝播する仕組み
 *   HTMLのイベントモデル特有の動作で、Goのイベントシステムとは異なる
 *
 * 【動作原理】
 * 1. タッチ/クリックイベントをキャプチャ
 * 2. stopPropagation()で親への伝播を停止
 * 3. 子要素のイベントは正常に処理される
 */

// React Nativeの基本View
// React Native basic View
import {View, type ViewStyle} from 'react-native'

// Reactの型定義
// React type definitions
import type React from 'react'

/**
 * イベント伝播停止コンポーネント
 * Event Stopper Component
 *
 * This utility function captures events and stops
 * them from propagating upwards.
 *
 * @param children 子要素 / Child elements
 * @param style スタイル / Style
 * @param onKeyDown キーダウンイベントも停止するか（デフォルト: true） / Whether to stop keyDown events (default: true)
 */
export function EventStopper({
  children,
  style,
  onKeyDown = true,
}: React.PropsWithChildren<{
  style?: ViewStyle | ViewStyle[]
  /**
   * デフォルト `true`。`false`に設定するとonKeyDownが親に伝播する
   * Default `true`. Set to `false` to allow onKeyDown to propagate
   */
  onKeyDown?: boolean
}>) {
  /**
   * イベント伝播を停止する関数
   * Function to stop event propagation
   *
   * @param e イベントオブジェクト / Event object
   */
  const stop = (e: any) => {
    // 親要素へのイベント伝播を停止
    // Stop event propagation to parent elements
    e.stopPropagation()
  }

  return (
    <View
      // タッチレスポンダーを自身で処理することを宣言
      // Declare that this view handles touch responder
      onStartShouldSetResponder={_ => true}
      // タッチ終了時に伝播停止
      // Stop propagation on touch end
      onTouchEnd={stop}
      // @ts-ignore Web専用: クリックイベント / Web only: click event
      onClick={stop}
      // キーダウンイベント（オプション）
      // KeyDown event (optional)
      onKeyDown={onKeyDown ? stop : undefined}
      style={style}>
      {children}
    </View>
  )
}
