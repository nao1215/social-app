/**
 * @fileoverview プロフィール購読ダイアログコンポーネント
 *
 * ユーザーの投稿・リプライ通知を購読するための設定ダイアログを提供します。
 * ユーザーは投稿のみ、または投稿とリプライの両方の通知を受け取るかを選択できます。
 *
 * 主な機能:
 * - 投稿/リプライの通知設定のトグル
 * - 楽観的UI更新による即座のフィードバック
 * - TanStack Queryを使用したキャッシュ管理
 * - プラットフォーム固有のUI調整（Web/Native）
 */

// React: UIコンポーネントとフックのインポート
// - useState: コンポーネントローカルの状態管理用（Goの変数宣言に相当）
// - useMemo: 計算結果をメモ化してパフォーマンス最適化（再計算の抑制）
import {useMemo, useState} from 'react'
// React Native: ネイティブUIコンポーネントのインポート
import {View} from 'react-native'
// AT Protocol: Blueskyプロトコルの型定義
// - 通知関連のデータ型とモデレーション設定の型
import {
  type AppBskyNotificationDefs,
  type AppBskyNotificationListActivitySubscriptions,
  type ModerationOpts,
  type Un$Typed,
} from '@atproto/api'
// Lingui: 国際化（i18n）ライブラリ
// - msg: 翻訳可能な文字列のマーカー
// - Trans: コンポーネント形式の翻訳
import {msg, Trans} from '@lingui/macro'
// Lingui: 翻訳関数のフック
import {useLingui} from '@lingui/react'
// TanStack Query: サーバー状態管理ライブラリ
// - InfiniteData: 無限スクロール用のデータ型
// - useMutation: サーバー更新操作の管理
// - useQueryClient: クエリキャッシュへのアクセス
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from '@tanstack/react-query'

// 内部ライブラリ: モデレーション・文字列処理・ロギング
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
import {cleanError} from '#/lib/strings/errors'
import {sanitizeHandle} from '#/lib/strings/handles'
import {logger} from '#/logger'
// プラットフォーム検出
import {isWeb} from '#/platform/detection'
// キャッシュ管理: プロフィールシャドウ更新
import {updateProfileShadow} from '#/state/cache/profile-shadow'
// クエリキー: アクティビティ購読のキャッシュキー
import {RQKEY_getActivitySubscriptions} from '#/state/queries/activity-subscriptions'
// セッション管理: 認証されたAgentの取得
import {useAgent} from '#/state/session'
// トースト通知
import * as Toast from '#/view/com/util/Toast'
// デザインシステム: スタイル定義とテーマ
import {platform, useTheme, web} from '#/alf'
import {atoms as a} from '#/alf'
// UIコンポーネント
import {Admonition} from '#/components/Admonition'
import {
  Button,
  ButtonIcon,
  type ButtonProps,
  ButtonText,
} from '#/components/Button'
import * as Dialog from '#/components/Dialog'
import * as Toggle from '#/components/forms/Toggle'
import {Loader} from '#/components/Loader'
import * as ProfileCard from '#/components/ProfileCard'
import {Text} from '#/components/Typography'
// 型定義: Blueskyプロフィール型
import type * as bsky from '#/types/bsky'

/**
 * プロフィール購読ダイアログのプロパティ
 *
 * Go言語での構造体に相当するTypeScript interfaceです。
 *
 * @interface
 * @property {Dialog.DialogControlProps} control - ダイアログの開閉を制御するプロパティ
 * @property {bsky.profile.AnyProfileView} profile - 購読対象のプロフィール情報
 * @property {ModerationOpts} moderationOpts - モデレーション設定（ブロック・ミュート等）
 * @property {boolean} [includeProfile] - プロフィールカードを表示するか（オプショナル）
 */
export function SubscribeProfileDialog({
  control,
  profile,
  moderationOpts,
  includeProfile,
}: {
  control: Dialog.DialogControlProps
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  includeProfile?: boolean
}) {
  return (
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      <Dialog.Handle />
      <DialogInner
        profile={profile}
        moderationOpts={moderationOpts}
        includeProfile={includeProfile}
      />
    </Dialog.Outer>
  )
}

/**
 * ダイアログの内部実装コンポーネント
 *
 * 購読設定の状態管理とUI更新を担当します。
 *
 * 実装の詳細:
 * - useState: 投稿/リプライの購読状態を管理
 * - useMemo: 選択値の配列を計算（不要な再計算を防ぐ）
 * - useMutation: サーバーへの購読設定保存
 * - 楽観的更新: 保存成功後にキャッシュを即座に更新
 */
