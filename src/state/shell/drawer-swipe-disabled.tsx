// Reactライブラリをインポート / Import React library
import React from 'react'

// ドロワーのスワイプ無効化状態のコンテキスト型（真偽値） / Type for drawer swipe disabled state context (boolean)
type StateContext = boolean
// ドロワースワイプ無効化設定関数のコンテキスト型 / Type for drawer swipe disabled setting function context
type SetContext = (v: boolean) => void

// ドロワーのスワイプ操作無効化状態を管理するReactコンテキスト（デフォルトは有効） / React context for managing drawer swipe operation disabled state (default is enabled)
const stateContext = React.createContext<StateContext>(false)
stateContext.displayName = 'DrawerSwipeDisabledStateContext'
// ドロワーのスワイプ無効化設定を管理するReactコンテキスト（デフォルトは何もしない関数） / React context for managing drawer swipe disabled setting (default is no-op function)
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DrawerSwipeDisabledSetContext'

/**
 * ドロワー（サイドメニュー）のスワイプ操作の有効/無効状態を管理するプロバイダーコンポーネント
 * 特定の画面やコンテンツでドロワーのスワイプジェスチャーを一時的に無効化する際に使用
 * 
 * Provider component for managing enabled/disabled state of drawer (side menu) swipe operations
 * Used to temporarily disable drawer swipe gestures on specific screens or content
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = React.useState(false) // スワイプ無効化状態を管理（初期値は有効） / Manage swipe disabled state (initial value is enabled)
  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * ドロワーのスワイプ操作が無効化されているかを取得するカスタムフック
 * Custom hook to get whether drawer swipe operations are disabled
 * 
 * @returns スワイプ操作が無効化されている場合はtrue / Returns true if swipe operations are disabled
 */
export function useIsDrawerSwipeDisabled() {
  return React.useContext(stateContext)
}

/**
 * ドロワーのスワイプ操作の有効/無効状態を設定する機能を取得するカスタムフック
 * Custom hook to get functionality for setting drawer swipe operation enabled/disabled state
 * 
 * @returns スワイプ無効化状態設定関数 / Swipe disabled state setting function
 */
export function useSetDrawerSwipeDisabled() {
  return React.useContext(setContext)
}
