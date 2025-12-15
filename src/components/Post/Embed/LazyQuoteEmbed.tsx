/**
 * 遅延読み込み引用埋め込みコンポーネント
 *
 * URIから投稿を取得し、引用投稿として表示するコンポーネントです。
 * データの取得は非同期で行われ、読み込み中はプレースホルダーを表示します。
 *
 * 主な機能:
 * - URIから投稿データの遅延読み込み
 * - 読み込み完了後に引用投稿カードとして表示
 * - 読み込み中のプレースホルダー表示
 *
 * Go言語との対比:
 * - useMemo: Goのsync.Onceに似た値のメモ化（依存配列が変わるまでキャッシュ）
 * - 三項演算子 (? :): Goのif-else文に相当
 *
 * Reactフック:
 * - useMemo: 計算結果をメモ化し、依存値が変わらない限り再計算しない
 */

import {useMemo} from 'react'
import {View} from 'react-native'

// 投稿からEmbedViewRecordを作成するユーティリティ
import {createEmbedViewRecordFromPost} from '#/state/queries/postgate/util'
// リンク解決クエリフック（URIから投稿データを取得）
import {useResolveLinkQuery} from '#/state/queries/resolve-link'
// デザインシステムのアトムとテーマフック
import {atoms as a, useTheme} from '#/alf'
// 引用埋め込みコンポーネント
import {QuoteEmbed} from '#/components/Post/Embed'

/**
 * 遅延読み込み引用埋め込みコンポーネント
 *
 * 指定されたURIから投稿データを非同期で取得し、引用投稿として表示します。
 * データ取得中はプレースホルダー（グレーのボックス）を表示します。
 *
 * Reactフック解説:
 * - useResolveLinkQuery(uri): URIから投稿データを取得するカスタムフック
 *   内部でReact Queryを使用し、自動的にキャッシュと再取得を管理
 * - useMemo: ビューオブジェクトの生成をメモ化
 *   dataが変わった時のみ再計算（パフォーマンス最適化）
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {string} props.uri - 引用する投稿のURI（AT URI形式）
 * @returns {JSX.Element} 引用投稿カードまたはプレースホルダー
 *
 * @example
 * <LazyQuoteEmbed uri="at://did:plc:xyz/app.bsky.feed.post/abc123" />
 */
export function LazyQuoteEmbed({uri}: {uri: string}) {
  // テーマ情報を取得（プレースホルダーの背景色に使用）
  const t = useTheme()
  // URIから投稿データを取得（React Queryによる自動キャッシュ）
  const {data} = useResolveLinkQuery(uri)

  // useMemo: ビューオブジェクトの作成をメモ化
  // dataが変わった時のみ再計算される（Go言語のsync.Onceに似た動作）
  const view = useMemo(() => {
    // データが存在しない、または投稿ではない場合はundefinedを返す
    if (!data || data.type !== 'record' || data.kind !== 'post') return
    // 投稿データから引用埋め込み用のビューレコードを作成
    return createEmbedViewRecordFromPost(data.view)
  }, [data]) // dataが変わった時のみ再実行

  // ビューが存在する場合は引用埋め込みを表示
  // 存在しない場合（読み込み中）はプレースホルダーを表示
  return view ? (
    <QuoteEmbed
      embed={{
        type: 'post',
        view,
      }}
    />
  ) : (
    // プレースホルダー: 読み込み中に表示されるグレーのボックス
    <View
      style={[
        a.w_full, // 幅100%
        a.rounded_md, // 角丸
        t.atoms.bg_contrast_25, // テーマに応じた背景色（薄いグレー）
        {
          height: 68, // 固定高さ68px（引用カードの最小高さ）
        },
      ]}
    />
  )
}
