// Reactのコールバック機能をインポート - 関数の再作成を防ぐために使用
import {useCallback} from 'react'
// Expo Locationライブラリ - デバイスの位置情報機能にアクセス
import * as Location from 'expo-location'

// デバイス位置情報の型定義をインポート
import {type DeviceLocation} from '#/state/geolocation/types'
// 実際の位置情報取得処理のユーティリティ関数をインポート
import {getDeviceGeolocation} from '#/state/geolocation/util'

// 外部コンポーネントで比較に使用するため、PermissionStatusを再エクスポート
export {PermissionStatus} from 'expo-location'

/**
 * デバイス位置情報の許可を要求し、取得処理を行うReact Hook
 * 
 * @returns 位置情報許可要求と取得を実行する非同期関数
 * - granted: true の場合、許可が得られ位置情報も含む
 * - granted: false の場合、許可が拒否され詳細な状態情報を含む
 */
export function useRequestDeviceLocation(): () => Promise<
  | {
      granted: true
      location: DeviceLocation | undefined
    }
  | {
      granted: false
      status: {
        canAskAgain: boolean
        /**
         * Enum, use `PermissionStatus` export for comparisons
         * 列挙型、比較には `PermissionStatus` エクスポートを使用すること
         */
        permissionStatus: Location.PermissionStatus
      }
    }
> {
  return useCallback(async () => {
    // フォアグラウンド位置情報の許可を要求
    const status = await Location.requestForegroundPermissionsAsync()

    if (status.granted) {
      // 許可が得られた場合、実際の位置情報を取得して返す
      return {
        granted: true,
        location: await getDeviceGeolocation(),
      }
    } else {
      // 許可が拒否された場合、詳細な状態情報を含めて返す
      // この情報により、再度許可を求めることができるかどうかを判断可能
      return {
        granted: false,
        status: {
          canAskAgain: status.canAskAgain,
          permissionStatus: status.status,
        },
      }
    }
  }, [])
}
