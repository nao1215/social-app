/**
 * 数値フォーマットユーティリティ
 * Numeric Format Utility
 *
 * 【概要】
 * 大きな数値を人間が読みやすい短縮形式にフォーマットするユーティリティ。
 * SNSでよく見られる「1.2K」「3.5M」などの表示に使用。
 *
 * 【使用場面】
 * - いいね数の表示（例: 1234 → "1.2K"）
 * - フォロワー数の表示（例: 1500000 → "1.5M"）
 * - リポスト数の表示
 *
 * 【Goユーザー向け補足】
 * - i18n.number: Goのfmt.Sprintfやmessage.NewPrinterに相当する国際化数値フォーマット
 * - notation: 'compact': 短縮表記（K, M, Bなど）
 * - roundingMode: 'trunc': 切り捨て（Goのmath.Truncに相当）
 */

// Linguiの国際化コア型
// Lingui i18n core type
import {type I18n} from '@lingui/core'

/**
 * 数値を短縮形式でフォーマット
 * Format Number in Compact Notation
 *
 * 【変換例】
 * - 1234 → "1.2K"
 * - 1500000 → "1.5M"
 * - 999 → "999"（1000未満はそのまま）
 *
 * 【Goでの同等実装】
 * ```go
 * func FormatCount(num float64) string {
 *     switch {
 *     case num >= 1_000_000_000:
 *         return fmt.Sprintf("%.1fB", math.Trunc(num/1_000_000_000*10)/10)
 *     case num >= 1_000_000:
 *         return fmt.Sprintf("%.1fM", math.Trunc(num/1_000_000*10)/10)
 *     case num >= 1_000:
 *         return fmt.Sprintf("%.1fK", math.Trunc(num/1_000*10)/10)
 *     default:
 *         return fmt.Sprintf("%d", int(num))
 *     }
 * }
 * ```
 *
 * @param i18n Linguiの国際化インスタンス / Lingui internationalization instance
 * @param num フォーマットする数値 / Number to format
 * @returns フォーマットされた文字列（例: "1.2K"） / Formatted string (e.g., "1.2K")
 */
export const formatCount = (i18n: I18n, num: number) => {
  return i18n.number(num, {
    // 短縮表記を使用（K, M, Bなど）
    // Use compact notation (K, M, B, etc.)
    notation: 'compact',
    // 小数点以下1桁まで表示
    // Display up to 1 decimal place
    maximumFractionDigits: 1,
    // @ts-expect-error - roundingMode not in the types
    // 切り捨てモード（1.99K → 1.9K）
    // Truncation mode (1.99K → 1.9K)
    roundingMode: 'trunc',
  })
}
