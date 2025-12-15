/**
 * インタラクション状態管理カスタムフック
 *
 * このモジュールは、UI要素のインタラクション状態（ホバー、プレス等）を管理します。
 *
 * 【概要】
 * - マウスホバーやタッチ操作の開始/終了を追跡
 * - ボタンやリンクなどのインタラクティブ要素のスタイル変更に使用
 * - シンプルなオン/オフの二値状態を提供
 *
 * 【使用場面】
 * - ボタンのホバーエフェクト
 * - タッチフィードバック（押下時のハイライト等）
 * - インタラクティブ要素のアクティブ状態管理
 *
 * 【Go開発者向け補足】
 * - このフックは状態（state）とコールバック関数をセットで返す
 * - Reactでは状態変更時に自動的にコンポーネントが再レンダリングされる
 * - Goのイベントハンドラーと異なり、状態管理が組み込まれている
 */

// React - useState, useCallback, useMemoフックを使用
import React from 'react'

/**
 * インタラクション状態を管理するフック
 *
 * 【機能】
 * - state: 現在のインタラクション状態（true=アクティブ、false=非アクティブ）
 * - onIn: インタラクション開始時のコールバック（ホバー開始、タッチ開始等）
 * - onOut: インタラクション終了時のコールバック（ホバー終了、タッチ終了等）
 *
 * 【Go開発者向け補足 - React Hooks】
 * - useState: 状態を保持するフック（Goには直接の対応概念なし）
 *   - 初期値 false でブール状態を作成
 *   - setState関数で状態を更新すると、コンポーネントが再レンダリングされる
 * - useCallback: 関数をメモ化するフック
 *   - 依存配列が空[]なので、コンポーネントのライフタイム中は同じ関数インスタンスを使用
 *   - パフォーマンス最適化のため（不要な再レンダリングを防ぐ）
 * - useMemo: 計算結果をメモ化するフック
 *   - 依存配列の値が変わらない限り、同じオブジェクトを返す
 *   - ここでは state, onIn, onOut が変わった時のみ新しいオブジェクトを生成
 *
 * @returns インタラクション状態と制御関数を含むオブジェクト
 *   - state: boolean - 現在のインタラクション状態
 *   - onIn: () => void - インタラクション開始ハンドラー
 *   - onOut: () => void - インタラクション終了ハンドラー
 *
 * @example
 * ```typescript
 * function InteractiveButton() {
 *   const { state, onIn, onOut } = useInteractionState()
 *
 *   return (
 *     <button
 *       onMouseEnter={onIn}    // マウスが要素に入った時
 *       onMouseLeave={onOut}   // マウスが要素から出た時
 *       onTouchStart={onIn}    // タッチ開始時
 *       onTouchEnd={onOut}     // タッチ終了時
 *       style={{
 *         backgroundColor: state ? '#007bff' : '#0056b3'  // 状態に応じて色変更
 *       }}
 *     >
 *       ボタン
 *     </button>
 *   )
 * }
 * ```
 */
export function useInteractionState() {
  // インタラクション状態を管理（初期値: false = 非アクティブ）
  // GoユーザーへのNote: useStateは[現在値, 更新関数]のタプルを返す
  // これはGoにはない構文で、分割代入により2つの値を個別の変数に取得
  const [state, setState] = React.useState(false)

  // インタラクション開始ハンドラー（状態をtrueにセット）
  // GoユーザーへのNote: useCallbackは依存配列[]が空なので、
  // この関数はコンポーネントの初回レンダリング時に一度だけ作成され、その後は同じインスタンスを再利用
  const onIn = React.useCallback(() => {
    setState(true)
  }, [])

  // インタラクション終了ハンドラー（状態をfalseにセット）
  const onOut = React.useCallback(() => {
    setState(false)
  }, [])

  // 状態と制御関数をまとめたオブジェクトを返す
  // GoユーザーへのNote: useMemoは計算コストの高い処理の結果をキャッシュするフック
  // ここでは単純なオブジェクト生成だが、依存配列[state, onIn, onOut]の値が
  // 変わらない限り同じオブジェクトを返すことで、子コンポーネントの不要な再レンダリングを防ぐ
  return React.useMemo(
    () => ({
      state,   // 現在のインタラクション状態
      onIn,    // インタラクション開始関数
      onOut,   // インタラクション終了関数
    }),
    [state, onIn, onOut], // 依存配列: これらのいずれかが変わった時のみ新しいオブジェクトを生成
  )
}
