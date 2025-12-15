/**
 * カウントホイールアニメーション判定ユーティリティ
 * Count Wheel Animation Decision Utility
 *
 * 【概要】
 * いいねカウントの数値変化時に、ホイールアニメーション（数字がクルクル回転）を
 * 表示すべきかどうかを判定するユーティリティ。
 *
 * 【主な機能】
 * - カウント数値の閾値に基づくアニメーション判定
 * - 特定の数値範囲でのアニメーション制御
 * - 100の倍数での特別なアニメーション処理
 *
 * 【使用場面】
 * - いいねボタンのカウント表示
 * - リポストカウントの表示
 * - その他の数値カウンターアニメーション
 *
 * 【Goユーザー向け補足】
 * この関数はシンプルな条件判定ロジックで、Goでも同様に実装可能。
 * アニメーションの「演出タイミング」を決定する純粋関数。
 */

/**
 * カウントホイールアニメーションを実行すべきか判定
 * Decide whether to run count wheel animation
 *
 * 【アニメーション実行条件】
 * 1. いいね解除 & カウント1 → 1から0に戻るときは必ずロール
 * 2. カウント1～999 → 通常範囲では常にロール
 * 3. カウント1000以上の場合:
 *    - いいね追加 & 100の倍数 → キリ番でロール（例: 1000, 1100, 1200）
 *    - いいね解除 & 100の倍数-1 → キリ番手前でロール（例: 999, 1099, 1199）
 *
 * 【設計理由】
 * - 少数カウント（1-999）: ユーザーの貢献が見えやすいため常にアニメーション
 * - 大量カウント（1000+）: 処理負荷軽減のため100の倍数のみアニメーション
 * - 0への遷移: 視覚的に重要なため必ずアニメーション
 *
 * 【Goでの同等実装】
 * ```go
 * func DecideShouldRoll(isSet bool, count int) bool {
 *     var shouldRoll bool
 *     if !isSet && count == 1 {
 *         shouldRoll = true
 *     } else if count > 1 && count < 1000 {
 *         shouldRoll = true
 *     } else if count > 0 {
 *         mod := count % 100
 *         if isSet && mod == 0 {
 *             shouldRoll = true
 *         } else if !isSet && mod == 99 {
 *             shouldRoll = true
 *         }
 *     }
 *     return shouldRoll
 * }
 * ```
 *
 * 【使用例】
 * ```typescript
 * // いいねを追加（999 → 1000）
 * decideShouldRoll(true, 1000)  // → true（キリ番）
 *
 * // いいねを追加（500 → 501）
 * decideShouldRoll(true, 501)   // → true（通常範囲）
 *
 * // いいねを追加（1001 → 1002）
 * decideShouldRoll(true, 1002)  // → false（キリ番ではない）
 *
 * // いいね解除（1 → 0）
 * decideShouldRoll(false, 1)    // → true（0への遷移）
 * ```
 *
 * @param isSet いいねが追加されたか（true=追加、false=解除） / Whether like is added (true=added, false=removed)
 * @param count 現在のカウント数 / Current count number
 * @returns アニメーションを実行すべきか / Whether to run animation
 */
export function decideShouldRoll(isSet: boolean, count: number) {
  // アニメーション実行フラグ
  // Animation execution flag
  let shouldRoll = false

  // ケース1: いいね解除で1→0への遷移（必ずロール）
  // Case 1: Removing like from 1 to 0 (always roll)
  if (!isSet && count === 1) {
    shouldRoll = true
  }
  // ケース2: カウント1～999（通常範囲、常にロール）
  // Case 2: Count 1-999 (normal range, always roll)
  else if (count > 1 && count < 1000) {
    shouldRoll = true
  }
  // ケース3: カウント1000以上（条件付きロール）
  // Case 3: Count 1000+ (conditional roll)
  else if (count > 0) {
    // 100で割った余り（キリ番判定用）
    // Remainder when divided by 100 (for milestone check)
    const mod = count % 100

    // いいね追加 & 100の倍数（例: 1000, 1100, 1200）
    // Adding like & multiple of 100 (e.g., 1000, 1100, 1200)
    if (isSet && mod === 0) {
      shouldRoll = true
    }
    // いいね解除 & 100の倍数-1（例: 999, 1099, 1199）
    // Removing like & one less than multiple of 100 (e.g., 999, 1099, 1199)
    else if (!isSet && mod === 99) {
      shouldRoll = true
    }
  }

  // 判定結果を返す
  // Return decision result
  return shouldRoll
}
