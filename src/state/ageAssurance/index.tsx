// ReactのContext API、フック、状態管理関数をインポート
// Import React Context API, hooks, and state management functions
import {createContext, useContext, useMemo, useState} from 'react'
// AT ProtocolのBlueSky未承認定義をインポート
// Import BlueSky unspecced definitions from AT Protocol
import {type AppBskyUnspeccedDefs} from '@atproto/api'
// React Queryのクエリフックをインポート
// Import query hook from React Query
import {useQuery} from '@tanstack/react-query'

// ネットワークリトライユーティリティをインポート
// Import network retry utility
import {networkRetry} from '#/lib/async/retry'
// プッシュ通知トークンの取得と登録フックをインポート
// Import push notification token get and register hook
import {useGetAndRegisterPushToken} from '#/lib/notifications/notifications'
// ネットワークエラー判定ユーティリティをインポート
// Import network error detection utility
import {isNetworkError} from '#/lib/strings/errors'
// 年齢認証コンテキストの型定義をインポート
// Import age assurance context type definitions
import {
  type AgeAssuranceAPIContextType,
  type AgeAssuranceContextType,
} from '#/state/ageAssurance/types'
// 年齢認証有効判定フックをインポート
// Import age assurance enabled check hook
import {useIsAgeAssuranceEnabled} from '#/state/ageAssurance/useIsAgeAssuranceEnabled'
// 年齢認証専用ロガーをインポート
// Import age assurance specific logger
import {logger} from '#/state/ageAssurance/util'
// 地理的位置情報状態フックをインポート
// Import geolocation status hook
import {useGeolocationStatus} from '#/state/geolocation'
// セッション管理エージェントフックをインポート
// Import session management agent hook
import {useAgent} from '#/state/session'

/**
 * 年齢認証クエリキーを作成する関数
 * React Queryのキャッシュ管理で使用するユニークなキーを生成する
 * 
 * Function to create age assurance query key.
 * Generates a unique key used for cache management in React Query.
 * 
 * @param did ユーザーの分散識別子 / User's decentralized identifier
 * @returns React Queryキー / React Query key
 */
export const createAgeAssuranceQueryKey = (did: string) =>
  ['ageAssurance', did] as const

/**
 * 年齢認証のデフォルト状態
 * サーバーからデータを取得できない場合のフォールバック値
 * 
 * Default age assurance state.
 * Fallback values when data cannot be retrieved from server.
 */
const DEFAULT_AGE_ASSURANCE_STATE: AppBskyUnspeccedDefs.AgeAssuranceState = {
  lastInitiatedAt: undefined, // 最後の認証試行時刻未設定 / Last verification attempt time not set
  status: 'unknown', // 状態不明 / Status unknown
}

/**
 * 年齢認証コンテキスト
 * 年齢認証状態と制限情報をアプリ全体で共有するためのReact Context
 * 
 * Age assurance context.
 * React Context for sharing age assurance status and restriction information across the app.
 */
const AgeAssuranceContext = createContext<AgeAssuranceContextType>({
  status: 'unknown', // 初期状態は不明 / Initial status is unknown
  isReady: false, // 初期状態は未準備 / Initial state is not ready
  lastInitiatedAt: undefined, // 最後の認証試行時刻未設定 / Last verification attempt time not set
  isAgeRestricted: false, // 初期状態は年齢制限なし / Initial state has no age restrictions
})
AgeAssuranceContext.displayName = 'AgeAssuranceContext'

/**
 * 年齢認証APIコンテキスト
 * 年齢認証状態の再取得などのAPI操作を提供するためのReact Context
 * 
 * Age assurance API context.
 * React Context for providing API operations like refetching age assurance state.
 */
const AgeAssuranceAPIContext = createContext<AgeAssuranceAPIContextType>({
  // @ts-ignore 型付けに悩まないため無視 / can't be bothered to type this
  refetch: () => Promise.resolve(), // ダミーの再取得関数 / Dummy refetch function
})
AgeAssuranceAPIContext.displayName = 'AgeAssuranceAPIContext'

