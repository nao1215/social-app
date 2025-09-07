/**
 * デバイスの位置情報を表す基本的な型定義
 * GPS情報やIP情報から取得される国・地域コードを格納
 */
export type DeviceLocation = {
  /** ISO国コード（例: 'US', 'JP'）- 位置情報が取得できない場合はundefined */
  countryCode: string | undefined
  /** 地域・州コード（例: 'CA', 'NY'）- 取得できない場合やサポートされていない国ではundefined */
  regionCode: string | undefined
}

/**
 * 位置情報に基づく年齢制限状態を含む拡張された位置情報ステータス
 * DeviceLocationの基本情報に加えて、年齢制限に関する判定結果を含む
 */
export type GeolocationStatus = DeviceLocation & {
  /** この地域が年齢制限対象地域かどうか（一部機能に制限あり） */
  isAgeRestrictedGeo: boolean
  /** この地域が年齢ブロック対象地域かどうか（アクセス自体が制限される） */
  isAgeBlockedGeo: boolean
}
