/**
 * オンボーディングユーティリティモジュール
 *
 * 【概要】
 * オンボーディングフローで使用される補助機能を提供します。
 * 主に複数アカウントの一括フォロー処理を担当します。
 *
 * 【主な機能】
 * - 複数アカウントの一括フォロー（bulkWriteFollows）
 * - フォロー処理のインデックス待機（whenFollowsIndexed）
 *
 * 【AT Protocolとの統合】
 * AT Protocolの applyWrites API を使用して、
 * 複数のフォローレコードを効率的にバッチ処理します。
 */

import {
  type $Typed,
  type AppBskyGraphFollow,
  type AppBskyGraphGetFollows,
  type BskyAgent,
  type ComAtprotoRepoApplyWrites,
} from '@atproto/api'
import {TID} from '@atproto/common-web'
import chunk from 'lodash.chunk'

import {until} from '#/lib/async/until'

/**
 * 複数アカウントを一括フォローする
 *
 * 【処理フロー】
 * 1. フォローレコードの作成
 * 2. レコードを50件ずつチャンクに分割
 * 3. 各チャンクを順次 applyWrites API で書き込み
 * 4. フォローがインデックスされるまで待機
 * 5. フォローURIのマップを返却
 *
 * @param agent - Bluesky エージェント（認証済み）
 * @param dids - フォローするアカウントのDIDリスト
 * @returns DIDからフォローURIへのマッピング
 * @throws セッションが存在しない場合
 */
export async function bulkWriteFollows(agent: BskyAgent, dids: string[]) {
  const session = agent.session

  // セッションが存在しない場合はエラー
  if (!session) {
    throw new Error(`bulkWriteFollows failed: no session`)
  }

  // ステップ1: 各DIDに対してフォローレコードを作成
  const followRecords: $Typed<AppBskyGraphFollow.Record>[] = dids.map(did => {
    return {
      $type: 'app.bsky.graph.follow', // AT Protocol のレコードタイプ
      subject: did, // フォロー対象のDID
      createdAt: new Date().toISOString(), // レコード作成日時
    }
  })

  // ステップ2: フォローレコードを書き込み操作に変換
  const followWrites: $Typed<ComAtprotoRepoApplyWrites.Create>[] =
    followRecords.map(r => ({
      $type: 'com.atproto.repo.applyWrites#create', // 作成操作
      collection: 'app.bsky.graph.follow', // フォローコレクション
      rkey: TID.nextStr(), // 一意なレコードキーを生成
      value: r, // フォローレコード
    }))

  // ステップ3: 50件ずつのチャンクに分割して順次書き込み
  // （APIの制限を回避するため）
  const chunks = chunk(followWrites, 50)
  for (const chunk of chunks) {
    await agent.com.atproto.repo.applyWrites({
      repo: session.did, // 自分のリポジトリ
      writes: chunk, // 書き込み操作のバッチ
    })
  }

  // ステップ4: フォローがインデックスされるまで待機
  // （検索可能になるまで少し時間がかかる）
  await whenFollowsIndexed(agent, session.did, res => !!res.data.follows.length)

  // ステップ5: DIDからフォローURIへのマップを作成して返却
  const followUris = new Map<string, string>()
  for (const r of followWrites) {
    followUris.set(
      r.value.subject as string,
      `at://${session.did}/app.bsky.graph.follow/${r.rkey}`,
    )
  }
  return followUris
}

/**
 * フォローがインデックスされるまで待機する
 *
 * 【処理概要】
 * AT Protocol ではレコードの書き込み後、インデックスに反映されるまで
 * わずかな時間がかかります。この関数は条件を満たすまでリトライします。
 *
 * @param agent - Bluesky エージェント
 * @param actor - アクターのDID
 * @param fn - 成功条件を判定する関数
 */
async function whenFollowsIndexed(
  agent: BskyAgent,
  actor: string,
  fn: (res: AppBskyGraphGetFollows.Response) => boolean,
) {
  await until(
    5, // 最大5回リトライ
    1e3, // 1秒間隔でリトライ
    fn, // 成功条件の判定関数
    () =>
      agent.app.bsky.graph.getFollows({
        actor, // フォロー一覧を取得
        limit: 1, // 1件だけ取得（存在確認のため）
      }),
  )
}
