/**
 * @file TermsOfService.tsx - 利用規約画面
 * @description Blueskyの利用規約(Terms of Service)へのリダイレクトを表示する画面コンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのテンプレート+ハンドラーを統合したもの。データと表示ロジックを一体化
 * - React Hooks: Goのコンテキスト値取得やミドルウェアに相当する機能を関数内で利用可能にする仕組み
 * - useFocusEffect: 画面がアクティブ/非アクティブになった時の処理（Goのdefer/cleanupパターン）
 * - JSX: TypeScript/JavaScript内に埋め込むXMLライクな構文（Goのhtml/templateを言語レベルでサポート）
 *
 * ## 主な機能
 * - 利用規約が外部サイトに移動したことをユーザーに通知
 * - 新しい利用規約ページへのハイパーリンクを提供
 * - Linguiによる多言語対応（50+言語サポート）
 * - テーマシステム統合（ライト/ダークモード自動切り替え）
 *
 * ## アーキテクチャ
 * - レガシーview層の静的情報画面として配置
 * - 利用規約本文は外部Webサイトでホスティング（頻繁な更新に対応）
 * - PrivacyPolicy/CopyrightPolicyと同じパターンで実装（コード一貫性）
 * - サインアップフローや設定画面からアクセス可能
 *
 * ## レガシー情報
 * - 過去バージョンではアプリ内に利用規約全文をハードコーディング
 * - 法的文書の更新頻度とアプリリリースサイクルの不一致により外部化
 * - /view/screens配下のレガシー構造だがシンプルなため移行優先度低
 *
 * @module view/screens
 */

// React本体 - コンポーネント、フック、仮想DOM機能を提供
import React from 'react'
// React NativeのViewコンポーネント - レイアウト用基本コンテナ
import {View} from 'react-native'
// Linguiマクロ - ビルド時に翻訳キーを抽出するmsg関数とTransコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui Reactフック - ランタイム翻訳機能（Goのi18n.T関数に相当）
import {useLingui} from '@lingui/react'
// React Navigationフック - 画面のライフサイクルイベントをハンドリング
import {useFocusEffect} from '@react-navigation/native'

// パレットフック - テーマベースのカラー値取得（ライト/ダーク対応）
import {usePalette} from '#/lib/hooks/usePalette'
// ルーティング型定義 - 型安全なナビゲーションパラメータ（GoのURLパラメータ構造体に相当）
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 共通スタイル定義 - プロジェクト全体で使用されるCSS in JSスタイル
import {s} from '#/lib/styles'
// シェルモード設定フック - UIシェルの表示モード制御（フル/ミニマル切り替え）
import {useSetMinimalShellMode} from '#/state/shell'
// テキストリンクコンポーネント - クリック可能なテキストリンク（HTMLのaタグ相当）
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント - スタイル付きテキスト表示（React Native Textのラッパー）
import {Text} from '#/view/com/util/text/Text'
// スクロールビューコンポーネント - 縦スクロール可能なコンテナ
import {ScrollView} from '#/view/com/util/Views'
// レイアウトコンポーネント群 - 画面全体の標準レイアウト構造
import * as Layout from '#/components/Layout'
// ビューヘッダーコンポーネント - 画面上部のタイトルバー（ナビゲーションバー）
import {ViewHeader} from '../com/util/ViewHeader'

// Props型定義: React Navigationから受け取る画面プロパティの型
// GoのHTTPハンドラー引数型に相当
type Props = NativeStackScreenProps<CommonNavigatorParams, 'TermsOfService'>

/**
 * 利用規約画面コンポーネント
 *
 * @param _props - ナビゲーションプロパティ（この画面では使用しないためアンダースコアプレフィックス）
 * @returns JSX要素 - レンダリングされるUI要素ツリー
 */
export const TermsOfServiceScreen = (_props: Props) => {
  // テーマカラーパレット取得（現在のテーマに応じた色セット）
  const pal = usePalette('default')
  // シェルモード設定関数取得（UIの表示/非表示を制御）
  const setMinimalShellMode = useSetMinimalShellMode()
  // 翻訳関数取得（_は国際化ライブラリの慣習的な命名）
  const {_} = useLingui()

  // 画面フォーカス時の副作用処理
  // この画面がアクティブになった時にフルUIに切り替え
  useFocusEffect(
    React.useCallback(() => {
      // ミニマルシェルモードを無効化（ナビゲーションバー等を表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列: setMinimalShellModeが変わらない限りコールバック再生成しない
  )

  return (
    <Layout.Screen>
      {/* 画面ヘッダー: 「利用規約」タイトルを国際化対応で表示 */}
      <ViewHeader title={_(msg`Terms of Service`)} />

      {/* スクロール可能なメインコンテンツエリア */}
      <ScrollView style={[s.hContentRegion, pal.view]}>
        {/* コンテンツコンテナ: 20pxのパディング設定 */}
        <View style={[s.p20]}>
          {/* 利用規約移動のお知らせテキスト */}
          <Text style={pal.text}>
            {/* 国際化対応テキスト: 翻訳キーとして抽出される */}
            <Trans>The Terms of Service have been moved to</Trans>{' '}
            {/* 外部リンク: 新しい利用規約ページへ遷移 */}
            <TextLink
              style={pal.link}
              href="https://bsky.social/about/support/tos"
              text="bsky.social/about/support/tos"
            />
          </Text>
        </View>

        {/* フッター用スペーサー: 画面下部に余白を追加してスクロール体験向上 */}
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
