// 永続化スキーマの型定義をインポート - データ構造の定義
import type {Schema} from './schema'

/**
 * 永続化API型定義
 * アプリケーションデータを永続的に保存・取得するためのインターフェース
 * プラットフォーム間（Web/Native）で共通のAPIを提供
 */
export type PersistedApi = {
  init(): Promise<void>                                        // 永続化システムの初期化
  get<K extends keyof Schema>(key: K): Schema[K]               // データの取得（キー指定）
  write<K extends keyof Schema>(key: K, value: Schema[K]): Promise<void> // データの書き込み
  onUpdate<K extends keyof Schema>(                            // データ更新の監視
    key: K,                                                    // 監視対象のキー
    cb: (v: Schema[K]) => void,                               // 更新時のコールバック関数
  ): () => void                                               // 監視解除関数を返却
  clearStorage: () => Promise<void>                           // ストレージの完全クリア
}
