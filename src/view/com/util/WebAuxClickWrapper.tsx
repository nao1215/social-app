/**
 * Web補助クリックラッパー
 * Web Auxiliary Click Wrapper
 *
 * 【概要】
 * マウスの中ボタン（ホイールボタン）クリックを処理するラッパー。
 * 中クリックでリンクを新タブで開く動作を実現。
 *
 * 【動作】
 * 1. 中クリックダウン → スクロールモードを防止
 * 2. 中クリックアップ → metaKey付きのclickイベントに変換
 * 3. これにより、リンクが新タブで開くように動作
 *
 * 【Goユーザー向け補足】
 * - e.button === 1: 中クリック（マウスボタン番号）
 * - dispatchEvent: イベントをプログラム的に発火
 * - metaKey: Cmd（Mac）/Ctrl（Win）キーフラグ
 * - Web専用機能（ネイティブでは何もしない）
 */

// React本体
// React core
import React from 'react'

// プラットフォーム判定
// Platform detection
import {Platform} from 'react-native'

/**
 * マウスアップイベントハンドラ
 * Mouse up event handler
 *
 * 中クリックを検出し、metaKey付きclickイベントに変換
 */
const onMouseUp = (e: React.MouseEvent & {target: HTMLElement}) => {
  // 中ボタン以外、またはアンカー要素内の場合は何もしない
  // Do nothing if not middle button or inside anchor element
  if (e.button !== 1 || e.target.closest('a') || e.target.tagName === 'A') {
    return
  }

  // metaKey付きclickイベントを発火（新タブで開く動作）
  // Dispatch click event with metaKey (opens in new tab)
  e.target.dispatchEvent(
    new MouseEvent('click', {metaKey: true, bubbles: true}),
  )
}

/**
 * マウスダウンイベントハンドラ
 * Mouse down event handler
 *
 * 中クリックのデフォルト動作（スクロールモード）を防止
 */
const onMouseDown = (e: React.MouseEvent) => {
  // 中ボタンのデフォルト動作を防止
  // Prevent middle button default behavior
  if (e.button !== 1) return
  e.preventDefault()
}

/**
 * Web補助クリックラッパーコンポーネント
 * Web Auxiliary Click Wrapper Component
 *
 * @param children 子要素 / Children
 */
export function WebAuxClickWrapper({children}: React.PropsWithChildren<{}>) {
  if (Platform.OS !== 'web') return children

  return (
    // @ts-ignore web only
    <div onMouseDown={onMouseDown} onMouseUp={onMouseUp}>
      {children}
    </div>
  )
}
