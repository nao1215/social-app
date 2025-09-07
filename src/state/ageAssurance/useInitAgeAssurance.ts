// AT ProtocolのBlueSky未承認定義と年齢認証初期化の型をインポート
// Import BlueSky unspecced definitions and age assurance initialization types from AT Protocol
import {
  type AppBskyUnspeccedDefs,
  type AppBskyUnspeccedInitAgeAssurance,
  AtpAgent,
} from '@atproto/api'
// React Queryのミューテーションとクエリクライアントをインポート
// Import mutation and query client from React Query
import {useMutation, useQueryClient} from '@tanstack/react-query'

// 非同期待機ユーティリティをインポート
// Import async wait utility
import {wait} from '#/lib/async/wait'
// アプリケーション定数（AppViewのURL等）をインポート
// Import application constants (AppView URLs, etc.)
import {
  // DEV_ENV_APPVIEW,
  PUBLIC_APPVIEW,
  PUBLIC_APPVIEW_DID,
} from '#/lib/constants'
// ネットワークエラー判定ユーティリティをインポート
// Import network error detection utility
import {isNetworkError} from '#/lib/hooks/useCleanError'
// ログ出力ユーティリティをインポート
// Import logging utility
import {logger} from '#/logger'
// 年齢認証クエリキー作成関数をインポート
// Import age assurance query key creation function
import {createAgeAssuranceQueryKey} from '#/state/ageAssurance'
// デバイス位置情報の型と地理的位置状態フックをインポート
// Import device location type and geolocation status hook
import {type DeviceLocation, useGeolocationStatus} from '#/state/geolocation'
// セッション管理エージェントフックをインポート
// Import session management agent hook
import {useAgent} from '#/state/session'

// 本番環境のAppViewエンドポイントを設定
// Set production AppView endpoints
let APPVIEW = PUBLIC_APPVIEW
let APPVIEW_DID = PUBLIC_APPVIEW_DID

/*
 * ローカル開発環境を使用する場合はコメントアウトを解除
 * Uncomment if using the local dev-env
 */
// if (__DEV__) {
//   APPVIEW = DEV_ENV_APPVIEW
//   /*
//    * 重要：この値は `http://localhost:2581` のイントロスペクションエンドポイントから取得し、
//    * `constants`で更新する必要があります。開発環境を実行するたびに変更されるためです。
//    * IMPORTANT: you need to get this value from `http://localhost:2581`
//    * introspection endpoint and updated in `constants`, since it changes
//    * every time you run the dev-env.
//    */
//   APPVIEW_DID = ``
// }

/**
 * 与えられた地理的位置データからISO国コード文字列を作成する
 * 年齢認証APIに送信するための標準化された国コード形式を生成する
 * 例: `GB` または `GB-ENG`
 * 
 * Creates an ISO country code string from the given geolocation data.
 * Generates a standardized country code format for sending to the age assurance API.
 * Examples: `GB` or `GB-ENG`
 * 
 * @param geolocation 地理的位置情報（国コードを含む） / Geolocation data including country code
 * @returns ISO形式の国コード / ISO format country code
 */
function createISOCountryCode(
  geolocation: Omit<DeviceLocation, 'countryCode'> & {
    countryCode: string
  },
): string {
  // 国コードを大文字に変換してISO標準形式にする
  // Convert country code to uppercase for ISO standard format
  return geolocation.countryCode.toUpperCase()
}

/**
 * 年齢認証プロセスを開始するカスタムフック
 * ユーザーの地理的位置情報を使用してサーバーに年齢認証を初期化する
 * 認証完了後にメール送信などの処理が行われる
 * 
 * Custom hook to initiate the age assurance process.
 * Uses the user's geolocation information to initialize age assurance on the server.
 * After completion, processes like email sending are performed.
 * 
 * @returns React Query mutation object for age assurance initialization
 */
export function useInitAgeAssurance() {
  // React Queryのクエリクライアントを取得
  // Get React Query client
  const qc = useQueryClient()
  // AT ProtocolエージェントをQueueget
  // Get AT Protocol agent
  const agent = useAgent()
  // ユーザーの地理的位置情報を取得
  // Get user's geolocation information
  const {status: geolocation} = useGeolocationStatus()
  return useMutation({
    async mutationFn(
      props: Omit<AppBskyUnspeccedInitAgeAssurance.InputSchema, 'countryCode'>,
    ) {
      // 地理的位置から国コードと地域コードを取得
      // Extract country code and region code from geolocation
      const countryCode = geolocation?.countryCode
      const regionCode = geolocation?.regionCode
      if (!countryCode) {
        throw new Error(`Geolocation not available, cannot init age assurance.`)
      }

      // AppViewサービスへのアクセス用の認証トークンを取得
      // Get authentication token for accessing AppView service
      const {
        data: {token},
      } = await agent.com.atproto.server.getServiceAuth({
        aud: APPVIEW_DID, // AppViewの識別子 / AppView identifier
        lxm: `app.bsky.unspecced.initAgeAssurance`, // 年齢認証初期化メソッド / Age assurance initialization method
      })

      // AppView専用のエージェントを作成
      // Create AppView-specific agent
      const appView = new AtpAgent({service: APPVIEW})
      appView.sessionManager.session = {...agent.session!}
      appView.sessionManager.session.accessJwt = token // 認証トークンを設定 / Set authentication token
      appView.sessionManager.session.refreshJwt = '' // リフレッシュトークンは空に設定 / Set refresh token to empty

      /*
       * 2秒の待機は実際に有用です。メール送信には少し時間がかかるため、
       * ユーザーが受信箱を開いたときにメールが準備されているようにします。
       * 2s wait is good actually. Email sending takes a hot sec and this helps
       * ensure the email is ready for the user once they open their inbox.
       */
      const {data} = await wait(
        2e3, // 2秒待機 / Wait 2 seconds
        appView.app.bsky.unspecced.initAgeAssurance({
          ...props,
          countryCode: createISOCountryCode({
            countryCode,
            regionCode,
          }), // ISO標準の国コードを生成 / Generate ISO standard country code
        }),
      )

      // 年齢認証状態をクエリキャッシュに保存
      // Save age assurance state to query cache
      qc.setQueryData<AppBskyUnspeccedDefs.AgeAssuranceState>(
        createAgeAssuranceQueryKey(agent.session?.did ?? 'never'),
        () => data,
      )
    },
    onError(e) {
      // ネットワークエラー以外のエラーをログに記録
      // Log non-network errors
      if (!isNetworkError(e)) {
        logger.error(`useInitAgeAssurance failed`, {
          safeMessage: e,
        })
      }
    },
  })
}
