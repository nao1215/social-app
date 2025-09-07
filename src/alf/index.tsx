// React基本機能
import React from 'react' // Reactライブラリ

// フォント機能
import {
  computeFontScaleMultiplier,
  getFontFamily,
  getFontScale,
  setFontFamily as persistFontFamily,
  setFontScale as persistFontScale,
} from '#/alf/fonts'                                                     // フォント管理機能
import {createThemes, defaultTheme} from '#/alf/themes'                  // テーマ作成・デフォルトテーマ
import {type Theme, type ThemeName} from '#/alf/types'                   // テーマ型定義
import {BLUE_HUE, GREEN_HUE, RED_HUE} from '#/alf/util/colorGeneration' // 色相定数
import {type Device} from '#/storage'                                    // デバイス型定義

// Alfデザインシステムのエクスポート
export {atoms} from '#/alf/atoms'              // アトミックスタイル
export * from '#/alf/breakpoints'              // ブレイクポイント
export * from '#/alf/fonts'                    // フォント機能
export * as tokens from '#/alf/tokens'         // デザイントークン
export * from '#/alf/types'                    // 型定義
export * from '#/alf/util/flatten'             // フラット化ユーティリティ
export * from '#/alf/util/platform'            // プラットフォームユーティリティ
export * from '#/alf/util/themeSelector'       // テーマセレクター
export * from '#/alf/util/useGutters'          // ガターユーティリティ

/**
 * Alfデザインシステムのメイン型定義
 * テーマ、フォント、機能フラグなどのすべてのAlfリソースを統合
 * Main type definition for Alf design system
 * Integrates all Alf resources: themes, fonts, feature flags, etc.
 */
export type Alf = {
  themeName: ThemeName                                          // 現在のテーマ名
  theme: Theme                                                  // 現在のテーマオブジェクト
  themes: ReturnType<typeof createThemes>                       // 利用可能なテーマ群
  fonts: {                                                      // フォント設定
    scale: Exclude<Device['fontScale'], undefined>              // フォントスケール
    scaleMultiplier: number                                     // スケール倍率
    family: Device['fontFamily']                                // フォントファミリー
    setFontScale: (fontScale: Exclude<Device['fontScale'], undefined>) => void  // フォントスケール設定
    setFontFamily: (fontFamily: Device['fontFamily']) => void   // フォントファミリー設定
  }
  /**
   * 機能フラグやその他のゲート制御オプション
   * Feature flags or other gated options
   */
  flags: {}
}

/**
 * AlfコンテキストのReactコンテキスト
 * デフォルト値を持つAlfデザインシステムのコンテキスト
 * React context for Alf context
 * Context for Alf design system with default values
 */
export const Context = React.createContext<Alf>({
  themeName: 'light',
  theme: defaultTheme,
  themes: createThemes({
    hues: {
      primary: BLUE_HUE,
      negative: RED_HUE,
      positive: GREEN_HUE,
    },
  }),
  fonts: {
    scale: getFontScale(),
    scaleMultiplier: computeFontScaleMultiplier(getFontScale()),
    family: getFontFamily(),
    setFontScale: () => {},
    setFontFamily: () => {},
  },
  flags: {},
})
Context.displayName = 'AlfContext'

export function ThemeProvider({
  children,
  theme: themeName,
}: React.PropsWithChildren<{theme: ThemeName}>) {
  const [fontScale, setFontScale] = React.useState<Alf['fonts']['scale']>(() =>
    getFontScale(),
  )
  const [fontScaleMultiplier, setFontScaleMultiplier] = React.useState(() =>
    computeFontScaleMultiplier(fontScale),
  )
  const setFontScaleAndPersist = React.useCallback<
    Alf['fonts']['setFontScale']
  >(
    fontScale => {
      setFontScale(fontScale)
      persistFontScale(fontScale)
      setFontScaleMultiplier(computeFontScaleMultiplier(fontScale))
    },
    [setFontScale],
  )
  const [fontFamily, setFontFamily] = React.useState<Alf['fonts']['family']>(
    () => getFontFamily(),
  )
  const setFontFamilyAndPersist = React.useCallback<
    Alf['fonts']['setFontFamily']
  >(
    fontFamily => {
      setFontFamily(fontFamily)
      persistFontFamily(fontFamily)
    },
    [setFontFamily],
  )
  const themes = React.useMemo(() => {
    return createThemes({
      hues: {
        primary: BLUE_HUE,
        negative: RED_HUE,
        positive: GREEN_HUE,
      },
    })
  }, [])

  const value = React.useMemo<Alf>(
    () => ({
      themes,
      themeName: themeName,
      theme: themes[themeName],
      fonts: {
        scale: fontScale,
        scaleMultiplier: fontScaleMultiplier,
        family: fontFamily,
        setFontScale: setFontScaleAndPersist,
        setFontFamily: setFontFamilyAndPersist,
      },
      flags: {},
    }),
    [
      themeName,
      themes,
      fontScale,
      setFontScaleAndPersist,
      fontFamily,
      setFontFamilyAndPersist,
      fontScaleMultiplier,
    ],
  )

  return <Context.Provider value={value}>{children}</Context.Provider>
}

export function useAlf() {
  return React.useContext(Context)
}

export function useTheme(theme?: ThemeName) {
  const alf = useAlf()
  return React.useMemo(() => {
    return theme ? alf.themes[theme] : alf.theme
  }, [theme, alf])
}
