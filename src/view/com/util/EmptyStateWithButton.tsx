/**
 * ボタン付き空状態コンポーネント
 * Empty State with Button Component
 *
 * 【概要】
 * データが存在しない場合に表示するプレースホルダーコンポーネント。
 * アイコン、メッセージ、アクションボタンを含む。
 * ユーザーに次のアクションを促すCTA（Call to Action）付き。
 *
 * 【使用場面】
 * - フォローしているユーザーがいない場合 → 「ユーザーを探す」ボタン
 * - 投稿がない場合 → 「投稿を作成」ボタン
 * - リストが空の場合 → 「アイテムを追加」ボタン
 *
 * 【レイアウト】
 * ┌─────────────────┐
 * │    [アイコン]     │
 * │   メッセージ     │
 * │   [+ボタン]      │
 * └─────────────────┘
 *
 * 【Goユーザー向け補足】
 * - CTA (Call to Action): ユーザーに行動を促すUI要素
 * - usePalette: テーマに応じたカラーパレットを取得するフック
 */

// React Nativeの基本コンポーネント
// React Native basic components
import {StyleSheet, View} from 'react-native'

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

// 共通スタイル
// Common styles
import {s} from '#/lib/styles'

// ボタンコンポーネント
// Button component
import {Button} from './forms/Button'

// テキストコンポーネント
// Text component
import {Text} from './text/Text'

/**
 * コンポーネントのProps型
 * Component Props type
 */
interface Props {
  /** テスト用ID / Test ID */
  testID?: string
  /** 表示するアイコン / Icon to display */
  icon: IconProp
  /** 表示するメッセージ / Message to display */
  message: string
  /** ボタンのラベル / Button label */
  buttonLabel: string
  /** ボタン押下時のコールバック / Callback on button press */
  onPress: () => void
}

/**
 * ボタン付き空状態コンポーネント
 * Empty State with Button Component
 *
 * @param props コンポーネントProps / Component props
 */
export function EmptyStateWithButton(props: Props) {
  // 通常テーマのカラーパレット
  // Normal theme color palette
  const pal = usePalette('default')

  // 反転テーマのカラーパレット（ボタン用）
  // Inverted theme color palette (for button)
  const palInverted = usePalette('inverted')

  return (
    <View testID={props.testID} style={styles.container}>
      <View style={styles.iconContainer}>
        <FontAwesomeIcon
          icon={props.icon}
          style={[styles.icon, pal.text]}
          size={62}
        />
      </View>
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        {props.message}
      </Text>
      <View style={styles.btns}>
        <Button
          testID={props.testID ? `${props.testID}-button` : undefined}
          type="inverted"
          style={styles.btn}
          onPress={props.onPress}>
          <FontAwesomeIcon
            icon="plus"
            style={palInverted.text as FontAwesomeIconStyle}
            size={14}
          />
          <Text type="lg-medium" style={palInverted.text}>
            {props.buttonLabel}
          </Text>
        </Button>
      </View>
    </View>
  )
}
const styles = StyleSheet.create({
  container: {
    height: '100%',
    paddingVertical: 40,
    paddingHorizontal: 30,
  },
  iconContainer: {
    marginBottom: 16,
  },
  icon: {
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  btns: {
    flexDirection: 'row',
    justifyContent: 'center',
  },
  btn: {
    gap: 10,
    marginVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 30,
  },
  notice: {
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginHorizontal: 30,
  },
})
