/**
 * @file NotFound.tsx - 404エラー画面
 * @description 存在しないページへのアクセス時に表示される404エラーページ
 *
 * ## Goエンジニア向けの説明
 * - Reactコンポーネント: Goのhttp.HandlerFuncに相当するUIレンダリング関数
 * - React Navigation: Goのchi/gorilla/muxのようなルーティングライブラリ
 * - フック: Goのコンテキストやミドルウェアパターンに似た副作用・状態管理機構
 * - StyleSheet: CSS-in-JS。Goのtemplate/cssに似ているが、型安全でスコープ化
 *
 * ## 主な機能
 * - 404エラーメッセージの表示
 * - 前の画面に戻る、またはホームへ移動するボタン
 * - ナビゲーション履歴に基づく動的なボタンラベル切り替え
 *
 * ## アーキテクチャ
 * - エラーハンドリング画面: ルーティングで未定義のパスに遷移した場合に表示
 * - ナビゲーションスタック管理: 戻るボタンの有効性を判定し適切な動作を提供
 * - アクセシビリティ対応: スクリーンリーダー用のラベルとヒント
 *
 * @module view/screens/NotFound
 */

// React本体: UIコンポーネントの基盤ライブラリ
import React from 'react'
// React Native基本コンポーネント: StyleSheet=スタイル定義、View=コンテナ
import {StyleSheet, View} from 'react-native'
// Lingui国際化: msg=翻訳キー、Trans=翻訳可能なテキストコンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui国際化フック: 現在のロケール情報と翻訳関数を提供
import {useLingui} from '@lingui/react'
// React Navigation: ナビゲーション操作とフック
// StackActions=スタック操作、useFocusEffect=フォーカス時副作用、useNavigation=ナビゲーションAPI
import {
  StackActions,
  useFocusEffect,
  useNavigation,
} from '@react-navigation/native'

// カスタムフック: テーマカラーパレットを取得（ダークモード等）
import {usePalette} from '#/lib/hooks/usePalette'
// 型定義: ナビゲーションオブジェクトの型（型安全なルーティング）
import {NavigationProp} from '#/lib/routes/types'
// スタイル定数: 共通スタイル定義（padding、margin等のユーティリティ）
import {s} from '#/lib/styles'
// シェル状態管理: ミニマルモード（ヘッダー表示制御）の設定フック
import {useSetMinimalShellMode} from '#/state/shell'
// ボタンコンポーネント: インタラクティブなボタンUI
import {Button} from '#/view/com/util/forms/Button'
// テキストコンポーネント: スタイル適用可能なテキスト表示
import {Text} from '#/view/com/util/text/Text'
// ビューヘッダー: 画面上部のヘッダー（タイトル、戻るボタン等）
import {ViewHeader} from '#/view/com/util/ViewHeader'
// レイアウトコンポーネント: 画面全体のレイアウト構造
import * as Layout from '#/components/Layout'

/**
 * 404エラー画面コンポーネント
 *
 * ## 機能概要
 * - ページが見つからないエラーメッセージ表示
 * - ナビゲーション履歴の有無に応じて「戻る」または「ホームへ」ボタンを表示
 *
 * ## Goとの対比
 * - Goのhttp.Errorに相当する処理
 * - ナビゲーションスタック管理により、ブラウザの「戻る」動作を実装
 *
 * @returns JSX要素（404エラーページUI）
 */
export const NotFoundScreen = () => {
  // テーマパレット取得: 'default'テーマの色設定を取得
  const pal = usePalette('default')
  // 翻訳関数: _(msg`...`)で多言語対応テキストを取得
  const {_} = useLingui()
  // ナビゲーションオブジェクト: 画面遷移を制御（Goのhttp.Redirectに相当）
  const navigation = useNavigation<NavigationProp>()
  // シェルモード設定関数: ヘッダー表示制御用のセッター
  const setMinimalShellMode = useSetMinimalShellMode()

  // 画面フォーカス時の副作用: 画面が表示されるたびに実行
  useFocusEffect(
    React.useCallback(() => {
      // ミニマルモードを無効化（フルヘッダー表示）
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  // ナビゲーション履歴チェック: 前の画面に戻れるか判定
  // Goのhttp.Request.Refererに似た概念
  const canGoBack = navigation.canGoBack()

  /**
   * ホームボタン押下時のハンドラ
   *
   * ## 動作
   * - 履歴がある場合: 前の画面に戻る（goBack）
   * - 履歴がない場合: ホームタブへ移動 + スタックをトップまでポップ
   *
   * ## Goとの対比
   * - Goのhttp.Redirectに相当
   * - popToTop()はナビゲーションスタックの全履歴をクリア
   */
  const onPressHome = React.useCallback(() => {
    if (canGoBack) {
      // 前の画面に戻る（ブラウザの「戻る」ボタンに相当）
      navigation.goBack()
    } else {
      // ホームタブへ移動
      navigation.navigate('HomeTab')
      // ナビゲーションスタックをクリア（Reduxのアクション送信）
      navigation.dispatch(StackActions.popToTop())
    }
  }, [navigation, canGoBack]) // 依存配列: これらが変わると再生成

  return (
    <Layout.Screen testID="notFoundView">
      {/* ヘッダー: 「Page Not Found」タイトル表示 */}
      <ViewHeader title={_(msg`Page Not Found`)} />
      {/* メインコンテンツ: 中央揃えでエラーメッセージ表示 */}
      <View style={styles.container}>
        {/* タイトル: 大きなテキストで「Page not found」 */}
        <Text type="title-2xl" style={[pal.text, s.mb10]}>
          <Trans>Page not found</Trans>
        </Text>
        {/* 説明文: 中サイズのテキストで詳細メッセージ */}
        <Text type="md" style={[pal.text, s.mb10]}>
          <Trans>
            We're sorry! We can't find the page you were looking for.
          </Trans>
        </Text>
        {/* アクションボタン: 「戻る」または「ホームへ」 */}
        <Button
          type="primary"
          // ラベル: 履歴の有無で動的に切り替え
          label={canGoBack ? _(msg`Go Back`) : _(msg`Go Home`)}
          // アクセシビリティラベル: スクリーンリーダー用
          accessibilityLabel={canGoBack ? _(msg`Go back`) : _(msg`Go home`)}
          // アクセシビリティヒント: ボタン押下時の動作説明
          accessibilityHint={
            canGoBack
              ? _(msg`Returns to previous page`)
              : _(msg`Returns to home page`)
          }
          onPress={onPressHome}
        />
      </View>
    </Layout.Screen>
  )
}

/**
 * スタイル定義
 *
 * ## Goとの対比
 * - CSSのJavaScript版。Goのtemplate/cssに相当するが型安全
 * - StyleSheet.create()でスタイルオブジェクトを最適化
 */
const styles = StyleSheet.create({
  // コンテナ: エラーメッセージ全体のレイアウト
  container: {
    paddingTop: 100, // 上部余白: 100px
    paddingHorizontal: 20, // 左右余白: 20px
    alignItems: 'center', // 水平方向の中央揃え（Flexbox）
    height: '100%', // 高さ: 画面全体
  },
})
