/**
 * エラーメッセージコンポーネント
 * Error Message Component
 *
 * 【概要】
 * エラー発生時に表示するインラインエラーメッセージコンポーネント。
 * エラーアイコン、メッセージ、リトライボタンを含むコンパクトな表示。
 *
 * 【使用場面】
 * - データ取得失敗時のエラー表示
 * - フォーム送信エラー
 * - ネットワークエラー通知
 *
 * 【Goユーザー向け補足】
 * - TouchableOpacity: タップ時に透明度が変わるタッチ可能コンポーネント
 * - usePalette('error'): エラー専用のカラーパレット取得
 * - accessibilityRole: スクリーンリーダー向けの役割指定（Goには直接対応なし）
 */

// React Nativeの基本コンポーネントと型
// React Native basic components and types
import {
  StyleProp,
  StyleSheet,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native'

// FontAwesomeアイコンコンポーネント
// FontAwesome icon component
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'

// 国際化マクロ
// Internationalization macro
import {msg} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// テーマカラー取得フック
// Theme color hook
import {usePalette} from '#/lib/hooks/usePalette'

// テーマコンテキスト
// Theme context
import {useTheme} from '#/lib/ThemeContext'

// レイアウトコンポーネント
// Layout components
import * as Layout from '#/components/Layout'

// テキストコンポーネント
// Text component
import {Text} from '../text/Text'

/**
 * エラーメッセージコンポーネント
 * Error Message Component
 *
 * @param message エラーメッセージ / Error message
 * @param numberOfLines 最大表示行数 / Maximum display lines
 * @param style カスタムスタイル / Custom style
 * @param onPressTryAgain リトライボタン押下時のコールバック / Callback on retry button press
 */
export function ErrorMessage({
  message,
  numberOfLines,
  style,
  onPressTryAgain,
}: {
  message: string
  numberOfLines?: number
  style?: StyleProp<ViewStyle>
  onPressTryAgain?: () => void
}) {
  const theme = useTheme()
  const pal = usePalette('error')
  const {_} = useLingui()
  return (
    <Layout.Center>
      <View testID="errorMessageView" style={[styles.outer, pal.view, style]}>
        <View
          style={[
            styles.errorIcon,
            {backgroundColor: theme.palette.error.icon},
          ]}>
          <FontAwesomeIcon
            icon="exclamation"
            style={pal.text as FontAwesomeIconStyle}
            size={16}
          />
        </View>
        <Text
          type="sm-medium"
          style={[styles.message, pal.text]}
          numberOfLines={numberOfLines}>
          {message}
        </Text>
        {onPressTryAgain && (
          <TouchableOpacity
            testID="errorMessageTryAgainButton"
            style={styles.btn}
            onPress={onPressTryAgain}
            accessibilityRole="button"
            accessibilityLabel={_(msg`Retry`)}
            accessibilityHint={_(
              msg`Retries the last action, which errored out`,
            )}>
            <FontAwesomeIcon
              icon="arrows-rotate"
              style={{color: theme.palette.error.icon}}
              size={18}
            />
          </TouchableOpacity>
        )}
      </View>
    </Layout.Center>
  )
}

const styles = StyleSheet.create({
  outer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 8,
  },
  errorIcon: {
    borderRadius: 12,
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  message: {
    flex: 1,
    paddingRight: 10,
  },
  btn: {
    paddingHorizontal: 4,
    paddingVertical: 4,
  },
})
