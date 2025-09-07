// Reactライブラリをインポート / Import React library
import React from 'react'
// React Native Reanimatedの共有値、アニメーション機能をインポート / Import shared value and animation functionality from React Native Reanimated
import {
  type SharedValue,
  useSharedValue,
  withSpring,
} from 'react-native-reanimated'

/**
 * ミニマルモード状態のコンテキスト型
 * Type for minimal mode state context
 */
type StateContext = {
  headerMode: SharedValue<number> // ヘッダーのミニマル表示状態（0=通常、1=ミニマル） / Header minimal display state (0=normal, 1=minimal)
  footerMode: SharedValue<number> // フッターのミニマル表示状態（0=通常、1=ミニマル） / Footer minimal display state (0=normal, 1=minimal)
}

/**
 * ミニマルモード設定関数のコンテキスト型
 * Type for minimal mode setting function context
 */
type SetContext = (v: boolean) => void

// ミニマルモード状態管理のReactコンテキスト（デフォルト値付き） / React context for minimal mode state management (with default values)
const stateContext = React.createContext<StateContext>({
  // ヘッダーモードのデフォルト共有値オブジェクト / Default shared value object for header mode
  headerMode: {
    value: 0, // 初期値は通常表示（0） / Initial value is normal display (0)
    addListener() {}, // リスナー追加（デフォルトは何もしない） / Add listener (default no-op)
    removeListener() {}, // リスナー削除（デフォルトは何もしない） / Remove listener (default no-op)
    modify() {}, // 値変更（デフォルトは何もしない） / Modify value (default no-op)
    get() {
      return 0 // 値取得（デフォルトは0を返す） / Get value (default returns 0)
    },
    set() {}, // 値設定（デフォルトは何もしない） / Set value (default no-op)
  },
  // フッターモードのデフォルト共有値オブジェクト / Default shared value object for footer mode
  footerMode: {
    value: 0, // 初期値は通常表示（0） / Initial value is normal display (0)
    addListener() {}, // リスナー追加（デフォルトは何もしない） / Add listener (default no-op)
    removeListener() {}, // リスナー削除（デフォルトは何もしない） / Remove listener (default no-op)
    modify() {}, // 値変更（デフォルトは何もしない） / Modify value (default no-op)
    get() {
      return 0 // 値取得（デフォルトは0を返す） / Get value (default returns 0)
    },
    set() {}, // 値設定（デフォルトは何もしない） / Set value (default no-op)
  },
})
stateContext.displayName = 'MinimalModeStateContext'
// ミニマルモード設定のReactコンテキスト（デフォルトは何もしない関数） / React context for minimal mode setting (default is no-op function)
const setContext = React.createContext<SetContext>((_: boolean) => {})
setContext.displayName = 'MinimalModeSetContext'

/**
 * ミニマルシェルモード（簡略表示）の状態管理プロバイダーコンポーネント
 * ヘッダーとフッターの表示状態をスプリングアニメーション付きで制御する
 * 
 * Minimal shell mode (simplified display) state management provider component
 * Controls header and footer display states with spring animations
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const headerMode = useSharedValue(0) // ヘッダーモードの共有値（0=通常、1=ミニマル） / Header mode shared value (0=normal, 1=minimal)
  const footerMode = useSharedValue(0) // フッターモードの共有値（0=通常、1=ミニマル） / Footer mode shared value (0=normal, 1=minimal)
  
  // ミニマルモードの設定関数（スプリングアニメーション付き） / Minimal mode setting function (with spring animation)
  const setMode = React.useCallback(
    (v: boolean) => {
      'worklet' // React Native Reanimated worklet指定 / React Native Reanimated worklet specification
      // ヘッダーモードをスプリングアニメーションで変更（オーバーシュート抑制付き） / Change header mode with spring animation (with overshoot clamping)
      headerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true, // アニメーションのオーバーシュートを抑制 / Suppress animation overshoot
        }),
      )
      // フッターモードをスプリングアニメーションで変更（オーバーシュート抑制付き） / Change footer mode with spring animation (with overshoot clamping)
      footerMode.set(() =>
        withSpring(v ? 1 : 0, {
          overshootClamping: true, // アニメーションのオーバーシュートを抑制 / Suppress animation overshoot
        }),
      )
    },
    [headerMode, footerMode],
  )
  
  // 状態コンテキストの値をメモ化して再レンダリングを最適化 / Memoize state context value to optimize re-renders
  const value = React.useMemo(
    () => ({
      headerMode,
      footerMode,
    }),
    [headerMode, footerMode],
  )
  
  return (
    <stateContext.Provider value={value}>
      <setContext.Provider value={setMode}>{children}</setContext.Provider>
    </stateContext.Provider>
  )
}

/**
 * ミニマルシェルモードの状態を取得するカスタムフック
 * Custom hook to get minimal shell mode state
 * 
 * @returns ヘッダーとフッターのミニマル表示状態の共有値 / Shared values for header and footer minimal display states
 */
export function useMinimalShellMode() {
  return React.useContext(stateContext)
}

/**
 * ミニマルシェルモードを設定する機能を取得するカスタムフック
 * Custom hook to get functionality for setting minimal shell mode
 * 
 * @returns ミニマルモード設定関数（アニメーション付き） / Minimal mode setting function (with animation)
 */
export function useSetMinimalShellMode() {
  return React.useContext(setContext)
}
