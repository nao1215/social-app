/**
 * デモフィードAPIモジュール
 *
 * 【概要】
 * 開発・デモ用のモックフィードを提供するAPIクラス。
 * 実際のAPIを呼び出さず、静的なデモデータを返す。
 *
 * 【用途】
 * - UIのデモンストレーション
 * - 開発時のオフラインテスト
 * - スクリーンショット作成
 *
 * 【Goユーザー向け補足】
 * - classはGoのstructにメソッドを追加したもの
 * - implements FeedAPIはGoのinterface実装に相当
 * - DEMO_FEEDは別ファイルで定義された静的データ
 */

/**
 * AT Protocol API型定義
 * AppBskyFeedDefs: フィード関連の型定義
 * BskyAgent: APIクライアント
 */
import {type AppBskyFeedDefs, type BskyAgent} from '@atproto/api'

/**
 * DEMO_FEED: 静的なデモ用フィードデータ
 * 開発・テスト用にハードコードされた投稿データ
 */
import {DEMO_FEED} from '#/lib/demo'

/**
 * フィードAPI共通インターフェース
 */
import {type FeedAPI, type FeedAPIResponse} from './types'

/**
 * デモフィードAPIクラス
 *
 * 【概要】
 * FeedAPIインターフェースを実装するが、実際のAPIは呼ばない。
 * 静的なデモデータを返すモッククラス。
 *
 * 【Goユーザー向け補足】
 * - implements FeedAPIはGoのinterface実装に相当
 * - agentフィールドは使用されないが、インターフェース互換性のため保持
 */
export class DemoFeedAPI implements FeedAPI {
  agent: BskyAgent  // 使用されないが、インターフェース互換性のため保持

  /**
   * コンストラクタ
   *
   * @param agent APIクライアント（使用されない）
   */
  constructor({agent}: {agent: BskyAgent}) {
    this.agent = agent
  }

  /**
   * 最新投稿を1件取得
   *
   * 【動作】
   * デモデータの最初の投稿を返す。
   * API呼び出しは行わない。
   *
   * @returns デモデータの最初の投稿
   */
  async peekLatest(): Promise<AppBskyFeedDefs.FeedViewPost> {
    return DEMO_FEED.feed[0]
  }

  /**
   * フィードを取得
   *
   * 【動作】
   * デモデータ全体を返す。
   * API呼び出しは行わない。
   * ページネーションは非対応（引数を受け取らない）。
   *
   * @returns デモフィードデータ
   */
  async fetch(): Promise<FeedAPIResponse> {
    return DEMO_FEED
  }
}
