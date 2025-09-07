// Reactライブラリをインポート / Import React library
import React from 'react'

// 永続化ストレージ機能をインポート / Import persistent storage functionality
import * as persisted from '#/state/persisted'

/**
 * カラーモード状態のコンテキスト型
 * Type for color mode state context
 */
type StateContext = {
  colorMode: persisted.Schema['colorMode'] // カラーモード設定（system/light/dark） / Color mode setting (system/light/dark)
  darkTheme: persisted.Schema['darkTheme'] // ダークテーマの種類 / Dark theme variant
}

/**
 * カラーモード設定変更のコンテキスト型
 * Type for color mode setting change context
 */
type SetContext = {
  setColorMode: (v: persisted.Schema['colorMode']) => void // カラーモード設定関数 / Color mode setting function
  setDarkTheme: (v: persisted.Schema['darkTheme']) => void // ダークテーマ設定関数 / Dark theme setting function
}

// カラーモード状態管理のReactコンテキスト（デフォルト値付き） / React context for color mode state management (with default values)
const stateContext = React.createContext<StateContext>({
  colorMode: 'system', // デフォルトはシステム設定に従う / Default follows system settings
  darkTheme: 'dark', // デフォルトはダークテーマ / Default is dark theme
})
stateContext.displayName = 'ColorModeStateContext'
// カラーモード設定変更のReactコンテキスト / React context for color mode setting changes
const setContext = React.createContext<SetContext>({} as SetContext)
setContext.displayName = 'ColorModeSetContext'

/**
 * カラーモード（ダーク・ライトモード）の状態管理プロバイダーコンポーネント
 * テーマ設定の永続化と同期を行う
 * 
 * Color mode (dark/light mode) state management provider component
 * Handles theme settings persistence and synchronization
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  // 永続化ストレージからカラーモード設定を取得して状態として管理 / Get color mode setting from persistent storage and manage as state
  const [colorMode, setColorMode] = React.useState(persisted.get('colorMode'))
  // 永続化ストレージからダークテーマ設定を取得して状態として管理 / Get dark theme setting from persistent storage and manage as state
  const [darkTheme, setDarkTheme] = React.useState(persisted.get('darkTheme'))

  // 状態コンテキストの値をメモ化（再レンダリング最適化） / Memoize state context value (optimize re-renders)
  const stateContextValue = React.useMemo(
    () => ({
      colorMode,
      darkTheme,
    }),
    [colorMode, darkTheme],
  )

  // 設定変更コンテキストの値をメモ化（再レンダリング最適化） / Memoize setting change context value (optimize re-renders)
  const setContextValue = React.useMemo(
    () => ({
      // カラーモード設定変更関数（状態更新と永続化を同時実行） / Color mode setting change function (simultaneously update state and persist)
      setColorMode: (_colorMode: persisted.Schema['colorMode']) => {
        setColorMode(_colorMode) // ローカル状態を更新 / Update local state
        persisted.write('colorMode', _colorMode) // 永続化ストレージに保存 / Save to persistent storage
      },
      // ダークテーマ設定変更関数（状態更新と永続化を同時実行） / Dark theme setting change function (simultaneously update state and persist)
      setDarkTheme: (_darkTheme: persisted.Schema['darkTheme']) => {
        setDarkTheme(_darkTheme) // ローカル状態を更新 / Update local state
        persisted.write('darkTheme', _darkTheme) // 永続化ストレージに保存 / Save to persistent storage
      },
    }),
    [],
  )

  // 永続化ストレージの変更を監視してローカル状態を同期 / Monitor persistent storage changes and synchronize local state
  React.useEffect(() => {
    // ダークテーマ設定の変更を監視 / Monitor dark theme setting changes
    const unsub1 = persisted.onUpdate('darkTheme', nextDarkTheme => {
      setDarkTheme(nextDarkTheme)
    })
    // カラーモード設定の変更を監視 / Monitor color mode setting changes
    const unsub2 = persisted.onUpdate('colorMode', nextColorMode => {
      setColorMode(nextColorMode)
    })
    // クリーンアップ関数で監視を解除 / Remove monitoring in cleanup function
    return () => {
      unsub1()
      unsub2()
    }
  }, [])

  return (
    <stateContext.Provider value={stateContextValue}>
      <setContext.Provider value={setContextValue}>
        {children}
      </setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * テーマ設定（カラーモードとダークテーマ）を取得するカスタムフック
 * Custom hook to get theme preferences (color mode and dark theme)
 * 
 * @returns 現在のテーマ設定（colorMode, darkTheme） / Current theme preferences (colorMode, darkTheme)
 */
export function useThemePrefs() {
  return React.useContext(stateContext)
}

/**
 * テーマ設定を変更する機能を取得するカスタムフック
 * Custom hook to get theme preference setting functionality
 * 
 * @returns テーマ設定変更機能（setColorMode, setDarkTheme） / Theme preference setting functionality (setColorMode, setDarkTheme)
 */
export function useSetThemePrefs() {
  return React.useContext(setContext)
}
