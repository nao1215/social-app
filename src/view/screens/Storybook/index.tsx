/**
 * @file index.tsx - Storybook メイン画面
 * @description デザインシステムのコンポーネントカタログを表示する開発者向けツール
 *
 * ## Goエンジニア向けの説明
 * - Storybook: UIコンポーネントのカタログ/ドキュメントツール（Goのgodocに相当する役割）
 * - デザインシステム: 一貫したUIを構築するためのコンポーネント・スタイル集
 * - ThemeProvider: テーマをコンテキスト経由で子孫に注入（Goのcontext.WithValueに類似）
 *
 * ## 主な機能
 * - テーマ切り替え（System/Light/Dim/Dark）
 * - ボタン、フォーム、タイポグラフィ等の各コンポーネントのプレビュー
 * - アイコン、シャドウ、スペーシング等のデザイントークン表示
 * - ダイアログ、メニュー、トースト等のインタラクティブコンポーネントのテスト
 * - ブレイクポイント（レスポンシブデザイン）の確認
 *
 * ## アーキテクチャ
 * - 各コンポーネントカテゴリを個別ファイルに分離（Buttons.tsx, Forms.tsx 等）
 * - ThemeProvider でテーマをラップしてプレビュー
 * - ListContained で仮想スクロールリストのテスト
 *
 * ## 開発者向け情報
 * - __DEV__ ビルドでのみアクセス可能
 * - 設定 → 開発者オプション → Storybook からアクセス
 * - 新しいコンポーネント追加時はここにも追加してプレビュー可能に
 *
 * @module view/screens/Storybook
 */

// Reactコアライブラリ
import React from 'react'
// React NativeのViewコンポーネント（レイアウトコンテナ）
import {View} from 'react-native'
// React Navigationフック
import {useNavigation} from '@react-navigation/native'

// ナビゲーション型定義
import {type NavigationProp} from '#/lib/routes/types'
// テーマ設定フック（カラーモード切り替え）
import {useSetThemePrefs} from '#/state/shell'
// 仮想スクロールリストのデモコンポーネント
import {ListContained} from '#/view/screens/Storybook/ListContained'
// デザインシステム（atoms: スタイルプリミティブ、ThemeProvider: テーマ注入）
import {atoms as a, ThemeProvider} from '#/alf'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// レイアウトコンポーネント
import * as Layout from '#/components/Layout'
// 各コンポーネントカテゴリのデモ
import {Admonitions} from './Admonitions'
import {Breakpoints} from './Breakpoints'
import {Buttons} from './Buttons'
import {Dialogs} from './Dialogs'
import {Forms} from './Forms'
import {Icons} from './Icons'
import {Links} from './Links'
import {Menus} from './Menus'
import {Settings} from './Settings'
import {Shadows} from './Shadows'
import {Spacing} from './Spacing'
import {Theming} from './Theming'
import {Toasts} from './Toasts'
import {Typography} from './Typography'

/**
 * Storybook - コンポーネントカタログのメイン画面
 *
 * Goでの例:
 * func StorybookHandler(w http.ResponseWriter, r *http.Request) {
 *   components := componentService.GetAll()
 *   render(w, "storybook.html", components)
 * }
 */
export function Storybook() {
  return (
    <Layout.Screen>
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>Storybook</Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      <Layout.Content keyboardShouldPersistTaps="handled">
        <StorybookInner />
      </Layout.Content>
    </Layout.Screen>
  )
}

function StorybookInner() {
  const {setColorMode, setDarkTheme} = useSetThemePrefs()
  const [showContainedList, setShowContainedList] = React.useState(false)
  const navigation = useNavigation<NavigationProp>()

  return (
    <>
      <View style={[a.p_xl, a.gap_5xl, {paddingBottom: 100}]}>
        {!showContainedList ? (
          <>
            <View style={[a.flex_row, a.align_start, a.gap_md]}>
              <Button
                color="primary"
                size="small"
                label='Set theme to "system"'
                onPress={() => setColorMode('system')}>
                <ButtonText>System</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "light"'
                onPress={() => setColorMode('light')}>
                <ButtonText>Light</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "dim"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dim')
                }}>
                <ButtonText>Dim</ButtonText>
              </Button>
              <Button
                color="secondary"
                size="small"
                label='Set theme to "dark"'
                onPress={() => {
                  setColorMode('dark')
                  setDarkTheme('dark')
                }}>
                <ButtonText>Dark</ButtonText>
              </Button>
            </View>

            <Button
              color="primary"
              size="small"
              onPress={() => navigation.navigate('SharedPreferencesTester')}
              label="two"
              testID="sharedPrefsTestOpenBtn">
              <ButtonText>Open Shared Prefs Tester</ButtonText>
            </Button>

            <ThemeProvider theme="light">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dim">
              <Theming />
            </ThemeProvider>
            <ThemeProvider theme="dark">
              <Theming />
            </ThemeProvider>

            <Toasts />
            <Buttons />
            <Forms />
            <Typography />
            <Spacing />
            <Shadows />
            <Icons />
            <Links />
            <Dialogs />
            <Menus />
            <Breakpoints />
            <Dialogs />
            <Admonitions />
            <Settings />

            <Button
              color="primary"
              size="large"
              label="Switch to Contained List"
              onPress={() => setShowContainedList(true)}>
              <ButtonText>Switch to Contained List</ButtonText>
            </Button>
          </>
        ) : (
          <>
            <Button
              color="primary"
              size="large"
              label="Switch to Storybook"
              onPress={() => setShowContainedList(false)}>
              <ButtonText>Switch to Storybook</ButtonText>
            </Button>
            <ListContained />
          </>
        )}
      </View>
    </>
  )
}
