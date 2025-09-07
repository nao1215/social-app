// Reactライブラリをインポート / Import React library
import React from 'react'

// プラットフォーム判定機能（Web判定）をインポート / Import platform detection functionality (Web detection)
import {isWeb} from '#/platform/detection'
// セッション（ログイン状態）管理のフックをインポート / Import session (login state) management hook
import {useSession} from '#/state/session'
// アクティブなスターターパック情報取得のフックをインポート / Import active starter pack information retrieval hook
import {useActiveStarterPack} from '#/state/shell/starter-pack'

/**
 * ログアウト状態のUI表示に関する状態型
 * State type for logged out UI display
 */
type State = {
  showLoggedOut: boolean // ログアウト画面を表示するかどうか / Whether to show logged out screen
  /**
   * ログアウト画面表示時にログインフォームに事前入力するアカウントDID
   * Account did used to populate the login form when the logged out view is shown
   */
  requestedAccountSwitchTo?: string
}

/**
 * ログアウト状態の制御機能型
 * Controls type for logged out state
 */
type Controls = {
  /**
   * ログアウト画面の表示・非表示を設定
   * Show or hide the logged out view
   */
  setShowLoggedOut: (show: boolean) => void
  /**
   * ログアウト画面を表示し、指定されたアカウントでログインフォームに遷移
   * Shows the logged out view and drops the user into the login form using the requested account
   */
  requestSwitchToAccount: (props: {
    /**
     * ログインフォームに事前入力するアカウントのDID
     * The did of the account to populate the login form with
     */
    requestedAccount?: string | 'none' | 'new' | 'starterpack'
  }) => void
  /**
   * 要求されたアカウントをクリアし、次回ログアウト画面表示時に事前入力しないようにする
   * Clears the requested account so that next time the logged out view is show, no account is pre-populated
   */
  clearRequestedAccount: () => void
}

// ログアウト状態管理のReactコンテキスト（デフォルト値付き） / React context for logged out state management (with default values)
const StateContext = React.createContext<State>({
  showLoggedOut: false, // デフォルトではログアウト画面は非表示 / Default is logged out screen hidden
  requestedAccountSwitchTo: undefined, // デフォルトでは要求されたアカウントなし / Default is no requested account
})
StateContext.displayName = 'LoggedOutStateContext'

// ログアウト制御機能のReactコンテキスト（デフォルト関数付き） / React context for logged out controls (with default functions)
const ControlsContext = React.createContext<Controls>({
  setShowLoggedOut: () => {}, // デフォルトは何もしない関数 / Default is no-op function
  requestSwitchToAccount: () => {}, // デフォルトは何もしない関数 / Default is no-op function
  clearRequestedAccount: () => {}, // デフォルトは何もしない関数 / Default is no-op function
})
ControlsContext.displayName = 'LoggedOutControlsContext'

/**
 * ログアウト状態（非ログイン時のUI表示）管理プロバイダーコンポーネント
 * スターターパックの存在やアカウント切り替え要求に応じてログアウト画面を制御する
 * 
 * Logged out state (non-login UI display) management provider component
 * Controls logged out screen based on starter pack presence and account switch requests
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const activeStarterPack = useActiveStarterPack() // アクティブなスターターパック取得 / Get active starter pack
  const {hasSession} = useSession() // セッション（ログイン）状態取得 / Get session (login) state
  const shouldShowStarterPack = Boolean(activeStarterPack?.uri) && !hasSession // スターターパックがあり、未ログインの場合 / If starter pack exists and not logged in
  const [state, setState] = React.useState<State>({
    showLoggedOut: shouldShowStarterPack, // スターターパック条件に応じて初期表示決定 / Determine initial display based on starter pack conditions
    requestedAccountSwitchTo: shouldShowStarterPack
      ? isWeb
        ? 'starterpack' // Web環境ではスターターパック / Starter pack in web environment
        : 'new' // ネイティブ環境では新規アカウント / New account in native environment
      : undefined,
  })

  // 制御機能をメモ化して再レンダリングを最適化 / Memoize control functions to optimize re-renders
  const controls = React.useMemo<Controls>(
    () => ({
      // ログアウト画面の表示・非表示設定 / Set logged out screen display/hide
      setShowLoggedOut(show) {
        setState(s => ({
          ...s,
          showLoggedOut: show,
        }))
      },
      // アカウント切り替え要求（ログアウト画面表示+アカウント指定） / Request account switch (show logged out screen + specify account)
      requestSwitchToAccount({requestedAccount}) {
        setState(s => ({
          ...s,
          showLoggedOut: true, // ログアウト画面を表示 / Show logged out screen
          requestedAccountSwitchTo: requestedAccount, // 指定されたアカウントを設定 / Set specified account
        }))
      },
      // 要求されたアカウントをクリア / Clear requested account
      clearRequestedAccount() {
        setState(s => ({
          ...s,
          requestedAccountSwitchTo: undefined,
        }))
      },
    }),
    [setState],
  )

  return (
    <StateContext.Provider value={state}>
      <ControlsContext.Provider value={controls}>
        {children}
      </ControlsContext.Provider>
    </StateContext.Provider>
  )
}

/**
 * ログアウト画面の表示状態を取得するカスタムフック
 * Custom hook to get logged out screen display state
 * 
 * @returns ログアウト状態情報（表示フラグ、要求アカウント） / Logged out state information (display flag, requested account)
 */
export function useLoggedOutView() {
  return React.useContext(StateContext)
}

/**
 * ログアウト画面の制御機能を取得するカスタムフック
 * Custom hook to get logged out screen control functionality
 * 
 * @returns ログアウト画面制御機能（表示設定、アカウント切り替え要求など） / Logged out screen control functionality (display setting, account switch request, etc.)
 */
export function useLoggedOutViewControls() {
  return React.useContext(ControlsContext)
}
