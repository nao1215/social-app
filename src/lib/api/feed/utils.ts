/**
 * フィードユーティリティモジュール
 *
 * 【概要】
 * フィード取得に関する共通ユーティリティ関数を提供。
 * Bluesky公式フィードの判定、ユーザー興味ヘッダーの生成など。
 *
 * 【主な機能】
 * - Bluesky公式フィードの判定
 * - ユーザー興味に基づくパーソナライズヘッダー生成
 * - デバッグ用のトピック上書き機能
 *
 * 【Goユーザー向け補足】
 * - モジュールスコープの変数（debugTopics）は初回インポート時に評価
 * - export functionはGoの公開関数に相当
 */

/**
 * AtUri: AT Protocol URI パーサー
 * at://did:plc:xxx/collection/rkey 形式のURIを解析
 */
import {AtUri} from '@atproto/api'

/**
 * BSKY_FEED_OWNER_DIDS: Bluesky公式フィード所有者のDID一覧
 * 公式フィードにはパーソナライズヘッダーを追加する
 */
import {BSKY_FEED_OWNER_DIDS} from '#/lib/constants'

/**
 * isWeb: 現在のプラットフォームがWebかどうかを判定
 */
import {isWeb} from '#/platform/detection'

/**
 * UsePreferencesQueryResponse: ユーザー設定の型
 */
import {UsePreferencesQueryResponse} from '#/state/queries/preferences'

/**
 * デバッグ用トピック上書き
 *
 * 【機能】
 * URLパラメータ ?debug_topics=xxx でフィードパーソナライズを上書き可能。
 * 開発時のテスト用。
 *
 * 【モジュール初期化について】
 * この変数はモジュール読み込み時に1回だけ評価される。
 * Goのinit()関数に相当するパターン。
 */
let debugTopics = ''
if (isWeb && typeof window !== 'undefined') {
  // URLのクエリパラメータを取得
  const params = new URLSearchParams(window.location.search)
  debugTopics = params.get('debug_topics') ?? ''
}

/**
 * Blueskyトピックヘッダーを生成
 *
 * 【概要】
 * Bluesky公式フィードにユーザーの興味情報を送信するための
 * HTTPヘッダーを生成する。
 *
 * 【パーソナライズの仕組み】
 * X-Bsky-Topicsヘッダーでユーザーの興味を送信すると、
 * フィードジェネレータがそれに基づいてコンテンツをパーソナライズ。
 *
 * 【優先順位】
 * 1. debugTopics（開発用上書き）
 * 2. userInterests（ユーザー設定）
 * 3. 空文字（パーソナライズなし）
 *
 * @param userInterests ユーザーの興味（カンマ区切り文字列）
 * @returns HTTPヘッダーオブジェクト
 */
export function createBskyTopicsHeader(userInterests?: string) {
  return {
    'X-Bsky-Topics': debugTopics || userInterests || '',
  }
}

/**
 * ユーザー興味を集約
 *
 * 【概要】
 * ユーザー設定からinterests.tagsを抽出し、
 * カンマ区切り文字列として返す。
 *
 * 【使用例】
 * tags: ['tech', 'sports', 'music'] → 'tech,sports,music'
 *
 * @param preferences ユーザー設定
 * @returns カンマ区切りの興味文字列
 */
export function aggregateUserInterests(
  preferences?: UsePreferencesQueryResponse,
) {
  return preferences?.interests?.tags?.join(',') || ''
}

/**
 * Bluesky公式フィードかどうかを判定
 *
 * 【概要】
 * フィードURIのホスト（所有者DID）がBluesky公式のものかを判定。
 * 公式フィードにはパーソナライズヘッダーを追加する。
 *
 * 【判定方法】
 * フィードURI（at://did:plc:xxx/app.bsky.feed.generator/yyy）から
 * ホスト部分（did:plc:xxx）を抽出し、公式DID一覧と照合。
 *
 * @param feedUri フィードのAT Protocol URI
 * @returns Bluesky公式フィードの場合true
 */
export function isBlueskyOwnedFeed(feedUri: string) {
  const uri = new AtUri(feedUri)
  // フィード所有者のDIDがBluesky公式一覧に含まれるか
  return BSKY_FEED_OWNER_DIDS.includes(uri.host)
}
