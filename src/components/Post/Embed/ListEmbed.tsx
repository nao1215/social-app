/**
 * リスト埋め込みコンポーネント
 *
 * ユーザーリスト（カスタムリスト）を投稿内に埋め込んで表示するコンポーネントです。
 * リストカード形式で表示され、タップするとリストページに遷移します。
 *
 * 主な機能:
 * - ユーザーリストのプレビュー表示（名前、説明、作成者など）
 * - モデレーション（コンテンツ管理）対応
 * - ContentHiderによる不適切コンテンツの制御
 *
 * Go言語との対比:
 * - useMemo: 計算結果のメモ化（Goのsync.Onceに似た動作）
 */

import {useMemo} from 'react'
// AT Protocolのユーザーリストモデレーション API
import {moderateUserList} from '@atproto/api'

// モデレーション設定取得フック
import {useModerationOpts} from '#/state/preferences/moderation-opts'
// デザインシステム
import {atoms as a, useTheme} from '#/alf'
// リストカードコンポーネント
import * as ListCard from '#/components/ListCard'
// コンテンツ非表示コンポーネント（モデレーション用）
import {ContentHider} from '#/components/moderation/ContentHider'
// 埋め込み型定義
import {type EmbedType} from '#/types/bsky/post'
// 共通プロパティ型
import {type CommonProps} from './types'

/**
 * リスト埋め込みコンポーネント
 *
 * ユーザーリストをカード形式で表示します。
 * モデレーション機能は外部コンポーネント（ModeratedListEmbed）で適用されます。
 *
 * @param {CommonProps & {embed: EmbedType<'list'>}} props - コンポーネントプロパティ
 * @param {EmbedType<'list'>} props.embed - リスト埋め込みデータ
 * @returns {JSX.Element} リストカード
 */
export function ListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  // テーマ取得（境界線の色に使用）
  const t = useTheme()

  return (
    <ListCard.Default
      view={embed.view}
      style={[a.border, t.atoms.border_contrast_medium, a.p_md, a.rounded_sm]}
    />
  )
}

/**
 * モデレーション対応リスト埋め込みコンポーネント
 *
 * ListEmbedをContentHiderでラップし、不適切なコンテンツを制御します。
 * ユーザーのモデレーション設定に基づいて、リストを非表示にしたり
 * 警告付きで表示したりします。
 *
 * Reactフック解説:
 * - useModerationOpts: ユーザーのモデレーション設定を取得
 * - useMemo: モデレーション判定結果をキャッシュ
 *   embed.viewやmoderationOptsが変わった時のみ再計算
 *
 * @param {CommonProps & {embed: EmbedType<'list'>}} props - コンポーネントプロパティ
 * @param {EmbedType<'list'>} props.embed - リスト埋め込みデータ
 * @returns {JSX.Element} モデレーション対応リストカード
 */
export function ModeratedListEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'list'>
}) {
  // ユーザーのモデレーション設定を取得
  const moderationOpts = useModerationOpts()

  // useMemo: モデレーション判定をメモ化（パフォーマンス最適化）
  // embed.viewまたはmoderationOptsが変わった時のみ再実行
  const moderation = useMemo(() => {
    return moderationOpts
      ? moderateUserList(embed.view, moderationOpts)
      : undefined
  }, [embed.view, moderationOpts])

  return (
    <ContentHider
      // モデレーションUI設定（contentList: リストコンテンツとして判定）
      modui={moderation?.ui('contentList')}
      // アクティブ時（警告表示時）のコンテナスタイル
      childContainerStyle={[a.pt_xs]}>
      {/* 実際のリストカード */}
      <ListEmbed embed={embed} />
    </ContentHider>
  )
}