/**
 * 年齢認証状態をアプリ読み込み時に取得する低レベルプロバイダー
 * 複雑化とパフォーマンス低下を避けるため、他のデータ取得はここに追加しないこと
 * 年齢制限が必要な地域のユーザーに対してのみ動作し、適切なコンテンツ制限を適用する
 * 
 * Low-level provider for fetching age assurance state on app load. Do not add
 * any other data fetching in here to avoid complications and reduced
 * performance. Only operates for users in regions requiring age restrictions
 * and applies appropriate content restrictions.
 * 
 * @param children 子コンポーネント / Child components
 */
export function Provider({children}: {children: React.ReactNode}) {
  // AT Protocolエージェントを取得
  // Get AT Protocol agent
  const agent = useAgent()
  // ユーザーの地理的位置情報を取得
  // Get user's geolocation information
  const {status: geolocation} = useGeolocationStatus()
  // 年齢認証が有効かどうかをチェック
  // Check if age assurance is enabled
  const isAgeAssuranceEnabled = useIsAgeAssuranceEnabled()
  // プッシュ通知トークンの取得と登録関数を取得
  // Get push notification token get and register function
  const getAndRegisterPushToken = useGetAndRegisterPushToken()
  // ペンディング中の再取得フラグを管理
  // Manage refetch while pending flag
  const [refetchWhilePending, setRefetchWhilePending] = useState(false)

  // 年齢認証状態をサーバーから取得するクエリ
  // Query to fetch age assurance state from server
  const {data, isFetched, refetch} = useQuery({
    /**
     * これは重要な設定です。デフォルト値にフォールバックした場合でも、
     * このクエリが必ず実行されて「fetched」状態で終了するようにしたい。
     * これにより、アプリの他の部分に年齢認証状態の読み込みを少なくとも試行したことを知らせる。
     * 
     * ただし、年齢認証が有効な場合のみ実行する必要がある。
     * 
     * This is load bearing. We always want this query to run and end in a
     * "fetched" state, even if we fall back to defaults. This lets the rest of
     * the app know that we've at least attempted to load the AA state.
     *
     * However, it only needs to run if AA is enabled.
     */
    enabled: isAgeAssuranceEnabled, // 年齢認証が有効な場合のみ実行 / Only run if age assurance is enabled
    refetchOnWindowFocus: refetchWhilePending, // ペンディング中はウィンドウフォーカス時に再取得 / Refetch on window focus while pending
    queryKey: createAgeAssuranceQueryKey(agent.session?.did ?? 'never'), // クエリキーを作成 / Create query key
    async queryFn() {
      // セッションがない場合はnullを返す
      // Return null if no session
      if (!agent.session) return null

      try {
        // ネットワークリトライで年齢認証状態を取得（3回まで再試行）
        // Fetch age assurance state with network retry (up to 3 attempts)
        const {data} = await networkRetry(3, () =>
          agent.app.bsky.unspecced.getAgeAssuranceState(),
        )
        // テスト用のコメントアウトされたダミーデータ
        // Test dummy data commented out
        // const {data} = {
        //   data: {
        //     lastInitiatedAt: new Date().toISOString(),
        //     status: 'pending',
        //   } as AppBskyUnspeccedDefs.AgeAssuranceState,
        // }

        // 取得したデータをデバッグログに出力
        // Output fetched data to debug log
        logger.debug(`fetch`, {
          data,
          account: agent.session?.did,
        })

        // 年齢制限状態に応じてプッシュ通知トークンを登録
        // Register push notification token based on age restriction status
        await getAndRegisterPushToken({
          isAgeRestricted:
            !!geolocation?.isAgeRestrictedGeo && data.status !== 'assured', // 年齢制限地域かつ未認証の場合は制限あり / Restricted if in age-restricted region and not assured
        })

        return data
      } catch (e) {
        // ネットワークエラー以外のエラーをログに記録
        // Log non-network errors
        if (!isNetworkError(e)) {
          logger.error(`ageAssurance: failed to fetch`, {safeMessage: e})
        }
        // エラーを再スローせず、デフォルト値にフォールバック
        // don't re-throw error, we'll just fall back to defaults
        return null
      }
    },
  })

  /**
   * 状態を導出するか、デフォルト値にフォールバックする
   * Derive state, or fall back to defaults
   */
  const ageAssuranceContext = useMemo<AgeAssuranceContextType>(() => {
    // サーバーからのデータまたはデフォルト値から状態を取得
    // Get status from server data or default values
    const {status, lastInitiatedAt} = data || DEFAULT_AGE_ASSURANCE_STATE
    const ctx: AgeAssuranceContextType = {
      // 取得完了または年齢認証が無効な場合は準備完了
      // Ready if fetched or age assurance is disabled
      isReady: isFetched || !isAgeAssuranceEnabled,
      status, // サーバーからの認証状態 / Server verification status
      lastInitiatedAt, // 最後の認証試行時刻 / Last verification attempt time
      // 年齢認証が有効でかつ未認証の場合は年齢制限あり
      // Age restricted if age assurance is enabled and not assured
      isAgeRestricted: isAgeAssuranceEnabled ? status !== 'assured' : false,
    }
    // デバッグ用にコンテキストをログ出力
    // Output context for debugging
    logger.debug(`context`, ctx)
    return ctx
  }, [isFetched, data, isAgeAssuranceEnabled])

  // ペンディング状態の管理とウィンドウフォーカス時の再取得設定
  // Manage pending state and window focus refetch settings
  if (
    !!ageAssuranceContext.lastInitiatedAt &&
    ageAssuranceContext.status === 'pending' &&
    !refetchWhilePending
  ) {
    /*
     * ペンディング状態の場合、ユーザーがアプリに戻ったときに
     * 最新の状態を取得するため、ウィンドウフォーカス時に再取得したい。
     * 
     * If we have a pending state, we want to refetch on window focus to ensure
     * that we get the latest state when the user returns to the app.
     */
    setRefetchWhilePending(true)
  } else if (
    !!ageAssuranceContext.lastInitiatedAt &&
    ageAssuranceContext.status !== 'pending' &&
    refetchWhilePending
  ) {
    // ペンディング状態ではなくなったら再取得フラグをオフ
    // Turn off refetch flag when no longer pending
    setRefetchWhilePending(false)
  }

  // APIコンテキストをメモ化して作成
  // Create and memoize API context
  const ageAssuranceAPIContext = useMemo<AgeAssuranceAPIContextType>(
    () => ({
      refetch, // 年齢認証状態の再取得関数 / Age assurance state refetch function
    }),
    [refetch],
  )

  return (
    <AgeAssuranceAPIContext.Provider value={ageAssuranceAPIContext}>
      <AgeAssuranceContext.Provider value={ageAssuranceContext}>
        {children}
      </AgeAssuranceContext.Provider>
    </AgeAssuranceAPIContext.Provider>
  )
}

/**
 * 低レベルの年齢認証状態へのアクセス
 * よりユーザーフレンドリーなインターフェースのために{@link useAgeAssurance}を使用することを推奨
 * 
 * Access to low-level AA state. Prefer using {@link useAgeAssurance} for a
 * more user-friendly interface.
 * 
 * @returns 年齢認証コンテキスト / Age assurance context
 */
export function useAgeAssuranceContext() {
  return useContext(AgeAssuranceContext)
}

/**
 * 年齢認証APIコンテキストへのアクセス
 * 年齢認証状態の再取得などのAPI操作を提供する
 * 
 * Access to age assurance API context.
 * Provides API operations such as refetching age assurance state.
 * 
 * @returns 年齢認証APIコンテキスト / Age assurance API context
 */
export function useAgeAssuranceAPIContext() {
  return useContext(AgeAssuranceAPIContext)
}
