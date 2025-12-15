/**
 * フルスクリーン制御カスタムフック（Web専用）
 *
 * このモジュールは、Web環境でのフルスクリーン表示の切り替えと状態管理を提供します。
 *
 * 【概要】
 * - Fullscreen API を利用したフルスクリーン表示の制御
 * - フルスクリーン状態の監視とリアクティブな状態管理
 * - ブラウザ固有のバグ（Chrome等）への対処を含む
 *
 * 【使用場面】
 * - 動画プレイヤーのフルスクリーン表示
 * - 画像ビューアーのフルスクリーンモード
 * - プレゼンテーションモード
 *
 * 【Go開発者向け補足】
 * - このフックはWeb専用で、React Native（モバイル）では使用不可
 * - 外部状態（document.fullscreenElement）をReactの状態として扱う
 * - useSyncExternalStore: 外部データソースとReactを同期させる仕組み
 */

// React Hooks - useState, useEffect, useRef, useCallback, useSyncExternalStore
import {
  useCallback,
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
} from 'react'

// ブラウザ判定ユーティリティ - ブラウザ固有の処理分岐に使用
import {isFirefox, isSafari} from '#/lib/browser'
// プラットフォーム判定 - Web環境かどうかをチェック
import {isWeb} from '#/platform/detection'

/**
 * フルスクリーン状態変更を監視するサブスクリプション関数
 *
 * 【Go開発者向け補足】
 * - この関数は useSyncExternalStore に渡すサブスクリプション関数
 * - Goの channel や context に似た、外部イベントの購読パターン
 * - 返り値のクリーンアップ関数は、コンポーネントのアンマウント時に実行される
 *
 * @param onChange - 状態変更時に呼ばれるコールバック関数
 * @returns クリーンアップ関数（イベントリスナーの削除）
 */
function fullscreenSubscribe(onChange: () => void) {
  // フルスクリーン状態変更イベントをリッスン
  // GoユーザーへのNote: DOMイベントの登録（Goのhttp.HandleFuncに似ている）
  document.addEventListener('fullscreenchange', onChange)

  // クリーンアップ関数を返す
  // この関数はコンポーネントのアンマウント時やサブスクリプション解除時に実行される
  return () => document.removeEventListener('fullscreenchange', onChange)
}

/**
 * フルスクリーン制御フック
 *
 * 【機能】
 * - フルスクリーン状態の取得（true/false）
 * - フルスクリーン切り替え関数の提供
 * - フルスクリーン解除時のスクロール位置復元（Chromeのバグ対策）
 *
 * 【Go開発者向け補足 - useSyncExternalStore】
 * - Reactの状態管理と外部データソース（DOM）を同期させるフック
 * - 第1引数: サブスクリプション関数（イベント購読）
 * - 第2引数: 現在の状態を取得する関数（スナップショット）
 * - Goでは手動でchannelやmutexで実装するところを、Reactが自動化
 *
 * 【Go開発者向け補足 - useRef】
 * - useRefは値を保持するが、変更してもコンポーネントの再レンダリングを引き起こさない
 * - Goのグローバル変数に似ているが、コンポーネントインスタンスごとに独立
 * - .current プロパティで値にアクセス
 *
 * 【Go開発者向け補足 - useState】
 * - 状態を保持し、変更時にコンポーネントを再レンダリング
 * - Goには直接の対応概念なし（手動でUIを更新する必要がある）
 *
 * @param ref - フルスクリーン表示する要素への参照（オプション）
 * @returns [isFullscreen, toggleFullscreen] のタプル
 *   - isFullscreen: boolean - 現在フルスクリーン状態か
 *   - toggleFullscreen: () => void - フルスクリーン切り替え関数
 *
 * @throws Web環境以外で使用した場合にエラーをスロー
 *
 * @example
 * ```typescript
 * function VideoPlayer() {
 *   const videoRef = useRef<HTMLVideoElement>(null)
 *   const [isFullscreen, toggleFullscreen] = useFullscreen(videoRef)
 *
 *   return (
 *     <div>
 *       <video ref={videoRef} src="video.mp4" />
 *       <button onClick={toggleFullscreen}>
 *         {isFullscreen ? '終了' : 'フルスクリーン'}
 *       </button>
 *     </div>
 *   )
 * }
 * ```
 */
