// ライブラリとユーティリティ
import {networkRetry} from '#/lib/async/retry'                    // ネットワークリトライ処理
import {
  DEFAULT_GEOLOCATION_CONFIG,
  GEOLOCATION_CONFIG_URL,
} from '#/state/geolocation/const'                                // 位置情報設定の定数
import {emitGeolocationConfigUpdate} from '#/state/geolocation/events'  // 位置情報設定更新イベント
import {logger} from '#/state/geolocation/logger'                 // 位置情報専用ロガー
import {BAPP_CONFIG_DEV_BYPASS_SECRET, IS_DEV} from '#/env'       // 環境設定
import {type Device, device} from '#/storage'                    // デバイスストレージ

/**
 * リモートサーバーから位置情報設定を取得する関数
 * @param url - 位置情報設定を取得するAPI URL
 * @returns デバイス位置情報設定またはundefined
 */
async function getGeolocationConfig(
  url: string,
): Promise<Device['geolocation']> {
  // 開発環境では認証バイパスヘッダーを追加
  const res = await fetch(url, {
    headers: IS_DEV
      ? {
          'x-dev-bypass-secret': BAPP_CONFIG_DEV_BYPASS_SECRET,
        }
      : undefined,
  })

  if (!res.ok) {
    throw new Error(`config: fetch failed ${res.status}`)
  }

  const json = await res.json()

  if (json.countryCode) {
    /**
     * レスポンスから既知の値のみを抽出して設定オブジェクトを構築
     * 余分なフィールドは無視する
     */
    const config: Device['geolocation'] = {
      countryCode: json.countryCode,                              // 国コード（必須）
      regionCode: json.regionCode ?? undefined,                  // 地域コード（オプション）
      ageRestrictedGeos: json.ageRestrictedGeos ?? [],           // 年齢制限地域リスト
      ageBlockedGeos: json.ageBlockedGeos ?? [],                 // 年齢ブロック地域リスト
    }
    logger.debug(`config: success`)
    return config
  } else {
    return undefined  // countryCodeが存在しない場合は設定なし
  }
}

/**
 * このファイル内でのみ使用されるローカルPromise
 * 位置情報設定の解決処理の状態を追跡
 */
let geolocationConfigResolution: Promise<{success: boolean}> | undefined

/**
 * 位置情報設定の解決処理を開始する関数
 * アプリ起動時に一度だけ呼び出される
 *
 * この関数は決して例外をthrowしません（Fail-safe設計）
 *
 * 位置情報設定の解決を確実に待つには {@link ensureGeolocationConfigIsResolved} を使用
 */
export function beginResolveGeolocationConfig() {
  /**
   * デバッグ用コード - リモート位置情報サービスへのアクセスを無効化し、
   * テスト用データを適用する場合にコメントアウトを外す
   */
  // if (__DEV__) {
  //   geolocationConfigResolution = new Promise(y => y({success: true}))
  //   device.set(['deviceGeolocation'], undefined) // GPS データをクリア
  //   device.set(['geolocation'], DEFAULT_GEOLOCATION_CONFIG) // bapp-config データをクリア
  //   return
  // }

  geolocationConfigResolution = new Promise(async resolve => {
    let success = true

    try {
      // 一度だけ試行、高速失敗
      const config = await getGeolocationConfig(GEOLOCATION_CONFIG_URL)
      if (config) {
        device.set(['geolocation'], config)        // デバイスストレージに保存
        emitGeolocationConfigUpdate(config)        // 設定更新イベントを発火
      } else {
        // エンドポイントは通常すべての失敗でthrowするはずだが、念のため
        throw new Error(
          `geolocation config: nothing returned from initial request`,
        )
      }
    } catch (e: any) {
      success = false

      logger.debug(`config: failed initial request`, {
        safeMessage: e.message,
      })

      // デフォルト設定にフォールバック
      device.set(['geolocation'], DEFAULT_GEOLOCATION_CONFIG)

      // バックグラウンドで3回リトライ（awaitしない、デフォルト設定で進行）
      networkRetry(3, () => getGeolocationConfig(GEOLOCATION_CONFIG_URL))
        .then(config => {
          if (config) {
            device.set(['geolocation'], config)
            emitGeolocationConfigUpdate(config)
            success = true
          } else {
            // エンドポイントは通常すべての失敗でthrowするはずだが、念のため
            throw new Error(`config: nothing returned from retries`)
          }
        })
        .catch((e: any) => {
          // 完全失敗時はクローズドポリシー（安全側に倒す）
          logger.debug(`config: failed retries`, {
            safeMessage: e.message,
          })
        })
    } finally {
      resolve({success})
    }
  })
}

/**
 * 位置情報設定が解決されているか、少なくとも一度は試行されていることを確認する関数
 * 後続のリトライはこのawaitではキャッチされず、{@link emitGeolocationConfigUpdate} 経由で報告される
 */
export async function ensureGeolocationConfigIsResolved() {
  if (!geolocationConfigResolution) {
    throw new Error(`config: beginResolveGeolocationConfig not called yet`)
  }

  // キャッシュされた設定があるかチェック
  const cached = device.get(['geolocation'])
  if (cached) {
    logger.debug(`config: using cache`)                          // キャッシュを使用
  } else {
    logger.debug(`config: no cache`)                             // キャッシュなし
    const {success} = await geolocationConfigResolution          // 解決処理の完了を待機
    if (success) {
      logger.debug(`config: resolved`)                           // 解決成功
    } else {
      logger.info(`config: failed to resolve`)                  // 解決失敗（デフォルト設定使用）
    }
  }
}
