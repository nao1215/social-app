/**
 * @file アクティブなポリシー更新を先行完了するフック
 * @description デバイスストレージでポリシー更新を先行して完了済みとマークする
 *
 * このフックは、ポリシー更新をデバイスレベルで先行完了させるための
 * ユーティリティを提供します。サーバー側の状態は後で同期されます。
 */

// React Hooks: useCallbackは関数をメモ化してパフォーマンスを最適化
// Goでは明示的な関数メモ化はありませんが、関数ポインタのキャッシュに近い概念
import {useCallback} from 'react'

// アクティブなポリシー更新ID
import {ACTIVE_UPDATE_ID} from '#/components/PolicyUpdateOverlay/config'
// ポリシー更新専用ロガー
import {logger} from '#/components/PolicyUpdateOverlay/logger'
// デバイスストレージフック（MMKVベースの永続化ストレージ）
import {device, useStorage} from '#/storage'

/**
 * アクティブなポリシー更新を先行完了するフック
 *
 * @description
 * デバイスストレージでアクティブなポリシー更新を完了済みとマークします。
 * `usePolicyUpdateState` がこの変更を検知し、このアカウントのサーバー側
 * NUX状態にこのステータスを複製します。
 *
 * @returns {Function} ポリシー更新を完了済みとマークする関数
 *
 * @example
 * ```tsx
 * function SettingsScreen() {
 *   const completePolicy = usePreemptivelyCompleteActivePolicyUpdate()
 *
 *   const handleSkipPolicy = () => {
 *     completePolicy() // デバイスレベルで先行完了
 *   }
 * }
 * ```
 *
 * @note
 * この関数は主に以下の用途で使用されます:
 * - ユーザーが別の方法でポリシーに同意した場合
 * - テスト時にポリシー更新をスキップする場合
 * - オフライン時の一時的な完了マーク（後でサーバーと同期）
 */
export function usePreemptivelyCompleteActivePolicyUpdate() {
  /**
   * useStorage: MMKVベースの永続化ストレージフック
   * Goのsync.Mapやローカルファイル永続化に似た仕組み
   * 第1引数: 現在の値（ここでは未使用なので_プレフィックス）
   * 第2引数: 値を更新する関数
   */
  const [_completedForDevice, setCompletedForDevice] = useStorage(device, [
    ACTIVE_UPDATE_ID,
  ])

  /**
   * useCallback: 関数をメモ化してパフォーマンス最適化
   * 依存配列の値が変更されない限り、同じ関数インスタンスを返します
   * これにより、子コンポーネントの不要な再レンダリングを防ぎます
   */
  return useCallback(() => {
    // デバッグログ: ポリシー更新を先行完了することをログ記録
    logger.debug(`preemptively completing active policy update`)

    // デバイスストレージに完了済みフラグを設定
    setCompletedForDevice(true)
  }, [setCompletedForDevice]) // 依存配列: この関数が変更された場合のみコールバックを再作成
}
