// プラットフォーム検出ユーティリティ
// Platform detection utilities
import {Platform} from 'react-native' // React Nativeプラットフォーム情報

// プラットフォーム判定定数
// Platform detection constants
export const isIOS = Platform.OS === 'ios'              // iOSかどうか
export const isAndroid = Platform.OS === 'android'      // Androidかどうか
export const isNative = isIOS || isAndroid              // ネイティブアプリかどうか
export const isWeb = !isNative                          // Webかどうか
export const isMobileWebMediaQuery = 'only screen and (max-width: 1300px)' // モバイルWebメディアクエリ
export const isMobileWeb =                              // モバイルWebかどうかの判定
  isWeb &&
  // @ts-ignore we know window exists -prf
  global.window.matchMedia(isMobileWebMediaQuery)?.matches
export const isIPhoneWeb = isWeb && /iPhone/.test(navigator.userAgent) // iPhone Web版かどうか
