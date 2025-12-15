/**
 * @file CommunityGuidelines.tsx - コミュニティガイドライン画面
 * @description Blueskyのコミュニティガイドラインへのリダイレクトを表示する静的情報画面
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: 再利用可能なUI部品。Goのstructに近いが、レンダリング関数を持つ
 * - JSX: HTMLのようなJavaScript拡張構文。TypeScriptファイル内でマークアップを記述
 * - フック(Hook): useXxx形式の関数。Goのコンテキストやミドルウェアに似た概念で、
 *   コンポーネントに副作用や状態管理などの機能を追加する
 *
 * ## 主な機能
 * - 外部リンクへの誘導メッセージ表示（ガイドラインは外部サイトに移動）
 * - スクロール可能なシンプルなテキスト表示
 * - 国際化対応のメッセージ表示
 *
 * ## アーキテクチャ
 * - 画面コンポーネント: React Navigationによるルーティング対象
 * - レイアウト: Layout.Screen + ViewHeader + ScrollViewの標準構成
 * - スタイル: paletteシステムによるテーマ対応（ダークモード等）
 *
 * @module view/screens/CommunityGuidelines
 */

// React本体: UIコンポーネントの基盤ライブラリ
import React from 'react'
// React Native基本コンポーネント: Viewはdivのようなコンテナ要素
import {View} from 'react-native'
// Lingui国際化: msg=翻訳キー、Trans=翻訳可能なテキストコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui国際化フック: 現在のロケール情報と翻訳関数を提供
import {useLingui} from '@lingui/react'
// React Navigation: 画面フォーカス時の副作用実行用フック
import {useFocusEffect} from '@react-navigation/native'

// カスタムフック: テーマカラーパレットを取得（ダークモード等）
import {usePalette} from '#/lib/hooks/usePalette'
// 型定義: 画面コンポーネントのプロパティ型（React NavigationのNavigator設定）
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// スタイル定数: 共通スタイル定義（padding、margin等のユーティリティ）
import {s} from '#/lib/styles'
// シェル状態管理: ミニマルモード（ヘッダー表示制御）の設定フック
import {useSetMinimalShellMode} from '#/state/shell'
// リンクコンポーネント: クリック可能なテキストリンク（外部URL対応）
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント: スタイル適用可能なテキスト表示
import {Text} from '#/view/com/util/text/Text'
// スクロールビュー: スクロール可能なコンテナ（長文表示用）
import {ScrollView} from '#/view/com/util/Views'
// レイアウトコンポーネント: 画面全体のレイアウト構造
import * as Layout from '#/components/Layout'
// ビューヘッダー: 画面上部のヘッダー（タイトル、戻るボタン等）
import {ViewHeader} from '../com/util/ViewHeader'

// 型定義: React Navigationから渡されるプロパティの型
// NativeStackScreenPropsはルーティングパラメータの型安全性を提供
type Props = NativeStackScreenProps<
  CommonNavigatorParams,
  'CommunityGuidelines'
>

/**
 * コミュニティガイドライン画面コンポーネント
 *
 * ## 機能概要
 * - ガイドラインが外部サイトに移動したことを通知
 * - 外部リンクへのテキストリンクを提供
 *
 * ## Goとの対比
 * - Goのhttp.HandlerFunc相当だが、HTMLを返す代わりにJSXを返す
 * - プロパティ（_props）は使用されないため、アンダースコアプレフィックス（Go慣習）
 *
 * @param _props - ルーティングパラメータ（未使用）
 * @returns JSX要素（レンダリング可能なReactコンポーネント）
 */
export const CommunityGuidelinesScreen = (_props: Props) => {
  // テーマパレット取得: 'default'テーマの色設定を取得
  const pal = usePalette('default')
  // 翻訳関数: _(msg`...`)で多言語対応テキストを取得
  const {_} = useLingui()
  // シェルモード設定関数: ヘッダー表示制御用のセッター
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の副作用: 画面が表示されるたびに実行
  // Goのミドルウェアに似ているが、画面表示時のみ実行される
  useFocusEffect(
    React.useCallback(() => {
      // ミニマルモードを無効化（フルヘッダー表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列: この値が変わると再生成
  )

  // JSXを返す: HTMLのような構文でUIを記述
  // Goのtemplate/htmlに似ているが、型安全で動的
  return (
    <Layout.Screen>
      {/* ヘッダー: 画面タイトルと戻るボタンを表示 */}
      <ViewHeader title={_(msg`Community Guidelines`)} />
      {/* スクロール可能なコンテンツ領域 */}
      <ScrollView style={[s.hContentRegion, pal.view]}>
        {/* メインコンテンツ: padding 20px */}
        <View style={[s.p20]}>
          {/* テキスト表示: テーマ色を適用 */}
          <Text style={pal.text}>
            {/* Trans: 翻訳可能なテキストブロック（複数要素を含む） */}
            <Trans>
              The Community Guidelines have been moved to{' '}
              {/* 外部リンク: クリック可能なテキストリンク */}
              <TextLink
                style={pal.link}
                href="https://bsky.social/about/support/community-guidelines"
                text="bsky.social/about/support/community-guidelines"
              />
            </Trans>
          </Text>
        </View>
        {/* フッタースペーサー: 下部の余白確保 */}
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
