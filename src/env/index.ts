/**
 * 環境変数管理モジュール（ネイティブ版: iOS/Android）
 *
 * iOS/Android向けの環境変数エクスポートモジュール。
 * ネイティブビルドバージョンを含む完全なバージョン文字列を提供。
 *
 * プラットフォーム固有の実装:
 * - iOS/Androidではネイティブビルド番号がバージョンに追加される
 * - Web版（index.web.ts）とは異なる実装
 *
 * Go言語との対応:
 * - ビルドタグ（//go:build ios || android）による条件付きコンパイルに相当
 */

// Expo・環境設定
import {nativeBuildVersion} from 'expo-application' // Expoアプリケーションビルドバージョン取得

// 共通環境設定のインポート
import {BUNDLE_IDENTIFIER, IS_TESTFLIGHT, RELEASE_VERSION} from '#/env/common' // 共通環境設定

// 共通環境設定を全てエクスポート（再エクスポート）
export * from '#/env/common' // 共通環境設定をエクスポート

/**
 * アプリのsemverバージョン（package.jsonで指定）
 *
 * iOS/Androidでは、特定のビルドを識別できるよう、
 * ネイティブビルドバージョンがsemverバージョンに追加される。
 *
 * @example
 * - semverバージョン: "1.0.0"
 * - ネイティブビルド番号: "42"
 * - 最終的なAPP_VERSION: "1.0.0.42"
 *
 * Go言語との対応:
 * - ldflags経由で埋め込まれるバージョン情報
 * - fmt.Sprintf("%s.%s", version, buildNumber) に相当
 */
export const APP_VERSION = `${RELEASE_VERSION}.${nativeBuildVersion}`

/**
 * 現在のバンドルの短縮コミットハッシュと環境
 *
 * デバッグ時や設定画面に表示される簡潔なメタデータ文字列。
 * 開発環境(dev)、TestFlight(tf)、本番環境(prod)を識別。
 *
 * @example
 * - 開発環境: "a1b2c3d (dev)"
 * - TestFlight: "a1b2c3d (tf)"
 * - 本番環境: "a1b2c3d (prod)"
 *
 * Go言語との対応:
 * - デバッグ用のビルド情報文字列
 * - slice(0, 7)はコミットハッシュの最初の7文字を取得（Goのstring[:7]に相当）
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER.slice(0, 7)} (${
  __DEV__ ? 'dev' : IS_TESTFLIGHT ? 'tf' : 'prod' // 開発・TestFlight・本番環境の識別
})`
