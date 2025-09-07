// JWTデコード用ライブラリ（トークン解析用）
// JWT decoding library (for token analysis)
import {jwtDecode} from 'jwt-decode'

// 型ガード用ユーティリティ（オブジェクトのプロパティ存在チェック）
// Type guard utility (object property existence check)
import {hasProp} from '#/lib/type-guards'
// アプリケーションロガー / Application logger
import {logger} from '#/logger'
// 永続化データ管理モジュール / Persistent data management module
import * as persisted from '#/state/persisted'
// セッションアカウント型 / Session account type
import {SessionAccount} from './types'

/**
 * 最後にアクティブだったアカウントを読み込む関数
 * 永続化されたセッションデータから現在のアカウント情報を取得
 * 
 * Function to read the last active account
 * Retrieves current account info from persisted session data
 */
export function readLastActiveAccount() {
  // 永続化されたセッションデータを取得
  // Get persisted session data
  const {currentAccount, accounts} = persisted.get('session')
  // アカウント一覧から現在のアカウントのDIDに一致するものを検索
  // Find account matching the current account's DID from account list
  return accounts.find(a => a.did === currentAccount?.did)
}

/**
 * サインアップキューに入っているかどうかを判定する関数
 * アクセストークンを解析してサインアップ待ち状態かを確認
 * 
 * Function to determine if signup is queued
 * Analyzes access token to check if in signup waiting state
 */
export function isSignupQueued(accessJwt: string | undefined) {
  if (accessJwt) {
    try {
      // JWTをデコードしてセッションデータを取得
      // Decode JWT to get session data
      const sessData = jwtDecode(accessJwt)
      // スコープがサインアップキューかどうかをチェック
      // Check if scope indicates signup queue
      return (
        hasProp(sessData, 'scope') &&
        sessData.scope === 'com.atproto.signupQueued'
      )
    } catch (e) {
      // JWTデコードエラーの場合はfalseを返す
      // Return false if JWT decode error occurs
      return false
    }
  }
  return false
}

/**
 * セッションが期限切れかどうかを判定する関数
 * アクセストークンの有効期限を現在時刻と比較
 * 
 * Function to determine if session is expired
 * Compare access token expiration time with current time
 */
export function isSessionExpired(account: SessionAccount) {
  try {
    if (account.accessJwt) {
      // JWTをデコードして有効期限を取得
      // Decode JWT to get expiration time
      const decoded = jwtDecode(account.accessJwt)
      if (decoded.exp) {
        // 現在時刻と有効期限を比較（JWTのexpは秒単位なので1000倍してミリ秒に変換）
        // Compare current time with expiration time (JWT exp is in seconds, multiply by 1000 for milliseconds)
        const didExpire = Date.now() >= decoded.exp * 1000
        return didExpire
      }
    }
  } catch (e) {
    // JWTデコードエラー時のログ出力
    // Log output when JWT decode error occurs
    logger.error(`session: could not decode jwt`)
  }
  // トークンがない場合やエラーの場合は期限切れとみなす
  // Consider expired if no token or error occurs
  return true
}
