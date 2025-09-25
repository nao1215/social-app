import {useCallback, useInsertionEffect, useRef} from 'react'

/**
 * 非リアクティブコールバックフック
 *
 * 【主な機能】
 * - 関数の参照を固定してリアクティブな更新を抑制
 * - useInsertionEffectによる最新関数の内部参照管理
 * - パフォーマンス最適化のための意図的な反応性の無効化
 *
 * 【使用場面】
 * - 頻繁に変更される関数の安定化（特に子コンポーネントのprops）
 * - イベントハンドラーの不要な再作成防止
 * - レンダリング最適化が必要な高頻度更新コンポーネント
 *
 * 【注意事項】
 * - リアクティブ性を意図的に破壊するため慎重な使用が必要
 * - 依存値の変更時に自動再レンダリングが発生しない
 * - レンダリング中の呼び出しでは古い値を参照する可能性
 *
 * 【技術的詳細】
 * - useInsertionEffectで最新関数の参照を即座に更新
 * - useCallbackで関数の参照自体は固定化
 * - 内部でrefを介して最新の関数実装にアクセス
 *
 * @template T 関数の型
 * @param fn ラップする関数
 * @returns 参照が固定された関数
 */
export function useNonReactiveCallback<T extends Function>(fn: T): T {
  const ref = useRef(fn)
  useInsertionEffect(() => {
    ref.current = fn
  }, [fn])
  return useCallback(
    (...args: any) => {
      const latestFn = ref.current
      return latestFn(...args)
    },
    [ref],
  ) as unknown as T
}
