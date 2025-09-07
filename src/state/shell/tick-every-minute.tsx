// Reactライブラリをインポート / Import React library
import React from 'react'

// 分単位での時刻更新値の型（ミリ秒のタイムスタンプ） / Type for minute-level time update value (millisecond timestamp)
type StateContext = number

// 分単位時刻更新のReactコンテキスト（初期値は0） / React context for minute-level time updates (initial value is 0)
const stateContext = React.createContext<StateContext>(0)
stateContext.displayName = 'TickEveryMinuteContext'

/**
 * 1分ごとに時刻を更新するプロバイダーコンポーネント
 * UIの時刻表示を定期的に更新するために使用（例：「3分前」→「4分前」）
 * 
 * Provider component that updates time every minute
 * Used to periodically update time displays in UI (e.g., "3 minutes ago" → "4 minutes ago")
 * 
 * @param children - 子コンポーネント / Child components
 */
export function Provider({children}: React.PropsWithChildren<{}>) {
  const [tick, setTick] = React.useState(Date.now()) // 現在時刻を状態として管理 / Manage current time as state
  
  React.useEffect(() => {
    // 60秒（60,000ミリ秒）ごとに時刻を更新するインターバルを設定 / Set interval to update time every 60 seconds (60,000 milliseconds)
    const i = setInterval(() => {
      setTick(Date.now()) // 現在時刻で状態を更新 / Update state with current time
    }, 60_000)
    
    // クリーンアップ関数でインターバルをクリア / Clear interval in cleanup function
    return () => clearInterval(i)
  }, [])
  
  return <stateContext.Provider value={tick}>{children}</stateContext.Provider>
}

/**
 * 分単位で更新される時刻（タイムスタンプ）を取得するカスタムフック
 * コンポーネントの再レンダリングを1分ごとにトリガーして時刻表示を更新する
 * 
 * Custom hook to get time (timestamp) updated every minute
 * Triggers component re-renders every minute to update time displays
 * 
 * @returns 現在のタイムスタンプ（ミリ秒） / Current timestamp (milliseconds)
 */
export function useTickEveryMinute() {
  return React.useContext(stateContext)
}