export function useFullscreen(ref?: React.RefObject<HTMLElement>) {
  // Web環境でない場合はエラーをスロー
  // GoユーザーへのNote: このチェックは実行時エラーではなく、開発時の誤用を防ぐため
  if (!isWeb) throw new Error("'useFullscreen' is a web-only hook")

  // フルスクリーン状態を外部ストア（DOM）と同期
  // GoユーザーへのNote: useSyncExternalStoreは外部の状態変更を検知し、
  // Reactコンポーネントに通知する仕組み（Goのwatcherパターンに似ている）
  const isFullscreen = useSyncExternalStore(
    fullscreenSubscribe, // イベント購読関数
    () => Boolean(document.fullscreenElement), // 現在の状態を取得（フルスクリーン要素が存在するか）
  )

  // フルスクリーン解除時に復元するスクロール位置を保持
  // GoユーザーへのNote: useRefは再レンダリング間で値を保持するが、
  // 値の変更は再レンダリングを引き起こさない（Goの静的変数に似ている）
  const scrollYRef = useRef<null | number>(null)

  // 前回のフルスクリーン状態を追跡（変更を検出するため）
  const [prevIsFullscreen, setPrevIsFullscreen] = useState(isFullscreen)

  /**
   * フルスクリーン切り替え関数
   *
   * 【処理フロー】
   * 1. 現在フルスクリーンの場合 → 解除
   * 2. 非フルスクリーンの場合 → 指定要素をフルスクリーンに
   *
   * 【Go開発者向け補足 - useCallback】
   * - 関数をメモ化し、依存配列の値が変わらない限り同じ関数インスタンスを返す
   * - パフォーマンス最適化のため（propsとして渡した際の再レンダリング防止）
   */
  const toggleFullscreen = useCallback(() => {
    if (isFullscreen) {
      // フルスクリーン解除
      document.exitFullscreen()
    } else {
      // フルスクリーン表示
      if (!ref) throw new Error('No ref provided')
      if (!ref.current) return // 要素がまだマウントされていない場合は何もしない

      // 現在のスクロール位置を保存（解除時に復元するため）
      scrollYRef.current = window.scrollY

      // 指定された要素をフルスクリーン表示
      ref.current.requestFullscreen()
    }
  }, [isFullscreen, ref]) // 依存配列: これらが変わった時のみ関数を再生成

  /**
   * フルスクリーン状態変更時の副作用処理
   *
   * 【処理内容】
   * - Chromeのバグ対策: フルスクリーン解除時にスクロール位置が戻らない問題を修正
   * - Firefox と Safari ではこの問題が発生しないため、処理をスキップ
   *
   * 【Go開発者向け補足 - useEffect】
   * - 副作用（side effect）を実行するフック
   * - Goのdefer文に似ているが、依存配列の値が変わった時に実行される
   * - レンダリング後に実行されるため、DOMの変更等が可能
   */
  useEffect(() => {
    // フルスクリーン状態に変更がない場合はスキップ
    if (prevIsFullscreen === isFullscreen) return
    setPrevIsFullscreen(isFullscreen)

    // Chromeのバグ対策: フルスクリーン解除後にスクロール位置を復元
    // Firefox と Safari では問題ないため、それ以外（おそらくChromiumベース）で実行
    if (prevIsFullscreen && !isFirefox && !isSafari) {
      // 100ms遅延させてスクロール位置を復元
      // DOM更新が完了するのを待つため（Goの time.Sleep に似ている）
      setTimeout(() => {
        if (scrollYRef.current !== null) {
          // 保存していたスクロール位置に戻す
          window.scrollTo(0, scrollYRef.current)
          // 使用済みなのでクリア
          scrollYRef.current = null
        }
      }, 100)
    }
  }, [isFullscreen, prevIsFullscreen]) // 依存配列: これらが変わった時に実行

  // フルスクリーン状態と切り替え関数をタプルとして返す
  // GoユーザーへのNote: "as const" は TypeScript の型アサーションで、
  // タプル型として扱うことを明示（配列ではなく固定長の[boolean, function]型）
  return [isFullscreen, toggleFullscreen] as const
}
