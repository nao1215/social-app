/**
 * CustomFeedEmptyState - カスタムフィード空状態コンポーネント
 *
 * 【概要】
 * カスタムフィードが空の場合に表示される空状態画面。
 * ユーザーに対して、フォローするアカウントを見つけるか、
 * 言語設定を調整するよう促すメッセージを表示します。
 *
 * 【機能】
 * - 虫眼鏡アイコンとメッセージの表示
 * - 検索画面への誘導ボタン
 * - プラットフォーム（Web/Native）に応じたナビゲーション
 *
 * 【Goユーザー向け補足】
 * - このファイルはReact Nativeコンポーネント（UIの部品）を定義しています
 * - export functionはGoのfuncに相当し、コンポーネントを外部から利用可能にします
 * - JSX（<View>など）はReact特有のUI記述方法で、HTMLに似た構文です
 *
 * @module CustomFeedEmptyState
 */

// Reactライブラリ（コンポーネント作成のための基本ライブラリ）
import React from 'react'
// React NativeのUI部品（View: コンテナ、StyleSheet: スタイル定義）
import {StyleSheet, View} from 'react-native'
// FontAwesomeアイコンコンポーネント（アイコン表示用）
import {
  FontAwesomeIcon,
  FontAwesomeIconStyle,
} from '@fortawesome/react-native-fontawesome'
// 国際化（i18n）ライブラリ - 多言語対応のためのテキスト翻訳
import {Trans} from '@lingui/macro'
// React Navigationフック - 画面遷移を制御
import {useNavigation} from '@react-navigation/native'

// カスタムフック - カラーパレット（配色）の取得
import {usePalette} from '#/lib/hooks/usePalette'
// カスタムアイコン - 虫眼鏡アイコン
import {MagnifyingGlassIcon} from '#/lib/icons'
// ナビゲーション型定義 - TypeScriptの型安全性のため（Goのinterfaceに相当）
import {NavigationProp} from '#/lib/routes/types'
// 共通スタイル定義
import {s} from '#/lib/styles'
// プラットフォーム判定ユーティリティ - Web/iOS/Androidの判別
import {isWeb} from '#/platform/detection'
// ボタンコンポーネント
import {Button} from '../util/forms/Button'
// テキストコンポーネント
import {Text} from '../util/text/Text'

/**
 * CustomFeedEmptyState - カスタムフィード空状態コンポーネント
 *
 * 【Reactフック使用箇所】
 * - usePalette: テーマカラーの取得（Goのcontext.Context的な役割）
 * - useNavigation: 画面遷移の制御
 * - React.useCallback: 関数のメモ化（パフォーマンス最適化）
 *
 * 【Goユーザー向け補足】
 * - useXXXで始まる関数は「フック」と呼ばれ、Reactの状態管理や副作用を扱います
 * - useCallbackは関数を再生成せずキャッシュし、不要な再レンダリングを防ぎます
 *
 * @returns {JSX.Element} 空状態UI
 */
