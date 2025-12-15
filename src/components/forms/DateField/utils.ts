/**
 * 日付フィールドユーティリティ関数
 *
 * 【概要】
 * 日付入力コンポーネントで使用する日付変換ユーティリティを提供します。
 * DateオブジェクトやISO文字列をYYYY-MM-DD形式の文字列に変換します。
 *
 * 【使用目的】
 * HTML5の<input type="date">やネイティブの日付ピッカーは、
 * YYYY-MM-DD形式の文字列を要求するため、このフォーマットへの
 * 変換が必要です。
 *
 * @module DateField/utils - 日付フィールドユーティリティモジュール
 */

/**
 * toSimpleDateString - 日付を YYYY-MM-DD 形式の文字列に変換
 *
 * DateオブジェクトまたはISO形式の文字列を、日付入力フィールドで
 * 使用可能なYYYY-MM-DD形式の文字列に変換します。
 *
 * 【Go開発者向けメモ】
 * - typeof: JavaScriptの型チェック演算子（実行時の型判定）
 * - 三項演算子: condition ? trueValue : falseValue（Goのif文の短縮形）
 * - Date | string: Union型（どちらの型も受け入れる）
 *
 * 【変換例】
 * - new Date('2024-01-15T12:30:00Z') → '2024-01-15'
 * - '2024-01-15T12:30:00Z' → '2024-01-15'
 * - new Date('2024-12-31') → '2024-12-31'
 *
 * @param date - 変換元の日付（DateオブジェクトまたはISO文字列）
 * @returns YYYY-MM-DD形式の日付文字列
 *
 * @example
 * toSimpleDateString(new Date()) // '2024-01-15'
 * toSimpleDateString('2024-01-15T12:00:00Z') // '2024-01-15'
 */
export function toSimpleDateString(date: Date | string): string {
  // 文字列の場合はDateオブジェクトに変換、既にDateの場合はそのまま使用
  // Go開発者メモ: typeof演算子でランタイム型チェック（Goの型スイッチに相当）
  const _date = typeof date === 'string' ? new Date(date) : date

  // ISO文字列に変換し、'T'で分割して日付部分のみを取得
  // 例: '2024-01-15T12:30:00.000Z' → ['2024-01-15', '12:30:00.000Z'] → '2024-01-15'
  return _date.toISOString().split('T')[0]
}
