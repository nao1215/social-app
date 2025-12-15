/**
 * @file Debug.tsx - デバッグパネル画面
 * @description 開発時のUIコンポーネント確認・テスト用のデバッグ画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: UIコンポーネントのカタログ/スタイルガイド
 * - ステートフル: useState で現在のタブとテーマを管理
 * - テーマプロバイダー: 子コンポーネントにテーマを注入（Goのcontext.Contextに類似）
 * - ViewSelector: スワイプ可能なタブUI（BaseタブでSwipeを切り替え）
 *
 * ## 主な機能
 * - UIコンポーネントのプレビュー（タイポグラフィ、ボタン、パレット等）
 * - ダークモード切り替えテスト
 * - エラー表示のプレビュー
 * - トースト通知のテスト
 * - ローディングプレースホルダーの確認
 *
 * ## アーキテクチャ
 * - 4つのタブ: Base（基本UI）、Controls（操作UI）、Error（エラー）、Notifs（通知）
 * - ThemeProvider でテーマを切り替え可能
 * - デバッグ専用画面（本番では使用しない）
 *
 * ## レガシー情報
 * - ViewHeader, ViewSelector: 旧コンポーネント（デバッグ用途なので移行せず維持）
 *
 * @module view/screens/Debug
 */

// Reactコアライブラリ
import React from 'react'
// React Native基本コンポーネント
import {ScrollView, View} from 'react-native'
// 国際化ライブラリ（翻訳）
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// テーマカラー取得フック
import {usePalette} from '#/lib/hooks/usePalette'
// ナビゲーション型定義
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// 共通スタイル
import {s} from '#/lib/styles'
// テーマプロバイダー（ライト/ダークテーマ切り替え）
import {type PaletteColorName, ThemeProvider} from '#/lib/ThemeContext'
// 空状態表示コンポーネント
import {EmptyState} from '#/view/com/util/EmptyState'
// エラーメッセージコンポーネント
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
// エラー画面コンポーネント
import {ErrorScreen} from '#/view/com/util/error/ErrorScreen'
// ボタンコンポーネント
import {Button} from '#/view/com/util/forms/Button'
// トグルボタンコンポーネント
import {ToggleButton} from '#/view/com/util/forms/ToggleButton'
// ローディングプレースホルダーコンポーネント群
import * as LoadingPlaceholder from '#/view/com/util/LoadingPlaceholder'
// テキストコンポーネント
import {Text} from '#/view/com/util/text/Text'
// トースト通知
import * as Toast from '#/view/com/util/Toast'
// ビューヘッダー（レガシー）
import {ViewHeader} from '#/view/com/util/ViewHeader'
// ビューセレクター（タブ切り替え、レガシー）
import {ViewSelector} from '#/view/com/util/ViewSelector'
// レイアウトコンポーネント
import * as Layout from '#/components/Layout'

// メインタブの定義（Base, Controls, Error, Notifs）
const MAIN_VIEWS = ['Base', 'Controls', 'Error', 'Notifs']

/**
 * DebugScreen - デバッグ画面のエントリーポイント
 *
 * Goでの例:
 * func DebugHandler(w http.ResponseWriter, r *http.Request) {
 *   theme := r.URL.Query().Get("theme")
 *   render(w, "debug.html", theme)
 * }
 *
 * テーマプロバイダーでラップし、ダークモード切り替えを実現
 */
