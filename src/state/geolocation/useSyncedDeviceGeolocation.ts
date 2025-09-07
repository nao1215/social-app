// Reactのエフェクトと参照フックをインポート
import {useEffect, useRef} from 'react'
// Expo Location - 位置情報許可状態の監視機能を使用
import * as Location from 'expo-location'

// 位置情報専用のロガーをインポート
import {logger} from '#/state/geolocation/logger'
// デバイス位置情報取得のユーティリティ関数をインポート
import {getDeviceGeolocation} from '#/state/geolocation/util'
// デバイスストレージの機能をインポート
import {device, useStorage} from '#/storage'

/**
 * Hook to get and sync the device geolocation from the device GPS and store it
 * using device storage. If permissions are not granted, it will clear any cached
 * storage value.
 * 
 * デバイスGPSから位置情報を取得し、デバイスストレージに保存・同期するHook
 * 許可が与えられていない場合、キャッシュされたストレージ値をクリアする
 */
export function useSyncedDeviceGeolocation() {
  // 同期処理の重複実行を防ぐためのフラグ（セッション中一度のみ実行）
  const synced = useRef(false)
  // フォアグラウンド位置情報許可状態を監視
  const [status] = Location.useForegroundPermissions()
  // デバイス位置情報のストレージ状態管理
  const [deviceGeolocation, setDeviceGeolocation] = useStorage(device, [
    'deviceGeolocation',
  ])

  useEffect(() => {
    async function get() {
      // no need to set this more than once per session
      // セッション中に複数回設定する必要はない
      if (synced.current) return

      logger.debug('useSyncedDeviceGeolocation: checking perms')

      if (status?.granted) {
        // 許可が与えられている場合、位置情報を取得
        const location = await getDeviceGeolocation()
        if (location) {
          logger.debug('useSyncedDeviceGeolocation: syncing location')
          // 取得した位置情報をストレージに保存
          setDeviceGeolocation(location)
          // 同期完了フラグを設定（重複実行を防止）
          synced.current = true
        }
      } else {
        // 許可が与えられていない場合の処理
        const hasCachedValue = device.get(['deviceGeolocation']) !== undefined

        /**
         * If we have a cached value, but user has revoked permissions,
         * quietly (will take effect lazily) clear this out.
         * 
         * キャッシュ値があるがユーザーが許可を取り消した場合、
         * 静かに（遅延実行で）クリアする
         */
        if (hasCachedValue) {
          logger.debug(
            'useSyncedDeviceGeolocation: clearing cached location, perms revoked',
          )
          // 許可が取り消されたため、キャッシュされた位置情報を削除
          device.set(['deviceGeolocation'], undefined)
        }
      }
    }

    // 非同期処理でエラーが発生した場合のハンドリング
    get().catch(e => {
      logger.error('useSyncedDeviceGeolocation: failed to sync', {
        safeMessage: e,
      })
    })
  }, [status, setDeviceGeolocation])

  // [現在の位置情報, 位置情報設定関数] のタプルを返す（readonlyタプル型）
  return [deviceGeolocation, setDeviceGeolocation] as const
}
