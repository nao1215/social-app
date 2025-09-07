// Expo・環境設定
import {nativeBuildVersion} from 'expo-application' // Expoアプリケーションビルドバージョン

import {BUNDLE_IDENTIFIER, IS_TESTFLIGHT, RELEASE_VERSION} from '#/env/common' // 共通環境設定

export * from '#/env/common' // 共通環境設定をエクスポート

/**
 * アプリのsemverバージョン（package.jsonで指定）
 * iOS/Androidでは、特定のビルドを識別できるよう、
 * ネイティブビルドバージョンがsemverバージョンに追加されます
 * The semver version of the app, specified in our `package.json`.file. On
 * iOs/Android, the native build version is appended to the semver version, so
 * that it can be used to identify a specific build.
 */
export const APP_VERSION = `${RELEASE_VERSION}.${nativeBuildVersion}`

/**
 * 現在のバンドルの短縮コミットハッシュと環境
 * The short commit hash and environment of the current bundle.
 */
export const APP_METADATA = `${BUNDLE_IDENTIFIER.slice(0, 7)} (${
  __DEV__ ? 'dev' : IS_TESTFLIGHT ? 'tf' : 'prod' // 開発・TestFlight・本番環境の識別
})`
