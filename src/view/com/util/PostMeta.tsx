/**
 * 投稿メタ情報コンポーネント
 * Post Meta Information Component
 *
 * 【概要】
 * 投稿の作成者情報と投稿日時を表示するコンポーネント。
 * アバター、表示名、ハンドル、認証バッジ、経過時間を含む。
 *
 * 【表示レイアウト】
 * [アバター] 表示名✓ @handle · 3h
 *
 * 【使用場面】
 * - フィード内の各投稿のヘッダー部分
 * - 投稿詳細画面のヘッダー
 * - 引用投稿内のメタ情報
 *
 * 【Goユーザー向け補足】
 * - memo: Goには直接対応なし（コンポーネント再レンダリング最適化）
 * - useCallback: 関数のメモ化（Goのクロージャキャプチャに似る）
 * - useQueryClient: React Queryのキャッシュ管理クライアント
 * - ProfileHoverCard: マウスホバー時にプロフィールプレビューを表示
 * - precacheProfile: プロフィールデータを先読みキャッシュ
 */

// Reactフックとメモ化
// React hooks and memoization
import {memo, useCallback} from 'react'

// React Nativeの型
// React Native types
import {type StyleProp, View, type ViewStyle} from 'react-native'

// AT Protocol API型定義
// AT Protocol API type definitions
import {type AppBskyActorDefs, type ModerationDecision} from '@atproto/api'

// 国際化マクロ
// Internationalization macro
import {msg} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// React Queryクライアント
// React Query client
import {useQueryClient} from '@tanstack/react-query'

// React型
// React type
import type React from 'react'

// アクターステータスフック（ライブ配信中など）
// Actor status hook (live streaming, etc.)
import {useActorStatus} from '#/lib/actor-status'

// プロフィールリンク生成
// Profile link generation
import {makeProfileLink} from '#/lib/routes/links'

// 双方向テキスト処理（RTL言語対応）
// Bidirectional text handling (RTL language support)
import {forceLTR} from '#/lib/strings/bidi'

// 改行しないスペース定数
// Non-breaking space constant
import {NON_BREAKING_SPACE} from '#/lib/strings/constants'

// 表示名サニタイズ
// Display name sanitization
import {sanitizeDisplayName} from '#/lib/strings/display-names'

// ハンドルサニタイズ
// Handle sanitization
import {sanitizeHandle} from '#/lib/strings/handles'

// 日時フォーマット
// Date/time formatting
import {niceDate} from '#/lib/strings/time'

// プラットフォーム検出
// Platform detection
import {isAndroid} from '#/platform/detection'

// プロフィールシャドウフック（楽観的更新用）
// Profile shadow hook (for optimistic updates)
import {useProfileShadow} from '#/state/cache/profile-shadow'

// プロフィール先読みキャッシュ
// Profile precache
import {precacheProfile} from '#/state/queries/profile'

// デザインシステム
// Design system
import {atoms as a, platform, useTheme, web} from '#/alf'

// Web専用インラインリンク
// Web-only inline link
import {WebOnlyInlineLinkText} from '#/components/Link'

// プロフィールホバーカード
// Profile hover card
import {ProfileHoverCard} from '#/components/ProfileHoverCard'

// テキストコンポーネント
// Text component
import {Text} from '#/components/Typography'

// 認証状態フック
// Verification state hook
import {useSimpleVerificationState} from '#/components/verification'

// 認証チェックマーク
// Verification check mark
import {VerificationCheck} from '#/components/verification/VerificationCheck'

// 経過時間表示
// Time elapsed display
import {TimeElapsed} from './TimeElapsed'

// ユーザーアバター（プレビュー可能）
// User avatar (previewable)
import {PreviewableUserAvatar} from './UserAvatar'

/**
 * 投稿メタ情報のProps型
 * Post Meta Props type
 */
interface PostMetaOpts {
  author: AppBskyActorDefs.ProfileViewBasic
  moderation: ModerationDecision | undefined
  postHref: string
  timestamp: string
  showAvatar?: boolean
  avatarSize?: number
  onOpenAuthor?: () => void
  style?: StyleProp<ViewStyle>
}

/**
 * 投稿メタ情報コンポーネント本体
 * Post Meta Component Implementation
 *
 * 【処理フロー】
 * 1. プロフィールシャドウで楽観的更新を適用
 * 2. 表示名・ハンドルを取得（フォールバック付き）
 * 3. リンク押下時にプロフィールを先読みキャッシュ
 * 4. 認証バッジ・ライブバッジの表示判定
 */
