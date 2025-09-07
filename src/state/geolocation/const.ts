// 位置情報ステータスの型定義をインポート
import {type GeolocationStatus} from '#/state/geolocation/types'
// 環境変数（開発用設定URLと開発環境フラグ）をインポート
import {BAPP_CONFIG_DEV_URL, IS_DEV} from '#/env'
// ストレージのデバイス型定義をインポート
import {type Device} from '#/storage'

// IP国コード確認用のURL（参考情報取得用）
export const IPCC_URL = `https://bsky.app/ipcc`
// 本番環境用の設定取得API URL
export const BAPP_CONFIG_URL_PROD = `https://ip.bsky.app/config`
// 実際に使用される設定API URL（環境に応じて本番または開発用を選択）
export const BAPP_CONFIG_URL = IS_DEV
  ? (BAPP_CONFIG_DEV_URL ?? BAPP_CONFIG_URL_PROD)  // 開発環境では開発用URL、未定義なら本番URL
  : BAPP_CONFIG_URL_PROD  // 本番環境では本番URL
// 位置情報設定取得用のURL（BAPP_CONFIG_URLのエイリアス）
export const GEOLOCATION_CONFIG_URL = BAPP_CONFIG_URL

/**
 * Default geolocation config.
 * デフォルトの位置情報設定
 * サーバーから設定を取得する前の初期状態として使用される
 */
export const DEFAULT_GEOLOCATION_CONFIG: Device['geolocation'] = {
  /** 国コード（初期状態では未設定） */
  countryCode: undefined,
  /** 地域コード（初期状態では未設定） */
  regionCode: undefined,
  /** 年齢制限対象地域のリスト（初期状態では空配列） */
  ageRestrictedGeos: [],
  /** 年齢ブロック対象地域のリスト（初期状態では空配列） */
  ageBlockedGeos: [],
}

/**
 * Default geolocation status.
 * デフォルトの位置情報ステータス
 * 位置情報が取得・計算される前の初期状態として使用される
 */
export const DEFAULT_GEOLOCATION_STATUS: GeolocationStatus = {
  /** 国コード（初期状態では未設定） */
  countryCode: undefined,
  /** 地域コード（初期状態では未設定） */
  regionCode: undefined,
  /** 年齢制限対象地域フラグ（初期状態ではfalse） */
  isAgeRestrictedGeo: false,
  /** 年齢ブロック対象地域フラグ（初期状態ではfalse） */
  isAgeBlockedGeo: false,
}
