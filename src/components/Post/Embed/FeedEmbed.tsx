/**
 * フィード埋め込みコンポーネント
 *
 * カスタムフィード（アルゴリズムフィード）を投稿内に埋め込んで表示するコンポーネントです。
 * フィードカード形式で表示され、タップするとフィードページに遷移します。
 *
 * 主な機能:
 * - カスタムフィードのプレビュー表示（アバター、タイトル、作成者、いいね数）
 * - モデレーション（コンテンツ管理）対応
 * - ContentHiderによる不適切コンテンツの制御
 *
 * Go言語との対比:
 * - useMemo: 計算結果のキャッシュ（Goのsync.Onceに似た動作）
 * - 三項演算子: Goのif-else文
 */

import {useMemo} from 'react'
// AT ProtocolのフィードジェネレーターモデレーションAPI
import {moderateFeedGenerator} from '@atproto/api'

// モデレーション設定取得フック
import {useModerationOpts} from '#/state/preferences/moderation-opts'
// デザインシステム
import {atoms as a, useTheme} from '#/alf'
// フィードカードコンポーネント
import * as FeedCard from '#/components/FeedCard'
// コンテンツ非表示コンポーネント（モデレーション用）
import {ContentHider} from '#/components/moderation/ContentHider'
// 埋め込み型定義
import {type EmbedType} from '#/types/bsky/post'
// 共通プロパティ型
import {type CommonProps} from './types'

/**
 * フィード埋め込みコンポーネント
 *
 * カスタムフィードをカード形式で表示します。
 * モデレーション機能は外部コンポーネント（ModeratedFeedEmbed）で適用されます。
 *
 * @param {CommonProps & {embed: EmbedType<'feed'>}} props - コンポーネントプロパティ
 * @param {EmbedType<'feed'>} props.embed - フィード埋め込みデータ
 * @returns {JSX.Element} フィードカード
 */
export function FeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  // テーマ取得（境界線の色に使用）
  const t = useTheme()

  return (
    <FeedCard.Link
      view={embed.view}
      style={[a.border, t.atoms.border_contrast_medium, a.p_md, a.rounded_sm]}>
      <FeedCard.Outer>
        <FeedCard.Header>
          {/* フィードのアバター画像 */}
          <FeedCard.Avatar src={embed.view.avatar} />
          {/* フィードのタイトルと作成者情報 */}
          <FeedCard.TitleAndByline
            title={embed.view.displayName}
            creator={embed.view.creator}
          />
        </FeedCard.Header>
        {/* いいね数の表示 */}
        <FeedCard.Likes count={embed.view.likeCount || 0} />
      </FeedCard.Outer>
    </FeedCard.Link>
  )
}

/**
 * モデレーション対応フィード埋め込みコンポーネント
 *
 * FeedEmbedをContentHiderでラップし、不適切なコンテンツを制御します。
 * ユーザーのモデレーション設定に基づいて、フィードを非表示にしたり
 * 警告付きで表示したりします。
 *
 * Reactフック解説:
 * - useModerationOpts: ユーザーのモデレーション設定を取得
 * - useMemo: モデレーション判定結果をキャッシュ
 *   embed.viewやmoderationOptsが変わった時のみ再計算
 *
 * @param {CommonProps & {embed: EmbedType<'feed'>}} props - コンポーネントプロパティ
 * @param {EmbedType<'feed'>} props.embed - フィード埋め込みデータ
 * @returns {JSX.Element} モデレーション対応フィードカード
 */
export function ModeratedFeedEmbed({
  embed,
}: CommonProps & {
  embed: EmbedType<'feed'>
}) {
  // ユーザーのモデレーション設定を取得
  const moderationOpts = useModerationOpts()

  // useMemo: モデレーション判定をメモ化（パフォーマンス最適化）
  // embed.viewまたはmoderationOptsが変わった時のみ再実行
  const moderation = useMemo(() => {
    return moderationOpts
      ? moderateFeedGenerator(embed.view, moderationOpts)
      : undefined
  }, [embed.view, moderationOpts])

  return (
    <ContentHider
      // モデレーションUI設定（contentList: リストコンテンツとして判定）
      modui={moderation?.ui('contentList')}
      // アクティブ時（警告表示時）のコンテナスタイル
      childContainerStyle={[a.pt_xs]}>
      {/* 実際のフィードカード */}
      <FeedEmbed embed={embed} />
    </ContentHider>
  )
}
