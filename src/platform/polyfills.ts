/**
 * React Native プラットフォーム向けポリフィルモジュール
 * Polyfills module for React Native platform
 *
 * このモジュールは、React Native（iOS/Android）環境で不足している
 * Web標準APIのポリフィルを提供します。
 *
 * This module provides polyfills for Web standard APIs missing in
 * React Native (iOS/Android) environments.
 *
 * 【Goユーザー向け解説】
 * React Nativeはネイティブアプリ環境で動作するため、Web APIの一部が利用できません。
 * このファイルはそれらのAPIをJavaScript実装で補完します。
 * .ts拡張子（.webなし）のファイルは、iOS/Androidビルド時に使用されます。
 *
 * 提供されるポリフィル:
 * - URL API: URLの解析と操作（react-native-url-polyfill）
 * - TextEncoder/TextDecoder: UTF-8エンコーディング/デコーディング（fast-text-encoding）
 * - atob: Base64デコード関数（グローバル関数として追加）
 *
 * @see https://github.com/charpeni/react-native-url-polyfill
 * @see https://github.com/inexorabletash/text-encoding
 * @see https://github.com/MaxArt2501/base64-js
 */

// React Native向けURL APIポリフィル（自動インストール）
// URL API polyfill for React Native (auto-install)
import 'react-native-url-polyfill/auto'

// TextEncoder/TextDecoderポリフィル（UTF-8テキストエンコーディング）
// TextEncoder/TextDecoder polyfill (UTF-8 text encoding)
import 'fast-text-encoding'
export {}

/**
 * Base64デコード実装
 * Base64 decode implementation
 *
 * このコードは MaxArt2501 の base64-js ライブラリから取得しました。
 * This code is from MaxArt2501's base64-js library.
 *
 * @license MIT
 * @copyright Copyright (c) 2014 MaxArt2501
 * @see https://github.com/MaxArt2501/base64-js
 *
 * 【Goユーザー向け解説】
 * Goのencoding/base64.StdEncoding.DecodeString()に相当する機能です。
 * Web標準のatob()関数をグローバルスコープに追加します。
 */

/**
https://github.com/MaxArt2501/base64-js
The MIT License (MIT)
Copyright (c) 2014 MaxArt2501
 */

// Base64文字セット（64文字 + パディング文字'='）
// Base64 character set (64 characters + padding character '=')
const b64 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/='

// Base64形式の正規表現（形式チェック用）
// Regular expression to check formal correctness of base64 encoded strings
const b64re =
  /^(?:[A-Za-z\d+\/]{4})*?(?:[A-Za-z\d+\/]{2}(?:==)?|[A-Za-z\d+\/]{3}=?)?$/

/**
 * atob関数: Base64文字列をデコード
 * atob function: Decode Base64 string
 *
 * Base64エンコードされた文字列をバイナリ文字列にデコードします。
 * Decodes a Base64-encoded string to a binary string.
 *
 * @param str - Base64エンコードされた文字列
 * @returns デコードされたバイナリ文字列
 *
 * @throws {TypeError} 不正なBase64文字列の場合
 *
 * 【仕様】
 * - ホワイトスペース（\t, \n, \f, \r, ' '）は自動的に除去されます
 * - パディング文字'='は必要に応じて自動補完されます
 * - 4文字ごとのブロックを3バイトにデコードします
 */
globalThis.atob = (str: string): string => {
  // atob can work with strings with whitespaces, even inside the encoded part,
  // but only \t, \n, \f, \r and ' ', which can be stripped.

  // ホワイトスペースを除去（Base64仕様に準拠）
  // Strip whitespace (compliant with Base64 specification)
  str = String(str).replace(/[\t\n\f\r ]+/g, '')

  // Base64形式の妥当性チェック
  // Validate Base64 format
  if (!b64re.test(str)) {
    throw new TypeError(
      "Failed to execute 'atob' on 'Window': The string to be decoded is not correctly encoded.",
    )
  }

  // Adding the padding if missing, for simplicity
  // パディング文字を補完（文字列長を4の倍数にする）
  // Add padding characters (make string length a multiple of 4)
  str += '=='.slice(2 - (str.length & 3))

  // デコード用変数
  // Variables for decoding
  var bitmap,  // 24ビットのビットマップ（4文字 → 3バイト）
    result = '', // デコード結果
    r1,          // 3文字目のインデックス
    r2,          // 4文字目のインデックス
    i = 0        // ループカウンター

  // 4文字ずつ処理してデコード
  // Process 4 characters at a time for decoding
  for (; i < str.length; ) {
    // 4文字を24ビットのビットマップに変換
    // Convert 4 characters to 24-bit bitmap
    bitmap =
      (b64.indexOf(str.charAt(i++)) << 18) | // 1文字目: ビット18-23
      (b64.indexOf(str.charAt(i++)) << 12) | // 2文字目: ビット12-17
      ((r1 = b64.indexOf(str.charAt(i++))) << 6) | // 3文字目: ビット6-11
      (r2 = b64.indexOf(str.charAt(i++)))           // 4文字目: ビット0-5

    // ビットマップから文字列に変換（パディング考慮）
    // Convert bitmap to string (considering padding)
    result +=
      r1 === 64 // 3文字目がパディング（'='）の場合
        ? String.fromCharCode((bitmap >> 16) & 255) // 1バイトのみ
        : r2 === 64 // 4文字目がパディング（'='）の場合
          ? String.fromCharCode((bitmap >> 16) & 255, (bitmap >> 8) & 255) // 2バイト
          : String.fromCharCode( // パディングなし
              (bitmap >> 16) & 255, // 1バイト目
              (bitmap >> 8) & 255,  // 2バイト目
              bitmap & 255,         // 3バイト目
            )
  }

  // デコード結果を返す
  // Return decoded result
  return result
}
