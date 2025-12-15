/**
 * モデレーション - ラベル情報取得モジュール
 * Moderation - Label Information Retrieval Module
 *
 * このモジュールは、コンテンツに付与されたラベルの詳細情報を取得します。
 * This module retrieves detailed information about labels attached to content.
 *
 * ラベルには以下の種類があります：
 * Labels come in the following types:
 * - グローバルラベル: AT Protocolで定義された標準ラベル（porn, gore等）
 * - カスタムラベル: ラベラー（モデレーター）が独自に定義したラベル
 *
 * 【Goユーザー向け補足】
 * - interface: Goのstructに相当する型定義
 * - Record<K, V>: GoのmapのようなKey-Value構造
 * - bcp-47-match: 言語コードのマッチングライブラリ（例: "ja-JP"と"ja"のマッチング）
 *
 * For Go Users:
 * - interface: Type definition equivalent to Go struct
 * - Record<K, V>: Key-Value structure like Go map
 * - bcp-47-match: Language code matching library (e.g., matching "ja-JP" with "ja")
 */

// AT Protocolのラベル関連型定義をインポート
// Import AT Protocol label-related type definitions
import {
  AppBskyLabelerDefs,
  ComAtprotoLabelDefs,
  InterpretedLabelValueDefinition,
  interpretLabelValueDefinition,
  LABELS,
} from '@atproto/api'
// 国際化フックをインポート
// Import internationalization hook
import {useLingui} from '@lingui/react'
// BCP-47言語コードマッチングライブラリをインポート
// Import BCP-47 language code matching library
import * as bcp47Match from 'bcp-47-match'

// 関連ヘルパー関数とフックをインポート
// Import related helper functions and hooks
import {
  GlobalLabelStrings,
  useGlobalLabelStrings,
} from '#/lib/moderation/useGlobalLabelStrings'
import {useLabelDefinitions} from '#/state/preferences'

/**
 * ラベル情報（Goのstructに相当）
 * Label information (equivalent to Go struct)
 */
export interface LabelInfo {
  label: ComAtprotoLabelDefs.Label // 元のラベルオブジェクト / Original label object
  def: InterpretedLabelValueDefinition // 解釈されたラベル定義 / Interpreted label definition
  strings: ComAtprotoLabelDefs.LabelValueDefinitionStrings // 表示文言（国際化済み） / Display strings (internationalized)
  labeler: AppBskyLabelerDefs.LabelerViewDetailed | undefined // ラベル実施元情報 / Labeler information
}

/**
 * ラベル情報を取得するReactフック
 * React hook to get label information
 *
 * 与えられたラベルから、定義・表示文言・ラベラー情報を取得します。
 * Retrieves definition, display strings, and labeler information from the given label.
 *
 * @param label - ラベルオブジェクト（Goのstruct引数に相当）
 * @param label - Label object (equivalent to Go struct parameter)
 * @returns ラベル情報
 * @returns Label information
 *
 * @example
 * const label = { val: 'porn', src: 'did:plc:...', ... }
 * const info = useLabelInfo(label)
 * console.log(info.strings.name) // "Adult Content" (ユーザーの言語で表示)
 * console.log(info.labeler.creator.handle) // "moderation.bsky.app"
 */
export function useLabelInfo(label: ComAtprotoLabelDefs.Label): LabelInfo {
  // 国際化オブジェクトを取得（ロケール情報含む）
  // Get internationalization object (includes locale information)
  const {i18n} = useLingui()
  // ラベル定義とラベラー一覧を取得
  // Get label definitions and labeler list
  const {labelDefs, labelers} = useLabelDefinitions()
  // グローバルラベルの表示文言を取得
  // Get global label display strings
  const globalLabelStrings = useGlobalLabelStrings()

  // ラベル定義を取得（カスタムまたはグローバル）
  // Get label definition (custom or global)
  const def = getDefinition(labelDefs, label)

  return {
    label,
    def,
    // ロケールに応じた表示文言を取得
    // Get display strings based on locale
    strings: getLabelStrings(i18n.locale, globalLabelStrings, def),
    // ラベル実施元（ラベラー）を検索
    // Search for labeler (label source)
    labeler: labelers.find(labeler => label.src === labeler.creator.did),
  }
}

