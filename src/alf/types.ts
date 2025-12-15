/**
 * デザインシステム型定義ファイル
 *
 * このファイルはBlueskyのデザインシステム(ALF: A Design Language Framework)の
 * 型定義を提供します。テーマ、カラーパレット、アトミックスタイルの型を定義します。
 *
 * デザインシステムとは:
 * UIの一貫性を保つための統一されたデザイン原則、パターン、コンポーネント集。
 * 色、余白、タイポグラフィなどを体系化し、再利用可能にします。
 *
 * Go開発者向け補足:
 * - type/interfaceはGoのstructに相当します
 * - これらの型はJSONタグのように、コンポーネントの形状を定義します
 * - テーマシステムはライト/ダーク/ディムの3つのカラースキームをサポート
 */

// React Nativeのスタイル型をインポート（GoのパッケージインポートのようなISO）
import {StyleProp, TextStyle, ViewStyle} from 'react-native'

/**
 * テキストスタイルプロパティ型
 *
 * テキストコンポーネントで使用されるスタイルプロパティの定義。
 * React NativeのTextStyleを受け入れます。
 *
 * Go開発者向け: Goの構造体タグ `json:"style,omitempty"` のようなオプショナルフィールド
 */
export type TextStyleProp = {
  style?: StyleProp<TextStyle>
}

/**
 * ビュースタイルプロパティ型
 *
 * ビュー（コンテナ）コンポーネントで使用されるスタイルプロパティの定義。
 * React NativeのViewStyleを受け入れます。
 *
 * Go開発者向け: HTMLの<div>や<span>のようなコンテナ要素のスタイル
 */
export type ViewStyleProp = {
  style?: StyleProp<ViewStyle>
}

/**
 * テーマ名型
 *
 * サポートされる3つのテーマを定義:
 * - light: ライトモード（明るい背景）
 * - dim: ディムモード（やや暗い背景、ダークモードより目に優しい）
 * - dark: ダークモード（真っ黒な背景）
 *
 * Go開発者向け: Goの列挙型（enum）のようなユニオン型
 */
export type ThemeName = 'light' | 'dim' | 'dark'

/**
 * カラーパレット型
 *
 * デザインシステム全体で使用される色の定義。
 * HSL色空間を使用して、一貫性のある色階層を生成します。
 *
 * 色の命名規則:
 * - white/black: 基本色
 * - like: いいね（ハート）の色
 * - contrast_XX: コントラスト階層（25が最も薄い、975が最も濃い）
 * - primary_XX: プライマリカラー（ブランドカラー、通常は青）
 * - positive_XX: ポジティブカラー（成功、通常は緑）
 * - negative_XX: ネガティブカラー（エラー、通常は赤）
 *
 * 数値の意味（25〜975）:
 * 色の明るさレベルを表す。25が最も薄く、975が最も濃い。
 * ライトモードとダークモードで反転して使用されます。
 *
 * Go開発者向け:
 * - これはGoのstructに相当し、各フィールドは色文字列（例: "#FFFFFF"や"hsl(210, 50%, 90%)"）
 * - 13段階の階層により、微妙なグラデーションや状態表現が可能
 */
export type Palette = {
  white: string  // 純白色
  black: string  // 純黒色
  like: string   // いいね（ハート）色

  // コントラスト階層（テキスト、背景、ボーダーで使用）
  contrast_25: string   // 最も薄いコントラスト
  contrast_50: string
  contrast_100: string
  contrast_200: string
  contrast_300: string
  contrast_400: string
  contrast_500: string  // 中間コントラスト
  contrast_600: string
  contrast_700: string
  contrast_800: string
  contrast_900: string
  contrast_950: string
  contrast_975: string  // 最も濃いコントラスト

  // プライマリカラー階層（ブランドカラー、通常は青）
  primary_25: string    // 最も薄いプライマリ
  primary_50: string
  primary_100: string
  primary_200: string
  primary_300: string
  primary_400: string
  primary_500: string   // 中間プライマリ
  primary_600: string
  primary_700: string
  primary_800: string
  primary_900: string
  primary_950: string
  primary_975: string   // 最も濃いプライマリ

  // ポジティブカラー階層（成功、承認、通常は緑）
  positive_25: string   // 最も薄いポジティブ
  positive_50: string
  positive_100: string
  positive_200: string
  positive_300: string
  positive_400: string
  positive_500: string  // 中間ポジティブ
  positive_600: string
  positive_700: string
  positive_800: string
  positive_900: string
  positive_950: string
  positive_975: string  // 最も濃いポジティブ

  // ネガティブカラー階層（エラー、警告、通常は赤）
  negative_25: string   // 最も薄いネガティブ
  negative_50: string
  negative_100: string
  negative_200: string
  negative_300: string
  negative_400: string
  negative_500: string  // 中間ネガティブ
  negative_600: string
  negative_700: string
  negative_800: string
  negative_900: string
  negative_950: string
  negative_975: string  // 最も濃いネガティブ
}

