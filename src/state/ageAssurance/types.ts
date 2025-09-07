// AT ProtocolのBlueSky未承認定義をインポート
// Import BlueSky unspecced definitions from AT Protocol
import {type AppBskyUnspeccedDefs} from '@atproto/api'
// React Query のクエリオブザーバー基底結果型をインポート
// Import query observer base result type from React Query
import {type QueryObserverBaseResult} from '@tanstack/react-query'

/**
 * 年齢認証コンテキストの型定義
 * 年齢認証の状態と制限情報を管理するためのコンテキスト型
 * 
 * Age assurance context type definition.
 * Context type for managing age verification state and restriction information.
 */
export type AgeAssuranceContextType = {
  /**
   * 年齢認証の状態がサーバーから取得済みかどうか
   * ユーザーが年齢認証が不要な地域にいる場合、または年齢認証が無効な場合は常に `true`
   * 
   * Whether the age assurance state has been fetched from the server. If user
   * is not in a region that requires AA, or AA is otherwise disabled, this
   * will always be `true`.
   */
  isReady: boolean
  /**
   * サーバーが報告するユーザーの年齢認証プロセスの状態
   * 
   * The server-reported status of the user's age verification process.
   */
  status: AppBskyUnspeccedDefs.AgeAssuranceState['status']
  /**
   * ユーザーが年齢認証の状態を最後に試行した時刻
   * 
   * The last time the age assurance state was attempted by the user.
   */
  lastInitiatedAt: AppBskyUnspeccedDefs.AgeAssuranceState['lastInitiatedAt']
  /**
   * ユーザーの地域の要件とサーバー提供の年齢認証状態に基づいて年齢制限が適用されているかを示す
   * ユーザーの自己申告年齢は考慮されない。年齢認証が無効な場合は常に `false`
   * 
   * Indicates the user is age restricted based on the requirements of their
   * region, and their server-provided age assurance status. Does not factor in
   * the user's declared age. If AA is otherwise disabled, this will always be
   * `false`.
   */
  isAgeRestricted: boolean
}

/**
 * 年齢認証API コンテキストの型定義
 * 年齢認証状態の再取得など、API操作を提供するコンテキスト型
 * 
 * Age assurance API context type definition.
 * Context type for providing API operations such as refetching age assurance state.
 */
export type AgeAssuranceAPIContextType = {
  /**
   * サーバーから年齢認証状態を再取得して更新する
   * 
   * Refreshes the age assurance state by fetching it from the server.
   */
  refetch: QueryObserverBaseResult['refetch']
}
