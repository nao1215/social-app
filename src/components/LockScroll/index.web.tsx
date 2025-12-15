/**
 * スクロールロックコンポーネント - Web版
 *
 * このファイルはWeb専用の実装です。
 * react-remove-scroll-barライブラリを使用して、モーダル表示時に
 * 背景のスクロールを無効化し、スクロールバーを非表示にします。
 *
 * Web特有の課題:
 * - モーダル表示時も背景コンテンツがスクロール可能（デフォルト動作）
 * - スクロールバーの幅でレイアウトがずれる（スクロールバー非表示時）
 * - body要素のoverflow制御が必要
 *
 * react-remove-scroll-barの機能:
 * - body要素に overflow: hidden を適用
 * - スクロールバーの幅を計算してpaddingで補正（レイアウトシフトを防ぐ）
 * - コンポーネントのアンマウント時に自動的に復元
 *
 * @module LockScroll/Web
 */

// react-remove-scroll-barライブラリのメインコンポーネント
import {RemoveScrollBar} from 'react-remove-scroll-bar'

/**
 * スクロールロックコンポーネント（RemoveScrollBarの再エクスポート）
 *
 * RemoveScrollBarをそのまま再エクスポートしています。
 * これにより、プラットフォーム間で統一されたAPIを提供します。
 *
 * 動作:
 * 1. マウント時: body要素にoverflow: hiddenを適用
 * 2. スクロールバーの幅を計算
 * 3. body要素にpaddingを追加（レイアウトシフトを防ぐ）
 * 4. アンマウント時: すべての変更を自動的に復元
 *
 * 使用例:
 * Modal内でLockScrollを使用すると、Webではスクロールをロック
 *
 * 技術的詳細:
 * - CSSのcalc()を使用してスクロールバー幅を計算
 * - window.innerWidthとdocument.documentElement.clientWidthの差分を使用
 * - 複数のLockScrollが同時にマウントされても正しく動作（参照カウント方式）
 */
export const LockScroll = RemoveScrollBar
