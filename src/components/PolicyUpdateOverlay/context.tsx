/**
 * @file ポリシー更新オーバーレイのReact Contextプロバイダー
 * @description ポリシー更新状態をアプリケーション全体で共有するためのContext
 *
 * このモジュールは、ポリシー更新の状態管理とコンポーネントツリー全体での
 * 状態共有を実現します。Reactのコンテキストパターンを使用して、
 * props のバケツリレーを回避します。
 *
 * @note
 * Goのcontext.Contextに似ていますが、Reactのコンテキストは値の共有に特化しています。
 */

// React Hooks: コンテキストとフックの基礎機能
// - createContext: グローバル状態を作成（Goのcontext.Contextに相当）
// - ReactNode: 任意のReact要素を表す型（interface{}に近い）
// - useContext: コンテキストの値を取得するフック
// - useMemo: 計算結果をメモ化して不要な再計算を防ぐ（パフォーマンス最適化）
// - useState: コンポーネント内の状態管理（Goには直接の対応物なし）
import {
  createContext,
  type ReactNode,
  useContext,
  useMemo,
  useState,
} from 'react'

// セッション情報フック（ログイン状態の確認）
import {useSession} from '#/state/session'
// ポータルプロバイダー（DOM階層を超えたレンダリング）
import {Provider as PortalProvider} from '#/components/PolicyUpdateOverlay/Portal'
// ポリシー更新状態管理フックと型定義
import {
  type PolicyUpdateState,
  usePolicyUpdateState,
} from '#/components/PolicyUpdateOverlay/usePolicyUpdateState'
// 環境変数（開発/本番/テストの判定）
import {ENV} from '#/env'

/**
 * ポリシー更新コンテキストの型定義
 * Goの struct に相当する interface 定義
 */
interface PolicyUpdateContextValue {
  /** ポリシー更新の現在の状態 */
  state: PolicyUpdateState
  /** オーバーレイを表示する準備が整ったことを通知する関数 */
  setIsReadyToShowOverlay: () => void
}

/**
 * ポリシー更新コンテキストの作成
 *
 * @description
 * デフォルト値として、完了済み状態を設定しています。
 * これにより、プロバイダー外で使用された場合でもエラーを防ぎます。
 *
 * @note
 * データの準備はアプリシェルのマウント時に整いますが、
 * 実際にレンダリングされるまで（サインイン/サインアップ/オンボーディング後）
 * オーバーレイを表示しないようにしています。
 */
const Context = createContext<PolicyUpdateContextValue>({
  state: {
    completed: true, // デフォルトは完了済みとして扱う
    complete: () => {}, // 何もしない空関数
  },
  setIsReadyToShowOverlay: () => {}, // 何もしない空関数
})

// コンテキストの表示名を設定（React DevToolsでのデバッグ用）
Context.displayName = 'PolicyUpdateOverlayContext'

/**
 * ポリシー更新コンテキストを使用するカスタムフック
 *
 * @description
 * コンポーネント内でポリシー更新の状態とアクションにアクセスするために使用します。
 *
 * @returns {PolicyUpdateContextValue} ポリシー更新の状態と制御関数
 *
 * @throws {Error} プロバイダー外で使用された場合にエラーをスロー
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const {state, setIsReadyToShowOverlay} = usePolicyUpdateContext()
 *   // state.completed で完了状態を確認
 *   // state.complete() で完了処理を実行
 * }
 * ```
 */
export function usePolicyUpdateContext() {
  // useContext: コンテキストから値を取得するReactフック
  const context = useContext(Context)

  // プロバイダー外で使用された場合のエラーチェック
  if (!context) {
    throw new Error(
      'usePolicyUpdateContext must be used within a PolicyUpdateProvider',
    )
  }

  return context
}

/**
 * ポリシー更新コンテキストプロバイダーコンポーネント
 *
 * @description
 * ポリシー更新の状態を管理し、子コンポーネントツリー全体に提供します。
 * アプリケーションのルートレベルで使用する必要があります。
 *
 * @param {Object} props - コンポーネントのprops
 * @param {ReactNode} props.children - 子要素
 *
 * @returns {JSX.Element} プロバイダーコンポーネント
 *
 * @example
 * ```tsx
 * <Provider>
 *   <App />
 * </Provider>
 * ```
 */
export function Provider({children}: {children?: ReactNode}) {
  // セッション状態を取得（ログイン中かどうか）
  const {hasSession} = useSession()

  /**
   * useState: コンポーネントローカルの状態管理
   * Goには直接の対応物がありませんが、クロージャ内の変数に近い概念です。
   * 第1引数: 現在の値
   * 第2引数: 値を更新する関数
   */
  const [isReadyToShowOverlay, setIsReadyToShowOverlay] = useState(false)

  // ポリシー更新の状態を管理
  const state = usePolicyUpdateState({
    // 以下のすべての条件が満たされた場合のみ有効化:
    // 1. オーバーレイ表示の準備が整っている
    // 2. ユーザーがログイン中
    // 3. テスト環境（e2e）ではない
    enabled: isReadyToShowOverlay && hasSession && ENV !== 'e2e',
  })

  /**
   * useMemo: 計算結果をメモ化してパフォーマンスを最適化
   *
   * Goでは明示的なメモ化はあまり使いませんが、計算コストの高い処理の結果を
   * キャッシュする概念に似ています。依存配列の値が変更された場合のみ再計算されます。
   */
  const ctx = useMemo(
    () => ({
      state,
      /**
       * オーバーレイ表示準備完了を通知
       * 既に準備完了の場合は何もしない（冪等性を保証）
       */
      setIsReadyToShowOverlay() {
        if (isReadyToShowOverlay) return
        setIsReadyToShowOverlay(true)
      },
    }),
    // 依存配列: これらの値が変更された場合のみctxオブジェクトを再作成
    [state, isReadyToShowOverlay, setIsReadyToShowOverlay],
  )

  return (
    <PortalProvider>
      {/* Context.Provider: コンテキストの値を子コンポーネントツリーに提供 */}
      <Context.Provider value={ctx}>{children}</Context.Provider>
    </PortalProvider>
  )
}
