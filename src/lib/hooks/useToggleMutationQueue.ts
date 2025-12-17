/**
 * トグルミューテーションキューフック
 *
 * 【概要】
 * いいね、フォローなどのトグル操作をキュー管理して楽観的更新を実現。
 * 連続した操作を適切に処理し、サーバーとの状態同期を保証。
 *
 * 【解決する問題】
 * 1. いいねボタン連打時の状態不整合
 * 2. ネットワーク遅延中の楽観的更新の巻き戻し
 * 3. 同じ値への複数リクエストの無駄な送信
 *
 * 【動作原理】
 * - activeTask: 現在実行中のミューテーション
 * - queuedTask: 次に実行予定のミューテーション
 * - 同じ値への連続リクエストはスキップ
 * - キュー処理中は新しい値で上書き可能
 *
 * 【処理フロー】
 * 1. ユーザーがトグル操作
 * 2. 楽観的にUIを更新
 * 3. キューに追加してサーバーリクエスト
 * 4. 成功時にonSuccessで確定、失敗時にロールバック
 *
 * 【Goユーザー向け補足】
 * - Promise: GoのchannelでのFuture/Promiseパターンに相当
 * - キュー処理: Goのworker goroutineパターン
 * - AbortError: Goのcontext.Canceledに相当
 */
import {useCallback, useEffect, useRef, useState} from 'react'

/**
 * キュー内のタスク定義
 * @template TServerState サーバー状態の型
 */
type Task<TServerState> = {
  isOn: boolean                                    // トグルの目標状態
  resolve: (serverState: TServerState) => void     // 成功時のコールバック
  reject: (e: unknown) => void                     // 失敗時のコールバック
}

/**
 * タスクキューの状態
 * @template TServerState サーバー状態の型
 */
type TaskQueue<TServerState> = {
  activeTask: Task<TServerState> | null   // 実行中のタスク
  queuedTask: Task<TServerState> | null   // 待機中のタスク
}

/**
 * 中断エラーを生成
 * スキップされたタスクのPromiseをrejectするために使用
 */
function AbortError() {
  const e = new Error()
  e.name = 'AbortError'
  return e
}

/**
 * トグル操作のキュー管理フック
 *
 * @template TServerState サーバーから返される状態の型
 * @param initialState 初期状態
 * @param runMutation 実際のミューテーション関数
 * @param onSuccess キュー処理完了時のコールバック
 * @returns トグルをキューに追加する関数
 */
export function useToggleMutationQueue<TServerState>({
  initialState,
  runMutation,
  onSuccess,
}: {
  initialState: TServerState
  runMutation: (
    prevState: TServerState,
    nextIsOn: boolean,
  ) => Promise<TServerState>
  onSuccess: (finalState: TServerState) => void
}) {
  // We use the queue as a mutable object.
  // This is safe becuase it is not used for rendering.
  const [queue] = useState<TaskQueue<TServerState>>({
    activeTask: null,
    queuedTask: null,
  })

  async function processQueue() {
    if (queue.activeTask) {
      // There is another active processQueue call iterating over tasks.
      // It will handle any newly added tasks, so we should exit early.
      return
    }
    // To avoid relying on the rendered state, capture it once at the start.
    // From that point on, and until the queue is drained, we'll use the real server state.
    let confirmedState: TServerState = initialState
    try {
      while (queue.queuedTask) {
        const prevTask = queue.activeTask
        const nextTask = queue.queuedTask
        queue.activeTask = nextTask
        queue.queuedTask = null
        if (prevTask?.isOn === nextTask.isOn) {
          // Skip multiple requests to update to the same value in a row.
          prevTask.reject(new (AbortError as any)())
          continue
        }
        try {
          // The state received from the server feeds into the next task.
          // This lets us queue deletions of not-yet-created resources.
          confirmedState = await runMutation(confirmedState, nextTask.isOn)
          nextTask.resolve(confirmedState)
        } catch (e) {
          nextTask.reject(e)
        }
      }
    } finally {
      onSuccess(confirmedState)
      queue.activeTask = null
      queue.queuedTask = null
    }
  }

  function queueToggle(isOn: boolean): Promise<TServerState> {
    return new Promise((resolve, reject) => {
      // This is a toggle, so the next queued value can safely replace the queued one.
      if (queue.queuedTask) {
        queue.queuedTask.reject(new (AbortError as any)())
      }
      queue.queuedTask = {isOn, resolve, reject}
      processQueue()
    })
  }

  const queueToggleRef = useRef(queueToggle)
  useEffect(() => {
    queueToggleRef.current = queueToggle
  })
  const queueToggleStable = useCallback(
    (isOn: boolean): Promise<TServerState> => {
      const queueToggleLatest = queueToggleRef.current
      return queueToggleLatest(isOn)
    },
    [],
  )
  return queueToggleStable
}