function DialogInner({
  profile,
  moderationOpts,
  includeProfile,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
  includeProfile?: boolean
}) {
  // Lingui: 翻訳関数の取得
  const {_} = useLingui()
  // テーマ: ライト/ダーク/Dimモードの設定
  const t = useTheme()
  // Agent: 認証されたAPIクライアント
  const agent = useAgent()
  // ダイアログコンテキスト: 親ダイアログの制御
  const control = Dialog.useDialogContext()
  // クエリクライアント: TanStack Queryのキャッシュ管理
  const queryClient = useQueryClient()

  // 初期状態の解析: 現在の購読設定を取得
  const initialState = parseActivitySubscription(
    profile.viewer?.activitySubscription,
  )

  // useState: 購読状態の管理（Goのローカル変数に相当）
  // state: 現在の状態、setState: 状態更新関数
  const [state, setState] = useState(initialState)

  // useMemo: 選択値の配列を計算（パフォーマンス最適化）
  // 依存配列[state]の値が変更された時のみ再計算される
  const values = useMemo(() => {
    const {post, reply} = state
    const res = []
    if (post) res.push('post')
    if (reply) res.push('reply')
    return res
  }, [state])

  /**
   * トグル変更ハンドラ
   *
   * ルール:
   * - リプライ通知を有効にするには投稿通知が必須
   * - 投稿通知を無効にすると自動的にリプライ通知も無効化
   *
   * @param {string[]} newValues - 新しい選択値の配列
   */
  const onChange = (newValues: string[]) => {
    setState(oldValues => {
      // リプライ通知を新規に有効化する場合、投稿通知も自動で有効化
      if (!oldValues.reply && newValues.includes('reply')) {
        return {
          post: true,
          reply: true,
        }
      }

      // 投稿通知を無効化する場合、リプライ通知も自動で無効化
      if (oldValues.post && !newValues.includes('post')) {
        return {
          post: false,
          reply: false,
        }
      }

      // 通常の更新
      return {
        post: newValues.includes('post'),
        reply: newValues.includes('reply'),
      }
    })
  }

  // useMutation: サーバー更新処理の管理
  // mutate: 実行関数, isPending: 実行中フラグ, error: エラー情報
  const {
    mutate: saveChanges,
    isPending: isSaving,
    error,
  } = useMutation({
    // mutationFn: 実際のAPI呼び出し処理
    mutationFn: async (
      activitySubscription: Un$Typed<AppBskyNotificationDefs.ActivitySubscription>,
    ) => {
      // AT Protocolの購読設定APIを呼び出し
      await agent.app.bsky.notification.putActivitySubscription({
        subject: profile.did,
        activitySubscription,
      })
    },
    // onSuccess: 保存成功時の処理
    onSuccess: (_data, activitySubscription) => {
      control.close(() => {
        // プロフィールシャドウの更新（即座にUIに反映）
        updateProfileShadow(queryClient, profile.did, {
          activitySubscription,
        })

        // 購読を完全に無効化した場合
        if (!activitySubscription.post && !activitySubscription.reply) {
          // メトリクス記録
          logger.metric('activitySubscription:disable', {})
          // トースト通知の表示
          Toast.show(
            _(
              msg`You will no longer receive notifications for ${sanitizeHandle(profile.handle, '@')}`,
            ),
            'check',
          )

          // 購読リストから該当ユーザーを削除（キャッシュ更新）
          queryClient.setQueryData(
            RQKEY_getActivitySubscriptions,
            (
              old?: InfiniteData<AppBskyNotificationListActivitySubscriptions.OutputSchema>,
            ) => {
              if (!old) return old
              return {
                ...old,
                pages: old.pages.map(page => ({
                  ...page,
                  subscriptions: page.subscriptions.filter(
                    item => item.did !== profile.did,
                  ),
                })),
              }
            },
          )
        } else {
          // 購読を有効化または設定変更した場合
          logger.metric('activitySubscription:enable', {
            setting: activitySubscription.reply ? 'posts_and_replies' : 'posts',
          })
          if (!initialState.post && !initialState.reply) {
            // 新規購読の場合
            Toast.show(
              _(
                msg`You'll start receiving notifications for ${sanitizeHandle(profile.handle, '@')}!`,
              ),
              'check',
            )
          } else {
            // 設定変更の場合
            Toast.show(_(msg`Changes saved`), 'check')
          }
        }
      })
    },
    // onError: エラー時の処理
    onError: err => {
      logger.error('Could not save activity subscription', {message: err})
    },
  })

  // useMemo: ボタンのプロパティを動的に計算
  // 変更の有無と設定内容に応じてボタンの表示を切り替え
  const buttonProps: Omit<ButtonProps, 'children'> = useMemo(() => {
    // 初期状態から変更があるか確認
    const isDirty =
      state.post !== initialState.post || state.reply !== initialState.reply
    const hasAny = state.post || state.reply

    if (isDirty) {
      // 変更がある場合: 保存ボタンを表示
      return {
        label: _(msg`Save changes`),
        color: hasAny ? 'primary' : 'negative',
        onPress: () => saveChanges(state),
        disabled: isSaving,
      }
    } else {
      // 変更がない場合
      if (isWeb) {
        // Web: 無効化された保存ボタン（UX的に自然）
        return {
          label: _(msg`Save changes`),
          color: 'secondary',
          disabled: true,
        }
      } else {
        // Native: キャンセルボタン
        return {
          label: _(msg`Cancel`),
          color: 'secondary',
          onPress: () => control.close(),
        }
      }
    }
  }, [state, initialState, control, _, isSaving, saveChanges])

  // サニタイズされた表示名の取得
  const name = createSanitizedDisplayName(profile, false)

  return (
    <Dialog.ScrollableInner
      style={web({maxWidth: 400})}
      label={_(msg`Get notified of new posts from ${name}`)}>
      <View style={[a.gap_lg]}>
        {/* ヘッダーセクション */}
        <View style={[a.gap_xs]}>
          <Text style={[a.font_heavy, a.text_2xl]}>
            <Trans>Keep me posted</Trans>
          </Text>
          <Text style={[t.atoms.text_contrast_medium, a.text_md]}>
            <Trans>Get notified of this account's activity</Trans>
          </Text>
        </View>

        {/* プロフィールカード（オプショナル表示） */}
        {includeProfile && (
          <ProfileCard.Header>
            <ProfileCard.Avatar
              profile={profile}
              moderationOpts={moderationOpts}
              disabledPreview
            />
            <ProfileCard.NameAndHandle
              profile={profile}
              moderationOpts={moderationOpts}
            />
          </ProfileCard.Header>
        )}

        {/* トグルグループ: 投稿/リプライの選択 */}
        <Toggle.Group
          label={_(msg`Subscribe to account activity`)}
          values={values}
          onChange={onChange}>
          <View style={[a.gap_sm]}>
            {/* 投稿トグル */}
            <Toggle.Item
              label={_(msg`Posts`)}
              name="post"
              style={[
                a.flex_1,
                a.py_xs,
                platform({
                  native: [a.justify_between],
                  web: [a.flex_row_reverse, a.gap_sm],
                }),
              ]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
                <Trans>Posts</Trans>
              </Toggle.LabelText>
              <Toggle.Switch />
            </Toggle.Item>
            {/* リプライトグル */}
            <Toggle.Item
              label={_(msg`Replies`)}
              name="reply"
              style={[
                a.flex_1,
                a.py_xs,
                platform({
                  native: [a.justify_between],
                  web: [a.flex_row_reverse, a.gap_sm],
                }),
              ]}>
              <Toggle.LabelText
                style={[t.atoms.text, a.font_normal, a.text_md, a.flex_1]}>
                <Trans>Replies</Trans>
              </Toggle.LabelText>
              <Toggle.Switch />
            </Toggle.Item>
          </View>
        </Toggle.Group>

        {/* エラー表示 */}
        {error && (
          <Admonition type="error">
            <Trans>Could not save changes: {cleanError(error)}</Trans>
          </Admonition>
        )}

        {/* 保存/キャンセルボタン */}
        <Button {...buttonProps} size="large" variant="solid">
          <ButtonText>{buttonProps.label}</ButtonText>
          {isSaving && <ButtonIcon icon={Loader} />}
        </Button>
      </View>

      <Dialog.Close />
    </Dialog.ScrollableInner>
  )
}

/**
 * アクティビティ購読オブジェクトのパース
 *
 * AT Protocolの購読設定を内部形式に変換します。
 * 未設定の場合はデフォルト値（全てfalse）を返します。
 *
 * @param {AppBskyNotificationDefs.ActivitySubscription} [sub] - 購読設定
 * @returns {Un$Typed<AppBskyNotificationDefs.ActivitySubscription>} パースされた購読設定
 */
function parseActivitySubscription(
  sub?: AppBskyNotificationDefs.ActivitySubscription,
): Un$Typed<AppBskyNotificationDefs.ActivitySubscription> {
  if (!sub) return {post: false, reply: false}
  const {post, reply} = sub
  return {post, reply}
}
