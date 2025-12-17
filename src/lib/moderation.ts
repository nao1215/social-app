/**
 * モデレーションユーティリティモジュール
 *
 * 【概要】
 * Blueskyのコンテンツモデレーション機能に関するヘルパー関数を提供。
 * ラベル判定、ラベラー管理、モデレーションUIの処理を行う。
 *
 * 【AT Protocolのラベルシステム】
 * - ラベル: コンテンツに付与されるメタデータ（例: 'porn', 'nudity', '!hide'）
 * - ラベラー: ラベルを付与するサービス（Bluesky公式 + サードパーティ）
 * - セルフラベル: ユーザーが自分のコンテンツに付与するラベル
 *
 * 【ラベルの種類】
 * - 成人向けコンテンツ: sexual, nudity, porn
 * - その他のセルフラベル: graphic-media
 * - システムラベル: !hide, !takedown（非表示/削除指示）
 *
 * 【モデレーションの決定プロセス】
 * 1. コンテンツのラベルを収集
 * 2. ユーザーのモデレーション設定を適用
 * 3. ModerationUIオブジェクトを生成（表示/非表示/警告）
 *
 * 【Goユーザー向け補足】
 * - ModerationUI: モデレーション判定結果を格納する構造体
 * - ラベラー購読: ユーザーが信頼するラベラーを選択する仕組み
 */
import React from 'react'
import {
  type AppBskyLabelerDefs,
  BskyAgent,
  type ComAtprotoLabelDefs,
  type InterpretedLabelValueDefinition,
  LABELS,
  type ModerationCause,
  type ModerationOpts,
  type ModerationUI,
} from '@atproto/api'

import {sanitizeDisplayName} from '#/lib/strings/display-names'
import {sanitizeHandle} from '#/lib/strings/handles'
import {type AppModerationCause} from '#/components/Pills'

/** 成人向けコンテンツのラベル一覧 */
export const ADULT_CONTENT_LABELS = ['sexual', 'nudity', 'porn']
/** その他のセルフラベル一覧 */
export const OTHER_SELF_LABELS = ['graphic-media']
/** 全セルフラベル（ユーザーが自分で付与可能） */
export const SELF_LABELS = [...ADULT_CONTENT_LABELS, ...OTHER_SELF_LABELS]

/** 成人向けセルフラベルの型 */
export type AdultSelfLabel = (typeof ADULT_CONTENT_LABELS)[number]
/** その他セルフラベルの型 */
export type OtherSelfLabel = (typeof OTHER_SELF_LABELS)[number]
/** セルフラベルの型（Union） */
export type SelfLabel = (typeof SELF_LABELS)[number]

/**
 * モデレーション原因から一意のキーを生成
 *
 * 【用途】
 * - 重複排除（unique関数で使用）
 * - キャッシュキー生成
 *
 * 【キー形式】
 * - ラベル: "label:{ラベル値}:{ソース}"
 * - その他: "{タイプ}:{ソース}"
 *
 * @param cause モデレーション原因
 * @returns 一意のキー文字列
 */
export function getModerationCauseKey(
  cause: ModerationCause | AppModerationCause,
): string {
  const source =
    cause.source.type === 'labeler'
      ? cause.source.did
      : cause.source.type === 'list'
        ? cause.source.list.uri
        : 'user'
  if (cause.type === 'label') {
    return `label:${cause.label.val}:${source}`
  }
  return `${cause.type}:${source}`
}

export function isJustAMute(modui: ModerationUI): boolean {
  return modui.filters.length === 1 && modui.filters[0].type === 'muted'
}

export function moduiContainsHideableOffense(modui: ModerationUI): boolean {
  const label = modui.filters.at(0)
  if (label && label.type === 'label') {
    return labelIsHideableOffense(label.label)
  }
  return false
}

export function labelIsHideableOffense(
  label: ComAtprotoLabelDefs.Label,
): boolean {
  return ['!hide', '!takedown'].includes(label.val)
}

export function getLabelingServiceTitle({
  displayName,
  handle,
}: {
  displayName?: string
  handle: string
}) {
  return displayName
    ? sanitizeDisplayName(displayName)
    : sanitizeHandle(handle, '@')
}

export function lookupLabelValueDefinition(
  labelValue: string,
  customDefs: InterpretedLabelValueDefinition[] | undefined,
): InterpretedLabelValueDefinition | undefined {
  let def
  if (!labelValue.startsWith('!') && customDefs) {
    def = customDefs.find(d => d.identifier === labelValue)
  }
  if (!def) {
    def = LABELS[labelValue as keyof typeof LABELS]
  }
  return def
}

export function isAppLabeler(
  labeler:
    | string
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
): boolean {
  if (typeof labeler === 'string') {
    return BskyAgent.appLabelers.includes(labeler)
  }
  return BskyAgent.appLabelers.includes(labeler.creator.did)
}

export function isLabelerSubscribed(
  labeler:
    | string
    | AppBskyLabelerDefs.LabelerView
    | AppBskyLabelerDefs.LabelerViewDetailed,
  modOpts: ModerationOpts,
) {
  labeler = typeof labeler === 'string' ? labeler : labeler.creator.did
  if (isAppLabeler(labeler)) {
    return true
  }
  return modOpts.prefs.labelers.find(l => l.did === labeler)
}

export type Subject =
  | {
      uri: string
      cid: string
    }
  | {
      did: string
    }

export function useLabelSubject({label}: {label: ComAtprotoLabelDefs.Label}): {
  subject: Subject
} {
  return React.useMemo(() => {
    const {cid, uri} = label
    if (cid) {
      return {
        subject: {
          uri,
          cid,
        },
      }
    } else {
      return {
        subject: {
          did: uri,
        },
      }
    }
  }, [label])
}

export function unique(
  value: ModerationCause,
  index: number,
  array: ModerationCause[],
) {
  return (
    array.findIndex(
      item => getModerationCauseKey(item) === getModerationCauseKey(value),
    ) === index
  )
}
