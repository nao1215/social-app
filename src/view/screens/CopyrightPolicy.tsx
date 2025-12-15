/**
 * @file CopyrightPolicy.tsx - 著作権ポリシー画面
 * @description Blueskyの著作権ポリシー(DMCA対応等)へのリダイレクトを表示する画面コンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのハンドラー関数に似ており、特定のルートに対応するUI描画ロジック
 * - フック(Hook): Goのミドルウェアやコンテキストに似た概念で、横断的関心事(テーマ、i18n等)を注入
 * - useFocusEffect: 画面のマウント/アンマウント時に実行される処理（Goのdefer/cleanupパターン）
 * - JSX記法: HTMLライクな構文でUI構造を記述（Goのhtml/templateパッケージに相当）
 *
 * ## 主な機能
 * - 著作権ポリシーが外部サイトに移動したことをユーザーに通知
 * - DMCA申立先など著作権関連情報へのリンクを提供
 * - 国際化(Lingui)による多言語対応
 * - テーマシステム統合による色の自動適用
 *
 * ## アーキテクチャ
 * - 静的情報画面として/view/screens配下に配置（レガシー構造）
 * - 著作権ポリシー本文は外部サイトでホスティング（メンテナンス性向上）
 * - PrivacyPolicyScreenと同様のパターンで実装（一貫性）
 * - 設定画面やフッターリンクから遷移可能
 *
 * ## レガシー情報
 * - 初期バージョンではアプリ内に著作権ポリシー全文を埋め込んでいた
 * - 法的文書の頻繁な更新に対応するため外部リンク方式に変更
 * - シンプルな構造のためレガシーview層に残存
 *
 * @module view/screens
 */

// React本体 - コンポーネント定義とフック機能に必須
import React from 'react'
// React NativeのViewコンポーネント - レイアウトコンテナ（HTMLのdivに相当）
import {View} from 'react-native'
// Linguiマクロ - コンパイル時翻訳キー抽出用のmsg関数とTransコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui Reactフック - 実行時翻訳機能を提供（Goのi18n.Localizerに相当）
import {useLingui} from '@lingui/react'
// React Navigationフック - 画面ライフサイクルフック（フォーカス検出）
import {useFocusEffect} from '@react-navigation/native'

// パレットフック - テーマベースのカラースキーム取得
import {usePalette} from '#/lib/hooks/usePalette'
// ルーティング型定義 - TypeScript型安全なナビゲーションパラメータ
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 共通スタイルオブジェクト - プロジェクト全体で共有されるCSS in JSスタイル
import {s} from '#/lib/styles'
// シェルモード設定フック - アプリシェルのUI表示モード制御
import {useSetMinimalShellMode} from '#/state/shell'
// テキストリンクコンポーネント - タップ可能なハイパーリンク
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント - テーマ対応テキスト表示（React Native Textのラッパー）
import {Text} from '#/view/com/util/text/Text'
// スクロールビューコンポーネント - 縦スクロール対応コンテナ
import {ScrollView} from '#/view/com/util/Views'
// レイアウトコンポーネント群 - 画面構造の標準レイアウト
import * as Layout from '#/components/Layout'
// ビューヘッダーコンポーネント - 画面上部のタイトルバー
import {ViewHeader} from '../com/util/ViewHeader'

// Props型定義: React Navigationから渡される画面プロパティ
// GoのHTTPリクエストパラメータ構造体に相当
type Props = NativeStackScreenProps<CommonNavigatorParams, 'CopyrightPolicy'>

/**
 * 著作権ポリシー画面コンポーネント
 *
 * @param _props - ナビゲーションプロパティ（未使用のためアンダースコアプレフィックス）
 * @returns JSX要素 - レンダリングされるUI要素ツリー
 */
export const CopyrightPolicyScreen = (_props: Props) => {
  // テーマカラーパレット取得（ライト/ダークテーマ対応）
  const pal = usePalette('default')
  // 翻訳関数取得（慣習的に_という名前を使用）
  const {_} = useLingui()
  // シェルモード設定関数取得（UIシェルの表示/非表示制御）
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の副作用処理
  // この画面がアクティブになった時にフルUIモードに切り替え
  useFocusEffect(
    React.useCallback(() => {
      // ミニマルシェルモードを無効化（ナビゲーションバー等をフル表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列: この関数が変更されない限りコールバックは再利用
  )

  return (
    <Layout.Screen>
      {/* 画面ヘッダー: 「著作権ポリシー」タイトルを表示 */}
      <ViewHeader title={_(msg`Copyright Policy`)} />

      {/* スクロール可能なメインコンテンツエリア */}
      <ScrollView style={[s.hContentRegion, pal.view]}>
        {/* コンテンツコンテナ: 20pxのパディング付き */}
        <View style={[s.p20]}>
          {/* 著作権ポリシー移動のお知らせテキスト */}
          <Text style={pal.text}>
            <Trans>
              The Copyright Policy has been moved to{' '}
              {/* 外部リンク: 新しい著作権ポリシーページへのリンク */}
              <TextLink
                style={pal.link}
                href="https://bsky.social/about/support/copyright"
                text="bsky.social/about/support/copyright"
              />
            </Trans>
          </Text>
        </View>

        {/* フッター用スペーサー: 下部に余白を確保してスクロール体験を改善 */}
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