export const DebugScreen = ({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Debug'
>) => {
  // カラースキーム状態管理（light/dark）
  const [colorScheme, setColorScheme] = React.useState<'light' | 'dark'>(
    'light',
  )
  // テーマ切り替えハンドラー
  const onToggleColorScheme = () => {
    setColorScheme(colorScheme === 'light' ? 'dark' : 'light')
  }
  return (
    // ThemeProvider: 子コンポーネントにテーマを注入（Goのcontext.Contextに類似）
    <ThemeProvider theme={colorScheme}>
      <Layout.Screen>
        <DebugInner
          colorScheme={colorScheme}
          onToggleColorScheme={onToggleColorScheme}
        />
      </Layout.Screen>
    </ThemeProvider>
  )
}

/**
 * DebugInner - デバッグパネルのメインコンポーネント
 *
 * ViewSelectorを使用して4つのタブ（Base, Controls, Error, Notifs）を切り替え
 */
function DebugInner({
  colorScheme,
  onToggleColorScheme,
}: {
  colorScheme: 'light' | 'dark'
  onToggleColorScheme: () => void
}) {
  // 現在のタブインデックス（0=Base, 1=Controls, 2=Error, 3=Notifs）
  const [currentView, setCurrentView] = React.useState<number>(0)
  const pal = usePalette('default') // テーマカラー（レガシー）
  const {_} = useLingui() // 国際化

  /**
   * renderItem - ViewSelectorのレンダー関数
   *
   * 各タブの内容を条件分岐で切り替え
   */
  const renderItem = (item: any) => {
    return (
      <View key={`view-${item.currentView}`}>
        {/* ダークモード切り替えトグル（全タブ共通） */}
        <View style={[s.pt10, s.pl10, s.pr10]}>
          <ToggleButton
            type="default-light"
            onPress={onToggleColorScheme}
            isSelected={colorScheme === 'dark'}
            label={_(msg`Dark mode`)}
          />
        </View>
        {/* タブコンテンツの条件分岐 */}
        {item.currentView === 3 ? (
          <NotifsView />
        ) : item.currentView === 2 ? (
          <ErrorView />
        ) : item.currentView === 1 ? (
          <ControlsView />
        ) : (
          <BaseView />
        )}
      </View>
    )
  }

  // ViewSelectorに渡すアイテム（現在のタブインデックスを含む）
  const items = [{currentView}]

  return (
    <View style={[s.hContentRegion, pal.view]}>
      <ViewHeader title={_(msg`Debug panel`)} />
      {/* スワイプ可能なタブセレクター */}
      <ViewSelector
        swipeEnabled
        sections={MAIN_VIEWS}
        items={items}
        renderItem={renderItem}
        onSelectView={setCurrentView}
      />
    </View>
  )
}

/**
 * Heading - セクション見出しコンポーネント
 *
 * 各UIセクションのタイトルを表示
 */
function Heading({label}: {label: string}) {
  const pal = usePalette('default')
  return (
    <View style={[s.pt10, s.pb5]}>
      <Text type="title-lg" style={pal.text}>
        {label}
      </Text>
    </View>
  )
}

/**
 * BaseView - 基本UIコンポーネントのプレビュータブ
 *
 * タイポグラフィ、カラーパレット、空状態、ローディングプレースホルダーを表示
 */
function BaseView() {
  return (
    <View style={[s.pl10, s.pr10]}>
      <Heading label="Typography" />
      <TypographyView />
      <Heading label="Palettes" />
      <PaletteView palette="default" />
      <PaletteView palette="primary" />
      <PaletteView palette="secondary" />
      <PaletteView palette="inverted" />
      <PaletteView palette="error" />
      <Heading label="Empty state" />
      <EmptyStateView />
      <Heading label="Loading placeholders" />
      <LoadingPlaceholderView />
      <View style={s.footerSpacer} />
    </View>
  )
}

/**
 * ControlsView - コントロールUIのプレビュータブ
 *
 * ボタン、トグルボタンなどのインタラクティブUI要素を表示
 */
function ControlsView() {
  return (
    <ScrollView style={[s.pl10, s.pr10]}>
      <Heading label="Buttons" />
      <ButtonsView />
      <Heading label="Toggle Buttons" />
      <ToggleButtonsView />
      <View style={s.footerSpacer} />
    </ScrollView>
  )
}

/**
 * ErrorView - エラー表示のプレビュータブ
 *
 * 全画面エラー、インラインエラーメッセージの各バリエーションを表示
 */
function ErrorView() {
  return (
    <View style={s.p10}>
      {/* 全画面エラー */}
      <View style={s.mb5}>
        <ErrorScreen
          title="Error screen"
          message="A major error occurred that led the entire screen to fail"
          details="Here are some details"
          onPressTryAgain={() => {}}
        />
      </View>
      {/* 基本エラーメッセージ */}
      <View style={s.mb5}>
        <ErrorMessage message="This is an error that occurred while things were being done" />
      </View>
      {/* 1行省略エラーメッセージ */}
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          numberOfLines={1}
        />
      </View>
      {/* リトライボタン付きエラーメッセージ */}
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          onPressTryAgain={() => {}}
        />
      </View>
      {/* リトライボタン付き1行省略エラーメッセージ */}
      <View style={s.mb5}>
        <ErrorMessage
          message="This is an error that occurred while things were being done"
          onPressTryAgain={() => {}}
          numberOfLines={1}
        />
      </View>
    </View>
  )
}

/**
 * NotifsView - 通知のテストタブ
 *
 * プッシュ通知とトースト通知のトリガーボタンを提供
 */
function NotifsView() {
  const triggerPush = () => {
    // TODO: ローカル通知のテスト実装（未実装）
  }
  const triggerToast = () => {
    // 短いトーストメッセージ
    Toast.show('The task has been completed')
  }
  const triggerToast2 = () => {
    // 長いトーストメッセージ
    Toast.show('The task has been completed successfully and with no problems')
  }
  return (
    <View style={s.p10}>
      <View style={s.flexRow}>
        <Button onPress={triggerPush} label="Trigger Push" />
        <Button onPress={triggerToast} label="Trigger Toast" />
        <Button onPress={triggerToast2} label="Trigger Toast 2" />
      </View>
    </View>
  )
}

function PaletteView({palette}: {palette: PaletteColorName}) {
  const defaultPal = usePalette('default')
  const pal = usePalette(palette)
  return (
    <View style={[pal.view, pal.border, s.p10, s.mb5, s.border1]}>
      <Text style={[pal.text]}>{palette} colors</Text>
      <Text style={[pal.textLight]}>Light text</Text>
      <Text style={[pal.link]}>Link text</Text>
      {palette !== 'default' && (
        <View style={[defaultPal.view]}>
          <Text style={[pal.textInverted]}>Inverted text</Text>
        </View>
      )}
    </View>
  )
}

function TypographyView() {
  const pal = usePalette('default')
  return (
    <View style={[pal.view]}>
      <Text type="2xl-thin" style={[pal.text]}>
        '2xl-thin' lorem ipsum dolor
      </Text>
      <Text type="2xl" style={[pal.text]}>
        '2xl' lorem ipsum dolor
      </Text>
      <Text type="2xl-medium" style={[pal.text]}>
        '2xl-medium' lorem ipsum dolor
      </Text>
      <Text type="2xl-bold" style={[pal.text]}>
        '2xl-bold' lorem ipsum dolor
      </Text>
      <Text type="2xl-heavy" style={[pal.text]}>
        '2xl-heavy' lorem ipsum dolor
      </Text>
      <Text type="xl-thin" style={[pal.text]}>
        'xl-thin' lorem ipsum dolor
      </Text>
      <Text type="xl" style={[pal.text]}>
        'xl' lorem ipsum dolor
      </Text>
      <Text type="xl-medium" style={[pal.text]}>
        'xl-medium' lorem ipsum dolor
      </Text>
      <Text type="xl-bold" style={[pal.text]}>
        'xl-bold' lorem ipsum dolor
      </Text>
      <Text type="xl-heavy" style={[pal.text]}>
        'xl-heavy' lorem ipsum dolor
      </Text>
      <Text type="lg-thin" style={[pal.text]}>
        'lg-thin' lorem ipsum dolor
      </Text>
      <Text type="lg" style={[pal.text]}>
        'lg' lorem ipsum dolor
      </Text>
      <Text type="lg-medium" style={[pal.text]}>
        'lg-medium' lorem ipsum dolor
      </Text>
      <Text type="lg-bold" style={[pal.text]}>
        'lg-bold' lorem ipsum dolor
      </Text>
      <Text type="lg-heavy" style={[pal.text]}>
        'lg-heavy' lorem ipsum dolor
      </Text>
      <Text type="md-thin" style={[pal.text]}>
        'md-thin' lorem ipsum dolor
      </Text>
      <Text type="md" style={[pal.text]}>
        'md' lorem ipsum dolor
      </Text>
      <Text type="md-medium" style={[pal.text]}>
        'md-medium' lorem ipsum dolor
      </Text>
      <Text type="md-bold" style={[pal.text]}>
        'md-bold' lorem ipsum dolor
      </Text>
      <Text type="md-heavy" style={[pal.text]}>
        'md-heavy' lorem ipsum dolor
      </Text>
      <Text type="sm-thin" style={[pal.text]}>
        'sm-thin' lorem ipsum dolor
      </Text>
      <Text type="sm" style={[pal.text]}>
        'sm' lorem ipsum dolor
      </Text>
      <Text type="sm-medium" style={[pal.text]}>
        'sm-medium' lorem ipsum dolor
      </Text>
      <Text type="sm-bold" style={[pal.text]}>
        'sm-bold' lorem ipsum dolor
      </Text>
      <Text type="sm-heavy" style={[pal.text]}>
        'sm-heavy' lorem ipsum dolor
      </Text>
      <Text type="xs-thin" style={[pal.text]}>
        'xs-thin' lorem ipsum dolor
      </Text>
      <Text type="xs" style={[pal.text]}>
        'xs' lorem ipsum dolor
      </Text>
      <Text type="xs-medium" style={[pal.text]}>
        'xs-medium' lorem ipsum dolor
      </Text>
      <Text type="xs-bold" style={[pal.text]}>
        'xs-bold' lorem ipsum dolor
      </Text>
      <Text type="xs-heavy" style={[pal.text]}>
        'xs-heavy' lorem ipsum dolor
      </Text>

      <Text type="title-2xl" style={[pal.text]}>
        'title-2xl' lorem ipsum dolor
      </Text>
      <Text type="title-xl" style={[pal.text]}>
        'title-xl' lorem ipsum dolor
      </Text>
      <Text type="title-lg" style={[pal.text]}>
        'title-lg' lorem ipsum dolor
      </Text>
      <Text type="title" style={[pal.text]}>
        'title' lorem ipsum dolor
      </Text>
      <Text type="button" style={[pal.text]}>
        Button
      </Text>
      <Text type="button-lg" style={[pal.text]}>
        Button-lg
      </Text>
    </View>
  )
}

function EmptyStateView() {
  return <EmptyState icon="bars" message="This is an empty state" />
}

function LoadingPlaceholderView() {
  return (
    <>
      <LoadingPlaceholder.PostLoadingPlaceholder />
      <LoadingPlaceholder.NotificationLoadingPlaceholder />
    </>
  )
}

function ButtonsView() {
  const defaultPal = usePalette('default')
  const buttonStyles = {marginRight: 5}
  return (
    <View style={[defaultPal.view]}>
      <View style={[s.flexRow, s.mb5]}>
        <Button type="primary" label="Primary solid" style={buttonStyles} />
        <Button type="secondary" label="Secondary solid" style={buttonStyles} />
      </View>
      <View style={[s.flexRow, s.mb5]}>
        <Button type="default" label="Default solid" style={buttonStyles} />
        <Button type="inverted" label="Inverted solid" style={buttonStyles} />
      </View>
      <View style={s.flexRow}>
        <Button
          type="primary-outline"
          label="Primary outline"
          style={buttonStyles}
        />
        <Button
          type="secondary-outline"
          label="Secondary outline"
          style={buttonStyles}
        />
      </View>
      <View style={s.flexRow}>
        <Button
          type="primary-light"
          label="Primary light"
          style={buttonStyles}
        />
        <Button
          type="secondary-light"
          label="Secondary light"
          style={buttonStyles}
        />
      </View>
      <View style={s.flexRow}>
        <Button
          type="default-light"
          label="Default light"
          style={buttonStyles}
        />
      </View>
    </View>
  )
}

function ToggleButtonsView() {
  const defaultPal = usePalette('default')
  const buttonStyles = s.mb5
  const [isSelected, setIsSelected] = React.useState(false)
  const onToggle = () => setIsSelected(!isSelected)
  return (
    <View style={[defaultPal.view]}>
      <ToggleButton
        type="primary"
        label="Primary solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary"
        label="Secondary solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="inverted"
        label="Inverted solid"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="primary-outline"
        label="Primary outline"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary-outline"
        label="Secondary outline"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="primary-light"
        label="Primary light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="secondary-light"
        label="Secondary light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
      <ToggleButton
        type="default-light"
        label="Default light"
        style={buttonStyles}
        isSelected={isSelected}
        onPress={onToggle}
      />
    </View>
  )
}