/**
 * テーマ別アトミックスタイル型
 *
 * テーマ（light/dim/dark）ごとに変化するスタイル定義。
 * Atomic CSS の概念に基づき、単一の目的を持つ小さなスタイルユニット。
 *
 * アトミックCSSとは:
 * 1つのCSSプロパティのみを持つ小さなクラス（例: .text-center { text-align: center; }）
 * これにより再利用性と保守性が向上します。
 *
 * Go開発者向け:
 * - これらはテーマに依存する動的なスタイル値を定義
 * - 例えば、textの色はlightテーマでは黒、darkテーマでは白になる
 * - shadow系はiOS/Androidで異なるプロパティを使用（elevation vs shadowRadius）
 */
export type ThemedAtoms = {
  // テキスト色バリエーション
  text: {
    color: string  // デフォルトテキスト色（lightは黒、darkは白）
  }
  text_contrast_low: {
    color: string  // 低コントラストテキスト（補助テキスト、プレースホルダー等）
  }
  text_contrast_medium: {
    color: string  // 中コントラストテキスト（サブテキスト等）
  }
  text_contrast_high: {
    color: string  // 高コントラストテキスト（強調テキスト等）
  }
  text_inverted: {
    color: string  // 反転テキスト色（ボタン内の白文字等）
  }

  // 背景色バリエーション（13段階のコントラストレベル）
  bg: {
    backgroundColor: string  // デフォルト背景色
  }
  bg_contrast_25: {
    backgroundColor: string  // 最も薄い背景
  }
  bg_contrast_50: {
    backgroundColor: string
  }
  bg_contrast_100: {
    backgroundColor: string
  }
  bg_contrast_200: {
    backgroundColor: string
  }
  bg_contrast_300: {
    backgroundColor: string
  }
  bg_contrast_400: {
    backgroundColor: string
  }
  bg_contrast_500: {
    backgroundColor: string  // 中間背景
  }
  bg_contrast_600: {
    backgroundColor: string
  }
  bg_contrast_700: {
    backgroundColor: string
  }
  bg_contrast_800: {
    backgroundColor: string
  }
  bg_contrast_900: {
    backgroundColor: string
  }
  bg_contrast_950: {
    backgroundColor: string
  }
  bg_contrast_975: {
    backgroundColor: string  // 最も濃い背景
  }

  // ボーダー色バリエーション
  border_contrast_low: {
    borderColor: string  // 低コントラストボーダー（微妙な区切り線）
  }
  border_contrast_medium: {
    borderColor: string  // 中コントラストボーダー（通常の区切り線）
  }
  border_contrast_high: {
    borderColor: string  // 高コントラストボーダー（強調された区切り線）
  }

  // シャドウスタイル（3サイズ）
  // iOSではshadowRadius/shadowOpacity、AndroidではelevationプロパティでシャドウVを実現
  shadow_sm: {
    shadowRadius: number     // シャドウのぼかし半径
    shadowOpacity: number    // シャドウの不透明度
    elevation: number        // Android用のエレベーション（高さ）
    shadowColor: string      // シャドウの色
  }
  shadow_md: {
    shadowRadius: number     // 中サイズシャドウ
    shadowOpacity: number
    elevation: number
    shadowColor: string
  }
  shadow_lg: {
    shadowRadius: number     // 大サイズシャドウ
    shadowOpacity: number
    elevation: number
    shadowColor: string
  }
}

/**
 * テーマ型
 *
 * アプリケーション全体のテーマ定義。
 * パレット（色定義）とアトミックスタイル（適用済みスタイル）を含みます。
 *
 * プロパティ:
 * - scheme: ライブラリサポート用のスキーム（'light' または 'dark'）
 * - name: テーマ名（'light', 'dim', 'dark'）
 * - palette: カラーパレット（色の定義）
 * - atoms: テーマ別アトミックスタイル（適用済みのスタイルオブジェクト）
 *
 * Go開発者向け:
 * - これは設定structのようなもので、アプリの見た目を完全に定義
 * - React Contextを通じて全コンポーネントに提供され、useTheme()フックで取得
 * - テーマ切り替え時は、このオブジェクト全体が新しいテーマに置き換わる
 */
export type Theme = {
  scheme: 'light' | 'dark'  // ライブラリサポート用（一部のライブラリはlight/darkのみ認識）
  name: ThemeName           // 実際のテーマ名（light/dim/dark）
  palette: Palette          // カラーパレット定義
  atoms: ThemedAtoms        // テーマ別アトミックスタイル
}
