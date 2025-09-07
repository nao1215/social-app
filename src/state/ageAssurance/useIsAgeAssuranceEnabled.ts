// Reactのメモ化フックをインポート
// Import React memoization hook
import {useMemo} from 'react'

// 地理的位置情報の状態を取得するフックをインポート
// Import hook to get geolocation status
import {useGeolocationStatus} from '#/state/geolocation'

/**
 * 年齢認証が有効化されているかを判定するカスタムフック
 * ユーザーの地理的位置に基づいて年齢制限が必要な地域にいるかを確認する
 * 年齢制限が必要な地域（例：英国、EU諸国など）では年齢認証が必要となる
 * 
 * Custom hook to determine if age assurance is enabled.
 * Checks if the user is in a region that requires age restrictions based on their geographic location.
 * Age assurance is required in age-restricted regions (e.g., UK, EU countries, etc.).
 * 
 * @returns {boolean} 年齢認証が有効かどうか / Whether age assurance is enabled
 */
export function useIsAgeAssuranceEnabled() {
  // 地理的位置情報の状態を取得
  // Get geolocation status
  const {status: geolocation} = useGeolocationStatus()

  return useMemo(() => {
    // 年齢制限が必要な地域にいるかをチェック
    // Check if user is in an age-restricted geographic region
    return !!geolocation?.isAgeRestrictedGeo
  }, [geolocation])
}
