/**
 * アクターステータス管理モジュール
 *
 * 【概要】
 * ユーザーの「ライブ配信中」などのステータス表示機能を管理。
 * プロフィールにステータス情報（外部リンク埋め込み）を表示。
 *
 * 【ステータスの条件】
 * 1. ステータスが設定されている
 * 2. 設定された有効期限内である
 * 3. 埋め込みリンクのドメインが許可リストに含まれている
 *
 * 【設定の検証】
 * - サービス設定から許可されたDIDとドメインを取得
 * - URLホスト名が許可ドメインに含まれているか検証
 * - 不正なURLや許可されていないドメインは拒否
 *
 * 【Goユーザー向け補足】
 * - useMemo: 計算結果のキャッシュ（Goのsync.Onceに類似）
 * - parseISO: ISO 8601形式の日時をパース（Goのtime.Parseに相当）
 * - isAfter: 日時比較（Goのtime.After()に相当）
 */
import {useMemo} from 'react'
import {
  type $Typed,
  type AppBskyActorDefs,
  AppBskyEmbedExternal,
} from '@atproto/api'
import {isAfter, parseISO} from 'date-fns'

import {useMaybeProfileShadow} from '#/state/cache/profile-shadow'
import {useLiveNowConfig} from '#/state/service-config'
import {useTickEveryMinute} from '#/state/shell'
import type * as bsky from '#/types/bsky'

/**
 * アクターのステータス（ライブ配信中など）を取得するフック
 *
 * 【動作】
 * - 1分ごとに再検証（有効期限チェック）
 * - シャドウキャッシュから最新のプロフィール情報を取得
 * - ステータスの有効性を検証して返す
 *
 * @param actor プロフィール情報
 * @returns ステータス情報（isActive, status, embed, expiresAt, record）
 */
export function useActorStatus(actor?: bsky.profile.AnyProfileView) {
  const shadowed = useMaybeProfileShadow(actor)
  const tick = useTickEveryMinute()
  const config = useLiveNowConfig()

  return useMemo(() => {
    tick! // revalidate every minute

    if (
      shadowed &&
      'status' in shadowed &&
      shadowed.status &&
      validateStatus(shadowed.did, shadowed.status, config) &&
      isStatusStillActive(shadowed.status.expiresAt)
    ) {
      return {
        isActive: true,
        status: 'app.bsky.actor.status#live',
        embed: shadowed.status.embed as $Typed<AppBskyEmbedExternal.View>, // temp_isStatusValid asserts this
        expiresAt: shadowed.status.expiresAt!, // isStatusStillActive asserts this
        record: shadowed.status.record,
      } satisfies AppBskyActorDefs.StatusView
    } else {
      return {
        status: '',
        isActive: false,
        record: {},
      } satisfies AppBskyActorDefs.StatusView
    }
  }, [shadowed, config, tick])
}

/**
 * ステータスがまだ有効期限内かを判定
 *
 * @param timeStr ISO 8601形式の有効期限文字列
 * @returns 有効期限内ならtrue
 */
export function isStatusStillActive(timeStr: string | undefined) {
  if (!timeStr) return false
  const now = new Date()
  const expiry = parseISO(timeStr)

  return isAfter(expiry, now)
}

/**
 * ステータスの有効性を検証
 *
 * 【検証内容】
 * 1. ステータスタイプが 'app.bsky.actor.status#live' か
 * 2. 設定に該当DIDが含まれているか
 * 3. 埋め込みURLのドメインが許可リストに含まれているか
 *
 * @param did ユーザーDID
 * @param status ステータスオブジェクト
 * @param config サービス設定（許可DIDとドメイン）
 * @returns 有効ならtrue
 */
export function validateStatus(
  did: string,
  status: AppBskyActorDefs.StatusView,
  config: {did: string; domains: string[]}[],
) {
  if (status.status !== 'app.bsky.actor.status#live') return false
  const sources = config.find(cfg => cfg.did === did)
  if (!sources) {
    return false
  }
  try {
    if (AppBskyEmbedExternal.isView(status.embed)) {
      const url = new URL(status.embed.external.uri)
      return sources.domains.includes(url.hostname)
    } else {
      return false
    }
  } catch {
    return false
  }
}
