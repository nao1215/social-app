/**
 * 投稿コントロールユーティリティモジュール
 *
 * 投稿の統計情報（いいね数、リポスト数など）を適切にフォーマットするための
 * ユーティリティ関数を提供します。
 *
 * 主な機能:
 * - 大きな数値のコンパクト表記（10K, 1.5M など）
 * - 国際化対応の数値フォーマット
 * - 10,000以上の場合は小数点以下を表示しない最適化
 *
 * Go言語との対比:
 * - useCallback: Goのクロージャに似た関数メモ化フック
 * - 依存配列 [i18n]: 依存する値が変わった時のみ関数を再生成
 */

import {useCallback} from 'react'
import {useLingui} from '@lingui/react'

/**
 * 投稿統計カウントのフォーマットフック
 *
 * 投稿のいいね数、リポスト数、返信数などを適切にフォーマットします。
 * 大きな数値は短縮表記（K, M）で表示し、ロケールに応じた形式で表示します。
 *
 * フォーマット例:
 * - 42 → "42"
 * - 1,234 → "1.2K"
 * - 10,000 → "10K" （小数点なし）
 * - 1,500,000 → "1.5M"
 *
 * Reactフック解説:
 * - useCallback: 関数をメモ化し、不要な再生成を防ぐ
 *   依存配列 [i18n] が変わった時のみ新しい関数を生成
 *   Goでは関数は値なので常に新しいアドレスになるが、Reactでは
 *   同一性が重要（再レンダリング最適化のため）
 *
 * @returns {(postStatCount: number) => string} 数値をフォーマットする関数
 *
 * @example
 * const formatPostStatCount = useFormatPostStatCount()
 * formatPostStatCount(1234) // "1.2K"
 * formatPostStatCount(10000) // "10K"
 */
export function useFormatPostStatCount() {
  // Linguiの国際化オブジェクトを取得（数値フォーマットに使用）
  const {i18n} = useLingui()

  // useCallback: 関数をメモ化して不要な再生成を防ぐ
  // Goのクロージャに似ているが、依存配列で再生成タイミングを制御
  return useCallback(
    (postStatCount: number) => {
      // 10,000以上かどうかをチェック（小数点表示の判定）
      const isOver10k = postStatCount >= 10_000

      // i18n.number: ロケールに応じた数値フォーマット
      // notation: 'compact' - 短縮表記（K, M など）
      // maximumFractionDigits - 小数点以下の最大桁数
      // roundingMode: 'trunc' - 切り捨て（四捨五入しない）
      return i18n.number(postStatCount, {
        notation: 'compact',
        maximumFractionDigits: isOver10k ? 0 : 1,
        // @ts-expect-error - roundingMode は型定義に含まれていないが実際には動作する
        roundingMode: 'trunc',
      })
    },
    [i18n], // i18nが変わった時のみ関数を再生成（ロケール変更時など）
  )
}
