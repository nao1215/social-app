// Reactライブラリ - コンテキスト、コンポーネント、フックのため
import React from 'react'

/**
 * 現在の会話IDコンテキスト - アプリ全体で現在アクティブな会話のIDを管理
 * Current conversation ID context - manages the ID of currently active conversation across the app
 * 
 * ユーザーが現在閲覧中の会話を追跡し、通知やUI更新の制御に使用
 * Tracks the conversation currently being viewed by the user, used for controlling notifications and UI updates
 */
const CurrentConvoIdContext = React.createContext<{
  currentConvoId: string | undefined // 現在の会話ID（ない場合はundefined） / Current conversation ID (undefined if none)
  setCurrentConvoId: (convoId: string | undefined) => void // 会話ID設定関数 / Function to set conversation ID
}>({
  // デフォルト値 / Default values
  currentConvoId: undefined,
  setCurrentConvoId: () => {}, // 空の実装 / Empty implementation
})
// デバッグ時の表示名設定
CurrentConvoIdContext.displayName = 'CurrentConvoIdContext'

/**
 * 現在の会話IDフック - 現在アクティブな会話のIDを取得・設定
 * Current conversation ID hook - get and set the currently active conversation ID
 * 
 * @returns 会話IDと設定関数を含むオブジェクト / Object containing conversation ID and setter function
 * @throws CurrentConvoIdProvider内で使用されない場合エラー / Error if used outside CurrentConvoIdProvider
 */
export function useCurrentConvoId() {
  const ctx = React.useContext(CurrentConvoIdContext)
  if (!ctx) {
    throw new Error(
      'useCurrentConvoId must be used within a CurrentConvoIdProvider',
    )
  }
  return ctx
}

/**
 * 現在の会話IDプロバイダーコンポーネント - 会話IDの状態を管理し子コンポーネントに提供
 * Current conversation ID provider component - manages conversation ID state and provides it to child components
 * 
 * アプリ全体で現在アクティブな会話を追跡し、コンポーネント間で情報を共有
 * Tracks the currently active conversation across the app and shares information between components
 * 
 * @param children - 子コンポーネント / Child components
 */
export function CurrentConvoIdProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // 現在の会話ID状態を管理
  const [currentConvoId, setCurrentConvoId] = React.useState<
    string | undefined
  >()
  
  // コンテキスト値をメモ化 - currentConvoIdが変更された時のみ再計算
  const ctx = React.useMemo(
    () => ({currentConvoId, setCurrentConvoId}),
    [currentConvoId],
  )
  
  // コンテキストを子コンポーネントに提供
  return (
    <CurrentConvoIdContext.Provider value={ctx}>
      {children}
    </CurrentConvoIdContext.Provider>
  )
}
