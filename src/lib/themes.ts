// React Nativeのプラットフォーム検出ユーティリティをインポート
// Import React Native platform detection utility
import {Platform} from 'react-native'

// ALFデザインシステムのトークンとパレットをインポート
// Import ALF design system tokens and palettes
import {tokens} from '#/alf'
import {darkPalette, dimPalette, lightPalette} from '#/alf/themes'
import {fontWeight} from '#/alf/tokens'
// レガシーカラー定義をインポート
// Import legacy color definitions
import {colors} from './styles'
// テーマの型定義をインポート
// Import theme type definition
import type {Theme} from './ThemeContext'

// デフォルト（ライト）テーマの定義
// Default (light) theme definition
export const defaultTheme: Theme = {
  colorScheme: 'light', // カラースキーム：ライト / Color scheme: light
  palette: { // カラーパレット定義 / Color palette definition
    default: { // デフォルトカラーテーマ / Default color theme
      background: lightPalette.white, // 背景色 / Background color
      backgroundLight: lightPalette.contrast_25, // 明るい背景色 / Light background color
      text: lightPalette.black, // メインテキスト色 / Main text color
      textLight: lightPalette.contrast_700, // 薄いテキスト色 / Light text color
      textInverted: lightPalette.white, // 反転テキスト色 / Inverted text color
      link: lightPalette.primary_500, // リンク色 / Link color
      border: lightPalette.contrast_100, // ボーダー色 / Border color
      borderDark: lightPalette.contrast_200, // 濃いボーダー色 / Dark border color
      icon: lightPalette.contrast_500, // アイコン色 / Icon color

      // non-standard / 非標準色
      textVeryLight: lightPalette.contrast_400, // 非常に薄いテキスト色 / Very light text color
      replyLine: lightPalette.contrast_100, // リプライ線の色 / Reply line color
      replyLineDot: lightPalette.contrast_200, // リプライ線のドット色 / Reply line dot color
      unreadNotifBg: lightPalette.primary_25, // 未読通知の背景色 / Unread notification background
      unreadNotifBorder: lightPalette.primary_100, // 未読通知のボーダー色 / Unread notification border
      postCtrl: lightPalette.contrast_500, // 投稿コントロール色 / Post control color
      brandText: lightPalette.primary_500, // ブランドテキスト色 / Brand text color
      emptyStateIcon: lightPalette.contrast_300, // 空状態アイコン色 / Empty state icon color
      borderLinkHover: lightPalette.contrast_300, // リンクホバー時のボーダー色 / Link hover border color
    },
    primary: { // プライマリカラーテーマ / Primary color theme
      background: colors.blue3, // プライマリ背景色 / Primary background color
      backgroundLight: colors.blue2, // プライマリ明るい背景色 / Primary light background color
      text: colors.white, // プライマリテキスト色 / Primary text color
      textLight: colors.blue0, // プライマリ薄いテキスト色 / Primary light text color
      textInverted: colors.blue3, // プライマリ反転テキスト色 / Primary inverted text color
      link: colors.blue0, // プライマリリンク色 / Primary link color
      border: colors.blue4, // プライマリボーダー色 / Primary border color
      borderDark: colors.blue5, // プライマリ濃いボーダー色 / Primary dark border color
      icon: colors.blue4, // プライマリアイコン色 / Primary icon color
    },
    secondary: { // セカンダリカラーテーマ / Secondary color theme
      background: colors.green3, // セカンダリ背景色 / Secondary background color
      backgroundLight: colors.green2, // セカンダリ明るい背景色 / Secondary light background color
      text: colors.white, // セカンダリテキスト色 / Secondary text color
      textLight: colors.green1, // セカンダリ薄いテキスト色 / Secondary light text color
      textInverted: colors.green4, // セカンダリ反転テキスト色 / Secondary inverted text color
      link: colors.green1, // セカンダリリンク色 / Secondary link color
      border: colors.green4, // セカンダリボーダー色 / Secondary border color
      borderDark: colors.green5, // セカンダリ濃いボーダー色 / Secondary dark border color
      icon: colors.green4, // セカンダリアイコン色 / Secondary icon color
    },
    inverted: { // 反転カラーテーマ / Inverted color theme
      background: darkPalette.black, // 反転背景色 / Inverted background color
      backgroundLight: darkPalette.contrast_50, // 反転明るい背景色 / Inverted light background color
      text: darkPalette.white, // 反転テキスト色 / Inverted text color
      textLight: darkPalette.contrast_700, // 反転薄いテキスト色 / Inverted light text color
      textInverted: darkPalette.black, // 反転反転テキスト色 / Inverted inverted text color
      link: darkPalette.primary_500, // 反転リンク色 / Inverted link color
      border: darkPalette.contrast_100, // 反転ボーダー色 / Inverted border color
      borderDark: darkPalette.contrast_200, // 反転濃いボーダー色 / Inverted dark border color
      icon: darkPalette.contrast_500, // 反転アイコン色 / Inverted icon color
    },
    error: { // エラーカラーテーマ / Error color theme
      background: colors.red3, // エラー背景色 / Error background color
      backgroundLight: colors.red2, // エラー明るい背景色 / Error light background color
      text: colors.white, // エラーテキスト色 / Error text color
      textLight: colors.red1, // エラー薄いテキスト色 / Error light text color
      textInverted: colors.red3, // エラー反転テキスト色 / Error inverted text color
      link: colors.red1, // エラーリンク色 / Error link color
      border: colors.red4, // エラーボーダー色 / Error border color
      borderDark: colors.red5, // エラー濃いボーダー色 / Error dark border color
      icon: colors.red4, // エラーアイコン色 / Error icon color
    },
  },
  shapes: { // UI要素の形状定義 / UI element shape definitions
    button: {
      // TODO: ボタンの形状定義 / Button shape definition
    },
    bigButton: {
      // TODO: 大きなボタンの形状定義 / Big button shape definition
    },
    smallButton: {
      // TODO: 小さなボタンの形状定義 / Small button shape definition
    },
  },
  typography: { // タイポグラフィ設定 / Typography settings
    '2xl-thin': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    '2xl': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    '2xl-medium': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    '2xl-bold': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    '2xl-heavy': {
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },
    'xl-thin': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    xl: {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'xl-medium': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'xl-bold': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'xl-heavy': {
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },
    'lg-thin': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    lg: {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'lg-medium': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'lg-bold': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'lg-heavy': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },
    'md-thin': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    md: {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'md-medium': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'md-bold': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'md-heavy': {
      fontSize: 15,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },
    'sm-thin': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    sm: {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'sm-medium': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'sm-bold': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'sm-heavy': {
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },
    'xs-thin': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    xs: {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'xs-medium': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'xs-bold': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'xs-heavy': {
      fontSize: 13,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.heavy,
    },

    'title-2xl': {
      fontSize: 34,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'title-xl': {
      fontSize: 28,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.bold,
    },
    'title-lg': {
      fontSize: 22,
      fontWeight: fontWeight.bold,
    },
    title: {
      fontWeight: fontWeight.bold,
      fontSize: 20,
      letterSpacing: tokens.TRACKING,
    },
    'title-sm': {
      fontWeight: fontWeight.bold,
      fontSize: 17,
      letterSpacing: tokens.TRACKING,
    },
    'post-text': {
      fontSize: 16,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'post-text-lg': {
      fontSize: 20,
      letterSpacing: tokens.TRACKING,
      fontWeight: fontWeight.normal,
    },
    'button-lg': {
      fontWeight: fontWeight.bold,
      fontSize: 18,
      letterSpacing: tokens.TRACKING,
    },
    button: {
      fontWeight: fontWeight.bold,
      fontSize: 14,
      letterSpacing: tokens.TRACKING,
    },
    mono: { // 等幅フォント設定 / Monospace font settings
      fontSize: 14,
      // プラットフォームに応じた等幅フォントファミリーを選択
      // Select monospace font family based on platform
      fontFamily: Platform.OS === 'android' ? 'monospace' : 'Courier New',
    },
  },
}

// ダークテーマの定義
// Dark theme definition
export const darkTheme: Theme = {
  ...defaultTheme, // デフォルトテーマをベースとして継承 / Inherit from default theme as base
  colorScheme: 'dark', // カラースキーム：ダーク / Color scheme: dark
  palette: { // ダークテーマ用カラーパレット / Color palette for dark theme
    ...defaultTheme.palette, // デフォルトパレットを継承 / Inherit default palette
    default: { // ダークテーマのデフォルトカラー / Dark theme default colors
      background: darkPalette.black, // ダーク背景色 / Dark background color
      backgroundLight: darkPalette.contrast_25, // ダーク明るい背景色 / Dark light background color
      text: darkPalette.white, // ダークテキスト色 / Dark text color
      textLight: darkPalette.contrast_600, // ダーク薄いテキスト色 / Dark light text color
      textInverted: darkPalette.black, // ダーク反転テキスト色 / Dark inverted text color
      link: darkPalette.primary_500, // ダークリンク色 / Dark link color
      border: darkPalette.contrast_100, // ダークボーダー色 / Dark border color
      borderDark: darkPalette.contrast_200, // ダーク濃いボーダー色 / Dark dark border color
      icon: darkPalette.contrast_500, // ダークアイコン色 / Dark icon color

      // non-standard / ダークテーマ用非標準色
      textVeryLight: darkPalette.contrast_400, // 非常に薄いテキスト色 / Very light text color
      replyLine: darkPalette.contrast_200, // リプライ線の色 / Reply line color
      replyLineDot: darkPalette.contrast_200, // リプライ線のドット色 / Reply line dot color
      unreadNotifBg: darkPalette.primary_25, // 未読通知の背景色 / Unread notification background
      unreadNotifBorder: darkPalette.primary_100, // 未読通知のボーダー色 / Unread notification border
      postCtrl: darkPalette.contrast_500, // 投稿コントロール色 / Post control color
      brandText: darkPalette.primary_500, // ブランドテキスト色 / Brand text color
      emptyStateIcon: darkPalette.contrast_300, // 空状態アイコン色 / Empty state icon color
      borderLinkHover: darkPalette.contrast_300, // リンクホバー時のボーダー色 / Link hover border color
    },
    primary: { // ダークテーマのプライマリ色 / Dark theme primary colors
      ...defaultTheme.palette.primary, // デフォルトのプライマリ色を継承 / Inherit default primary colors
      textInverted: colors.blue2, // ダークテーマ用プライマリ反転テキスト色 / Dark theme primary inverted text color
    },
    secondary: { // ダークテーマのセカンダリ色 / Dark theme secondary colors
      ...defaultTheme.palette.secondary, // デフォルトのセカンダリ色を継承 / Inherit default secondary colors
      textInverted: colors.green2, // ダークテーマ用セカンダリ反転テキスト色 / Dark theme secondary inverted text color
    },
    inverted: { // ダークテーマの反転色（ライト色を使用） / Dark theme inverted colors (using light colors)
      background: darkPalette.white, // 反転背景色 / Inverted background color
      backgroundLight: lightPalette.contrast_50, // 反転明るい背景色 / Inverted light background color
      text: lightPalette.black, // 反転テキスト色 / Inverted text color
      textLight: lightPalette.contrast_700, // 反転薄いテキスト色 / Inverted light text color
      textInverted: darkPalette.white, // 反転反転テキスト色 / Inverted inverted text color
      link: lightPalette.primary_500, // 反転リンク色 / Inverted link color
      border: lightPalette.contrast_100, // 反転ボーダー色 / Inverted border color
      borderDark: lightPalette.contrast_200, // 反転濃いボーダー色 / Inverted dark border color
      icon: lightPalette.contrast_500, // 反転アイコン色 / Inverted icon color
    },
  },
}

// ディム（薄暗い）テーマの定義
// Dim theme definition
export const dimTheme: Theme = {
  ...darkTheme, // ダークテーマをベースとして継承 / Inherit from dark theme as base
  palette: { // ディムテーマ用カラーパレット / Color palette for dim theme
    ...darkTheme.palette, // ダークテーマのパレットを継承 / Inherit dark theme palette
    default: { // ディムテーマのデフォルトカラー / Dim theme default colors
      ...darkTheme.palette.default, // ダークテーマのデフォルト色を継承 / Inherit dark theme default colors
      background: dimPalette.black, // ディム背景色 / Dim background color
      backgroundLight: dimPalette.contrast_25, // ディム明るい背景色 / Dim light background color
      text: dimPalette.white, // ディムテキスト色 / Dim text color
      textLight: dimPalette.contrast_700, // ディム薄いテキスト色 / Dim light text color
      textInverted: dimPalette.black, // ディム反転テキスト色 / Dim inverted text color
      link: dimPalette.primary_500, // ディムリンク色 / Dim link color
      border: dimPalette.contrast_100, // ディムボーダー色 / Dim border color
      borderDark: dimPalette.contrast_200, // ディム濃いボーダー色 / Dim dark border color
      icon: dimPalette.contrast_500, // ディムアイコン色 / Dim icon color

      // non-standard / ディムテーマ用非標準色
      textVeryLight: dimPalette.contrast_400, // 非常に薄いテキスト色 / Very light text color
      replyLine: dimPalette.contrast_200, // リプライ線の色 / Reply line color
      replyLineDot: dimPalette.contrast_200, // リプライ線のドット色 / Reply line dot color
      unreadNotifBg: dimPalette.primary_25, // 未読通知の背景色 / Unread notification background
      unreadNotifBorder: dimPalette.primary_100, // 未読通知のボーダー色 / Unread notification border
      postCtrl: dimPalette.contrast_500, // 投稿コントロール色 / Post control color
      brandText: dimPalette.primary_500, // ブランドテキスト色 / Brand text color
      emptyStateIcon: dimPalette.contrast_300, // 空状態アイコン色 / Empty state icon color
      borderLinkHover: dimPalette.contrast_300, // リンクホバー時のボーダー色 / Link hover border color
    },
  },
}
