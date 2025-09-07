// React Nativeのスタイル関連のユーティリティとタイプ定義をインポート
// Imports React Native style utilities and type definitions
import {
  Dimensions, // デバイスの画面サイズ情報を取得するAPI / API to get device screen dimensions
  type StyleProp, // スタイルプロパティの型定義 / Type definition for style properties
  StyleSheet, // スタイルシートを作成するためのAPI / API for creating stylesheets
  type TextStyle, // テキストスタイルの型定義 / Type definition for text styles
} from 'react-native'

// プラットフォーム検出ユーティリティをインポート
// Import platform detection utility
import {isWeb} from '#/platform/detection'
// テーマとタイポグラフィの型定義をインポート
// Import theme and typography type definitions
import {type Theme, type TypographyVariant} from './ThemeContext'

// 1 is lightest, 2 is light, 3 is mid, 4 is dark, 5 is darkest
// カラーパレット定義（1が最も明るく、5が最も暗い）
/**
 * @deprecated use ALF colors instead
 * @deprecated 代わりにALFカラーを使用してください
 */
// アプリケーション全体で使用する色の定数定義
// Color constant definitions used throughout the application
export const colors = {
  white: '#ffffff',
  black: '#000000',

  gray1: '#F3F3F8',
  gray2: '#E2E2E4',
  gray3: '#B9B9C1',
  gray4: '#8D8E96',
  gray5: '#545664',
  gray6: '#373942',
  gray7: '#26272D',
  gray8: '#141417',

  blue0: '#bfe1ff',
  blue1: '#8bc7fd',
  blue2: '#52acfe',
  blue3: '#0085ff',
  blue4: '#0062bd',
  blue5: '#034581',
  blue6: '#012561',
  blue7: '#001040',

  red1: '#ffe6eb',
  red2: '#fba2b2',
  red3: '#ec4868',
  red4: '#d11043',
  red5: '#970721',
  red6: '#690419',
  red7: '#4F0314',

  pink1: '#f8ccff',
  pink2: '#e966ff',
  pink3: '#db00ff',
  pink4: '#a601c1',
  pink5: '#570066',

  purple1: '#ebdbff',
  purple2: '#ba85ff',
  purple3: '#9747ff',
  purple4: '#6d00fa',
  purple5: '#380080',

  green1: '#c1ffb8',
  green2: '#27f406',
  green3: '#20bc07',
  green4: '#148203',
  green5: '#082b03',

  unreadNotifBg: '#ebf6ff',
  brandBlue: '#0066FF',
  like: '#ec4899',
}

// グラデーション色の定義（ボタンやUI要素で使用）
// Gradient color definitions used for buttons and UI elements
export const gradients = {
  blueLight: {start: '#5A71FA', end: colors.blue3}, // buttons / ボタン用
  blue: {start: '#5E55FB', end: colors.blue3}, // fab / フローティングアクションボタン用
  blueDark: {start: '#5F45E0', end: colors.blue3}, // avis, banner / アバターやバナー用
}

/**
 * @deprecated use atoms from `#/alf`
 * @deprecated `#/alf`のatomsを使用してください
 */
