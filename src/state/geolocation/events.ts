// Node.jsスタイルのイベント管理ライブラリをインポート - React Nativeで利用可能
import EventEmitter from 'eventemitter3'

// ストレージのデバイス型定義をインポート
import {type Device} from '#/storage'

// 位置情報イベント管理用のイベントエミッター
const events = new EventEmitter()
// 位置情報設定更新イベントの識別子
const EVENT = 'geolocation-config-updated'

/**
 * 位置情報設定が更新されたことを通知するイベントを発行する
 * アプリ全体に設定変更を伝播するために使用
 */
export const emitGeolocationConfigUpdate = (config: Device['geolocation']) => {
  events.emit(EVENT, config)
}

/**
 * 位置情報設定更新イベントのリスナーを登録する
 * 
 * @param listener 設定更新時に呼び出されるコールバック関数
 * @returns リスナーの登録を解除する関数
 */
export const onGeolocationConfigUpdate = (
  listener: (config: Device['geolocation']) => void,
) => {
  events.on(EVENT, listener)
  // cleanup関数を返す - useEffectの戻り値として使用可能
  return () => {
    events.off(EVENT, listener)
  }
}
