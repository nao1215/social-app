/**
 * 数値ユーティリティモジュール
 *
 * 【概要】
 * 数値の範囲制限などの基本的な数学関数を提供。
 *
 * 【Goユーザー向け補足】
 * - Math.min/max: Goのmath.Min/Maxに相当
 * - 複数引数の関数呼び出しをネストして範囲制限を実現
 */

/**
 * 値を指定された範囲内に制限する
 *
 * 【動作】
 * - v < min の場合: min を返す
 * - v > max の場合: max を返す
 * - それ以外: v をそのまま返す
 *
 * 【使用例】
 * clamp(150, 0, 100) // → 100
 * clamp(-10, 0, 100) // → 0
 * clamp(50, 0, 100)  // → 50
 *
 * @param v 制限する値
 * @param min 最小値
 * @param max 最大値
 * @returns 範囲内に制限された値
 */
export function clamp(v: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, v))
}