// 再利用可能なスタイルオブジェクトの定義
// Reusable style object definitions
export const s = StyleSheet.create({
  // helpers / ヘルパースタイル
  footerSpacer: {height: 100}, // フッターのスペーサー / Footer spacer
  contentContainer: {paddingBottom: 200}, // コンテンツコンテナ / Content container
  contentContainerExtra: {paddingBottom: 300}, // 拡張コンテンツコンテナ / Extended content container
  border0: {borderWidth: 0}, // ボーダーなし / No border
  border1: {borderWidth: 1}, // 1pxボーダー / 1px border
  borderTop1: {borderTopWidth: 1}, // 上ボーダー1px / Top border 1px
  borderRight1: {borderRightWidth: 1}, // 右ボーダー1px / Right border 1px
  borderBottom1: {borderBottomWidth: 1}, // 下ボーダー1px / Bottom border 1px
  borderLeft1: {borderLeftWidth: 1}, // 左ボーダー1px / Left border 1px
  hidden: {display: 'none'}, // 非表示 / Hidden
  dimmed: {opacity: 0.5}, // 半透明 / Semi-transparent

  // font weights / フォントウェイト
  fw600: {fontWeight: '600'}, // セミボールド / Semi-bold
  bold: {fontWeight: '600'}, // ボールド / Bold
  fw500: {fontWeight: '600'}, // ミディアム / Medium
  semiBold: {fontWeight: '600'}, // セミボールド / Semi-bold
  fw400: {fontWeight: '400'}, // ノーマル / Normal
  normal: {fontWeight: '400'}, // ノーマル / Normal
  fw300: {fontWeight: '400'}, // ライト / Light
  light: {fontWeight: '400'}, // ライト / Light

  // text decoration / テキスト装飾
  underline: {textDecorationLine: 'underline'}, // 下線 / Underline

  // font variants / フォントバリアント
  tabularNum: {fontVariant: ['tabular-nums']}, // 等幅数字 / Tabular numbers

  // font sizes / フォントサイズ
  f9: {fontSize: 9},
  f10: {fontSize: 10},
  f11: {fontSize: 11},
  f12: {fontSize: 12},
  f13: {fontSize: 13},
  f14: {fontSize: 14},
  f15: {fontSize: 15},
  f16: {fontSize: 16},
  f17: {fontSize: 17},
  f18: {fontSize: 18},

  // line heights / 行の高さ
  ['lh13-1']: {lineHeight: 13},
  ['lh13-1.3']: {lineHeight: 16.9}, // 1.3 of 13px
  ['lh14-1']: {lineHeight: 14},
  ['lh14-1.3']: {lineHeight: 18.2}, // 1.3 of 14px
  ['lh15-1']: {lineHeight: 15},
  ['lh15-1.3']: {lineHeight: 19.5}, // 1.3 of 15px
  ['lh16-1']: {lineHeight: 16},
  ['lh16-1.3']: {lineHeight: 20.8}, // 1.3 of 16px
  ['lh17-1']: {lineHeight: 17},
  ['lh17-1.3']: {lineHeight: 22.1}, // 1.3 of 17px
  ['lh18-1']: {lineHeight: 18},
  ['lh18-1.3']: {lineHeight: 23.4}, // 1.3 of 18px

  // margins / マージン
  mr2: {marginRight: 2},
  mr5: {marginRight: 5},
  mr10: {marginRight: 10},
  mr20: {marginRight: 20},
  ml2: {marginLeft: 2},
  ml5: {marginLeft: 5},
  ml10: {marginLeft: 10},
  ml20: {marginLeft: 20},
  mt2: {marginTop: 2},
  mt5: {marginTop: 5},
  mt10: {marginTop: 10},
  mt20: {marginTop: 20},
  mb2: {marginBottom: 2},
  mb5: {marginBottom: 5},
  mb10: {marginBottom: 10},
  mb20: {marginBottom: 20},

  // paddings / パディング
  p2: {padding: 2},
  p5: {padding: 5},
  p10: {padding: 10},
  p20: {padding: 20},
  pr2: {paddingRight: 2},
  pr5: {paddingRight: 5},
  pr10: {paddingRight: 10},
  pr20: {paddingRight: 20},
  pl2: {paddingLeft: 2},
  pl5: {paddingLeft: 5},
  pl10: {paddingLeft: 10},
  pl20: {paddingLeft: 20},
  pt2: {paddingTop: 2},
  pt5: {paddingTop: 5},
  pt10: {paddingTop: 10},
  pt20: {paddingTop: 20},
  pb2: {paddingBottom: 2},
  pb5: {paddingBottom: 5},
  pb10: {paddingBottom: 10},
  pb20: {paddingBottom: 20},
  px5: {paddingHorizontal: 5},

  // flex / フレックスレイアウト
  flexRow: {flexDirection: 'row'}, // 横並び / Horizontal layout
  flexCol: {flexDirection: 'column'}, // 縦並び / Vertical layout
  flex1: {flex: 1}, // フレックス1 / Flex 1
  flexGrow1: {flexGrow: 1}, // フレックスグロー1 / Flex grow 1
  alignCenter: {alignItems: 'center'}, // 中央寄せ / Center alignment
  alignBaseline: {alignItems: 'baseline'}, // ベースライン寄せ / Baseline alignment
  justifyCenter: {justifyContent: 'center'}, // 中央寄せ（主軸） / Center justification

  // position / ポジショニング
  absolute: {position: 'absolute'}, // 絶対配置 / Absolute positioning

  // dimensions / サイズ
  w100pct: {width: '100%'}, // 幅100% / Width 100%
  h100pct: {height: '100%'}, // 高さ100% / Height 100%
  hContentRegion: isWeb ? {minHeight: '100%'} : {height: '100%'}, // コンテンツ領域の高さ / Content region height
  window: { // ウィンドウサイズ / Window dimensions
    width: Dimensions.get('window').width,
    height: Dimensions.get('window').height,
  },

  // text align / テキスト配置
  textLeft: {textAlign: 'left'}, // 左寄せ / Left align
  textCenter: {textAlign: 'center'}, // 中央寄せ / Center align
  textRight: {textAlign: 'right'}, // 右寄せ / Right align

  // colors / 色
  white: {color: colors.white},
  black: {color: colors.black},

  gray1: {color: colors.gray1},
  gray2: {color: colors.gray2},
  gray3: {color: colors.gray3},
  gray4: {color: colors.gray4},
  gray5: {color: colors.gray5},

  blue1: {color: colors.blue1},
  blue2: {color: colors.blue2},
  blue3: {color: colors.blue3},
  blue4: {color: colors.blue4},
  blue5: {color: colors.blue5},

  red1: {color: colors.red1},
  red2: {color: colors.red2},
  red3: {color: colors.red3},
  red4: {color: colors.red4},
  red5: {color: colors.red5},

  pink1: {color: colors.pink1},
  pink2: {color: colors.pink2},
  pink3: {color: colors.pink3},
  pink4: {color: colors.pink4},
  pink5: {color: colors.pink5},

  purple1: {color: colors.purple1},
  purple2: {color: colors.purple2},
  purple3: {color: colors.purple3},
  purple4: {color: colors.purple4},
  purple5: {color: colors.purple5},

  green1: {color: colors.green1},
  green2: {color: colors.green2},
  green3: {color: colors.green3},
  green4: {color: colors.green4},
  green5: {color: colors.green5},

  brandBlue: {color: colors.brandBlue},
  likeColor: {color: colors.like},
})

