/**
 * 遅延ローディング状態管理カスタムフック
 *
 * このモジュールは、ローディングインジケーターの表示を遅延させるためのフックを提供します。
 *
 * 【概要】
 * - 初回読み込み時のチラつき防止
 * - 指定した遅延時間後にローディング状態を解除
 * - スムーズなユーザー体験の実現
 *
 * 【使用場面】
 * - 高速なAPI応答時のローディング画面のフラッシュ防止
 * - アプリ起動時のスプラッシュスクリーン制御
 * - データフェッチ完了前の一時的なローディング表示
 *
 * 【背景】
 * データの読み込みが非常に速い場合（<100ms）、ローディングインジケーターが
 * 一瞬だけ表示されて消える「チラつき」が発生し、UXを損なう可能性があります。
 * このフックは一定時間ローディング状態を維持することで、この問題を解決します。
 *
 * 【Go開発者向け補足】
 * - useEffect: 副作用（タイマー処理）を管理するフック
 * - useState: ローディング状態を保持するフック
 * - クリーンアップ関数: Goのdefer文に似た、リソース解放の仕組み
 */

// React - useState, useEffectフックを使用
import React from 'react'

/**
 * 遅延ローディング状態を管理するフック
 *
 * 【動作】
 * 1. 初期状態として指定された状態（通常はtrue=ローディング中）を設定
 * 2. 指定された遅延時間後に自動的にfalse（ローディング完了）に変更
 * 3. コンポーネントがアンマウントされた場合はタイマーをクリーンアップ
 *
 * 【Go開発者向け補足 - useEffect】
 * - 副作用（side effect）を実行するフック
 * - 依存配列[isLoading, delay]が変わった時に再実行される
 * - 返り値のクリーンアップ関数は、次の実行前やアンマウント時に実行される
 * - Goの defer 文に似ているが、タイミング制御がより柔軟
 *
 * 【Go開発者向け補足 - useState】
 * - ローディング状態を保持する
 * - setIsLoading(false)を呼ぶとコンポーネントが再レンダリングされる
 * - Goでは手動でUIを更新する必要があるが、Reactでは自動
 *
 * @param delay - ローディング状態を維持する時間（ミリ秒）
 * @param initialState - 初期ローディング状態（デフォルト: true）
 * @returns 現在のローディング状態（boolean）
 *
 * @example
 * ```typescript
 * function SplashScreen() {
 *   // 初回表示時、500ms間はローディング表示を維持
 *   const isLoading = useDelayedLoading(500, true)
 *
 *   if (isLoading) {
 *     return <LoadingSpinner />
 *   }
 *
 *   return <MainContent />
 * }
 * ```
 *
 * @example
 * ```typescript
 * function DataList() {
 *   const { data, isLoading: dataLoading } = useQuery(...)
 *
 *   // データ取得が100ms未満で完了した場合、ローディング表示をスキップ
 *   const showLoading = useDelayedLoading(100, dataLoading)
 *
 *   if (showLoading) {
 *     return <Skeleton />
 *   }
 *
 *   return <List data={data} />
 * }
 * ```
 */
export function useDelayedLoading(delay: number, initialState: boolean = true) {
  // ローディング状態を管理
  // GoユーザーへのNote: useStateは[現在値, 更新関数]のタプルを返す
  // initialState をデフォルト引数として true に設定（ローディング中から開始）
  const [isLoading, setIsLoading] = React.useState(initialState)

  /**
   * タイマー設定とクリーンアップの副作用
   *
   * 【処理フロー】
   * 1. isLoading が true の場合、タイマーを設定
   * 2. delay ミリ秒後に isLoading を false に変更
   * 3. コンポーネントアンマウント時またはisLoading/delayが変わった時にタイマーをクリア
   *
   * 【Go開発者向け補足】
   * - NodeJS.Timeout: タイマーIDの型（Goの *time.Timer に相当）
   * - setTimeout: 指定時間後に関数を実行（Goの time.AfterFunc に似ている）
   * - clearTimeout: タイマーをキャンセル（Goの timer.Stop() に相当）
   */
  React.useEffect(() => {
    let timeout: NodeJS.Timeout

    // ローディング中の場合のみタイマーを設定
    // 初回読み込み時にローディングスピナーを短時間表示し、チラつきを防止
    if (isLoading) {
      // delay ミリ秒後にローディング状態を解除
      timeout = setTimeout(() => setIsLoading(false), delay)
    }

    // クリーンアップ関数
    // GoユーザーへのNote: この関数は以下のタイミングで実行される
    // 1. コンポーネントがアンマウントされた時
    // 2. 依存配列[isLoading, delay]の値が変わって、次のuseEffectが実行される前
    // 3. これにより、メモリリークやタイマーの重複実行を防ぐ
    // Goの defer 文に似ているが、より細かい制御が可能
    return () => timeout && clearTimeout(timeout)
  }, [isLoading, delay]) // 依存配列: これらが変わった時にエフェクトを再実行

  // 現在のローディング状態を返す
  return isLoading
}
