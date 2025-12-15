/**
 * メール確認イベント管理モジュール
 *
 * このモジュールは、メール確認完了イベントをアプリケーション全体で共有するための
 * イベントエミッター（EventEmitter）を提供します。
 * Observer パターンを使用して、メール確認の完了を複数のコンポーネントに通知します。
 *
 * 【主な機能】
 * - メール確認完了イベントの発火
 * - メール確認完了イベントのリスナー登録（1回のみ実行）
 *
 * 【Goユーザー向け補足】
 * - EventEmitter: イベント駆動型のパブリッシュ/サブスクライブパターン（Goのchannelに似ている）
 * - useEffect: 副作用フック。コンポーネントのマウント/アンマウント時に処理を実行
 * - クリーンアップ関数: useEffectの戻り値関数。アンマウント時に実行（Goのdeferに似ている）
 */

// Reactの副作用フックをインポート
import {useEffect} from 'react'
// イベントエミッターライブラリをインポート（軽量で型安全なEventEmitter）
import EventEmitter from 'eventemitter3'

/**
 * イベントエミッターのインスタンス
 *
 * アプリケーション全体で共有されるシングルトンのイベントエミッター。
 * メール確認完了イベント（emailVerified）を管理します。
 *
 * 【Goユーザー向け補足】
 * - new EventEmitter<{...}>: ジェネリック型でイベント名と引数の型を指定
 * - emailVerified: void - イベント名が'emailVerified'で、引数なし（void）
 * - これはGoのchan struct{}に似ている（値なしのシグナル）
 */
const events = new EventEmitter<{
  emailVerified: void
}>()

/**
 * メール確認完了イベントを発火する関数
 *
 * メールアドレスの確認が完了した際に、この関数を呼び出してイベントを発火します。
 * 登録されたすべてのリスナーに通知が届きます。
 *
 * @example
 * // メール確認処理の成功後に呼び出す
 * await confirmEmail(token)
 * emitEmailVerified()
 *
 * 【Goユーザー向け補足】
 * - events.emit(): イベントを発火。Goのchannelへの送信（ch <- struct{}{}）に似ている
 */
export function emitEmailVerified() {
  events.emit('emailVerified')
}

/**
 * メール確認完了イベントのリスナーを登録するカスタムフック
 *
 * メール確認が完了した際に、指定されたコールバック関数を実行します。
 * once()を使用して1回のみ実行されるため、同じイベントで複数回呼ばれません。
 *
 * @param {() => void} cb - メール確認完了時に実行されるコールバック関数
 *
 * @example
 * function MyComponent() {
 *   useOnEmailVerified(() => {
 *     console.log('Email verified!')
 *   })
 * }
 *
 * 【Goユーザー向け補足】
 * - useEffect: コンポーネントのライフサイクルに合わせて副作用を実行
 * - once(): イベントを1回のみ受信（自動的にリスナー解除）
 * - return () => {...}: クリーンアップ関数。コンポーネントアンマウント時に実行（Goのdeferに似ている）
 * - [cb]: 依存配列。cbが変わった時にエフェクトを再実行
 */
export function useOnEmailVerified(cb: () => void) {
  useEffect(() => {
    // 【重要】 once()を使用する理由:
    // useAccountEmailStateの各インスタンスでイベントが複数回発火する可能性があるため、
    // 1回のみ実行されるようにonceを使用しています。
    events.once('emailVerified', cb)
    // クリーンアップ関数: コンポーネントがアンマウントされたときにリスナーを解除
    return () => {
      events.off('emailVerified', cb)
    }
  }, [cb]) // cbが変わったときのみエフェクトを再実行
}
