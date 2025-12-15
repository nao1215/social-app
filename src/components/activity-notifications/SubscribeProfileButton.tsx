/**
 * @fileoverview プロフィール購読ボタンコンポーネント
 *
 * ユーザープロフィールに表示される、投稿通知を購読するためのボタンです。
 * ボタンをクリックすると購読設定ダイアログが開きます。
 *
 * 主な機能:
 * - メール認証確認（未認証の場合は認証を要求）
 * - 初回利用時のツールチップ表示
 * - 購読状態に応じたアイコン切り替え（購読中/未購読）
 */

// React: コールバック関数のメモ化用フック
// useCallback: 関数をメモ化して不要な再作成を防ぐ（Goの関数定義に相当）
import {useCallback} from 'react'
// AT Protocol: モデレーション設定の型定義
import {type ModerationOpts} from '@atproto/api'
// Lingui: 国際化ライブラリ
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// カスタムフック: メール認証必須処理
import {useRequireEmailVerification} from '#/lib/hooks/useRequireEmailVerification'
// ユーティリティ: サニタイズされた表示名の生成
import {createSanitizedDisplayName} from '#/lib/moderation/create-sanitized-display-name'
// UIコンポーネント
import {Button, ButtonIcon} from '#/components/Button'
import {useDialogControl} from '#/components/Dialog'
// アイコン: 通知ベル（購読設定）
import {BellPlus_Stroke2_Corner0_Rounded as BellPlusIcon} from '#/components/icons/BellPlus'
// アイコン: 通知ベル（購読中）
import {BellRinging_Filled_Corner0_Rounded as BellRingingIcon} from '#/components/icons/BellRinging'
// ツールチップコンポーネント
import * as Tooltip from '#/components/Tooltip'
import {Text} from '#/components/Typography'
// ローカルストレージ: ツールチップ表示フラグの管理
import {useActivitySubscriptionsNudged} from '#/storage/hooks/activity-subscriptions-nudged'
// 型定義: Blueskyプロフィール型
import type * as bsky from '#/types/bsky'
// 購読ダイアログコンポーネント
import {SubscribeProfileDialog} from './SubscribeProfileDialog'

/**
 * プロフィール購読ボタンコンポーネント
 *
 * プロフィールページに表示される通知購読用のボタンです。
 * クリック時にメール認証状態を確認し、認証済みの場合は購読設定ダイアログを表示します。
 *
 * @param {Object} props - コンポーネントのプロパティ（Go言語のstructに相当）
 * @param {bsky.profile.AnyProfileView} props.profile - 購読対象のプロフィール情報
 * @param {ModerationOpts} props.moderationOpts - モデレーション設定
 *
 * Go言語での参考:
 * ```go
 * type Props struct {
 *   Profile         AnyProfileView
 *   ModerationOpts  ModerationOpts
 * }
 * ```
 */
export function SubscribeProfileButton({
  profile,
  moderationOpts,
}: {
  profile: bsky.profile.AnyProfileView
  moderationOpts: ModerationOpts
}) {
  // Lingui: 翻訳関数の取得
  const {_} = useLingui()
  // メール認証必須処理のラッパー関数
  const requireEmailVerification = useRequireEmailVerification()
  // ダイアログ制御: 開閉状態の管理
  const subscribeDialogControl = useDialogControl()
  // ローカルストレージ: ツールチップ表示済みフラグ
  // activitySubscriptionsNudged: 現在の値
  // setActivitySubscriptionsNudged: 更新関数
  const [activitySubscriptionsNudged, setActivitySubscriptionsNudged] =
    useActivitySubscriptionsNudged()

  /**
   * ツールチップ閉じるハンドラ
   *
   * ツールチップを閉じた際に、次回以降表示しないようフラグを保存します。
   */
  const onDismissTooltip = () => {
    setActivitySubscriptionsNudged(true)
  }

  /**
   * ボタンクリックハンドラ
   *
   * useCallback: 関数をメモ化し、依存配列の値が変更された時のみ再作成
   * これにより不要な再レンダリングを防ぎます（パフォーマンス最適化）
   */
  const onPress = useCallback(() => {
    subscribeDialogControl.open()
  }, [subscribeDialogControl])

  // サニタイズされた表示名の取得（XSS対策等）
  const name = createSanitizedDisplayName(profile, true)

  /**
   * メール認証チェック付きクリックハンドラ
   *
   * メール未認証の場合は認証ダイアログを表示し、
   * 認証済みの場合は購読設定ダイアログを開きます。
   */
  const wrappedOnPress = requireEmailVerification(onPress, {
    instructions: [
      <Trans key="message">
        Before you can get notifications for {name}'s posts, you must first
        verify your email.
      </Trans>,
    ],
  })

  // 購読状態の判定: 投稿またはリプライのいずれかが有効な場合
  const isSubscribed =
    profile.viewer?.activitySubscription?.post ||
    profile.viewer?.activitySubscription?.reply

  // 購読状態に応じたアイコンの選択
  const Icon = isSubscribed ? BellRingingIcon : BellPlusIcon

  return (
    <>
      {/* ツールチップ: 初回利用時のみ表示 */}
      <Tooltip.Outer
        visible={!activitySubscriptionsNudged}
        onVisibleChange={onDismissTooltip}
        position="bottom">
        <Tooltip.Target>
          {/* 購読ボタン */}
          <Button
            accessibilityRole="button"
            testID="dmBtn"
            size="small"
            color="secondary"
            variant="solid"
            shape="round"
            label={_(msg`Get notified when ${name} posts`)}
            onPress={wrappedOnPress}>
            <ButtonIcon icon={Icon} size="md" />
          </Button>
        </Tooltip.Target>
        {/* ツールチップのテキスト */}
        <Tooltip.TextBubble>
          <Text>
            <Trans>Get notified about new posts</Trans>
          </Text>
        </Tooltip.TextBubble>
      </Tooltip.Outer>

      {/* 購読設定ダイアログ */}
      <SubscribeProfileDialog
        control={subscribeDialogControl}
        profile={profile}
        moderationOpts={moderationOpts}
      />
    </>
  )
}
