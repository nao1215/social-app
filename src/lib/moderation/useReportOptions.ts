/**
 * モデレーション - 報告オプション生成モジュール
 * Moderation - Report Options Generation Module
 *
 * このモジュールは、ユーザーがコンテンツやアカウントを報告する際の選択肢を提供します。
 * This module provides options for users to report content or accounts.
 *
 * 報告理由は、アカウント・投稿・リスト・スターターパック・フィードジェネレーター等、
 * 対象の種類ごとに異なる選択肢が用意されています。
 * Report reasons vary by target type: account, post, list, starter pack, feed generator, etc.
 *
 * 【Goユーザー向け補足】
 * - interface: Goのstructに相当する型定義
 * - useMemo: 計算結果をキャッシュするReactフック（パフォーマンス最適化）
 * - REASONSPAM等: AT Protocolで定義された報告理由の定数
 *
 * For Go Users:
 * - interface: Type definition equivalent to Go struct
 * - useMemo: React hook that caches computation results (performance optimization)
 * - REASONSPAM, etc.: Report reason constants defined in AT Protocol
 */

// Reactのメモ化フックをインポート（計算結果をキャッシュ）
// Import React memoization hook (cache computation results)
import {useMemo} from 'react'
// AT Protocolのモデレーション定義をインポート
// Import AT Protocol moderation definitions
import {ComAtprotoModerationDefs} from '@atproto/api'
// 国際化（i18n）マクロとフックをインポート
// Import internationalization (i18n) macro and hook
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/**
 * 報告オプション（Goのstructに相当）
 * Report option (equivalent to Go struct)
 */
export interface ReportOption {
  reason: string // 報告理由コード（例: "spam", "misleading"） / Report reason code
  title: string // 表示タイトル / Display title
  description: string // 詳細説明 / Detailed description
}

/**
 * 報告対象種別ごとの報告オプション集合（Goのstructに相当）
 * Report options collection by target type (equivalent to Go struct)
 */
interface ReportOptions {
  account: ReportOption[] // アカウント報告用オプション / Account report options
  post: ReportOption[] // 投稿報告用オプション / Post report options
  list: ReportOption[] // リスト報告用オプション / List report options
  starterpack: ReportOption[] // スターターパック報告用オプション / Starter pack report options
  feedgen: ReportOption[] // フィードジェネレーター報告用オプション / Feed generator report options
  other: ReportOption[] // その他報告用オプション / Other report options
  convoMessage: ReportOption[] // 会話メッセージ報告用オプション / Conversation message report options
}

/**
 * 報告オプションを取得するReactフック
 * React hook to get report options
 *
 * ユーザーの言語設定に応じて、国際化された報告オプションを返します。
 * Returns internationalized report options based on user's language setting.
 *
 * useMemoを使用しているため、言語設定が変わらない限り再計算されません。
 * Uses useMemo, so it won't recalculate unless the language setting changes.
 *
 * @returns 報告対象種別ごとの報告オプション
 * @returns Report options by target type
 *
 * @example
 * const reportOptions = useReportOptions()
 * // アカウント報告時の選択肢を表示
 * reportOptions.account.forEach(option => {
 *   console.log(option.title, option.description)
 * })
 */
export function useReportOptions(): ReportOptions {
  // 国際化関数を取得（翻訳処理用）
  // Get internationalization function (for translation)
  const {_} = useLingui()

  // 言語設定が変わらない限り、計算結果をキャッシュ（パフォーマンス最適化）
  // Cache calculation results unless language setting changes (performance optimization)
  return useMemo(() => {
    // 全種別で共通の「その他」オプション
    // "Other" option common to all types
    const other = {
      reason: ComAtprotoModerationDefs.REASONOTHER,
      title: _(msg`Other`),
      description: _(msg`An issue not included in these options`),
    }

    // 複数種別で共通の報告オプション（反社会的行動・違法行為・その他）
    // Common report options for multiple types (anti-social, illegal, other)
    const common = [
      {
        reason: ComAtprotoModerationDefs.REASONRUDE,
        title: _(msg`Anti-Social Behavior`),
        description: _(msg`Harassment, trolling, or intolerance`),
      },
      {
        reason: ComAtprotoModerationDefs.REASONVIOLATION,
        title: _(msg`Illegal and Urgent`),
        description: _(msg`Glaring violations of law or terms of service`),
      },
      other,
    ]

    return {
      // アカウント報告用オプション
      // Account report options
      account: [
        {
          reason: ComAtprotoModerationDefs.REASONMISLEADING,
          title: _(msg`Misleading Account`),
          description: _(
            msg`Impersonation or false claims about identity or affiliation`,
          ),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Frequently Posts Unwanted Content`),
          description: _(msg`Spam; excessive mentions or replies`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        other,
      ],

      // 投稿報告用オプション
      // Post report options
      post: [
        {
          reason: ComAtprotoModerationDefs.REASONMISLEADING,
          title: _(msg`Misleading Post`),
          description: _(msg`Impersonation, misinformation, or false claims`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Spam`),
          description: _(msg`Excessive mentions or replies`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSEXUAL,
          title: _(msg`Unwanted Sexual Content`),
          description: _(msg`Nudity or adult content not labeled as such`),
        },
        ...common, // 共通オプションを展開 / Spread common options
      ],

      // 会話メッセージ報告用オプション（DM等）
      // Conversation message report options (DMs, etc.)
      convoMessage: [
        {
          reason: ComAtprotoModerationDefs.REASONSPAM,
          title: _(msg`Spam`),
          description: _(msg`Excessive or unwanted messages`),
        },
        {
          reason: ComAtprotoModerationDefs.REASONSEXUAL,
          title: _(msg`Unwanted Sexual Content`),
          description: _(msg`Inappropriate messages or explicit links`),
        },
        ...common,
      ],

      // リスト報告用オプション
      // List report options
      list: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],

      // スターターパック報告用オプション
      // Starter pack report options
      starterpack: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],

      // フィードジェネレーター報告用オプション
      // Feed generator report options
      feedgen: [
        {
          reason: ComAtprotoModerationDefs.REASONVIOLATION,
          title: _(msg`Name or Description Violates Community Standards`),
          description: _(msg`Terms used violate community standards`),
        },
        ...common,
      ],

      // その他の報告用オプション
      // Other report options
      other: common,
    }
  }, [_]) // _（国際化関数）が変更された場合のみ再計算 / Recalculate only when _ (i18n function) changes
}
