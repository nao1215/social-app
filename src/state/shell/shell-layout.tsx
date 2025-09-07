// Reactライブラリをインポート / Import React library
import React from 'react'
// React Native Reanimatedの共有値機能をインポート / Import shared value functionality from React Native Reanimated
import {type SharedValue, useSharedValue} from 'react-native-reanimated'

/**
 * シェルレイアウト（アプリ全体のUI構造）の状態を管理するコンテキスト型
 * Type for managing shell layout (overall app UI structure) state context
 */
type StateContext = {
  headerHeight: SharedValue<number> // ヘッダー（上部バー）の高さを管理する共有値 / Shared value managing header (top bar) height
  footerHeight: SharedValue<number> // フッター（下部バー）の高さを管理する共有値 / Shared value managing footer (bottom bar) height
}

// シェルレイアウト状態管理のReactコンテキスト（デフォルト値付き） / React context for shell layout state management (with default values)
const stateContext = React.createContext<StateContext>({
  // ヘッダー高さのデフォルト共有値オブジェクト / Default shared value object for header height
  headerHeight: {
    value: 0, // 初期値は0 / Initial value is 0
    addListener() {}, // リスナー追加（デフォルトは何もしない） / Add listener (default no-op)
    removeListener() {}, // リスナー削除（デフォルトは何もしない） / Remove listener (default no-op)
    modify() {}, // 値変更（デフォルトは何もしない） / Modify value (default no-op)
    get() {
      return 0 // 値取得（デフォルトは0を返す） / Get value (default returns 0)
    },
    set() {}, // 値設定（デフォルトは何もしない） / Set value (default no-op)
  },
  // フッター高さのデフォルト共有値オブジェクト / Default shared value object for footer height
  footerHeight: {
    value: 0, // 初期値は0 / Initial value is 0
    addListener() {}, // リスナー追加（デフォルトは何もしない） / Add listener (default no-op)
    removeListener() {}, // リスナー削除（デフォルトは何もしない） / Remove listener (default no-op)
    modify() {}, // 値変更（デフォルトは何もしない） / Modify value (default no-op)
    get() {
      return 0 // 値取得（デフォルトは0を返す） / Get value (default returns 0)
    },
    set() {}, // 値設定（デフォルトは何もしない） / Set value (default no-op)
  },
})
stateContext.displayName = 'ShellLayoutContext'

/**
 * シェルレイアウト（アプリ全体のUI構造）の状態管理プロバイダーコンポーネント
 * ヘッダーとフッターの高さを共有値として管理し、アニメーション対応を可能にする
 * 
 * Shell layout (overall app UI structure) state management provider component
 * Manages header and footer heights as shared values, enabling animation support
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerHeight = useSharedValue(0) // ヘッダー高さの共有値（アニメーション対応） / Header height shared value (animation-enabled)
  const footerHeight = useSharedValue(0) // フッター高さの共有値（アニメーション対応） / Footer height shared value (animation-enabled)

  // コンテキスト値をメモ化して再レンダリングを最適化 / Memoize context value to optimize re-renders
  const value = React.useMemo(
    () => ({
      headerHeight,
      footerHeight,
    }),
    [headerHeight, footerHeight],
  )

  return <stateContext.Provider value={value}>{children}</stateContext.Provider>
}

/**
 * シェルレイアウトの状態（ヘッダーとフッターの高さ）を取得するカスタムフック
 * Custom hook to get shell layout state (header and footer heights)
 * 
 * @returns ヘッダーとフッターの高さの共有値オブジェクト / Shared value objects for header and footer heights
 */
export function useShellLayout() {
  return React.useContext(stateContext)
}
