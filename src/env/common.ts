/**
 * 環境変数管理モジュール
 *
 * アプリケーション全体で使用する環境変数を一元管理するモジュール。
 * process.env経由でビルド時に注入される環境変数をTypeScript型付きでエクスポート。
 *
 * 主な機能:
 * - アプリバージョン情報の管理
 * - ログレベル設定
 * - 外部サービス(Sentry, Bitdrift)の設定
 * - AT Protocolエンドポイント設定
 *
 * Go言語との対応:
 * - process.envはGoのos.Getenv()に相当
 * - 環境変数はビルド時に.envファイルから読み込まれる
 */

// AT Protocol型定義
import {type Did} from '@atproto/api' // DID（Decentralized Identifier）型

// package.jsonからバージョン情報を取得
import packageJson from '#/../package.json'

/**
 * アプリのsemverバージョン（package.jsonで定義）
 *
 * Render.comデプロイメント用のフォールバック機能付き。
 * EXPO_PUBLIC_RELEASE_VERSIONが未設定の場合、package.jsonのversionを使用。
 *
 * @example "1.0.0"
 *
 * Go言語との対応:
 * - const版定数に相当（var版ではない）
 * - ビルド時に値が確定する
 */
export const RELEASE_VERSION: string =
  process.env.EXPO_PUBLIC_RELEASE_VERSION || packageJson.version

/**
 * アプリが実行されている環境（development, testflight, production, e2eなど）
 *
 * この値によりログレベルや機能の有効/無効が切り替わる。
 *
 * @example "production" | "development" | "testflight"
 *
 * Go言語との対応:
 * - 環境変数から取得するstring型定数
 */
export const ENV: string = process.env.EXPO_PUBLIC_ENV

/**
 * アプリがTestFlight環境で実行されているかを示すフラグ
 *
 * TestFlightはAppleのベータテストプラットフォーム。
 * TestFlight環境では本番環境とは異なる動作（デバッグ機能有効など）をする。
 *
 * Go言語との対応:
 * - bool型定数に相当
 */
export const IS_TESTFLIGHT = ENV === 'testflight'

/**
 * 開発環境で実行されているかを示すフラグ
 *
 * __DEV__はReact Nativeのグローバル変数で、開発ビルドでtrue。
 *
 * Go言語との対応:
 * - ビルドタグ（build tags）に相当
 */
export const IS_DEV = __DEV__

/**
 * 内部環境（開発環境またはTestFlight）で実行されているかを示すフラグ
 *
 * デバッグ機能やログ出力の制御に使用。
 * 本番環境（production）ではfalseになる。
 *
 * Go言語との対応:
 * - 複合条件の定数
 */
export const IS_INTERNAL = IS_DEV || IS_TESTFLIGHT

/**
 * 現在のバンドルが作成されたコミットハッシュ
 *
 * ユーザーは設定画面でバージョン情報と共にコミットハッシュを確認可能。
 * デバッグや問題報告時の識別に有用。
 *
 * @example "a1b2c3d" (短縮コミットハッシュ)
 *
 * Go言語との対応:
 * - ldflags経由で埋め込まれる変数に相当
 */
export const BUNDLE_IDENTIFIER: string =
  process.env.EXPO_PUBLIC_BUNDLE_IDENTIFIER || 'dev'

/**
 * バンドルのビルド日時（YYMMDDHH形式）
 *
 * 常に増加する形式（年月日時）のため、ビルドの新旧比較に使用可能。
 * StatSigレポート用に使用され、特定バンドルの識別には使用すべきでない。
 *
 * @example 25011415 (2025年1月14日15時)
 *
 * Go言語との対応:
 * - ビルド時刻の埋め込みに相当
 */
export const BUNDLE_DATE: number =
  process.env.EXPO_PUBLIC_BUNDLE_DATE === undefined
    ? 0
    : Number(process.env.EXPO_PUBLIC_BUNDLE_DATE)

/**
 * アプリのログレベル設定
 *
 * ログ出力の詳細度を制御。debug < info < warn < error の順で重要度が上がる。
 * デフォルトは'info'で、それ以上のレベル（warn, error）のみ出力される。
 *
 * Go言語との対応:
 * - log/slogのLogLevelに相当
 * - as構文はGoの型アサーションに相当
 */
