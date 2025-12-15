/**
 * フォロー/アンフォロー操作カスタムフック
 *
 * このモジュールは、ユーザーのフォロー/アンフォロー操作を処理する再利用可能なロジックを提供します。
 *
 * 【概要】
 * - ユーザープロフィールに対するフォロー/アンフォロー機能
 * - 認証チェック（未ログイン時はログイン画面へ誘導）
 * - エラーハンドリングとユーザーへのフィードバック（トースト通知）
 * - 楽観的UI更新のためのキュー処理
 *
 * 【Go開発者向け補足 - カスタムフック】
 * - カスタムフックは、ロジックを再利用可能な関数として抽出するReactのパターン
 * - Goの関数と異なり、内部で他のフック（useCallback, useState等）を呼び出せる
 * - コンポーネント間でビジネスロジックを共有する際の標準的な手法
 */

// React - useCallbackフックを使用するために必要
import React from 'react'
// Lingui - 国際化ライブラリ（msgはメッセージ定義マクロ）
import {msg} from '@lingui/macro'
// Lingui - 翻訳関数を取得するフック
import {useLingui} from '@lingui/react'

// Statsig - A/Bテスト・機能フラグ用のログイベント型定義
import {LogEvents} from '#/lib/statsig/statsig'
// ロガー - エラーログ記録用
import {logger} from '#/logger'
// キャッシュ型 - 楽観的更新用のシャドウ型（仮の状態を保持）
import {Shadow} from '#/state/cache/types'
// プロフィールフォローのミューテーションキュー - API呼び出しと楽観的更新
import {useProfileFollowMutationQueue} from '#/state/queries/profile'
// 認証確認フック - 未ログイン時にログイン画面へ誘導
import {useRequireAuth} from '#/state/session'
// トースト通知 - ユーザーへのフィードバック表示
import * as Toast from '#/view/com/util/Toast'
// AT Protocol型定義 - Blueskyプロトコルの型
import * as bsky from '#/types/bsky'

/**
 * フォロー/アンフォロー操作関数を提供するカスタムフック
 *
 * 【パラメータ】
 * @param profile - 操作対象のユーザープロフィール（Shadow型で楽観的更新に対応）
 * @param logContext - ログ記録用のコンテキスト情報（どの画面からの操作か等）
 *
 * 【戻り値】
 * @returns {{ follow: () => void, unfollow: () => void }}
 *   - follow: フォロー実行関数
 *   - unfollow: アンフォロー実行関数
 *
 * 【Go開発者向け補足 - 型定義】
 * - Shadow<T>: 楽観的更新用のラッパー型（Goには直接の対応概念なし）
 * - LogEvents['profile:follow']['logContext']: 型のインデックスアクセス（Goの struct field tag に似ている）
 *
 * @example
 * ```typescript
 * function ProfileHeader({ profile }) {
 *   const { follow, unfollow } = useFollowMethods({
 *     profile,
 *     logContext: 'ProfileScreen'
 *   })
 *
 *   return (
 *     <button onClick={profile.viewer?.following ? unfollow : follow}>
 *       {profile.viewer?.following ? 'アンフォロー' : 'フォロー'}
 *     </button>
 *   )
 * }
 * ```
 */
export function useFollowMethods({
  profile,
  logContext,
}: {
  profile: Shadow<bsky.profile.AnyProfileView>
  logContext: LogEvents['profile:follow']['logContext'] &
    LogEvents['profile:unfollow']['logContext']
}) {
  // Lingui翻訳関数を取得（_関数でメッセージを翻訳）
  // GoユーザーへのNote: これはi18n（国際化）のための仕組み
  const {_} = useLingui()

  // 認証確認関数を取得
  // 未ログインユーザーが操作しようとした際にログイン画面へリダイレクト
  const requireAuth = useRequireAuth()

  // フォロー/アンフォローのキュー処理関数を取得
  // GoユーザーへのNote: 配列分割代入 [a, b] = arr は Goにはない構文
  // これはタプル（複数の値）を返す関数から、個別の変数に割り当てる記法
  const [queueFollow, queueUnfollow] = useProfileFollowMutationQueue(
    profile,
    logContext,
  )

  /**
   * フォロー実行関数
   *
   * 【処理フロー】
   * 1. 認証チェック（未ログイン時はログイン画面へ）
   * 2. フォローAPIを呼び出し（楽観的更新で即座にUIを更新）
   * 3. エラー時はトースト通知を表示
   *
   * 【Go開発者向け補足 - useCallback】
   * - useCallback は関数をメモ化するReactフック
   * - Goのクロージャーに似ているが、依存配列で再生成タイミングを制御
   * - 依存配列[_, queueFollow, requireAuth]の値が変わらない限り、同じ関数インスタンスを返す
   * - これにより子コンポーネントへの props として渡した際の不要な再レンダリングを防ぐ
   */
  const follow = React.useCallback(() => {
    // requireAuth: コールバック関数を受け取り、認証済みの場合のみ実行
    // 未ログインの場合はログイン画面へリダイレクト
    requireAuth(async () => {
      try {
        // フォローAPIを非同期実行
        // GoユーザーへのNote: await は Goの <- channel 受信に似た非同期待機
        await queueFollow()
      } catch (e: any) {
        // エラーログを記録（Sentry等のログサービスへ送信）
        logger.error(`useFollowMethods: failed to follow`, {message: String(e)})

        // AbortError（ユーザーによるキャンセル）以外のエラーの場合のみトースト表示
        // GoユーザーへのNote: e?.name は Optional Chaining（eがnullでも安全にアクセス）
        if (e?.name !== 'AbortError') {
          // _(msg`...`): Linguiマクロでメッセージを翻訳
          // 'xmark': トーストアイコンの種類（エラー表示）
          Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
        }
      }
    })
  }, [_, queueFollow, requireAuth]) // 依存配列: これらの値が変わった時のみ関数を再生成

  /**
   * アンフォロー実行関数
   *
   * 【処理フロー】
   * follow関数とほぼ同じだが、queueUnfollowを呼び出す点が異なる
   *
   * 【Go開発者向け補足】
   * - followとほぼ同じパターンだが、Reactでは各関数を個別にメモ化する必要がある
   * - Goなら一つの関数に isFollow bool パラメータを渡すところだが、
   *   Reactでは明示的なAPI（follow/unfollow）を提供する慣習
   */
  const unfollow = React.useCallback(() => {
    requireAuth(async () => {
      try {
        // アンフォローAPIを非同期実行
        await queueUnfollow()
      } catch (e: any) {
        // エラーログを記録
        logger.error(`useFollowMethods: failed to unfollow`, {
          message: String(e),
        })

        // AbortError以外はトースト通知を表示
        if (e?.name !== 'AbortError') {
          Toast.show(_(msg`An issue occurred, please try again.`), 'xmark')
        }
      }
    })
  }, [_, queueUnfollow, requireAuth]) // 依存配列

  // follow, unfollowの2つの関数を含むオブジェクトを返却
  // GoユーザーへのNote: オブジェクトリテラルのショートハンド記法
  // {follow, unfollow} は {follow: follow, unfollow: unfollow} と同じ
  return {
    follow,
    unfollow,
  }
}
