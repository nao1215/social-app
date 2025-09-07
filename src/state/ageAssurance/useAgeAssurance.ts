// Reactのメモ化フックをインポート
// Import React memoization hook
import {useMemo} from 'react'

// 年齢認証コンテキストフックをインポート
// Import age assurance context hook
import {useAgeAssuranceContext} from '#/state/ageAssurance'
// 年齢認証専用のロガーをインポート
// Import age assurance specific logger
import {logger} from '#/state/ageAssurance/util'
// ユーザー設定クエリフックをインポート
// Import user preferences query hook
import {usePreferencesQuery} from '#/state/queries/preferences'

/**
 * 年齢認証情報の拡張型定義
 * 基本的な年齢認証コンテキストにユーザーの自己申告年齢情報を追加する
 * 
 * Extended age assurance information type definition.
 * Adds user's self-declared age information to basic age assurance context.
 */
type AgeAssurance = ReturnType<typeof useAgeAssuranceContext> & {
  /**
   * ユーザーが設定で申告した年齢（存在する場合）
   * 
   * The age the user has declared in their preferences, if any.
   */
  declaredAge: number | undefined
  /**
   * ユーザーが18歳未満の年齢を申告しているかを示す
   * 
   * Indicates whether the user has declared an age under 18.
   */
  isDeclaredUnderage: boolean
}

/**
 * 年齢認証状態とユーザーの自己申告年齢に基づく包括的な年齢情報を提供するフック
 * より使いやすいインターフェースを提供するため、{@link useAgeAssuranceContext}の代わりにこちらを使用する
 * 年齢制限の判定や未成年者の識別に必要な全ての情報を統合する
 * 
 * Hook providing comprehensive age information based on age assurance status and the user's
 * declared age. Use this instead of {@link useAgeAssuranceContext} to get a
 * more user-friendly interface that integrates all information needed for age restriction
 * determination and minor identification.
 * 
 * @returns {AgeAssurance} 年齢認証と自己申告年齢を統合した情報 / Integrated age assurance and self-declared age information
 */
export function useAgeAssurance(): AgeAssurance {
  // 基本的な年齢認証コンテキストを取得
  // Get basic age assurance context
  const aa = useAgeAssuranceContext()
  // ユーザー設定の取得状態と設定データを取得
  // Get user preferences loading state and data
  const {isFetched: preferencesLoaded, data: preferences} =
    usePreferencesQuery()
  // ユーザーが申告した年齢を取得
  // Get user's declared age
  const declaredAge = preferences?.userAge

  return useMemo(() => {
    // 年齢認証とユーザー設定の両方が読み込み完了しているかチェック
    // Check if both age assurance and user preferences are loaded
    const isReady = aa.isReady && preferencesLoaded
    // ユーザーが18歳未満であると申告しているかを判定
    // Determine if user has declared being under 18
    const isDeclaredUnderage =
      declaredAge !== undefined ? declaredAge < 18 : false
    // 統合された年齢認証状態を構築
    // Build integrated age assurance state
    const state: AgeAssurance = {
      isReady, // データの準備完了状態 / Data ready state
      status: aa.status, // サーバー認証状態 / Server verification status
      lastInitiatedAt: aa.lastInitiatedAt, // 最後の認証試行時刻 / Last verification attempt time
      isAgeRestricted: aa.isAgeRestricted, // 年齢制限適用状態 / Age restriction applied state
      declaredAge, // 自己申告年齢 / Self-declared age
      isDeclaredUnderage, // 未成年申告状態 / Declared underage state
    }
    // デバッグ用に状態をログ出力
    // Log state for debugging
    logger.debug(`state`, state)
    return state
  }, [aa, preferencesLoaded, declaredAge])
}
