// Blueskyエージェントをインポート
// Import Bluesky agent
import {BskyAgent} from '@atproto/api'

// アプリケーションロガーをインポート
// Import application logger
import {logger} from '#/logger'
// デバイスストレージをインポート
// Import device storage
import {device} from '#/storage'

// 各国・地域のモデレーションラベラーのDID（分散識別子）定義
// DID (Decentralized Identifier) definitions for moderation labelers in each country/region

export const BR_LABELER = 'did:plc:ekitcvx7uwnauoqy5oest3hm' // ブラジル / Brazil
export const DE_LABELER = 'did:plc:r55ow3tocux5kafs5dq445fy' // ドイツ / Germany
export const RU_LABELER = 'did:plc:crm2agcxvvlj6hilnjdc4hox' // ロシア / Russia
export const GB_LABELER = 'did:plc:gvkp7euswjjrctjmqwhhfzif' // イギリス / United Kingdom
export const AU_LABELER = 'did:plc:dsynw7isrf2eqlhcjx3ffnmt' // オーストラリア / Australia
export const TR_LABELER = 'did:plc:cquoj7aozvmkud2gifeinkda' // トルコ / Turkey
export const JP_LABELER = 'did:plc:vhgppeyjwgrr37vm4v6ggd5a' // 日本 / Japan
export const ES_LABELER = 'did:plc:zlbbuj5nov4ixhvgl3bj47em' // スペイン / Spain
export const PK_LABELER = 'did:plc:zrp6a3tvprrsgawsbswbxu7m' // パキスタン / Pakistan
export const IN_LABELER = 'did:plc:srr4rdvgzkbx6t7fxqtt6j5t' // インド / India

/**
 * 全EU諸国用のモデレーションラベラー
 * EU法規制に準拠したコンテンツモデレーション機関
 * 
 * Moderation labeler for all EU countries
 * Content moderation authority complying with EU regulations
 */
export const EU_LABELER = 'did:plc:z57lz5dhgz2dkjogoysm3vut'

/**
 * 国コード別のモデレーション機関マッピング
 * 各国の法的要件や文化的背景に応じたコンテンツモデレーション機関を定義
 * 
 * Country code to moderation authority mapping
 * Defines content moderation authorities according to legal requirements and cultural context of each country
 */
const MODERATION_AUTHORITIES: {
  [countryCode: string]: string[] // 国コード: モデレーションラベラーDIDの配列 / Country code: Array of moderation labeler DIDs
} = {
  // 独立したモデレーション機関を持つ国々 / Countries with independent moderation authorities
  BR: [BR_LABELER], // ブラジル / Brazil
  RU: [RU_LABELER], // ロシア / Russia
  GB: [GB_LABELER], // イギリス / United Kingdom
  AU: [AU_LABELER], // オーストラリア / Australia
  TR: [TR_LABELER], // トルコ / Turkey
  JP: [JP_LABELER], // 日本 / Japan
  PK: [PK_LABELER], // パキスタン / Pakistan
  IN: [IN_LABELER], // インド / India

  // EU諸国（EU共通ラベラーを使用） / EU countries (using common EU labeler)
  AT: [EU_LABELER], // オーストリア / Austria
  BE: [EU_LABELER], // ベルギー / Belgium
  BG: [EU_LABELER], // ブルガリア / Bulgaria
  HR: [EU_LABELER], // クロアチア / Croatia
  CY: [EU_LABELER], // キプロス / Cyprus
  CZ: [EU_LABELER], // チェコ共和国 / Czech Republic
  DK: [EU_LABELER], // デンマーク / Denmark
  EE: [EU_LABELER], // エストニア / Estonia
  FI: [EU_LABELER], // フィンランド / Finland
  FR: [EU_LABELER], // フランス / France
  DE: [EU_LABELER, DE_LABELER], // ドイツ（EU共通+独自ラベラー）/ Germany (common EU + specific labeler)
  GR: [EU_LABELER], // ギリシャ / Greece
  HU: [EU_LABELER], // ハンガリー / Hungary
  IE: [EU_LABELER], // アイルランド / Ireland
  IT: [EU_LABELER], // イタリア / Italy
  LV: [EU_LABELER], // ラトビア / Latvia
  LT: [EU_LABELER], // リトアニア / Lithuania
  LU: [EU_LABELER], // ルクセンブルク / Luxembourg
  MT: [EU_LABELER], // マルタ / Malta
  NL: [EU_LABELER], // オランダ / Netherlands
  PL: [EU_LABELER], // ポーランド / Poland
  PT: [EU_LABELER], // ポルトガル / Portugal
  RO: [EU_LABELER], // ルーマニア / Romania
  SK: [EU_LABELER], // スロバキア / Slovakia
  SI: [EU_LABELER], // スロベニア / Slovenia
  ES: [EU_LABELER, ES_LABELER], // スペイン（EU共通+独自ラベラー）/ Spain (common EU + specific labeler)
  SE: [EU_LABELER], // スウェーデン / Sweden
}

