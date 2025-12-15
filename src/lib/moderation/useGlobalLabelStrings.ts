/**
 * モデレーション - グローバルラベル文言定義モジュール
 * Moderation - Global Label Strings Definition Module
 *
 * このモジュールは、AT Protocolで定義されているグローバルラベルの表示文言を提供します。
 * This module provides display strings for global labels defined in AT Protocol.
 *
 * グローバルラベルは、全Blueskyサーバーで共通のコンテンツ分類タグです。
 * Global labels are content classification tags common across all Bluesky servers.
 *
 * 【Goユーザー向け補足】
 * - type: Goのtype定義に相当するTypeScript型エイリアス
 * - Record<K, V>: GoのmapのようなKey-Value構造を表すTypeScript型
 * - useMemo: 計算結果をキャッシュするReactフック
 *
 * For Go Users:
 * - type: TypeScript type alias equivalent to Go type definition
 * - Record<K, V>: TypeScript type representing Key-Value structure like Go map
 * - useMemo: React hook that caches computation results
 */

// Reactのメモ化フックをインポート
// Import React memoization hook
import {useMemo} from 'react'
// 国際化（i18n）マクロとフックをインポート
// Import internationalization (i18n) macro and hook
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/**
 * グローバルラベル文言の型定義（Goのmapに相当）
 * Global label strings type definition (equivalent to Go map)
 *
 * キー: ラベル識別子（例: "porn", "gore", "!hide"）
 * Key: Label identifier (e.g., "porn", "gore", "!hide")
 * 値: 名前と説明文のオブジェクト
 * Value: Object with name and description
 */
export type GlobalLabelStrings = Record<
  string,
  {
    name: string // ラベル名（短い表示名） / Label name (short display name)
    description: string // ラベル説明（詳細な説明文） / Label description (detailed description)
  }
>

/**
 * グローバルラベルの表示文言を取得するReactフック
 * React hook to get global label display strings
 *
 * AT Protocolで定義された標準ラベルの名前と説明を、
 * ユーザーの言語設定に応じて国際化した形で返します。
 * Returns names and descriptions of standard labels defined in AT Protocol,
 * internationalized according to user's language setting.
 *
 * ラベル種別：
 * Label types:
 * - "!hide": モデレーターによって完全に非表示にされたコンテンツ
 * - "!warn": モデレーターによって警告が付与されたコンテンツ
 * - "!no-unauthenticated": ログインユーザーのみ閲覧可能なコンテンツ
 * - "porn": 明示的な性的コンテンツ
 * - "sexual": 性的示唆のあるコンテンツ（露骨さは低い）
 * - "nudity": 非性的なヌード（芸術作品等）
 * - "graphic-media" / "gore": グロテスクまたは暴力的なメディア
 *
 * @returns ラベル識別子をキーとする表示文言マップ
 * @returns Display string map with label identifier as key
 *
 * @example
 * const labelStrings = useGlobalLabelStrings()
 * console.log(labelStrings['porn'].name) // "Adult Content"
 * console.log(labelStrings['porn'].description) // "Explicit sexual images."
 */
export function useGlobalLabelStrings(): GlobalLabelStrings {
  // 国際化関数を取得
  // Get internationalization function
  const {_} = useLingui()

  // 言語設定が変わらない限り、計算結果をキャッシュ
  // Cache calculation results unless language setting changes
  return useMemo(
    () => ({
      // モデレーターによる非表示ラベル（最も強い制限）
      // Hidden by moderators label (strongest restriction)
      '!hide': {
        name: _(msg`Content Blocked`),
        description: _(msg`This content has been hidden by the moderators.`),
      },

      // モデレーターによる警告ラベル
      // Warning by moderators label
      '!warn': {
        name: _(msg`Content Warning`),
        description: _(
          msg`This content has received a general warning from moderators.`,
        ),
      },

      // ログイン必須ラベル（未認証ユーザーには非表示）
      // Sign-in required label (hidden from unauthenticated users)
      '!no-unauthenticated': {
        name: _(msg`Sign-in Required`),
        description: _(
          msg`This user has requested that their content only be shown to signed-in users.`,
        ),
      },

      // アダルトコンテンツラベル（明示的な性的画像）
      // Adult content label (explicit sexual images)
      porn: {
        name: _(msg`Adult Content`),
        description: _(msg`Explicit sexual images.`),
      },

      // 性的示唆ラベル（ヌードは含まない）
      // Sexually suggestive label (does not include nudity)
      sexual: {
        name: _(msg`Sexually Suggestive`),
        description: _(msg`Does not include nudity.`),
      },

      // 非性的ヌードラベル（芸術作品等）
      // Non-sexual nudity label (artistic nudes, etc.)
      nudity: {
        name: _(msg`Non-sexual Nudity`),
        description: _(msg`E.g. artistic nudes.`),
      },

      // グラフィックメディアラベル（暴力的・グロテスクなコンテンツ）
      // Graphic media label (violent/grotesque content)
      'graphic-media': {
        name: _(msg`Graphic Media`),
        description: _(msg`Explicit or potentially disturbing media.`),
      },

      // ゴアラベル（graphic-mediaと同義、後方互換性のため残存）
      // Gore label (synonym of graphic-media, kept for backward compatibility)
      gore: {
        name: _(msg`Graphic Media`),
        description: _(msg`Explicit or potentially disturbing media.`),
      },
    }),
    [_], // _（国際化関数）が変更された場合のみ再計算 / Recalculate only when _ (i18n function) changes
  )
}
