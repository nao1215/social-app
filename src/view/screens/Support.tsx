/**
 * @file Support.tsx - サポート画面
 * @description Blueskyのヘルプデスク/サポートフォームへのリダイレクトを表示する画面コンポーネント
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのハンドラー関数とテンプレートを統合したもの。UIロジックとレンダリングを一体化
 * - React Hooks: Goのコンテキスト取得やミドルウェアチェーンに相当。コンポーネントに機能を追加する仕組み
 * - useFocusEffect: 画面のライフサイクルフック（マウント/アンマウント時処理、Goのdefer文に類似）
 * - 定数インポート: Goのconstパッケージと同様、アプリケーション全体で共有する定数値
 *
 * ## 主な機能
 * - サポートフォームが外部サイトに移動したことをユーザーに通知
 * - ヘルプデスクURL(HELP_DESK_URL)へのリンクを2箇所に配置（テキストリンク、プレーンテキスト）
 * - 国際化対応（Lingui）による多言語サポート
 * - センタリングレイアウトで視認性向上
 * - テーマシステム統合（ライト/ダークモード）
 *
 * ## アーキテクチャ
 * - レガシーview層の静的情報画面として配置
 * - HELP_DESK_URL定数を使用して外部サポートサイトへ誘導
 * - CenteredViewを使用した中央寄せレイアウト（他のポリシー画面とは異なるデザイン）
 * - title-xlタイプのテキストで大きなタイトル表示
 * - 設定画面やヘルプメニューからアクセス可能
 *
 * ## レガシー情報
 * - 以前はアプリ内にサポートフォームを実装していた
 * - ユーザーサポートの効率化のため外部ヘルプデスクシステムに移行
 * - /view/screens配下のレガシー構造だが頻繁にアクセスされるため維持
 *
 * @module view/screens
 */

// React本体 - コンポーネント定義とフック機能に必須
import React from 'react'
// Linguiマクロ - ビルド時翻訳キー抽出用のmsg関数とTransコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui Reactフック - ランタイム翻訳機能（Goのi18n.Tに相当）
import {useLingui} from '@lingui/react'
// React Navigationフック - 画面フォーカス時のライフサイクル処理
import {useFocusEffect} from '@react-navigation/native'

// ヘルプデスクURL定数 - 外部サポートサイトのURL（Goのconst定義に相当）
import {HELP_DESK_URL} from '#/lib/constants'
// パレットフック - テーマベースのカラースキーム取得
import {usePalette} from '#/lib/hooks/usePalette'
// ルーティング型定義 - TypeScript型安全なナビゲーションパラメータ
import {CommonNavigatorParams, NativeStackScreenProps} from '#/lib/routes/types'
// 共通スタイルオブジェクト - プロジェクト全体で共有されるCSS in JSスタイル
import {s} from '#/lib/styles'
// シェルモード設定フック - UIシェルの表示モード制御（フル/ミニマル）
import {useSetMinimalShellMode} from '#/state/shell'
// テキストリンクコンポーネント - クリック可能なハイパーリンク（HTMLのaタグ相当）
import {TextLink} from '#/view/com/util/Link'
// テキストコンポーネント - スタイル付きテキスト表示（複数のtype指定可能）
import {Text} from '#/view/com/util/text/Text'
// ビューヘッダーコンポーネント - 画面上部のタイトルバー
import {ViewHeader} from '#/view/com/util/ViewHeader'
// センタリングビューコンポーネント - コンテンツを画面中央に配置
import {CenteredView} from '#/view/com/util/Views'
// レイアウトコンポーネント群 - 画面全体の標準レイアウト構造
import * as Layout from '#/components/Layout'

// Props型定義: React Navigationから渡される画面プロパティ
// GoのHTTPハンドラー引数型に相当
type Props = NativeStackScreenProps<CommonNavigatorParams, 'Support'>

/**
 * サポート画面コンポーネント
 *
 * @param _props - ナビゲーションプロパティ（未使用のためアンダースコアプレフィックス）
 * @returns JSX要素 - レンダリングされるUI要素ツリー
 */
export const SupportScreen = (_props: Props) => {
  // テーマカラーパレット取得（ライト/ダークテーマ対応）
  const pal = usePalette('default')
  // シェルモード設定関数取得（UIの表示/非表示制御）
  const setMinimalShellMode = useSetMinimalShellMode()
  // 翻訳関数取得（_は国際化ライブラリの慣習的な命名）
  const {_} = useLingui()

  // 画面フォーカス時の副作用処理
  // この画面がアクティブになった時にフルUIモードに切り替え
  useFocusEffect(
    React.useCallback(() => {
      // ミニマルシェルモードを無効化（ナビゲーションバー等をフル表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]), // 依存配列: この関数が変更されない限りコールバック再利用
  )

  return (
    <Layout.Screen>
      {/* 画面ヘッダー: 「サポート」タイトルを国際化対応で表示 */}
      <ViewHeader title={_(msg`Support`)} />

      {/* 中央寄せビュー: コンテンツを画面中央に配置 */}
      <CenteredView>
        {/* メインタイトル: 大きなテキストでサポート表示 */}
        <Text type="title-xl" style={[pal.text, s.p20, s.pb5]}>
          <Trans>Support</Trans>
        </Text>

        {/* 説明文: サポートフォーム移動のお知らせとリンク */}
        <Text style={[pal.text, s.p20]}>
          <Trans>
            The support form has been moved. If you need help, please{' '}
            {/* クリック可能なテキストリンク: 「こちらをクリック」 */}
            <TextLink
              href={HELP_DESK_URL}
              text={_(msg`click here`)}
              style={pal.link}
            />{' '}
            {/* プレーンテキストでもURL表示（コピー&ペースト用） */}
            or visit {HELP_DESK_URL} to get in touch with us.
          </Trans>
        </Text>
      </CenteredView>
    </Layout.Screen>
  )
}
