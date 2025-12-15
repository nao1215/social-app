/**
 * モデレーション - モデレーション原因説明生成モジュール
 * Moderation - Moderation Cause Description Generation Module
 *
 * このモジュールは、コンテンツがモデレーションされた理由を説明する文言を生成します。
 * This module generates descriptions explaining why content was moderated.
 *
 * モデレーション原因の種類：
 * Types of moderation causes:
 * - blocking/blocked-by: ブロック関係
 * - muted: ミュート状態
 * - hidden: ユーザーによる非表示
 * - label: ラベルによるコンテンツ分類
 *
 * 【Goユーザー向け補足】
 * - interface: Goのstructに相当する型定義
 * - React.useMemo: 計算結果をキャッシュするReactフック
 * - type assertion: Goの型アサーション（type.(TargetType)）に相当
 *
 * For Go Users:
 * - interface: Type definition equivalent to Go struct
 * - React.useMemo: React hook that caches computation results
 * - type assertion: Equivalent to Go type assertion (type.(TargetType))
 */

// Reactのフックをインポート
// Import React hooks
import React from 'react'
// AT ProtocolのモデレーションDIDとモデレーション原因型をインポート
// Import AT Protocol moderation DID and moderation cause types
import {
  BSKY_LABELER_DID,
  type ModerationCause,
  type ModerationCauseSource,
} from '@atproto/api'
// 国際化（i18n）マクロとフックをインポート
// Import internationalization (i18n) macro and hook
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// ユーティリティ関数と状態管理フックをインポート
// Import utility functions and state management hooks
import {sanitizeHandle} from '#/lib/strings/handles'
import {useLabelDefinitions} from '#/state/preferences'
import {useSession} from '#/state/session'
// アイコンコンポーネントをインポート（各モデレーション原因の視覚表現）
// Import icon components (visual representation of each moderation cause)
import {CircleBanSign_Stroke2_Corner0_Rounded as CircleBanSign} from '#/components/icons/CircleBanSign'
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
import {type Props as SVGIconProps} from '#/components/icons/common'
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
import {Warning_Stroke2_Corner0_Rounded as Warning} from '#/components/icons/Warning'
import {type AppModerationCause} from '#/components/Pills'
// 関連ヘルパー関数をインポート
// Import related helper functions
import {useGlobalLabelStrings} from './useGlobalLabelStrings'
import {getDefinition, getLabelStrings} from './useLabelInfo'

/**
 * モデレーション原因の説明情報（Goのstructに相当）
 * Moderation cause description information (equivalent to Go struct)
 */
export interface ModerationCauseDescription {
  icon: React.ComponentType<SVGIconProps> // 表示アイコン / Display icon
  name: string // モデレーション原因名 / Moderation cause name
  description: string // 詳細説明 / Detailed description
  source?: string // モデレーション実施元（ラベラーのハンドル等） / Moderation source (labeler handle, etc.)
  sourceDisplayName?: string // モデレーション実施元の表示名 / Source display name
  sourceType?: ModerationCauseSource['type'] // モデレーション実施元の種別 / Source type
  sourceAvi?: string // モデレーション実施元のアバター画像URL / Source avatar image URL
  sourceDid?: string // モデレーション実施元のDID / Source DID
}

/**
 * モデレーション原因の説明を取得するReactフック
 * React hook to get moderation cause description
 *
 * 与えられたモデレーション原因（ブロック、ミュート、ラベル等）に基づいて、
 * ユーザーに表示すべきアイコン、タイトル、説明文を生成します。
 * Based on the given moderation cause (block, mute, label, etc.),
 * generates icon, title, and description to display to the user.
 *
 * @param cause - モデレーション原因オブジェクト（undefinedの場合は一般警告）
 * @param cause - Moderation cause object (general warning if undefined)
 * @returns モデレーション原因の説明情報
 * @returns Moderation cause description information
 *
 * @example
 * const cause = { type: 'blocking', ... }
 * const desc = useModerationCauseDescription(cause)
 * console.log(desc.name) // "User Blocked"
 * console.log(desc.icon) // CircleBanSign component
 */
