/**
 * ユーザー情報テキストコンポーネント
 * User Info Text Component
 *
 * 【概要】
 * ユーザーDIDからプロフィール情報を取得し、指定された属性（表示名、ハンドル等）
 * をリンク付きで表示するコンポーネント。データ取得中はプレースホルダー表示。
 *
 * 【使用場面】
 * - 「○○さんがいいねしました」などの通知テキスト
 * - ユーザー名の動的表示
 * - プロフィールへのリンク付きユーザー名
 *
 * 【Goユーザー向け補足】
 * - DID: 分散識別子（Decentralized Identifier）、ユーザーの一意識別子
 * - useProfileQuery: プロフィール情報をAPIから取得するReact Queryフック
 * - STALE.INFINITY: キャッシュを無期限に有効にする設定
 */

// React Nativeのスタイル型
// React Native style types
import {type StyleProp, type TextStyle} from 'react-native'

// AT Protocol APIの型定義
// AT Protocol API type definitions
import {type AppBskyActorGetProfile} from '@atproto/api'

// プロフィールリンク生成ユーティリティ
// Profile link generation utility
import {makeProfileLink} from '#/lib/routes/links'

// 表示名サニタイズ
// Display name sanitization
import {sanitizeDisplayName} from '#/lib/strings/display-names'

// ハンドルサニタイズ
// Handle sanitization
import {sanitizeHandle} from '#/lib/strings/handles'

// キャッシュ有効期限定数
// Cache staleness constants
import {STALE} from '#/state/queries'

// プロフィールクエリフック
// Profile query hook
import {useProfileQuery} from '#/state/queries/profile'

// デザインシステム
// Design system
import {atoms as a} from '#/alf'

// インラインリンクテキストコンポーネント
// Inline link text component
import {InlineLinkText} from '#/components/Link'

// テキストコンポーネント
// Text component
import {Text} from '#/components/Typography'

// ローディングプレースホルダー
// Loading placeholder
import {LoadingPlaceholder} from './LoadingPlaceholder'

/**
 * ユーザー情報テキスト
 * User Info Text
 *
 * 【動作フロー】
 * 1. DIDからプロフィール情報を取得
 * 2. 取得中: ローディングプレースホルダー表示
 * 3. 成功: 指定属性（displayName/handle等）をリンクとして表示
 * 4. エラー: failedで指定されたフォールバックテキスト表示
 *
 * @param did ユーザーのDID / User's DID
 * @param attr 表示する属性（デフォルト: 'handle'） / Attribute to display (default: 'handle')
 * @param loading ローディング中テキスト（未使用） / Loading text (unused)
 * @param failed エラー時のフォールバックテキスト / Fallback text on error
 * @param prefix テキストの前に付加する文字列 / String to prepend to text
 * @param style カスタムスタイル / Custom style
 */
export function UserInfoText({
  did,
  attr,
  failed,
  prefix,
  style,
}: {
  /** ユーザーのDID（分散識別子） / User's DID (Decentralized Identifier) */
  did: string
  /** 表示する属性（displayName, handle等） / Attribute to display */
  attr?: keyof AppBskyActorGetProfile.OutputSchema
  /** ローディング中テキスト（現在未使用） / Loading text (currently unused) */
  loading?: string
  /** エラー時のフォールバックテキスト / Fallback text on error */
  failed?: string
  /** テキストの前に付加する文字列 / String to prepend */
  prefix?: string
  /** カスタムスタイル / Custom style */
  style?: StyleProp<TextStyle>
}) {
  // デフォルト値の設定
  // Set default values
  attr = attr || 'handle'
  failed = failed || 'user'

  // プロフィール情報を取得（キャッシュ無期限）
  // Fetch profile info (cache indefinitely)
  const {data: profile, isError} = useProfileQuery({
    did,
    staleTime: STALE.INFINITY,
  })

  // エラー時: フォールバックテキスト表示
  // On error: show fallback text
  if (isError) {
    return (
      <Text style={style} numberOfLines={1}>
        {failed}
      </Text>
    )
  } else if (profile) {
    // 成功時: プロフィールへのリンク付きテキスト表示
    // On success: show linked text to profile
    const text = `${prefix || ''}${sanitizeDisplayName(
      typeof profile[attr] === 'string' && profile[attr]
        ? (profile[attr] as string)
        : sanitizeHandle(profile.handle),
    )}`
    return (
      <InlineLinkText
        label={text}
        style={style}
        numberOfLines={1}
        to={makeProfileLink(profile)}>
        <Text emoji style={style}>
          {text}
        </Text>
      </InlineLinkText>
    )
  }

  // 取得中: ローディングプレースホルダー表示
  // Fetching: show loading placeholder
  // eslint-disable-next-line bsky-internal/avoid-unwrapped-text
  return (
    <LoadingPlaceholder
      width={80}
      height={8}
      style={[a.relative, {top: 1, left: 2}]}
    />
  )
}
