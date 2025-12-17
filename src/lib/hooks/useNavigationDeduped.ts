/**
 * 重複排除ナビゲーションフックモジュール
 *
 * 【概要】
 * ナビゲーション操作の連続呼び出しを防止するラッパーフック。
 * ユーザーの高速タップによる画面の重複遷移を防ぐ。
 *
 * 【解決する問題】
 * - ボタン連打による同じ画面の複数プッシュ
 * - ネットワーク遅延中の重複ナビゲーション
 * - アニメーション中の追加ナビゲーション
 *
 * 【ラップされるメソッド】
 * - push/navigate/replace: 画面遷移
 * - dispatch: カスタムアクション
 * - popToTop/popTo/pop/goBack: 戻る操作
 * - canGoBack/getState/getParent: 状態取得（重複排除なし）
 *
 * 【Goユーザー向け補足】
 * - useMemo: 計算結果のキャッシュ（Goのsync.Poolに類似）
 * - Parameters<typeof T>: 関数Tの引数型を取得（Goのreflectに相当）
 * - Pick<T, K>: 型Tから特定のキーKのみを抽出
 */
import {useMemo} from 'react'
import {useNavigation} from '@react-navigation/core'

import {useDedupe} from '#/lib/hooks/useDedupe'
import {type NavigationProp} from '#/lib/routes/types'

/**
 * 重複排除機能付きナビゲーションの型定義
 * NavigationPropから必要なメソッドのみを抽出
 */
export type DebouncedNavigationProp = Pick<
  NavigationProp,
  | 'popToTop'
  | 'popTo'
  | 'pop'
  | 'push'
  | 'navigate'
  | 'canGoBack'
  | 'replace'
  | 'dispatch'
  | 'goBack'
  | 'getState'
  | 'getParent'
>

/**
 * 重複排除機能付きナビゲーションフック
 *
 * 【主な機能】
 * - ナビゲーション操作の重複実行を防止
 * - React Navigationの全メソッドをラップしてdedupe機能を提供
 * - 高速タップや連続操作による意図しない画面遷移を防ぐ
 *
 * 【使用場面】
 * - ユーザーが連続してボタンをタップした時の重複ナビゲーション防止
 * - ネットワーク遅延時の重複画面遷移防止
 * - UIの応答性向上とユーザビリティ改善
 *
 * 【技術的詳細】
 * - useDedupe()で短時間の重複呼び出しをフィルタリング
 * - React NavigationのNavigationPropと完全に互換性を保持
 * - メモ化により不要な再レンダリングを防止
 *
 * @returns ナビゲーション操作の重複排除版メソッド群
 */
export function useNavigationDeduped() {
  const navigation = useNavigation<NavigationProp>()
  const dedupe = useDedupe()

  return useMemo<DebouncedNavigationProp>(
    () => ({
      // 新しい画面をスタックにプッシュ（重複防止付き）
      push: (...args: Parameters<typeof navigation.push>) => {
        dedupe(() => navigation.push(...args))
      },
      navigate: (...args: Parameters<typeof navigation.navigate>) => {
        dedupe(() => navigation.navigate(...args))
      },
      replace: (...args: Parameters<typeof navigation.replace>) => {
        dedupe(() => navigation.replace(...args))
      },
      dispatch: (...args: Parameters<typeof navigation.dispatch>) => {
        dedupe(() => navigation.dispatch(...args))
      },
      popToTop: () => {
        dedupe(() => navigation.popToTop())
      },
      popTo: (...args: Parameters<typeof navigation.popTo>) => {
        dedupe(() => navigation.popTo(...args))
      },
      pop: (...args: Parameters<typeof navigation.pop>) => {
        dedupe(() => navigation.pop(...args))
      },
      goBack: () => {
        dedupe(() => navigation.goBack())
      },
      canGoBack: () => {
        return navigation.canGoBack()
      },
      getState: () => {
        return navigation.getState()
      },
      getParent: (...args: Parameters<typeof navigation.getParent>) => {
        return navigation.getParent(...args)
      },
    }),
    [dedupe, navigation],
  )
}
