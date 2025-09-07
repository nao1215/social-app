// Expo Locationから位置情報取得関連の機能をインポート
import {
  getCurrentPositionAsync, // 現在位置の緯度経度を取得
  type LocationGeocodedAddress, // ジオコーディング結果の型定義
  reverseGeocodeAsync, // 緯度経度から住所情報を取得（リバースジオコーディング）
} from 'expo-location'

// 位置情報関連のロガーをインポート
import {logger} from '#/state/geolocation/logger'
// デバイス位置情報の型定義をインポート
import {type DeviceLocation} from '#/state/geolocation/types'
// ストレージのデバイス型定義をインポート
import {type Device} from '#/storage'

/**
 * Maps full US region names to their short codes.
 * アメリカ合衆国の州名（フルネーム）を州コード（略称）にマッピングするオブジェクト
 *
 * Context: in some cases, like on Android, we get the full region name instead
 * of the short code. We may need to expand this in the future to other
 * countries, hence the prefix.
 * 
 * 背景：Androidなどの一部のケースでは、略称ではなくフルネームの州名が取得される
 * 将来的に他国に拡張する可能性があるため、USプレフィックスを付けている
 */
export const USRegionNameToRegionCode: {
  [regionName: string]: string
} = {
  Alabama: 'AL',
  Alaska: 'AK',
  Arizona: 'AZ',
  Arkansas: 'AR',
  California: 'CA',
  Colorado: 'CO',
  Connecticut: 'CT',
  Delaware: 'DE',
  Florida: 'FL',
  Georgia: 'GA',
  Hawaii: 'HI',
  Idaho: 'ID',
  Illinois: 'IL',
  Indiana: 'IN',
  Iowa: 'IA',
  Kansas: 'KS',
  Kentucky: 'KY',
  Louisiana: 'LA',
  Maine: 'ME',
  Maryland: 'MD',
  Massachusetts: 'MA',
  Michigan: 'MI',
  Minnesota: 'MN',
  Mississippi: 'MS',
  Missouri: 'MO',
  Montana: 'MT',
  Nebraska: 'NE',
  Nevada: 'NV',
  ['New Hampshire']: 'NH',
  ['New Jersey']: 'NJ',
  ['New Mexico']: 'NM',
  ['New York']: 'NY',
  ['North Carolina']: 'NC',
  ['North Dakota']: 'ND',
  Ohio: 'OH',
  Oklahoma: 'OK',
  Oregon: 'OR',
  Pennsylvania: 'PA',
  ['Rhode Island']: 'RI',
  ['South Carolina']: 'SC',
  ['South Dakota']: 'SD',
  Tennessee: 'TN',
  Texas: 'TX',
  Utah: 'UT',
  Vermont: 'VT',
  Virginia: 'VA',
  Washington: 'WA',
  ['West Virginia']: 'WV',
  Wisconsin: 'WI',
  Wyoming: 'WY',
}

/**
 * Normalizes a `LocationGeocodedAddress` into a `DeviceLocation`.
 * `LocationGeocodedAddress`を`DeviceLocation`に正規化する関数
 *
 * We don't want or care about the full location data, so we trim it down and
 * normalize certain fields, like region, into the format we need.
 * 
 * すべての位置情報データは不要なため、必要な部分のみを抽出し、
 * 州などのフィールドを必要な形式に正規化する
 */
export function normalizeDeviceLocation(
  location: LocationGeocodedAddress,
): DeviceLocation {
  let {isoCountryCode, region} = location

  if (region) {
    if (isoCountryCode === 'US') {
      // アメリカの場合、フルネームの州名を略称に変換（見つからない場合は元の値を使用）
      region = USRegionNameToRegionCode[region] ?? region
    }
  }

  return {
    countryCode: isoCountryCode ?? undefined,
    regionCode: region ?? undefined,
  }
}

/**
 * Combines precise location data with the geolocation config fetched from the
 * IP service, with preference to the precise data.
 * 
 * 精密な位置情報データとIPサービスから取得した位置情報設定を統合する
 * 精密なデータが利用可能な場合はそちらを優先する
 */
export function mergeGeolocation(
  location?: DeviceLocation,
  config?: Device['geolocation'],
): DeviceLocation {
  // GPS位置情報に国コードがある場合、それを優先して使用
  if (location?.countryCode) return location
  // GPS情報がない場合、IP由来の設定情報を使用
  return {
    countryCode: config?.countryCode,
    regionCode: config?.regionCode,
  }
}

/**
 * Computes the geolocation status (age-restricted, age-blocked) based on the
 * given location and geolocation config. `location` here should be merged with
 * `mergeGeolocation()` ahead of time if needed.
 * 
 * 指定された位置情報と位置情報設定に基づいて、位置情報ステータス
 * （年齢制限あり、年齢ブロック）を計算する
 * `location`は必要に応じて事前に`mergeGeolocation()`でマージしておくこと
 */
export function computeGeolocationStatus(
  location: DeviceLocation,
  config: Device['geolocation'],
) {
  /**
   * We can't do anything if we don't have this data.
   * 国コードがない場合は判定不可能
   */
  if (!location.countryCode) {
    return {
      ...location,
      isAgeRestrictedGeo: false,
      isAgeBlockedGeo: false,
    }
  }

  // 年齢制限対象地域かどうかを判定
  const isAgeRestrictedGeo = config?.ageRestrictedGeos?.some(rule => {
    if (rule.countryCode === location.countryCode) {
      if (!rule.regionCode) {
        return true // whole country is blocked - 国全体がブロック対象
      } else if (rule.regionCode === location.regionCode) {
        return true // 特定の州・地域がブロック対象
      }
    }
  })

  // 年齢ブロック対象地域かどうかを判定
  const isAgeBlockedGeo = config?.ageBlockedGeos?.some(rule => {
    if (rule.countryCode === location.countryCode) {
      if (!rule.regionCode) {
        return true // whole country is blocked - 国全体がブロック対象
      } else if (rule.regionCode === location.regionCode) {
        return true // 特定の州・地域がブロック対象
      }
    }
  })

  return {
    ...location,
    isAgeRestrictedGeo: !!isAgeRestrictedGeo,
    isAgeBlockedGeo: !!isAgeBlockedGeo,
  }
}

/**
 * デバイスの現在位置情報を取得し、国コードと州コードを含むDeviceLocationを返す
 * GPS情報から逆ジオコーディングを使用して住所情報に変換する
 */
export async function getDeviceGeolocation(): Promise<DeviceLocation> {
  try {
    // 現在のGPS座標を取得
    const geocode = await getCurrentPositionAsync()
    // 緯度経度から住所情報を取得（逆ジオコーディング）
    const locations = await reverseGeocodeAsync({
      latitude: geocode.coords.latitude,
      longitude: geocode.coords.longitude,
    })
    // 最初の結果を使用（通常は最も正確）
    const location = locations.at(0)
    // 取得した住所情報を正規化
    const normalized = location ? normalizeDeviceLocation(location) : undefined
    return {
      countryCode: normalized?.countryCode ?? undefined,
      regionCode: normalized?.regionCode ?? undefined,
    }
  } catch (e) {
    // 位置情報取得に失敗した場合はエラーをログに記録
    logger.error('getDeviceGeolocation: failed', {
      safeMessage: e,
    })
    // undefined値で初期化したオブジェクトを返す
    return {
      countryCode: undefined,
      regionCode: undefined,
    }
  }
}
