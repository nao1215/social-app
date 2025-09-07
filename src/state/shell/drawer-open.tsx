// React関数（createContext、useContext、useState）をインポート / Import React functions (createContext, useContext, useState)
import {createContext, useContext, useState} from 'react'

// ドロワー開閉状態のコンテキスト型（真偽値） / Type for drawer open/close state context (boolean)
type StateContext = boolean
// ドロワー状態設定関数のコンテキスト型 / Type for drawer state setting function context
type SetContext = (v: boolean) => void

// ドロワーの開閉状態を管理するReactコンテキスト（デフォルトは閉じている） / React context for managing drawer open/close state (default is closed)
const stateContext = createContext<StateContext>(false)
stateContext.displayName = 'DrawerOpenStateContext'
// ドロワーの状態設定を管理するReactコンテキスト（デフォルトは何もしない関数） / React context for managing drawer state setting (default is no-op function)
const setContext = createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'DrawerOpenSetContext'

/**
 * ドロワー（サイドメニュー）の開閉状態を管理するプロバイダーコンポーネント
 * アプリ全体でドロワーの表示状態を共有する
 * 
 * Provider component for managing drawer (side menu) open/close state
 * Shares drawer display state across the entire app
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const [state, setState] = useState(false) // ドロワーの開閉状態を管理（初期値は閉じている） / Manage drawer open/close state (initial value is closed)

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * ドロワーが開いているかどうかを取得するカスタムフック
 * Custom hook to get whether the drawer is open
 * 
 * @returns ドロワーが開いている場合はtrue / Returns true if drawer is open
 */
export function useIsDrawerOpen() {
  return useContext(stateContext)
}

/**
 * ドロワーの開閉状態を設定する機能を取得するカスタムフック
 * Custom hook to get functionality for setting drawer open/close state
 * 
 * @returns ドロワー状態設定関数 / Drawer state setting function
 */
export function useSetDrawerOpen() {
  return useContext(setContext)
}
