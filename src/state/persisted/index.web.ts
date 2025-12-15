/**
 * 永続化ストレージ実装モジュール（Web版）
 *
 * このモジュールはWeb環境での永続化ストレージを実装します。
 * localStorageを使用し、複数タブ間でのデータ同期をBroadcastChannelとEventEmitterで実現。
 *
 * 【Goユーザー向け補足】
 * - localStorage: ブラウザのキー・バリュー型永続ストレージ（Goのファイルベースストレージに相当）
 * - BroadcastChannel: 同一オリジンの複数タブ間通信API（Goのpub/subパターンに相当）
 * - EventEmitter: イベント駆動型プログラミングのライブラリ（Goのchannelに似た概念）
 * - window.onstorage: ブラウザの他タブでのlocalStorage変更を検知するイベント
 */

// イベント駆動ライブラリ - タブ内でのイベント通知に使用
import EventEmitter from 'eventemitter3'

// ブラウザタブ間通信ライブラリ - 複数タブでのデータ同期に使用
import BroadcastChannel from '#/lib/broadcast'
// ログシステム - エラーやデバッグ情報の記録
import {logger} from '#/logger'
// スキーマ定義・バリデーション関数・デフォルト値
import {
  defaults,
  Schema,
  tryParse,
  tryStringify,
} from '#/state/persisted/schema'
// 永続化APIの型定義
import {PersistedApi} from './types'
// データ正規化ユーティリティ
import {normalizeData} from './util'

// スキーマ関連の型を外部に公開（re-export）
export type {PersistedAccount, Schema} from '#/state/persisted/schema'
export {defaults} from '#/state/persisted/schema'

/**
 * localStorageのキー名定数
 * アプリケーション全体の設定を保存するキー
 */
const BSKY_STORAGE = 'BSKY_STORAGE'

/**
 * ブロードキャストチャンネル
 * 同一オリジンの複数タブ間でメッセージを送受信するためのチャンネル
 * （Goのpub/subパターンに相当）
 */
const broadcast = new BroadcastChannel('BSKY_BROADCAST_CHANNEL')

/**
 * 更新イベント名定数
 * タブ間で設定更新を通知する際のイベント識別子
 */
const UPDATE_EVENT = 'BSKY_UPDATE'

/**
 * メモリ内の状態キャッシュ
 * localStorageからの頻繁な読み込みを避けるためのインメモリキャッシュ
 */
let _state: Schema = defaults

/**
 * イベントエミッター
 * このタブ内でのデータ更新を各コンポーネントに通知するためのイベント発火機構
 * （Goのchannelによるイベント通知に相当）
 */
const _emitter = new EventEmitter()

/**
 * 永続化システムの初期化関数（Web版）
 * アプリ起動時に呼ばれ、イベントリスナーを設定しlocalStorageからデータを読み込む
 *
 * 【Goユーザー向け補足】
 * イベントハンドラ設定: Goのgoroutineでchannelをlistenするパターンに相当
 */
export async function init() {
  // ブロードキャストメッセージハンドラの設定（他タブからのメッセージ受信）
  broadcast.onmessage = onBroadcastMessage
  // ストレージイベントハンドラの設定（他タブのlocalStorage変更検知）
  window.onstorage = onStorage
  // localStorageから初期データ読み込み（同期処理）
  const stored = readFromStorage()
  if (stored) {
    _state = stored  // 読み込み成功時、メモリキャッシュを更新
  }
}
init satisfies PersistedApi['init']

/**
 * 設定値取得関数
 * メモリキャッシュから指定されたキーの値を取得（同期処理）
 *
 * @param key 取得するキー名
 * @returns キーに対応する値
 */
export function get<K extends keyof Schema>(key: K): Schema[K] {
  return _state[key]
}
get satisfies PersistedApi['get']

/**
 * 設定値書き込み関数（Web版）
 * 指定されたキーに値を書き込み、localStorageに永続化し、他タブに変更を通知
 *
 * 【Goユーザー向け補足】
 * 複数タブ間の同期処理を含むため、以下の処理を順次実行：
 * 1. 他タブでの変更を確認してマージ
 * 2. 値の変更チェック（無駄な通知を避ける）
 * 3. データ正規化と永続化
 * 4. 他タブへのブロードキャスト
 *
 * @param key 書き込むキー名
 * @param value 書き込む値
 */
export async function write<K extends keyof Schema>(
  key: K,
  value: Schema[K],
): Promise<void> {
  // 他タブで既に更新されている可能性があるため、最新データを取得
  const next = readFromStorage()
  if (next) {
    // ストレージが別タブで更新されている場合、その最新データに書き込みを適用
    // この時点ではリスナーを発火しない（ブロードキャストイベントで発火される）
    _state = next
  }
  try {
    // 値が実質的に変更されていない場合はスキップ（最適化）
    // 主に無駄なブロードキャストを避けるため
    if (JSON.stringify({v: _state[key]}) === JSON.stringify({v: value})) {
      return  // 変更なし、早期リターン
    }
  } catch (e) {
    // JSON化失敗は無視して通常処理を続行
  }
  // データ正規化とメモリキャッシュ更新
  _state = normalizeData({
    ..._state,
    [key]: value,
  })
  // localStorageに書き込み（同期処理）
  writeToStorage(_state)
  // 他タブに更新を通知（新形式：キー指定）
  broadcast.postMessage({event: {type: UPDATE_EVENT, key}})
  // 後方互換性のため旧形式でも通知
  broadcast.postMessage({event: UPDATE_EVENT})
}
write satisfies PersistedApi['write']