export const LOG_LEVEL = (process.env.EXPO_PUBLIC_LOG_LEVEL || 'info') as
  | 'debug'
  | 'info'
  | 'warn'
  | 'error'

/**
 * 特定のロガーインスタンスでデバッグログを有効化する設定
 *
 * カンマ区切りでロガーのコンテキスト名を指定。
 * ワイルドカード（*）も使用可能。
 *
 * @example "session,notifications" または "session:*"
 *
 * Go言語との対応:
 * - フィルタリング用の文字列設定
 */
export const LOG_DEBUG: string = process.env.EXPO_PUBLIC_LOG_DEBUG || ''

/**
 * プロキシ先のBluesky appviewのDID（Decentralized Identifier）
 *
 * AT Protocolの分散型アーキテクチャにおいて、
 * どのappviewサーバーに接続するかを指定。
 * デフォルトはBluesky公式のapi.bsky.app。
 *
 * Go言語との対応:
 * - エンドポイントURL設定の型付き版
 * - DIDはW3C標準の分散型ID
 */
export const BLUESKY_PROXY_DID: Did =
  process.env.EXPO_PUBLIC_BLUESKY_PROXY_DID || 'did:web:api.bsky.app'

/**
 * プロキシ先のチャットサービスのDID
 *
 * Blueskyのダイレクトメッセージ機能が使用するサーバーを指定。
 * デフォルトはBluesky公式のapi.bsky.chat。
 *
 * Go言語との対応:
 * - チャット専用エンドポイント設定
 */
export const CHAT_PROXY_DID: Did =
  process.env.EXPO_PUBLIC_CHAT_PROXY_DID || 'did:web:api.bsky.chat'

/**
 * Sentry DSN（Data Source Name）
 *
 * Sentryはエラートラッキングサービス。
 * DSNはエラーレポートの送信先を指定する接続文字列。
 * undefinedの場合、Sentryは無効化される。
 *
 * Go言語との対応:
 * - SentryのDSN設定（sentry-go）
 * - optional型（*string）に相当
 */
export const SENTRY_DSN: string | undefined = process.env.EXPO_PUBLIC_SENTRY_DSN

/**
 * Bitdrift APIキー
 *
 * Bitdriftはモバイルアプリのログ収集・分析サービス。
 * undefinedの場合、Bitdriftは無効化される。
 *
 * Go言語との対応:
 * - ログ収集サービスのAPIキー設定
 * - optional型（*string）に相当
 */
export const BITDRIFT_API_KEY: string | undefined =
  process.env.EXPO_PUBLIC_BITDRIFT_API_KEY

/**
 * GCPプロジェクトID（ネイティブデバイス認証用）
 *
 * Google Cloud PlatformのプロジェクトIDで、
 * ネイティブアプリのデバイス認証に必要。
 * Web版では未設定で0と評価される。
 *
 * Go言語との対応:
 * - GCPクライアント初期化時のプロジェクトID
 * - 数値型定数
 */
export const GCP_PROJECT_ID: number =
  process.env.EXPO_PUBLIC_GCP_PROJECT_ID === undefined
    ? 0
    : Number(process.env.EXPO_PUBLIC_GCP_PROJECT_ID)

/**
 * bapp-config Webワーカー開発環境用URL
 *
 * ローカル開発時に使用するbapp-config Webワーカーのエンドポイント。
 * ローカルサーバーのURLを指定可能（env.example参照）。
 *
 * Go言語との対応:
 * - 開発環境用の代替エンドポイント設定
 */
export const BAPP_CONFIG_DEV_URL = process.env.BAPP_CONFIG_DEV_URL

/**
 * bapp-config Webワーカー開発環境バイパス用シークレット
 *
 * development モードで動作するWebワーカーへの
 * ローカル開発アクセスを許可するための認証シークレット。
 *
 * Go言語との対応:
 * - 開発環境バイパス用の認証トークン
 */
export const BAPP_CONFIG_DEV_BYPASS_SECRET: string =
  process.env.BAPP_CONFIG_DEV_BYPASS_SECRET
