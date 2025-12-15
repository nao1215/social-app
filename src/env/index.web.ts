/**
 * 環境変数管理モジュール（Web版）
 *
 * Web向けの環境変数エクスポートモジュール。
 * ネイティブ版とは異なり、シンプルなバージョン管理を提供。
 *
 * プラットフォーム固有の実装:
 * - Webではネイティブビルド番号を含まない
 * - APP_VERSIONはRELEASE_VERSIONと同一
 * - ネイティブ版（index.ts）とは異なる実装
 *
 * Go言語との対応:
 * - ビルドタグ（//go:build js && wasm）による条件付きコンパイルに相当
 */

// 共通環境設定のインポート
import {BUNDLE_IDENTIFIER, RELEASE_VERSION} from '#/env/common'

// 共通環境設定を全てエクスポート（再エクスポート）
export * from '#/env/common'

/**
 * アプリのsemverバージョン（package.jsonで指定）
 *
 * Web版ではネイティブビルド番号を追加せず、
 * semverバージョンをそのまま使用。
 *
 * @example "1.0.0"
 *
 * Go言語との対応:
 * - ldflags経由で埋め込まれるバージョン情報（シンプル版）
 */
export const APP_VERSION = RELEASE_VERSION

/**
 * 現在のバンドルの短縮コミットハッシュと環境
 *
 * デバッグ時や設定画面に表示される簡潔なメタデータ文字列。
 * Web版では開発環境(dev)と本番環境(prod)のみを識別（TestFlightなし）。
 *
 * @example
 * - 開発環境: "a1b2c3d (dev)"
 * - 本番環境: "a1b2c3d (prod)"
 *
 * Go言語との対応:
 * - デバッグ用のビルド情報文字列
 * - slice(0, 7)はコミットハッシュの最初の7文字を取得（Goのstring[:7]に相当）
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER.slice(0, 7)} (${__DEV__ ? 'dev' : 'prod'})`
