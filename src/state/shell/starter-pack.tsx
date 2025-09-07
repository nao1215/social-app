// Reactライブラリをインポート / Import React library
import React from 'react'

/**
 * アクティブなスターターパック情報の状態型
 * URIとクリップ表示フラグを含む
 * 
 * State type for active starter pack information
 * Includes URI and clip display flag
 */
type StateContext =
  | {
      uri: string // スターターパックのURI / Starter pack URI
      isClip?: boolean // クリップ表示かどうか（オプション） / Whether it's a clip display (optional)
    }
  | undefined // 未設定の場合 / When not set

/**
 * スターターパック設定関数の型
 * Type for starter pack setting function
 */
type SetContext = (v: StateContext) => void

// アクティブなスターターパック状態管理のReactコンテキスト / React context for active starter pack state management
const stateContext = React.createContext<StateContext>(undefined)
stateContext.displayName = 'ActiveStarterPackStateContext'
// スターターパック設定のReactコンテキスト / React context for starter pack setting
const setContext = React.createContext<SetContext>((_: StateContext) => {})
setContext.displayName = 'ActiveStarterPackSetContext'

/**
 * アクティブなスターターパック（新規ユーザー向けのおすすめコンテンツ）状態管理プロバイダー
 * オンボーディングやユーザー招待で使用されるスターターパック情報を管理する
 * 
 * Active starter pack (recommended content for new users) state management provider
 * Manages starter pack information used in onboarding and user invitations
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: {children: React.ReactNode}) {
  const [state, setState] = React.useState<StateContext>() // スターターパック状態管理 / Manage starter pack state

  return (
    <stateContext.Provider value={state}>
      <setContext.Provider value={setState}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * 現在アクティブなスターターパック情報を取得するカスタムフック
 * Custom hook to get currently active starter pack information
 * 
 * @returns アクティブなスターターパック情報またはundefined / Active starter pack information or undefined
 */
export const useActiveStarterPack = () => React.useContext(stateContext)

/**
 * アクティブなスターターパックを設定する機能を取得するカスタムフック
 * Custom hook to get functionality for setting active starter pack
 * 
 * @returns スターターパック設定関数 / Starter pack setting function
 */
export const useSetActiveStarterPack = () => React.useContext(setContext)