/**
 * ラベル定義を取得する（カスタムまたはグローバル）
 * Get label definition (custom or global)
 *
 * 優先順位：
 * Priority:
 * 1. カスタムラベル定義（ラベラーが独自に定義）
 * 2. グローバルラベル定義（AT Protocolの標準定義）
 * 3. フォールバック定義（何も見つからない場合）
 *
 * @param labelDefs - ラベル定義マップ（Goのmap[string][]structに相当）
 * @param labelDefs - Label definition map (equivalent to Go map[string][]struct)
 * @param label - ラベルオブジェクト
 * @param label - Label object
 * @returns 解釈されたラベル定義
 * @returns Interpreted label definition
 *
 * @example
 * const def = getDefinition(labelDefs, { val: 'porn', src: 'did:plc:...' })
 * console.log(def.severity) // 'alert'
 * console.log(def.blurs) // 'media'
 */
export function getDefinition(
  labelDefs: Record<string, InterpretedLabelValueDefinition[]>,
  label: ComAtprotoLabelDefs.Label,
): InterpretedLabelValueDefinition {
  // カスタムラベル定義を検索（"!"で始まらないラベルのみ）
  // Search for custom label definition (only labels not starting with "!")
  // "!"で始まるラベルはシステム予約ラベル
  // Labels starting with "!" are system-reserved labels
  const customDef =
    !label.val.startsWith('!') &&
    labelDefs[label.src]?.find(
      def => def.identifier === label.val && def.definedBy === label.src,
    )
  if (customDef) {
    return customDef
  }

  // グローバルラベル定義を検索（AT Protocol標準ラベル）
  // Search for global label definition (AT Protocol standard labels)
  const globalDef = LABELS[label.val as keyof typeof LABELS]
  if (globalDef) {
    return globalDef
  }

  // どちらも見つからない場合は、何もしない定義を返す（フォールバック）
  // If neither found, return no-op definition (fallback)
  // severity: 'none' = 何も制限しない / No restrictions
  // blurs: 'none' = 何もぼかさない / No blurring
  // defaultSetting: 'ignore' = デフォルトで無視 / Ignore by default
  return interpretLabelValueDefinition(
    {
      identifier: label.val,
      severity: 'none',
      blurs: 'none',
      defaultSetting: 'ignore',
      locales: [],
    },
    label.src,
  )
}

/**
 * ラベルの表示文言を取得（ロケールに応じて）
 * Get label display strings (based on locale)
 *
 * 優先順位：
 * Priority:
 * 1. グローバルラベルの場合 → useGlobalLabelStringsの文言を使用
 * 2. カスタムラベルの場合 → ロケールマッチングで最適な文言を取得
 * 3. フォールバック → ラベル識別子そのものを使用
 *
 * @param locale - ユーザーのロケール（例: "ja-JP", "en-US"）
 * @param locale - User's locale (e.g., "ja-JP", "en-US")
 * @param globalLabelStrings - グローバルラベル文言マップ
 * @param globalLabelStrings - Global label strings map
 * @param def - ラベル定義
 * @param def - Label definition
 * @returns 表示文言（名前と説明）
 * @returns Display strings (name and description)
 *
 * @example
 * const strings = getLabelStrings('ja', globalStrings, pornLabelDef)
 * console.log(strings.name) // "アダルトコンテンツ" (日本語の場合)
 */
export function getLabelStrings(
  locale: string,
  globalLabelStrings: GlobalLabelStrings,
  def: InterpretedLabelValueDefinition,
): ComAtprotoLabelDefs.LabelValueDefinitionStrings {
  // グローバルラベルの場合
  // If global label
  if (!def.definedBy) {
    // グローバル文言マップから検索
    // Search from global strings map
    if (def.identifier in globalLabelStrings) {
      return globalLabelStrings[
        def.identifier
      ] as ComAtprotoLabelDefs.LabelValueDefinitionStrings
    }
  } else {
    // カスタムラベルの場合、ロケールマッチングを試みる
    // For custom labels, attempt locale matching
    // bcp47Match.basicFilterは、"ja-JP"と"ja"などをマッチングできる
    // bcp47Match.basicFilter can match "ja-JP" with "ja", etc.
    const localeMatch = def.locales.find(
      strings => bcp47Match.basicFilter(locale, strings.lang).length > 0,
    )
    if (localeMatch) {
      return localeMatch
    }

    // ロケールマッチが見つからない場合は、最初の定義を使用（フォールバック）
    // If no locale match found, use first definition (fallback)
    if (def.locales[0]) {
      return def.locales[0]
    }
  }

  // すべて失敗した場合は、ラベル識別子をそのまま表示
  // If all fail, display label identifier as-is
  return {
    lang: locale,
    name: def.identifier,
    description: `Labeled "${def.identifier}"`,
  }
}
