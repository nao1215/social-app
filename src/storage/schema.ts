/**
 * ストレージスキーマ定義モジュール
 * Storage schema definition module
 *
 * このモジュールは、MMKV永続ストレージに保存されるデータの型定義を提供します。
 * デバイス固有のデータとアカウント固有のデータの2つのスキーマがあります。
 *
 * This module provides type definitions for data stored in MMKV persistent storage.
 * There are two schemas: device-specific data and account-specific data.
 *
 * 【Goユーザー向け解説】
 * これらの型定義は、Goのstructに相当します。MMKVストレージに保存される
 * データ構造を定義し、TypeScriptの型安全性を提供します。
 *
 * スキーマの種類:
 * - Device: デバイス単位で保存されるデータ（すべてのアカウントで共有）
 * - Account: アカウント単位で保存されるデータ（アカウントごとに独立）
 *
 * 【MMKVについて】
 * MMKV（Memory-Mapped Key-Value）は、Tencent製の高性能キーバリューストレージです。
 * Goのbolt/bboltに似た仕組みで、メモリマップドファイルを使用して
 * 高速な読み書きを実現します。
 *
 * @see https://github.com/Tencent/MMKV
 */

// ポリシー更新設定をインポート
// Import policy update configuration
import {type ID as PolicyUpdate202508} from '#/components/PolicyUpdateOverlay/updates/202508/config'

/**
 * デバイス固有データのスキーマ
 * Schema for device-specific data
 *
 * このデータは、デバイス単位で保存され、すべてのアカウントで共有されます。
 * ユーザー設定、UI状態、地理位置情報などが含まれます。
 *
 * This data is stored per device and shared across all accounts.
 * Includes user settings, UI state, geolocation, etc.
 *
 * 【Goユーザー向け解説】
 * Goのstructタグ（`json:"fieldName"`）に相当するフィールド定義です。
 * TypeScriptでは、interfaceまたはtypeで構造体を定義します。
 *
 * @example
 * ```typescript
 * // Goでの同等の定義:
 * type Device struct {
 *     FontScale string `json:"fontScale"`
 *     FontFamily string `json:"fontFamily"`
 *     LastNuxDialog *string `json:"lastNuxDialog,omitempty"`
 *     // ...
 * }
 * ```
 */
export type Device = {
  /**
   * フォントスケール設定
   * Font scale setting
   *
   * ユーザー設定のフォントサイズ調整。
   * -2（最小）から+2（最大）までの5段階。
   *
   * @type {'-2' | '-1' | '0' | '1' | '2'}
   */
  fontScale: '-2' | '-1' | '0' | '1' | '2'

  /**
   * フォントファミリー設定
   * Font family setting
   *
   * システムフォントまたはテーマフォントの選択。
   *
   * @type {'system' | 'theme'}
   */
  fontFamily: 'system' | 'theme'

  /**
   * 最後に表示したNUX（New User Experience）ダイアログ
   * Last shown NUX (New User Experience) dialog
   *
   * 新規ユーザー向けガイダンスダイアログの表示管理。
   * 既に表示済みのダイアログを追跡し、重複表示を防ぐ。
   *
   * @type {string | undefined}
   */
  lastNuxDialog: string | undefined

  /**
   * 地理位置情報設定（IPベース）
   * Geolocation configuration (IP-based)
   *
   * IPアドレスから取得した地理位置情報。
   * 以前は状態管理も兼ねていましたが、現在は設定データのみを保持。
   *
   * Previously did double duty as the "status" for geolocation state,
   * but that has since moved to the client.
   *
   * @property {string | undefined} countryCode - 国コード（ISO 3166-1 alpha-2）
   * @property {string | undefined} regionCode - 地域コード
   * @property {Array} ageRestrictedGeos - 年齢制限が必要な地域リスト
   * @property {Array} ageBlockedGeos - 年齢制限でブロックされる地域リスト
   */
  geolocation?: {
    countryCode: string | undefined
    regionCode: string | undefined
    ageRestrictedGeos: {
      countryCode: string
      regionCode: string | undefined
    }[]
    ageBlockedGeos: {
      countryCode: string
      regionCode: string | undefined
    }[]
  }

  /**
   * GPS位置情報（ユーザー許可が必要）
   * GPS-based geolocation (requires user permission)
   *
   * ユーザーが位置情報アクセスを許可した場合のGPS位置。
   * より正確な位置情報を提供。
   *
   * The GPS-based geolocation, if the user has granted permission.
   *
   * @property {string | undefined} countryCode - 国コード
   * @property {string | undefined} regionCode - 地域コード
   */
  deviceGeolocation?: {
    countryCode: string | undefined
    regionCode: string | undefined
  }

  /**
   * トレンドベータ機能有効化フラグ
   * Trending beta feature enabled flag
   *
   * トレンド機能のベータテストへの参加状態。
   *
   * @type {boolean}
   */
  trendingBetaEnabled: boolean

  /**
   * 開発者モード有効化フラグ
   * Developer mode enabled flag
   *
   * 開発者向けデバッグ機能の有効化状態。
   *
   * @type {boolean}
   */
  devMode: boolean

  /**
   * デモモード有効化フラグ
   * Demo mode enabled flag
   *
   * デモンストレーション用モードの有効化状態。
   *
   * @type {boolean}
   */
  demoMode: boolean

  /**
   * アクティビティサブスクリプション案内表示済みフラグ
   * Activity subscriptions nudge shown flag
   *
   * アクティビティサブスクリプション機能の案内を既に表示したかどうか。
   *
   * @type {boolean | undefined}
   */
  activitySubscriptionsNudged?: boolean

  /**
   * ポリシー更新オーバーレイ設定
   * Policy update overlay settings
   *
   * 新しいポリシーアナウンスメントごとに、新しいIDが必要です。
   * New IDs are required for each new announcement.
   *
   * @property {boolean | undefined} policyUpdateDebugOverride - デバッグ用の強制表示フラグ
   * @property {boolean | undefined} [PolicyUpdate202508] - 2025年8月のポリシー更新表示済みフラグ
   */
  policyUpdateDebugOverride?: boolean
  [PolicyUpdate202508]?: boolean
}

/**
 * アカウント固有データのスキーマ
 * Schema for account-specific data
 *
 * このデータは、アカウント単位で保存され、各アカウントで独立しています。
 * 検索履歴など、ユーザー固有の情報が含まれます。
 *
 * This data is stored per account and is independent for each account.
 * Includes user-specific information like search history.
 *
 * 【Goユーザー向け解説】
 * アカウント情報を保持するstructです。現在は検索履歴のみですが、
 * 将来的に他のアカウント固有データが追加される可能性があります。
 *
 * @example
 * ```typescript
 * // アカウントストレージの使用例:
 * import { account } from '#/storage'
 * account.set(['user123', 'searchTermHistory'], ['react', 'typescript'])
 * const history = account.get(['user123', 'searchTermHistory'])
 * ```
 */
export type Account = {
  /**
   * 検索キーワード履歴
   * Search term history
   *
   * ユーザーが検索したキーワードの履歴。
   * オートコンプリートや検索サジェストに使用。
   *
   * @type {string[] | undefined}
   */
  searchTermHistory?: string[]

  /**
   * 検索アカウント履歴
   * Search account history
   *
   * ユーザーが検索したアカウントの履歴。
   * アカウント検索時のサジェストに使用。
   *
   * @type {string[] | undefined}
   */
  searchAccountHistory?: string[]
}
