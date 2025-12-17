/**
 * スターターパック生成モジュール
 *
 * 【概要】
 * Blueskyの「スターターパック」機能を自動生成。
 * スターターパックは新規ユーザーが一括でフォローできるアカウント集。
 *
 * 【スターターパックとは】
 * - 特定のトピックや興味に関連するアカウントを集めたリスト
 * - 新規ユーザーのオンボーディングを支援
 * - ワンクリックで複数アカウントをフォロー可能
 *
 * 【処理フロー】
 * 1. ユーザーのフォロー中アカウントを取得
 * 2. リファレンスリスト（リスト型レコード）を作成
 * 3. スターターパック本体を作成
 * 4. AppViewへの反映を待機
 *
 * 【AT Protocolの概念】
 * - app.bsky.graph.list: リストを表すレコード
 * - app.bsky.graph.listitem: リストの項目
 * - app.bsky.graph.starterpack: スターターパック本体
 * - com.atproto.repo.applyWrites: バッチ書き込みAPI
 *
 * 【Goユーザー向け補足】
 * - useMutation: TanStack Queryのデータ更新フック
 *   GoでのHTTP POSTリクエスト + 状態管理に相当
 * - $Typed: AT Protocol SDKの型付きオブジェクト
 * - Promise.all: Goのsync.WaitGroupに相当
 */
import {
  type $Typed,
  type AppBskyActorDefs,
  type AppBskyGraphGetStarterPack,
  type BskyAgent,
  type ComAtprotoRepoApplyWrites,
  type Facet,
} from '@atproto/api'
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
import {useMutation} from '@tanstack/react-query'

import {until} from '#/lib/async/until'
import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {enforceLen} from '#/lib/strings/helpers'
import {useAgent} from '#/state/session'
import type * as bsky from '#/types/bsky'

/**
 * スターターパック用のリストを作成
 *
 * 【処理内容】
 * 1. app.bsky.graph.list レコードを作成
 * 2. 指定されたプロフィール群を listitem として追加
 *
 * @param name リストの名前
 * @param description リストの説明（オプション）
 * @param descriptionFacets 説明文内のリンク/メンション等
 * @param profiles 追加するプロフィール一覧
 * @param agent Bluesky APIエージェント
 * @returns 作成されたリストのURIとCID
 */
export const createStarterPackList = async ({
  name,
  description,
  descriptionFacets,
  profiles,
  agent,
}: {
  name: string
  description?: string
  descriptionFacets?: Facet[]
  profiles: bsky.profile.AnyProfileView[]
  agent: BskyAgent
}): Promise<{uri: string; cid: string}> => {
  if (profiles.length === 0) throw new Error('No profiles given')

  const list = await agent.app.bsky.graph.list.create(
    {repo: agent.session!.did},
    {
      name,
      description,
      descriptionFacets,
      avatar: undefined,
      createdAt: new Date().toISOString(),
      purpose: 'app.bsky.graph.defs#referencelist',
    },
  )
  if (!list) throw new Error('List creation failed')
  await agent.com.atproto.repo.applyWrites({
    repo: agent.session!.did,
    writes: profiles.map(p => createListItem({did: p.did, listUri: list.uri})),
  })

  return list
}

/**
 * スターターパック自動生成用のReact Queryミューテーション
 *
 * 【機能】
 * - ユーザーのフォロー中アカウントを自動収集
 * - 「{ユーザー名}'s Starter Pack」という名前で生成
 * - 最低7人以上のフォローが必要
 *
 * 【エラー条件】
 * - ERROR_DATA: プロフィール取得失敗
 * - NOT_ENOUGH_FOLLOWERS: フォロー数が7未満
 *
 * @param onSuccess 成功時のコールバック（URI/CIDを受け取る）
 * @param onError エラー時のコールバック
 * @returns TanStack QueryのMutationフック
 */
export function useGenerateStarterPackMutation({
  onSuccess,
  onError,
}: {
  onSuccess: ({uri, cid}: {uri: string; cid: string}) => void
  onError: (e: Error) => void
}) {
  const {_} = useLingui()
  const agent = useAgent()

  return useMutation<{uri: string; cid: string}, Error, void>({
    mutationFn: async () => {
      let profile: AppBskyActorDefs.ProfileViewDetailed | undefined
      let profiles: AppBskyActorDefs.ProfileView[] | undefined

      await Promise.all([
        (async () => {
          profile = (
            await agent.app.bsky.actor.getProfile({
              actor: agent.session!.did,
            })
          ).data
        })(),
        (async () => {
          profiles = (
            await agent.app.bsky.actor.searchActors({
              q: encodeURIComponent('*'),
              limit: 49,
            })
          ).data.actors.filter(p => p.viewer?.following)
        })(),
      ])

      if (!profile || !profiles) {
        throw new Error('ERROR_DATA')
      }

      // We include ourselves when we make the list
      if (profiles.length < 7) {
        throw new Error('NOT_ENOUGH_FOLLOWERS')
      }

      const displayName = enforceLen(
        profile.displayName
          ? sanitizeDisplayName(profile.displayName)
          : `@${sanitizeHandle(profile.handle)}`,
        25,
        true,
      )
      const starterPackName = _(msg`${displayName}'s Starter Pack`)

      const list = await createStarterPackList({
        name: starterPackName,
        profiles,
        agent,
      })

      return await agent.app.bsky.graph.starterpack.create(
        {
          repo: agent.session!.did,
        },
        {
          name: starterPackName,
          list: list.uri,
          createdAt: new Date().toISOString(),
        },
      )
    },
    onSuccess: async data => {
      await whenAppViewReady(agent, data.uri, v => {
        return typeof v?.data.starterPack.uri === 'string'
      })
      onSuccess(data)
    },
    onError: error => {
      onError(error)
    },
  })
}

/**
 * リストアイテム作成用のレコードオブジェクトを生成
 *
 * 【AT Protocolの構造】
 * - $type: レコードタイプの識別子
 * - collection: 保存先のコレクション名
 * - value: レコードの実データ
 *
 * @param did 追加するユーザーのDID
 * @param listUri 追加先リストのAT URI
 * @returns applyWrites用のCreateオペレーション
 */
function createListItem({
  did,
  listUri,
}: {
  did: string
  listUri: string
}): $Typed<ComAtprotoRepoApplyWrites.Create> {
  return {
    $type: 'com.atproto.repo.applyWrites#create',
    collection: 'app.bsky.graph.listitem',
    value: {
      $type: 'app.bsky.graph.listitem',
      subject: did,
      list: listUri,
      createdAt: new Date().toISOString(),
    },
  }
}

/**
 * AppViewへのデータ反映を待機
 *
 * 【なぜ待機が必要か】
 * - AT Protocolは分散システム
 * - PDSへの書き込み後、AppViewへの伝播に時間がかかる
 * - 即座にgetStarterPackを呼ぶと404になる可能性
 *
 * @param agent Bluesky APIエージェント
 * @param uri 作成したスターターパックのURI
 * @param fn 準備完了を判定する関数
 */
async function whenAppViewReady(
  agent: BskyAgent,
  uri: string,
  fn: (res?: AppBskyGraphGetStarterPack.Response) => boolean,
) {
  await until(
    5, // 最大5回試行
    1e3, // 1秒間隔でリトライ
    fn,
    () => agent.app.bsky.graph.getStarterPack({starterPack: uri}),
  )
}
