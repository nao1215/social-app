/**
 * 空状態表示コンポーネント
 * Empty State Display Component
 *
 * 【概要】
 * データが存在しない場合に表示するプレースホルダーコンポーネント。
 * アイコンとメッセージでユーザーに状態を伝える。
 *
 * 【使用場面】
 * - 検索結果が0件の場合
 * - フォロワー/フォロイーがいない場合
 * - 投稿がない場合
 * - リストが空の場合
 *
 * 【Goユーザー向け補足】
 * - StyleSheet.create: スタイル定義の最適化（事前コンパイル）
 * - usePalette: テーマカラーの取得フック
 * - useWebMediaQueries: レスポンシブデザイン用のメディアクエリフック
 */

// React Nativeの基本コンポーネントとスタイル
// React Native basic components and styles
import {StyleProp, StyleSheet, View, ViewStyle} from 'react-native'

// FontAwesomeアイコンの型
// FontAwesome icon type
import {IconProp} from '@fortawesome/fontawesome-svg-core'

// FontAwesomeアイコンコンポーネント
// FontAwesome icon component
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

// テーマカラー取得フック
// Theme color hook
import {usePalette} from '#/lib/hooks/usePalette'

// レスポンシブデザイン用メディアクエリフック
// Media query hook for responsive design
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

// ユーザーグループアイコン
// User group icon
import {UserGroupIcon} from '#/lib/icons'

// 成長アイコン
// Growth icon
import {Growth_Stroke2_Corner0_Rounded as Growth} from '#/components/icons/Growth'

// テキストコンポーネント
// Text component
import {Text} from './text/Text'

/**
 * 空状態コンポーネント
 * Empty State Component
 *
 * 【レイアウト】
 * ┌─────────────────┐
 * │    [アイコン]     │
 * │   メッセージ     │
 * └─────────────────┘
 *
 * @param testID テスト用ID / Test ID
 * @param icon 表示するアイコン / Icon to display
 * @param message 表示するメッセージ / Message to display
 * @param style コンテナスタイル / Container style
 */
export function EmptyState({
  testID,
  icon,
  message,
  style,
}: {
  /** テスト用ID / Test ID */
  testID?: string
  /** 表示するアイコン（FontAwesome、user-group、growth） / Icon to display */
  icon: IconProp | 'user-group' | 'growth'
  /** 表示するメッセージ / Message to display */
  message: string
  /** コンテナスタイル / Container style */
  style?: StyleProp<ViewStyle>
}) {
  // テーマカラーを取得
  // Get theme colors
  const pal = usePalette('default')

  // デバイスサイズに応じたレイアウト判定
  // Determine layout based on device size
  const {isTabletOrDesktop} = useWebMediaQueries()

  // タブレット/デスクトップでは大きいアイコン
  // Larger icon for tablet/desktop
  const iconSize = isTabletOrDesktop ? 64 : 48

  return (
    <View testID={testID} style={style}>
      {/* アイコンコンテナ（円形背景） */}
      {/* Icon container (circular background) */}
      <View
        style={[
          styles.iconContainer,
          isTabletOrDesktop && styles.iconContainerBig,
          pal.viewLight,
        ]}>
        {/* アイコンの種類に応じて表示を切り替え */}
        {/* Switch display based on icon type */}
        {icon === 'user-group' ? (
          <UserGroupIcon size={iconSize} />
        ) : icon === 'growth' ? (
          <Growth width={iconSize} fill={pal.colors.emptyStateIcon} />
        ) : (
          <FontAwesomeIcon
            icon={icon}
            size={iconSize}
            style={[{color: pal.colors.emptyStateIcon} as FontAwesomeIconStyle]}
          />
        )}
      </View>
      {/* メッセージテキスト */}
      {/* Message text */}
      <Text type="xl" style={[{color: pal.colors.textLight}, styles.text]}>
        {message}
      </Text>
    </View>
  )
}

/**
 * スタイル定義
 * Style definitions
 */
const styles = StyleSheet.create({
  // アイコンコンテナ（モバイル用）
  // Icon container (for mobile)
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 80,
    width: 80,
    marginLeft: 'auto', // 水平中央揃え / Horizontal center
    marginRight: 'auto', // 水平中央揃え / Horizontal center
    borderRadius: 80, // 完全な円形 / Perfect circle
    marginTop: 30,
  },
  // アイコンコンテナ（タブレット/デスクトップ用）
  // Icon container (for tablet/desktop)
  iconContainerBig: {
    width: 100,
    height: 100,
    marginTop: 50,
  },
  // メッセージテキスト
  // Message text
  text: {
    textAlign: 'center',
    paddingTop: 20,
  },
})