/**
 * テーマに基づいて行の高さを計算するユーティリティ関数
 * Utility function to calculate line height based on theme
 * @param theme テーマオブジェクト / Theme object
 * @param type タイポグラフィのバリアント / Typography variant
 * @param height 高さの倍数 / Height multiplier
 * @returns テキストスタイル / Text style
 */
export function lh(
  theme: Theme,
  type: TypographyVariant,
  height: number,
): TextStyle {
  return {
    // フォントサイズに高さの倍数を掛けて行の高さを計算
    // Calculate line height by multiplying font size with height multiplier
    lineHeight: Math.round((theme.typography[type].fontSize || 16) * height),
  }
}

/**
 * スタイルを追加するユーティリティ関数
 * Utility function to add styles
 * @param base ベースとなるスタイル / Base style
 * @param addedStyle 追加するスタイル / Style to add
 * @returns 結合されたスタイル / Combined style
 */
export function addStyle<T>(
  base: StyleProp<T>,
  addedStyle: StyleProp<T>,
): StyleProp<T> {
  // ベーススタイルが配列の場合は連結、そうでなければ新しい配列を作成
  // If base style is an array, concatenate; otherwise create a new array
  if (Array.isArray(base)) {
    return base.concat([addedStyle])
  }
  return [base, addedStyle]
}
