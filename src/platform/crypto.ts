/**
 * Webクリプト API エクスポートモジュール
 * Web Crypto API export module
 *
 * このファイルは、expo-modules-coreのビルド時の問題を回避するための
 * ハックとして機能します。expo-modules-coreはuuid.web.jsで
 * require('crypto')を試みますが、ビルド時に失敗します。
 *
 * This file acts as a hack to avoid build-time issues with expo-modules-core.
 * expo-modules-core tries to require('crypto') in uuid.web.js, which fails
 * during our build process.
 *
 * 【Goユーザー向け解説】
 * Web環境では、Goのcrypto/randパッケージに相当するグローバルなcryptoオブジェクトが
 * ブラウザに組み込まれています。このファイルはそれを単にエクスポートしています。
 *
 * 解決方法:
 * - Babelとtsconfigのエイリアス設定を使用して、crypto requireをこのファイルに
 *   リダイレクトしています
 *
 * Solution:
 * - We use a Babel and tsconfig alias to redirect crypto requires to this file
 *
 * @see babel.config.js - エイリアス設定
 * @see tsconfig.json - TypeScript path mapping
 * @author prf (original author)
 */

// HACK
// expo-modules-core tries to require('crypto') in uuid.web.js
// and while it tries to detect web crypto before doing so, our
// build fails when it tries to do this require. We use a babel
// and tsconfig alias to direct it here
// -prf

/**
 * グローバルcryptoオブジェクトをエクスポート
 * Export the global crypto object
 *
 * Web標準のCrypto APIを提供します。これには以下が含まれます:
 * - getRandomValues(): 暗号学的に安全な乱数生成
 * - subtle: 暗号化操作のためのSubtleCrypto API
 *
 * Provides the Web standard Crypto API including:
 * - getRandomValues(): Cryptographically secure random number generation
 * - subtle: SubtleCrypto API for cryptographic operations
 */
export default crypto