export function CustomFeedEmptyState() {
  // デフォルトカラーパレットの取得（通常のテキストや背景色）
  const pal = usePalette('default')
  // 反転カラーパレットの取得（ボタン内部のテキスト色など）
  const palInverted = usePalette('inverted')
  // ナビゲーションオブジェクトの取得（画面遷移を制御）
  const navigation = useNavigation<NavigationProp>()

  /**
   * onPressFindAccounts - アカウント検索ボタン押下ハンドラー
   *
   * 【処理内容】
   * プラットフォームに応じて検索画面へナビゲート：
   * - Web: Search画面へ直接遷移
   * - Native (iOS/Android): SearchTabへ遷移し、スタックをトップに戻す
   *
   * 【Goユーザー向け補足】
   * - useCallbackは関数をメモ化（キャッシュ）するReactフック
   * - 依存配列[navigation]が変わらない限り、同じ関数インスタンスを再利用
   * - これにより不要な再レンダリングを防ぎ、パフォーマンスを最適化
   */
  const onPressFindAccounts = React.useCallback(() => {
    if (isWeb) {
      // Web環境：検索画面へ直接ナビゲート
      navigation.navigate('Search', {})
    } else {
      // ネイティブ環境：検索タブへナビゲート後、スタックをトップに戻す
      navigation.navigate('SearchTab')
      navigation.popToTop()
    }
  }, [navigation]) // 依存配列：navigationが変わったときのみ関数を再生成

  /**
   * レンダリング部分
   *
   * 【JSX構造】
   * - View: コンテナ（Goでいうdivタグ相当）
   * - MagnifyingGlassIcon: 虫眼鏡アイコン（検索を象徴）
   * - Text: メッセージテキスト（Transで多言語対応）
   * - Button: アカウント検索ボタン
   *
   * 【Goユーザー向け補足】
   * - JSXは関数の戻り値としてUIツリーを返す特殊な構文です
   * - <View>はReact.createElement(View, ...)の糖衣構文
   * - styleプロパティで見た目をカスタマイズ（CSSスタイルのようなもの）
   */
  return (
    <View style={styles.emptyContainer}>
      {/* アイコンコンテナ */}
      <View style={styles.emptyIconContainer}>
        <MagnifyingGlassIcon style={[styles.emptyIcon, pal.text]} size={62} />
      </View>

      {/* 空状態メッセージ */}
      <Text type="xl-medium" style={[s.textCenter, pal.text]}>
        <Trans>
          This feed is empty! You may need to follow more users or tune your
          language settings.
        </Trans>
      </Text>

      {/* アカウント検索ボタン */}
      <Button
        type="inverted"
        style={styles.emptyBtn}
        onPress={onPressFindAccounts}>
        <Text type="lg-medium" style={palInverted.text}>
          <Trans>Find accounts to follow</Trans>
        </Text>
        <FontAwesomeIcon
          icon="angle-right"
          style={palInverted.text as FontAwesomeIconStyle}
          size={14}
        />
      </Button>
    </View>
  )
}

/**
 * スタイル定義
 *
 * 【StyleSheet.create】
 * React NativeのスタイルシステムでCSS-likeなスタイルを定義。
 * オブジェクトとして定義し、パフォーマンス最適化とTypeScript型チェックを提供。
 *
 * 【Goユーザー向け補足】
 * - これはGoのstruct定義に似ており、各スタイルプロパティが型安全に管理されます
 * - StyleSheet.createは最適化とバリデーションを提供します
 */
const styles = StyleSheet.create({
  // 空状態メインコンテナ - 画面全体の高さで中央配置
  emptyContainer: {
    height: '100%', // 画面の100%の高さ
    paddingVertical: 40, // 上下の余白
    paddingHorizontal: 30, // 左右の余白
  },
  // アイコンコンテナ - 虫眼鏡アイコンの配置用
  emptyIconContainer: {
    marginBottom: 16, // 下方向のマージン
  },
  // アイコン自体のスタイル - 中央配置
  emptyIcon: {
    marginLeft: 'auto', // 左側の自動マージンで中央寄せ
    marginRight: 'auto', // 右側の自動マージンで中央寄せ
  },
  // ボタンのスタイル - 丸みのあるボタンデザイン
  emptyBtn: {
    marginVertical: 20, // 上下のマージン
    flexDirection: 'row', // 子要素を横並びに配置（Flexbox）
    alignItems: 'center', // 子要素を中央揃え（縦方向）
    justifyContent: 'space-between', // 子要素間のスペースを均等配置
    paddingVertical: 18, // ボタン内上下パディング
    paddingHorizontal: 24, // ボタン内左右パディング
    borderRadius: 30, // 角を丸くする（ピル型ボタン）
  },

  // 以下は未使用のスタイル（将来のフィードヒント機能用に残されている可能性）
  feedsTip: {
    position: 'absolute', // 絶対配置
    left: 22, // 左から22pxの位置
  },
  feedsTipArrow: {
    marginLeft: 32, // 左マージン
    marginTop: 8, // 上マージン
  },
})