export function useModerationCauseDescription(
  cause: ModerationCause | AppModerationCause | undefined,
): ModerationCauseDescription {
  // 現在のアカウント情報を取得
  // Get current account information
  const {currentAccount} = useSession()
  // 国際化関数とロケール情報を取得
  // Get internationalization function and locale information
  const {_, i18n} = useLingui()
  // ラベル定義とラベラー一覧を取得
  // Get label definitions and labeler list
  const {labelDefs, labelers} = useLabelDefinitions()
  // グローバルラベルの表示文言を取得
  // Get global label display strings
  const globalLabelStrings = useGlobalLabelStrings()

  // 依存値が変更された場合のみ再計算（パフォーマンス最適化）
  // Recalculate only when dependencies change (performance optimization)
  return React.useMemo(() => {
    // causeがundefinedの場合は一般警告を返す
    // Return general warning if cause is undefined
    if (!cause) {
      return {
        icon: Warning,
        name: _(msg`Content Warning`),
        description: _(
          msg`Moderator has chosen to set a general warning on the content.`,
        ),
      }
    }

    // ブロック中（自分が相手をブロックしている）
    // Blocking (you are blocking the user)
    if (cause.type === 'blocking') {
      if (cause.source.type === 'list') {
        // リスト経由でブロックしている場合
        // Blocking via list
        return {
          icon: CircleBanSign,
          name: _(msg`User Blocked by "${cause.source.list.name}"`),
          description: _(
            msg`You have blocked this user. You cannot view their content.`,
          ),
        }
      } else {
        // 個別にブロックしている場合
        // Individual block
        return {
          icon: CircleBanSign,
          name: _(msg`User Blocked`),
          description: _(
            msg`You have blocked this user. You cannot view their content.`,
          ),
        }
      }
    }

    // ブロックされている（相手が自分をブロックしている）
    // Blocked by (the user is blocking you)
    if (cause.type === 'blocked-by') {
      return {
        icon: CircleBanSign,
        name: _(msg`User Blocking You`),
        description: _(
          msg`This user has blocked you. You cannot view their content.`,
        ),
      }
    }

    // ブロック関係のあるユーザー同士の相互作用（第三者視点）
    // Interaction between users with blocking relationship (third-party view)
    if (cause.type === 'block-other') {
      return {
        icon: CircleBanSign,
        name: _(msg`Content Not Available`),
        description: _(
          msg`This content is not available because one of the users involved has blocked the other.`,
        ),
      }
    }

    // ミュート中
    // Muted
    if (cause.type === 'muted') {
      if (cause.source.type === 'list') {
        // リスト経由でミュートしている場合
        // Muted via list
        return {
          icon: EyeSlash,
          name: _(msg`Muted by "${cause.source.list.name}"`),
          description: _(msg`You have muted this user`),
        }
      } else {
        // 個別にミュートしている場合
        // Individual mute
        return {
          icon: EyeSlash,
          name: _(msg`Account Muted`),
          description: _(msg`You have muted this account.`),
        }
      }
    }

    // ミュートワード（特定単語・ハッシュタグをミュート）
    // Mute word (muting specific words/hashtags)
    if (cause.type === 'mute-word') {
      return {
        icon: EyeSlash,
        name: _(msg`Post Hidden by Muted Word`),
        description: _(
          msg`You've chosen to hide a word or tag within this post.`,
        ),
      }
    }

    // 非表示（ユーザーが手動で非表示にした投稿）
    // Hidden (post manually hidden by user)
    if (cause.type === 'hidden') {
      return {
        icon: EyeSlash,
        name: _(msg`Post Hidden by You`),
        description: _(msg`You have hidden this post`),
      }
    }

    // リプライ非表示（スレッド作成者またはユーザー自身が非表示にしたリプライ）
    // Reply hidden (reply hidden by thread author or user themselves)
    if (cause.type === 'reply-hidden') {
      // 自分が非表示にしたかどうかを判定
      // Determine if you hid it yourself
      const isMe = currentAccount?.did === cause.source.did
      return {
        icon: EyeSlash,
        name: isMe
          ? _(msg`Reply Hidden by You`)
          : _(msg`Reply Hidden by Thread Author`),
        description: isMe
          ? _(msg`You hid this reply.`)
          : _(msg`The author of this thread has hidden this reply.`),
      }
    }

    // ラベルによるモデレーション（最も複雑なケース）
    // Moderation by label (most complex case)
    if (cause.type === 'label') {
      // ラベル定義を取得（カスタム定義またはグローバル定義）
      // Get label definition (custom or global)
      const def = cause.labelDef || getDefinition(labelDefs, cause.label)
      // ラベルの表示文言を取得（ロケールに応じて）
      // Get label display strings (based on locale)
      const strings = getLabelStrings(i18n.locale, globalLabelStrings, def)
      // ラベル実施元（ラベラー）を検索
      // Search for label source (labeler)
      const labeler = labelers.find(l => l.creator.did === cause.label.src)
      let source = labeler
        ? sanitizeHandle(labeler.creator.handle, '@')
        : undefined
      let sourceDisplayName = labeler?.creator.displayName

      // ラベラーが見つからない場合の処理
      // Handle case when labeler is not found
      if (!source) {
        if (cause.label.src === BSKY_LABELER_DID) {
          // 公式Blueskyモデレーションサービス
          // Official Bluesky moderation service
          source = 'moderation.bsky.app'
          sourceDisplayName = 'Bluesky Moderation Service'
        } else {
          // 不明なラベラー
          // Unknown labeler
          source = _(msg`an unknown labeler`)
        }
      }

      // pornとsexualラベルを「Adult Content」に統一
      // Unify porn and sexual labels as "Adult Content"
      if (def.identifier === 'porn' || def.identifier === 'sexual') {
        strings.name = _(msg`Adult Content`)
      }

      // ラベルの重大度に応じたアイコンを選択
      // Select icon based on label severity
      return {
        icon:
          def.identifier === '!no-unauthenticated'
            ? EyeSlash // ログイン必須 / Sign-in required
            : def.severity === 'alert'
              ? Warning // 警告 / Warning
              : CircleInfo, // 情報 / Information
        name: strings.name,
        description: strings.description,
        source,
        sourceDisplayName,
        sourceType: cause.source.type,
        sourceAvi: labeler?.creator.avatar,
        sourceDid: cause.label.src,
      }
    }

    // 上記のいずれにも該当しない場合（発生しないはず）
    // Should never happen (fallback case)
    return {
      icon: CircleInfo,
      name: '',
      description: ``,
    }
  }, [
    labelDefs,
    labelers,
    globalLabelStrings,
    cause,
    _,
    i18n.locale,
    currentAccount?.did,
  ])
}
