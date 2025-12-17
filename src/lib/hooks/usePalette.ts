/**
 * パレットスタイル取得フック（非推奨）
 *
 * 【概要】
 * テーマカラーパレットからスタイルオブジェクトを生成。
 * レガシーコードで使用されている旧スタイルシステム。
 *
 * 【注意】
 * このフックは非推奨（@deprecated）。
 * 新しいコードでは`#/alf`のuseThemeを使用すること。
 *
 * 【提供スタイル】
 * - view/viewLight: コンテナの背景色
 * - btn: ボタンの背景色
 * - border/borderDark: ボーダー色
 * - text/textLight/textInverted: テキスト色
 * - link: リンク色
 * - icon: アイコン色
 *
 * 【Goユーザー向け補足】
 * - useMemo: 計算結果のキャッシュ（Goのsync.Onceに類似）
 * - @deprecated: Goのdeprecated: コメントに相当
 */
import {useMemo} from 'react'
import {type TextStyle, type ViewStyle} from 'react-native'

import {
  type PaletteColor,
  type PaletteColorName,
  useTheme,
} from '../ThemeContext'

/**
 * usePaletteの戻り値の型定義
 * 各種スタイルオブジェクトを含む
 */
export interface UsePaletteValue {
  colors: PaletteColor       // 元のカラー値
  view: ViewStyle            // コンテナ背景
  viewLight: ViewStyle       // 明るい背景
  btn: ViewStyle             // ボタン背景
  border: ViewStyle          // 通常ボーダー
  borderDark: ViewStyle      // 濃いボーダー
  text: TextStyle            // 通常テキスト
  textLight: TextStyle       // 薄いテキスト
  textInverted: TextStyle    // 反転テキスト
  link: TextStyle            // リンクテキスト
  icon: TextStyle            // アイコン色
}

/**
 * テーマパレットからスタイルを取得するフック
 *
 * @deprecated `#/alf`のuseThemeを使用してください
 * @param color パレット名（'default', 'primary'など）
 * @returns スタイルオブジェクトのコレクション
 */
export function usePalette(color: PaletteColorName): UsePaletteValue {
  const theme = useTheme()
  return useMemo(() => {
    const palette = theme.palette[color]
    return {
      colors: palette,
      view: {
        backgroundColor: palette.background,
      },
      viewLight: {
        backgroundColor: palette.backgroundLight,
      },
      btn: {
        backgroundColor: palette.backgroundLight,
      },
      border: {
        borderColor: palette.border,
      },
      borderDark: {
        borderColor: palette.borderDark,
      },
      text: {
        color: palette.text,
      },
      textLight: {
        color: palette.textLight,
      },
      textInverted: {
        color: palette.textInverted,
      },
      link: {
        color: palette.link,
      },
      icon: {
        color: palette.icon,
      },
    }
  }, [theme, color])
}