let PostMeta = (opts: PostMetaOpts): React.ReactNode => {
  const t = useTheme()
  const {i18n, _} = useLingui()

  // プロフィールシャドウ: 楽観的更新を反映したプロフィール
  // Profile shadow: profile with optimistic updates applied
  const author = useProfileShadow(opts.author)
  const displayName = author.displayName || author.handle
  const handle = author.handle
  const profileLink = makeProfileLink(author)
  const queryClient = useQueryClient()
  const onOpenAuthor = opts.onOpenAuthor

  // 著者リンク押下前のコールバック: プロフィールを先読みキャッシュ
  // Callback before author link press: precache profile
  const onBeforePressAuthor = useCallback(() => {
    precacheProfile(queryClient, author)
    onOpenAuthor?.()
  }, [queryClient, author, onOpenAuthor])

  // 投稿リンク押下前のコールバック
  // Callback before post link press
  const onBeforePressPost = useCallback(() => {
    precacheProfile(queryClient, author)
  }, [queryClient, author])

  const timestampLabel = niceDate(i18n, opts.timestamp)
  const verification = useSimpleVerificationState({profile: author})
  const {isActive: live} = useActorStatus(author)

  return (
    <View
      style={[
        a.flex_1,
        a.flex_row,
        a.align_center,
        a.pb_xs,
        a.gap_xs,
        a.z_20,
        opts.style,
      ]}>
      {opts.showAvatar && (
        <View style={[a.self_center, a.mr_2xs]}>
          <PreviewableUserAvatar
            size={opts.avatarSize || 16}
            profile={author}
            moderation={opts.moderation?.ui('avatar')}
            type={author.associated?.labeler ? 'labeler' : 'user'}
            live={live}
            hideLiveBadge
          />
        </View>
      )}
      <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
        <ProfileHoverCard did={author.did}>
          <View style={[a.flex_row, a.align_end, a.flex_shrink]}>
            <WebOnlyInlineLinkText
              emoji
              numberOfLines={1}
              to={profileLink}
              label={_(msg`View profile`)}
              disableMismatchWarning
              onPress={onBeforePressAuthor}
              style={[
                a.text_md,
                a.font_bold,
                t.atoms.text,
                a.leading_tight,
                a.flex_shrink_0,
                {maxWidth: '70%'},
              ]}>
              {forceLTR(
                sanitizeDisplayName(
                  displayName,
                  opts.moderation?.ui('displayName'),
                ),
              )}
            </WebOnlyInlineLinkText>
            {verification.showBadge && (
              <View
                style={[
                  a.pl_2xs,
                  a.self_center,
                  {
                    marginTop: platform({web: 0, ios: 0, android: -1}),
                  },
                ]}>
                <VerificationCheck
                  width={platform({android: 13, default: 12})}
                  verifier={verification.role === 'verifier'}
                />
              </View>
            )}
            <WebOnlyInlineLinkText
              emoji
              numberOfLines={1}
              to={profileLink}
              label={_(msg`View profile`)}
              disableMismatchWarning
              disableUnderline
              onPress={onBeforePressAuthor}
              style={[
                a.text_md,
                t.atoms.text_contrast_medium,
                a.leading_tight,
                {flexShrink: 10},
              ]}>
              {NON_BREAKING_SPACE + sanitizeHandle(handle, '@')}
            </WebOnlyInlineLinkText>
          </View>
        </ProfileHoverCard>

        <TimeElapsed timestamp={opts.timestamp}>
          {({timeElapsed}) => (
            <WebOnlyInlineLinkText
              to={opts.postHref}
              label={timestampLabel}
              title={timestampLabel}
              disableMismatchWarning
              disableUnderline
              onPress={onBeforePressPost}
              style={[
                a.pl_xs,
                a.text_md,
                a.leading_tight,
                isAndroid && a.flex_grow,
                a.text_right,
                t.atoms.text_contrast_medium,
                web({
                  whiteSpace: 'nowrap',
                }),
              ]}>
              {!isAndroid && (
                <Text
                  style={[
                    a.text_md,
                    a.leading_tight,
                    t.atoms.text_contrast_medium,
                  ]}
                  accessible={false}>
                  &middot;{' '}
                </Text>
              )}
              {timeElapsed}
            </WebOnlyInlineLinkText>
          )}
        </TimeElapsed>
      </View>
    </View>
  )
}
PostMeta = memo(PostMeta)
export {PostMeta}
