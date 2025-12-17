/**
 * 読み込みリトライボタンコンポーネント
 * Load More Retry Button Component
 *
 * 【概要】
 * 無限スクロールリストで追加データの読み込みに失敗した場合に表示される
 * リトライボタン。回転矢印アイコンとメッセージで再試行を促す。
 *
 * 【使用場面】
 * - フィード・タイムラインの追加読み込み失敗時
 * - 検索結果の追加取得失敗時
 * - 通知一覧の続き読み込み失敗時
 *
 * 【Goユーザー向け補足】
 * - StyleSheet.create: スタイル定義をオブジェクトとして事前定義（パフォーマンス最適化）
 * - usePalette: テーマカラーの取得フック
 */

// React NativeのスタイルシートAPI
// React Native StyleSheet API
import {StyleSheet} from 'react-native'

// FontAwesomeアイコンコンポーネント（回転矢印アイコン用）
// FontAwesome icon component (for rotate arrow icon)
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

// パレット（テーマカラー）取得フック
// Palette (theme colors) hook
import {usePalette} from '#/lib/hooks/usePalette'

// ボタンコンポーネント
// Button component
import {Button} from './forms/Button'

// テキストコンポーネント
// Text component
import {Text} from './text/Text'

/**
 * 読み込みリトライボタン
 * Load More Retry Button
 *
 * 【レイアウト】
 * [回転矢印アイコン] [ラベルテキスト]
 *
 * @param label 表示するラベル（例: "読み込みをリトライ"） / Label to display (e.g., "Retry loading")
 * @param onPress 押下時のコールバック / Callback on press
 */
export function LoadMoreRetryBtn({
  label,
  onPress,
}: {
  label: string
  onPress: () => void
}) {
  // テーマに応じたカラーパレットを取得
  // Get color palette based on theme
  const pal = usePalette('default')

  return (
    <Button type="default-light" onPress={onPress} style={styles.loadMoreRetry}>
      {/* 回転矢印アイコン（リトライを視覚的に示す） */}
      {/* Rotate arrow icon (visually indicates retry) */}
      <FontAwesomeIcon
        icon="arrow-rotate-left"
        style={pal.textLight as FontAwesomeIconStyle}
        size={18}
      />
      {/* ラベルテキスト */}
      {/* Label text */}
      <Text style={[pal.textLight, styles.label]}>{label}</Text>
    </Button>
  )
}

/**
 * スタイル定義
 * Style definitions
 *
 * 【Goユーザー向け補足】
 * StyleSheet.createは事前にスタイルオブジェクトを登録し、
 * レンダリング時のオブジェクト生成コストを削減する最適化手法。
 * Goでいう var styles = struct{...}{} の事前定義に似る。
 */
const styles = StyleSheet.create({
  // リトライボタンのコンテナスタイル
  // Retry button container style
  loadMoreRetry: {
    flexDirection: 'row', // 横並びレイアウト / Horizontal layout
    gap: 14, // アイコンとテキストの間隔 / Gap between icon and text
    alignItems: 'center', // 垂直中央揃え / Vertical center alignment
    borderRadius: 0, // 角丸なし / No border radius
    marginTop: 1, // 上マージン / Top margin
    paddingVertical: 12, // 垂直パディング / Vertical padding
    paddingHorizontal: 20, // 水平パディング / Horizontal padding
  },
  // ラベルのスタイル
  // Label style
  label: {
    flex: 1, // 残りスペースを占有 / Occupy remaining space
  },
})
