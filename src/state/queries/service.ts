// TanStack Query（データ取得ライブラリ） / TanStack Query (data fetching library)
import {useQuery} from '@tanstack/react-query'

// エージェントクラス / Agent class
import {Agent} from '../session/agent'

// クエリキーの定義 / Query key definitions
const RQKEY_ROOT = 'service' // サービスクエリのルートキー / Service query root key
/**
 * サービスクエリキー生成関数 / Service query key generator
 * @param serviceUrl サービスURL / Service URL
 */
export const RQKEY = (serviceUrl: string) => [RQKEY_ROOT, serviceUrl]

/**
 * AT Protocolサービスの情報を取得するフック / Hook to fetch AT Protocol service information
 * サービスの設定や機能を確認するために使用 / Used to check service configuration and capabilities
 * @param serviceUrl サービスURL / Service URL
 */
export function useServiceQuery(serviceUrl: string) {
  return useQuery({
    queryKey: RQKEY(serviceUrl), // クエリキー / Query key
    queryFn: async () => {
      // 指定したサービス用のエージェントを作成 / Create agent for specified service
      const agent = new Agent(null, {service: serviceUrl})
      // サービスの詳細情報を取得 / Fetch service details
      const res = await agent.com.atproto.server.describeServer()
      return res.data
    },
    enabled: isValidUrl(serviceUrl), // 有効なURLの場合のみ実行 / Only execute if URL is valid
  })
}

/**
 * URLの有効性をチェックするユーティリティ関数 / Utility function to check URL validity
 * @param url チェック対象のURL / URL to check
 * @returns URLが有効かどうか / Whether the URL is valid
 */
function isValidUrl(url: string) {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const urlp = new URL(url) // URLコンストラクタでパースを試行 / Try parsing with URL constructor
    return true // パース成功 / Parse successful
  } catch {
    return false // パース失敗 / Parse failed
  }
}
