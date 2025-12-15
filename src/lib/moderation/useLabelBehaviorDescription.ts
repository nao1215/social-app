/**
 * モデレーション - ラベル動作説明文生成モジュール
 * Moderation - Label Behavior Description Generation Module
 *
 * このモジュールは、コンテンツモデレーションラベルの動作を説明する文言を生成します。
 * This module generates descriptions for content moderation label behaviors.
 *
 * ラベルとは、アダルトコンテンツ・暴力的画像・スパムなどのコンテンツ分類のことです。
 * Labels are content classifications such as adult content, violent images, spam, etc.
 *
 * 【Goユーザー向け補足】
 * - ラベル: コンテンツに付与される分類タグ（例: "porn", "gore", "spam"）
 * - Preference: ユーザーのラベルに対する表示設定（hide/warn/show）
 * - interface: Goのstructに相当する型定義
 *
 * For Go Users:
 * - Label: Classification tag attached to content (e.g., "porn", "gore", "spam")
 * - Preference: User's display setting for labels (hide/warn/show)
 * - interface: Type definition equivalent to Go struct
 */

// AT Protocolのラベル定義型とユーザー設定型をインポート（Goのstructに相当）
// Import AT Protocol label definition and preference types (equivalent to Go structs)
import {InterpretedLabelValueDefinition, LabelPreference} from '@atproto/api'
// 国際化（i18n）マクロとフックをインポート
// Import internationalization (i18n) macro and hook
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

/**
 * ラベルの動作を短い説明文で返す（設定画面用）
 * Return short description of label behavior (for settings screen)
 *
 * ラベルの種類とユーザー設定に基づいて、動作を示す短い文言を返します。
 * Returns a short description of the behavior based on label type and user preference.
 *
 * @param labelValueDef - ラベル定義（severity, blurs等の設定を含む）
 * @param labelValueDef - Label definition (includes severity, blurs, etc.)
 * @param pref - ユーザーのラベル表示設定（'ignore' | 'warn' | 'hide'）
 * @param pref - User's label display preference ('ignore' | 'warn' | 'hide')
 * @returns 動作説明文（"Off", "Hide", "Warn", "Show badge"等）
 * @returns Behavior description ("Off", "Hide", "Warn", "Show badge", etc.)
 *
 * @example
 * const desc = useLabelBehaviorDescription(pornLabelDef, 'hide')
 * // "Hide" - アダルトコンテンツを非表示にする
 */
export function useLabelBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  // 国際化関数を取得（翻訳処理用）
  // Get internationalization function (for translation)
  const {_} = useLingui()

  // 'ignore'設定の場合は機能オフ
  // If preference is 'ignore', feature is off
  if (pref === 'ignore') {
    return _(msg`Off`)
  }

  // コンテンツまたはメディアをぼかす設定の場合
  // If set to blur content or media
  if (labelValueDef.blurs === 'content' || labelValueDef.blurs === 'media') {
    if (pref === 'hide') {
      return _(msg`Hide`) // 完全に非表示 / Completely hidden
    }
    return _(msg`Warn`) // 警告表示（クリックで表示可能） / Show warning (viewable on click)
  } else if (labelValueDef.severity === 'alert') {
    // 重大度が「alert」の場合（重要な警告）
    // If severity is 'alert' (important warning)
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Warn`)
  } else if (labelValueDef.severity === 'inform') {
    // 重大度が「inform」の場合（情報提供レベル）
    // If severity is 'inform' (informational level)
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Show badge`) // バッジ表示（軽度の警告） / Show badge (mild warning)
  } else {
    // その他のケース
    // Other cases
    if (pref === 'hide') {
      return _(msg`Hide`)
    }
    return _(msg`Disabled`)
  }
}

/**
 * ラベルの動作を詳細な説明文で返す（詳細設定画面用）
 * Return detailed description of label behavior (for detailed settings screen)
 *
 * useLabelBehaviorDescriptionよりも詳細な説明を返します。
 * Returns more detailed description than useLabelBehaviorDescription.
 * フィードからのフィルタリング動作なども含めて説明します。
 * Includes filtering behavior from feeds in the description.
 *
 * @param labelValueDef - ラベル定義（severity, blurs等の設定を含む）
 * @param labelValueDef - Label definition (includes severity, blurs, etc.)
 * @param pref - ユーザーのラベル表示設定（'ignore' | 'warn' | 'hide'）
 * @param pref - User's label display preference ('ignore' | 'warn' | 'hide')
 * @returns 詳細な動作説明文
 * @returns Detailed behavior description
 *
 * @example
 * const desc = useLabelLongBehaviorDescription(pornLabelDef, 'hide')
 * // "Blur images and filter from feeds" - 画像をぼかし、フィードから除外
 */
export function useLabelLongBehaviorDescription(
  labelValueDef: InterpretedLabelValueDefinition,
  pref: LabelPreference,
) {
  // 国際化関数を取得
  // Get internationalization function
  const {_} = useLingui()

  // 'ignore'設定の場合は無効
  // If preference is 'ignore', disabled
  if (pref === 'ignore') {
    return _(msg`Disabled`)
  }

  // コンテンツをぼかす設定の場合
  // If set to blur content
  if (labelValueDef.blurs === 'content') {
    if (pref === 'hide') {
      // コンテンツに警告を表示し、フィードから除外
      // Warn content and remove from feeds
      return _(msg`Warn content and filter from feeds`)
    }
    // コンテンツに警告のみ表示
    // Only warn content
    return _(msg`Warn content`)
  } else if (labelValueDef.blurs === 'media') {
    // メディア（画像・動画）をぼかす設定の場合
    // If set to blur media (images/videos)
    if (pref === 'hide') {
      // 画像をぼかし、フィードから除外
      // Blur images and remove from feeds
      return _(msg`Blur images and filter from feeds`)
    }
    // 画像をぼかすのみ
    // Only blur images
    return _(msg`Blur images`)
  } else if (labelValueDef.severity === 'alert') {
    // 重大度が「alert」の場合
    // If severity is 'alert'
    if (pref === 'hide') {
      // 警告を表示し、フィードから除外
      // Show warning and remove from feeds
      return _(msg`Show warning and filter from feeds`)
    }
    // 警告のみ表示
    // Only show warning
    return _(msg`Show warning`)
  } else if (labelValueDef.severity === 'inform') {
    // 重大度が「inform」の場合
    // If severity is 'inform'
    if (pref === 'hide') {
      // バッジを表示し、フィードから除外
      // Show badge and remove from feeds
      return _(msg`Show badge and filter from feeds`)
    }
    // バッジのみ表示
    // Only show badge
    return _(msg`Show badge`)
  } else {
    // その他のケース
    // Other cases
    if (pref === 'hide') {
      // フィードから除外のみ（警告なし）
      // Only filter from feeds (no warning)
      return _(msg`Filter from feeds`)
    }
    return _(msg`Disabled`)
  }
}
