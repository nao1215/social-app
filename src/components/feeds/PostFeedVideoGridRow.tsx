/**
 * @file ポストフィード動画グリッド行コンポーネント
 * @description フィード内で動画を含む投稿を2列グリッドレイアウトで表示するコンポーネント。
 *              動画フィードの視覚的なレイアウトを管理し、各動画カードをグリッド形式で配置します。
 */

// React Nativeのビューコンポーネント（Goの基本的なコンテナ型に相当）
import {View} from 'react-native'
// AT Protocol APIの動画埋め込み型定義（Goのstructに相当）
import {AppBskyEmbedVideo} from '@atproto/api'

// Statsigイベントロギング用ユーティリティ（分析トラッキング）
import {logEvent} from '#/lib/statsig/statsig'
// フィード投稿のスライスアイテム型定義（Goのstructに相当）
import {FeedPostSliceItem} from '#/state/queries/post-feed'
// 動画フィードのソースコンテキスト型（フィードの出所を追跡）
import {VideoFeedSourceContext} from '#/screens/VideoFeed/types'
// アトミックスタイル定義とガター用フック（レイアウトスペーシング管理）
import {atoms as a, useGutters} from '#/alf'
// グリッドレイアウトコンポーネント（2列レイアウト用）
import * as Grid from '#/components/Grid'
// 動画投稿カードコンポーネント（実際の動画表示とプレースホルダー）
import {
  VideoPostCard,
  VideoPostCardPlaceholder,
} from '#/components/VideoPostCard'

/**
 * @function PostFeedVideoGridRow
 * @description ポストフィード内の動画を2列グリッド形式で表示するコンポーネント。
 *              フィードアイテムから動画埋め込みを抽出し、グリッドレイアウトで配置します。
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {FeedPostSliceItem[]} props.items - フィード投稿のスライスアイテム配列
 * @param {VideoFeedSourceContext} props.sourceContext - 動画フィードのソースコンテキスト（分析用）
 * @returns {JSX.Element | null} グリッドレイアウトの動画カードまたはnull
 *
 * Go開発者向け補足:
 * - interface/typeはGoのstructに相当する型定義です
 * - propsはGoの構造体フィールドのような役割を果たします
 */
export function PostFeedVideoGridRow({
  items: slices,
  sourceContext,
}: {
  items: FeedPostSliceItem[]
  sourceContext: VideoFeedSourceContext
}) {
  // useGutters: カスタムフック（Goの関数に相当）でレイアウトのガター（余白）を計算
  // レスポンシブデザインのため、画面サイズ別に異なる余白を適用
  const gutters = useGutters(['base', 'base', 0, 'base'])

  // 動画埋め込みを持つ投稿のみをフィルタリングし、必要な情報を抽出
  // Goのスライス操作（filter + map）に相当
  const posts = slices
    .filter(slice => AppBskyEmbedVideo.isView(slice.post.embed))
    .map(slice => ({
      post: slice.post,
      moderation: slice.moderation,
    }))

  /**
   * 投稿数が元のスライス数と一致しない場合はnullを返す
   * これは通常発生しないはずだが、PostFeedコンポーネントで
   * 動画なし投稿を事前にフィルタリングすべき
   */
  if (posts.length !== slices.length) return null

  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_sm]}>
        <Grid.Row gap={a.gap_sm.gap}>
          {/* 各投稿を2列グリッド（width={1/2}）でマッピング */}
          {posts.map(post => (
            <Grid.Col key={post.post.uri} width={1 / 2}>
              <VideoPostCard
                post={post.post}
                sourceContext={sourceContext}
                moderation={post.moderation}
                onInteract={() => {
                  // ユーザーが動画カードをクリックした際のイベントを記録
                  logEvent('videoCard:click', {context: 'feed'})
                }}
              />
            </Grid.Col>
          ))}
        </Grid.Row>
      </View>
    </View>
  )
}

/**
 * @function PostFeedVideoGridRowPlaceholder
 * @description データ読み込み中に表示するプレースホルダーコンポーネント。
 *              実際の動画カードと同じレイアウトでスケルトン表示を行います。
 *
 * @returns {JSX.Element} プレースホルダーのグリッド行
 *
 * Go開発者向け補足:
 * - Reactではデータ読み込み中の「ローディング状態」を視覚的に表現するため、
 *   プレースホルダーコンポーネントを使用することが一般的です
 */
export function PostFeedVideoGridRowPlaceholder() {
  // ガター設定は実際のコンテンツと同じにして一貫性を保つ
  const gutters = useGutters(['base', 'base', 0, 'base'])
  return (
    <View style={[gutters]}>
      <View style={[a.flex_row, a.gap_sm]}>
        {/* 2つのプレースホルダーカードを横並びで表示 */}
        <VideoPostCardPlaceholder />
        <VideoPostCardPlaceholder />
      </View>
    </View>
  )
}
