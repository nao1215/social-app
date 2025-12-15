/**
 * @file PrivacyPolicy.tsx - プライバシーポリシー画面
 * @description Blueskyのプライバシーポリシーへのリダイレクトを表示する画面コンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goの構造体とメソッドの組み合わせに相当。UIの一部を独立した再利用可能な部品として定義
 * - フック(Hook): Goのインターフェースに似た概念で、コンポーネントに状態やライフサイクル機能を追加する仕組み
 * - useFocusEffect: Goのdefer文に似ており、画面がフォーカスされた時/離れた時に処理を実行
 * - Props: Goの構造体フィールドのように、親コンポーネントから渡される設定値
 *
 * ## 主な機能
 * - プライバシーポリシーが外部サイトに移動したことをユーザーに通知
 * - 新しいプライバシーポリシーのURLへのリンクを提供
 * - 国際化対応(Lingui)による多言語サポート
 * - テーマに応じた色の自動適用
 *
 * ## アーキテクチャ
 * - レガシーview層に配置された静的情報画面
 * - 実際のポリシー内容は外部Webサイト(bsky.social)でホスト
 * - シンプルなリダイレクト用の軽量コンポーネント
 * - ナビゲーションスタックに統合され、設定画面などからアクセス可能
 *
 * ## レガシー情報
 * - 以前はアプリ内にポリシー全文を表示していたが、メンテナンス性向上のため外部化
 * - /view/screens配下のレガシー構造だが、シンプルなため移行予定なし
 *
 * @module view/screens
 */

// React本体 - コンポーネント定義に必須（Goのパッケージimportに相当）
import React from 'react'
// React NativeのViewコンポーネント - HTMLのdivタグに相当するコンテナ要素
import {View} from 'react-native'
// Linguiマクロ - 国際化(i18n)用のmsg関数とTransコンポーネント（コンパイル時に翻訳キーを抽出）
import {msg, Trans} from '@lingui/macro'
// Lingui Reactフック - 翻訳関数を提供（Goのi18n.Localizerに相当）
import {useLingui} from '@lingui/react'
// React Navigationフック - 画面フォーカス時のライフサイクル処理（Goのdefer/cleanupに似た概念）
import {useFocusEffect} from '@react-navigation/native'

// パレットフック - テーマカラー取得（Goのconfigパッケージに相当）
import {usePalette} from '#/lib/hooks/usePalette'
// ルーティング型定義 - 画面遷移のパラメータ型（Goの構造体定義に相当）
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 共通スタイル定義 - 汎用的なCSS in JSスタイル（Goの定数定義に相当）
import {s} from '#/lib/styles'
// シェルモード設定フック - UIシェルの表示モード制御（Goのコンテキスト設定に相当）
import {useSetMinimalShellMode} from '#/state/shell'
// テキストリンクコンポーネント - クリック可能なハイパーリンク（HTMLのaタグに相当）
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント - スタイル付きテキスト表示（React NativeのTextをラップ）
import {Text} from '#/view/com/util/text/Text'
// スクロールビューコンポーネント - 縦スクロール可能なコンテナ（HTMLのoverflow:autoに相当）
import {ScrollView} from '#/view/com/util/Views'
// レイアウトコンポーネント群 - 画面全体のレイアウト構造を提供
import * as Layout from '#/components/Layout'
// ビューヘッダーコンポーネント - 画面上部のタイトルバー（ナビゲーションバー）
import {ViewHeader} from '../com/util/ViewHeader'

// Props型定義: ナビゲーションから渡される画面パラメータの型
// GoのHTTPハンドラーの引数型定義に相当
type Props = NativeStackScreenProps<CommonNavigatorParams, 'PrivacyPolicy'>

/**
 * プライバシーポリシー画面コンポーネント
 *
 * @param _props - ナビゲーションプロパティ（この画面では未使用のためアンダースコアプレフィックス）
 * @returns JSX要素 - レンダリングされるUI（Goのテンプレート実行結果に相当）
 */
export const PrivacyPolicyScreen = (_props: Props) => {
  // テーマカラーパレット取得（ライト/ダークモード対応）
  const pal = usePalette('default')
  // 翻訳関数取得（_は慣習的な命名で、Goのi18n.Tに相当）
  const {_} = useLingui()
  // シェルモード設定関数取得（ミニマルモードON/OFFを制御）
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の副作用処理
  // Goのdefer文やcleanup関数に似た仕組み
  useFocusEffect(
    React.useCallback(() => {
      // 画面表示時にミニマルシェルモードを無効化（フルUIを表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列: setMinimalShellModeが変更された時のみコールバックを再生成
  )

  return (
    <Layout.Screen>
      {/* 画面ヘッダー: タイトルを国際化対応で表示 */}
      <ViewHeader title={_(msg`Privacy Policy`)} />

      {/* スクロール可能なコンテンツエリア */}
      <ScrollView style={[s.hContentRegion, pal.view]}>
        {/* パディング付きコンテナ（20pxの余白） */}
        <View style={[s.p20]}>
          {/* メインテキスト: プライバシーポリシー移動のお知らせ */}
          <Text style={pal.text}>
            <Trans>
              The Privacy Policy has been moved to{' '}
              {/* 外部リンク: 新しいプライバシーポリシーURL */}
              <TextLink
                style={pal.link}
                href="https://bsky.social/about/support/privacy-policy"
                text="bsky.social/about/support/privacy-policy"
              />
            </Trans>
          </Text>
        </View>

        {/* フッター用スペーサー: 下部に余白を追加してスクロール体験を向上 */}
        <View style={s.footerSpacer} />
      </ScrollView>
    </Layout.Screen>
  )
}