// 全てのモデレーション機関のDIDを重複なしで抽出
// Extract all moderation authority DIDs without duplicates
const MODERATION_AUTHORITIES_DIDS = Array.from(
  new Set(Object.values(MODERATION_AUTHORITIES).flat()),
)

/**
 * 指定されたDIDが設定不可能なモデレーション機関かどうかを判定する関数
 * 地域的な法的要件により自動適用されるラベラーはユーザーが無効化できない
 * 
 * Function to determine if specified DID is a non-configurable moderation authority
 * Labelers automatically applied due to regional legal requirements cannot be disabled by users
 */
export function isNonConfigurableModerationAuthority(did: string) {
  // 法的モデレーション機関のDID一覧に含まれるかをチェック
  // Check if included in the list of legal moderation authority DIDs
  return MODERATION_AUTHORITIES_DIDS.includes(did)
}

/**
 * 追加モデレーション機関を設定する関数
 * デバイスの位置情報をベースに、その国の法的要件に応じたモデレーションラベラーを適用
 * 
 * Function to configure additional moderation authorities
 * Applies moderation labelers according to legal requirements of the country based on device location
 */
export function configureAdditionalModerationAuthorities() {
  // デバイスの位置情報（国コード）を取得
  // Get device location information (country code)
  const geolocation = device.get(['geolocation'])
  
  // デフォルトは全てのモデレーション機関を適用
  // Default to applying all moderation authorities
  let additionalLabelers: string[] = MODERATION_AUTHORITIES_DIDS

  if (geolocation?.countryCode) {
    // 位置情報がある場合は、その国に必要なモデレーション機関のみを使用
    // If location info available, use only moderation authorities necessary for that country
    additionalLabelers = MODERATION_AUTHORITIES[geolocation.countryCode] ?? []
  } else {
    // 位置情報がない場合のログ出力
    // Log output when location info is unavailable
    logger.info(`no geolocation, cannot apply mod authorities`)
  }

  // 開発環境ではモデレーション機関を適用しない
  // Don't apply moderation authorities in development environment
  if (__DEV__) {
    additionalLabelers = []
  }

  // 既存のアプリラベラーと追加ラベラーを結合（重複除去）
  // Combine existing app labelers with additional labelers (remove duplicates)
  const appLabelers = Array.from(
    new Set([...BskyAgent.appLabelers, ...additionalLabelers]),
  )

  // モデレーション機関適用のログ出力
  // Log output for moderation authority application
  logger.info(`applying mod authorities`, {
    additionalLabelers, // 追加されたラベラー一覧 / List of added labelers
    appLabelers, // 最終的なアプリラベラー一覧 / Final list of app labelers
  })

  // Blueskyエージェントにラベラー設定を適用
  // Apply labeler configuration to Bluesky agent
  BskyAgent.configure({appLabelers})
}
