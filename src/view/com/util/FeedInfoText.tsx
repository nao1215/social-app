/**
 * フィード情報テキストコンポーネント
 * Feed Info Text Component
 *
 * 【概要】
 * フィード（カスタムフィード、リスト等）の名前を表示するコンポーネント。
 * フィードURIからAPIで情報を取得し、表示名をレンダリング。
 * データ取得中はローディングプレースホルダーを表示。
 *
 * 【使用場面】
 * - 投稿の「○○フィードから」表示
 * - フィードリストでの名前表示
 * - フィードへのリンク表示
 *
 * 【Goユーザー向け補足】
 * - useFeedSourceInfoQuery: React QueryによるAPIデータ取得フック
 *   Goでいう http.Get + JSONデコード + キャッシュ機能
 * - isError: APIエラー発生フラグ
 * - TextLinkOnWebOnly: Webではリンク、ネイティブではテキストとして表示
 */

// React Nativeのスタイル関連型
// React Native style related types
import {StyleProp, StyleSheet, TextStyle} from 'react-native'

// 表示名サニタイズユーティリティ
// Display name sanitization utility
import {sanitizeDisplayName} from '#/lib/strings/display-names'

// タイポグラフィバリアント型
// Typography variant type
import {TypographyVariant} from '#/lib/ThemeContext'

// フィードソース情報取得クエリフック
// Feed source info query hook
import {useFeedSourceInfoQuery} from '#/state/queries/feed'

// Web専用テキストリンクコンポーネント
// Web-only text link component
import {TextLinkOnWebOnly} from './Link'

// ローディングプレースホルダーコンポーネント
// Loading placeholder component
import {LoadingPlaceholder} from './LoadingPlaceholder'

/**
 * フィード名テキストコンポーネント
 * Feed Name Text Component
 *
 * 【動作フロー】
 * 1. フィードURIからAPIで情報取得
 * 2. 取得中: ローディングプレースホルダー表示
 * 3. 成功: フィード名をリンクとして表示
 * 4. エラー: URIの最後の部分をフォールバック表示
 *
 * @param type テキストサイズバリアント / Text size variant
 * @param uri フィードのAT URI / Feed's AT URI
 * @param href リンク先URL / Link destination URL
 * @param lineHeight 行の高さ / Line height
 * @param numberOfLines 最大行数（超過時は省略） / Max lines (truncate if exceeded)
 * @param style カスタムスタイル / Custom style
 */
export function FeedNameText({
  type = 'md',
  uri,
  href,
  lineHeight,
  numberOfLines,
  style,
}: {
  /** テキストサイズバリアント（デフォルト: 'md'） / Text size variant (default: 'md') */
  type?: TypographyVariant
  /** フィードのAT URI / Feed's AT URI */
  uri: string
  /** リンク先URL / Link destination URL */
  href: string
  /** 行の高さ / Line height */
  lineHeight?: number
  /** 最大表示行数 / Maximum display lines */
  numberOfLines?: number
  /** カスタムスタイル / Custom style */
  style?: StyleProp<TextStyle>
}) {
  // フィード情報をAPIから取得（キャッシュ付き）
  // Fetch feed info from API (with caching)
  const {data, isError} = useFeedSourceInfoQuery({uri})

  let inner

  // データ取得完了またはエラー時
  // When data fetch complete or error
  if (data?.displayName || isError) {
    // 表示名を取得（フォールバック: URIの最後の部分）
    // Get display name (fallback: last part of URI)
    const displayName = data?.displayName || uri.split('/').pop() || ''
    inner = (
      <TextLinkOnWebOnly
        type={type}
        style={style}
        lineHeight={lineHeight}
        numberOfLines={numberOfLines}
        href={href}
        // 表示名をサニタイズして表示
        // Sanitize and display the name
        text={sanitizeDisplayName(displayName)}
      />
    )
  } else {
    // 取得中: ローディングプレースホルダー表示
    // Fetching: show loading placeholder
    inner = (
      <LoadingPlaceholder
        width={80}
        height={8}
        style={styles.loadingPlaceholder}
      />
    )
  }

  return inner
}

/**
 * スタイル定義
 * Style definitions
 */
const styles = StyleSheet.create({
  // ローディングプレースホルダーの位置調整
  // Loading placeholder position adjustment
  loadingPlaceholder: {position: 'relative', top: 1, left: 2},
})
