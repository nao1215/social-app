// React核心ライブラリ - Contextとフック機能を使用
import React from 'react'

// デフォルトの位置情報設定と状態をインポート
import {
  DEFAULT_GEOLOCATION_CONFIG,
  DEFAULT_GEOLOCATION_STATUS,
} from '#/state/geolocation/const'
// 位置情報設定更新イベントの監視機能をインポート
import {onGeolocationConfigUpdate} from '#/state/geolocation/events'
// 位置情報専用のロガーをインポート
import {logger} from '#/state/geolocation/logger'
// 位置情報関連の型定義をインポート
import {
  type DeviceLocation,
  type GeolocationStatus,
} from '#/state/geolocation/types'
// デバイス位置情報の同期管理Hookをインポート
import {useSyncedDeviceGeolocation} from '#/state/geolocation/useSyncedDeviceGeolocation'
// 位置情報の計算と統合を行うユーティリティ関数をインポート
import {
  computeGeolocationStatus,
  mergeGeolocation,
} from '#/state/geolocation/util'
// ストレージ関連の型定義と実体をインポート
import {type Device, device} from '#/storage'

// 位置情報関連のすべての機能を外部に公開
export * from '#/state/geolocation/config'
export * from '#/state/geolocation/types'
export * from '#/state/geolocation/util'

// デバイス位置情報データを提供するContextの型定義
type DeviceGeolocationContext = {
  deviceGeolocation: DeviceLocation | undefined
}

// デバイス位置情報を更新するAPIを提供するContextの型定義
type DeviceGeolocationAPIContext = {
  setDeviceGeolocation(deviceGeolocation: DeviceLocation): void
}

// 位置情報設定を提供するContextの型定義
type GeolocationConfigContext = {
  config: Device['geolocation']
}

// 最終的な位置情報ステータスを提供するContextの型定義
type GeolocationStatusContext = {
  /**
   * Merged geolocation from config and device GPS (if available).
   * 設定とデバイスGPS（利用可能な場合）から統合された位置情報
   */
  location: DeviceLocation
  /**
   * Computed geolocation status based on the merged location and config.
   * 統合された位置情報と設定に基づいて計算された位置情報ステータス
   */
  status: GeolocationStatus
}

// デバイス位置情報データを管理するReact Context
const DeviceGeolocationContext = React.createContext<DeviceGeolocationContext>({
  deviceGeolocation: undefined,
})
DeviceGeolocationContext.displayName = 'DeviceGeolocationContext'

// デバイス位置情報更新APIを管理するReact Context
const DeviceGeolocationAPIContext =
  React.createContext<DeviceGeolocationAPIContext>({
    setDeviceGeolocation: () => {},
  })
DeviceGeolocationAPIContext.displayName = 'DeviceGeolocationAPIContext'

// 位置情報設定を管理するReact Context
const GeolocationConfigContext = React.createContext<GeolocationConfigContext>({
  config: DEFAULT_GEOLOCATION_CONFIG,
})
GeolocationConfigContext.displayName = 'GeolocationConfigContext'

// 最終的な位置情報ステータスを管理するReact Context
const GeolocationStatusContext = React.createContext<GeolocationStatusContext>({
  location: {
    countryCode: undefined,
    regionCode: undefined,
  },
  status: DEFAULT_GEOLOCATION_STATUS,
})
GeolocationStatusContext.displayName = 'GeolocationStatusContext'

/**
 * Provider of geolocation config and computed geolocation status.
 * 位置情報設定と計算された位置情報ステータスを提供するプロバイダー
 */
export function GeolocationStatusProvider({
  children,
}: {
  children: React.ReactNode
}) {
  // 上位Contextからデバイス位置情報を取得
  const {deviceGeolocation} = React.useContext(DeviceGeolocationContext)
  // 位置情報設定の状態管理（初期値はストレージまたはデフォルト設定）
  const [config, setConfig] = React.useState(() => {
    const initial = device.get(['geolocation']) || DEFAULT_GEOLOCATION_CONFIG
    return initial
  })

  // 位置情報設定の更新イベントを監視し、状態を同期
  React.useEffect(() => {
    return onGeolocationConfigUpdate(config => {
      setConfig(config!)
    })
  }, [])

  // 設定用Contextの値をメモ化（パフォーマンス最適化）
  const configContext = React.useMemo(() => ({config}), [config])
  // ステータス用Contextの値を計算してメモ化
  const statusContext = React.useMemo(() => {
    if (deviceGeolocation?.countryCode) {
      logger.debug('has device geolocation available')
    }
    // GPS位置情報と設定情報を統合
    const geolocation = mergeGeolocation(deviceGeolocation, config)
    // 統合された位置情報に基づいて最終ステータスを計算
    const status = computeGeolocationStatus(geolocation, config)
    // ensure this remains debug and never leaves device
    // デバッグ情報としてログに記録（本番環境では記録されない）
    logger.debug('result', {deviceGeolocation, geolocation, status, config})
    return {location: geolocation, status}
  }, [config, deviceGeolocation])

  return (
    <GeolocationConfigContext.Provider value={configContext}>
      <GeolocationStatusContext.Provider value={statusContext}>
        {children}
      </GeolocationStatusContext.Provider>
    </GeolocationConfigContext.Provider>
  )
}

/**
 * Provider of providers. Provides device geolocation data to lower-level
 * `GeolocationStatusProvider`, and device geolocation APIs to children.
 * 
 * プロバイダーのプロバイダー。下位の`GeolocationStatusProvider`にデバイス位置情報データを提供し、
 * 子コンポーネントにデバイス位置情報APIを提供する
 */
export function Provider({children}: {children: React.ReactNode}) {
  // デバイス位置情報の同期管理Hook（ストレージとGPSの自動同期）
  const [deviceGeolocation, setDeviceGeolocation] = useSyncedDeviceGeolocation()

  // デバイス位置情報設定用のコールバック関数（メモ化により再レンダリング最適化）
  const handleSetDeviceGeolocation = React.useCallback(
    (location: DeviceLocation) => {
      logger.debug('setting device geolocation')
      // undefined値を明示的に処理して正規化
      setDeviceGeolocation({
        countryCode: location.countryCode ?? undefined,
        regionCode: location.regionCode ?? undefined,
      })
    },
    [setDeviceGeolocation],
  )

  return (
    <DeviceGeolocationAPIContext.Provider
      value={React.useMemo(
        () => ({setDeviceGeolocation: handleSetDeviceGeolocation}),
        [handleSetDeviceGeolocation],
      )}>
      <DeviceGeolocationContext.Provider
        value={React.useMemo(() => ({deviceGeolocation}), [deviceGeolocation])}>
        <GeolocationStatusProvider>{children}</GeolocationStatusProvider>
      </DeviceGeolocationContext.Provider>
    </DeviceGeolocationAPIContext.Provider>
  )
}

/**
 * デバイス位置情報操作APIにアクセスするためのReact Hook
 * 位置情報の手動設定が必要な場面で使用
 */
export function useDeviceGeolocationApi() {
  return React.useContext(DeviceGeolocationAPIContext)
}

/**
 * 位置情報設定（年齢制限情報など）にアクセスするためのReact Hook
 * サーバーから取得した位置情報ルール設定を参照する際に使用
 */
export function useGeolocationConfig() {
  return React.useContext(GeolocationConfigContext)
}

/**
 * 最終的な位置情報ステータスにアクセスするためのReact Hook
 * GPS・設定・年齢制限判定などが統合された最終結果を取得
 */
export function useGeolocationStatus() {
  return React.useContext(GeolocationStatusContext)
}