/**
 * データ更新監視関数（Web版）
 * 指定されたキーの値が変更された際にコールバックを実行
 *
 * 【Goユーザー向け補足】
 * イベントリスナーの登録・解除パターン
 * 戻り値のクリーンアップ関数はReactのuseEffectで使用される
 *
 * @param key 監視対象のキー
 * @param cb 更新時のコールバック関数
 * @returns クリーンアップ関数（リスナー解除用）
 */
export function onUpdate<K extends keyof Schema>(
  key: K,
  cb: (v: Schema[K]) => void,
): () => void {
  // リスナー関数: 現在の値を取得してコールバックを実行
  const listener = () => cb(get(key))
  // 旧形式のイベントにもリスナー登録（後方互換性）
  _emitter.addListener('update', listener)
  // 新形式のキー指定イベントにリスナー登録
  _emitter.addListener('update:' + key, listener)
  // クリーンアップ関数を返却（リスナー解除用）
  return () => {
    _emitter.removeListener('update', listener)
    _emitter.removeListener('update:' + key, listener)
  }
}
onUpdate satisfies PersistedApi['onUpdate']

/**
 * ストレージ完全クリア関数（Web版）
 * localStorageからアプリデータを削除
 *
 * 【Goユーザー向け補足】
 * プライベートモードでは例外が発生するため、try-catchで処理
 */
export async function clearStorage() {
  try {
    localStorage.removeItem(BSKY_STORAGE)
  } catch (e: any) {
    // プライベートモードでは期待されるエラー、無視する
  }
}
clearStorage satisfies PersistedApi['clearStorage']

/**
 * ストレージイベントハンドラ
 * 他のタブでlocalStorageが変更された際に呼ばれるイベントハンドラ
 * （window.onstorageイベント用）
 *
 * 【Goユーザー向け補足】
 * ブラウザのストレージイベント: 他タブでのlocalStorage変更を自動検知
 */
function onStorage() {
  const next = readFromStorage()  // 最新データを読み込み
  if (next === _state) {
    return  // 変更なしの場合は何もしない
  }
  if (next) {
    _state = next  // メモリキャッシュを更新
    _emitter.emit('update')  // 更新イベントを発火
  }
}

/**
 * ブロードキャストメッセージハンドラ
 * 他のタブからのブロードキャストメッセージを処理
 *
 * 【Goユーザー向け補足】
 * MessageEvent: ブラウザのメッセージイベント型
 * data.event: イベントペイロード（Goのstruct messageに相当）
 *
 * @param event ブロードキャストメッセージイベント
 */
async function onBroadcastMessage({data}: MessageEvent) {
  // イベントタイプが更新イベントかチェック（新旧両形式に対応）
  if (
    typeof data === 'object' &&
    (data.event === UPDATE_EVENT || // 旧形式（後方互換）
      data.event?.type === UPDATE_EVENT)  // 新形式
  ) {
    // 他タブで更新された可能性があるため、最新状態を読み込み
    const next = readFromStorage()
    if (next === _state) {
      return  // 変更なし
    }
    if (next) {
      _state = next  // メモリキャッシュを更新
      // キー指定の更新イベントを発火（新形式）
      if (typeof data.event.key === 'string') {
        _emitter.emit('update:' + data.event.key)
      } else {
        // キー指定なしの更新イベント（旧形式、後方互換）
        _emitter.emit('update')
      }
    } else {
      // データ読み込み失敗時のエラーログ
      logger.error(
        `persisted state: handled update update from broadcast channel, but found no data`,
      )
    }
  }
}

/**
 * ストレージへの書き込み内部関数（Web版）
 * スキーマオブジェクトをJSON文字列化してlocalStorageに保存
 *
 * @param value 保存するスキーマオブジェクト
 */
function writeToStorage(value: Schema) {
  const rawData = tryStringify(value)  // JSON文字列化（バリデーション含む）
  if (rawData) {
    try {
      // localStorageに保存（同期処理）
      localStorage.setItem(BSKY_STORAGE, rawData)
    } catch (e) {
      // プライベートモードでは期待されるエラー、無視する
    }
  }
}

/**
 * 読み込みキャッシュ用変数
 * 同じJSON文字列を繰り返しパースすることを避けるためのキャッシュ
 * （パフォーマンス最適化）
 */
let lastRawData: string | undefined
let lastResult: Schema | undefined

/**
 * ストレージからの読み込み内部関数（Web版）
 * localStorageからJSON文字列を読み込み、パース・正規化
 * パフォーマンス向上のため、前回と同じデータの場合はキャッシュを返却
 *
 * 【Goユーザー向け補足】
 * キャッシュ機構: 同じデータの再パースを避ける最適化
 *
 * @returns 読み込み成功時はSchemaオブジェクト、失敗時はundefined
 */
function readFromStorage(): Schema | undefined {
  let rawData: string | null = null
  try {
    // localStorageから読み込み（同期処理）
    rawData = localStorage.getItem(BSKY_STORAGE)
  } catch (e) {
    // プライベートモードでは期待されるエラー、無視する
  }
  if (rawData) {
    // 前回と同じデータの場合はキャッシュを返却（パース処理をスキップ）
    if (rawData === lastRawData) {
      return lastResult
    } else {
      // 新しいデータの場合はパース・正規化
      const result = tryParse(rawData)
      if (result) {
        lastRawData = rawData    // キャッシュ更新
        lastResult = normalizeData(result)  // 正規化して格納
        return lastResult
      }
    }
  }
  // データがない、またはパース失敗時はundefined返却
}
