/**
 * プロフィール画面のエラー状態表示コンポーネント
 *
 * 【Go開発者向け説明】
 * このモジュールは、モデレーションサービスの読み込みに失敗した際の
 * エラー状態を表示するUIコンポーネントです。
 *
 * 【モジュールの役割】
 * - モデレーションサービス（ラベラー）の読み込みエラー表示
 * - ユーザーフレンドリーなエラーメッセージと詳細情報の提供
 * - 前のページへの戻る機能
 * - アクセシビリティ対応のUI構築
 *
 * 【技術スタック】
 * - React Navigation: 画面遷移管理
 * - Lingui: 国際化対応
 * - Alf: デザインシステム
 *
 * 【使用例】
 * モデレーションサービスのAPIエラー時に、このコンポーネントがレンダリングされ、
 * エラー詳細とユーザーアクションを提供します。
 */

// React本体（関数コンポーネントの基盤）
import React from 'react'
// React Nativeの基本UIコンポーネント（Goのhtml/templateに相当するが型安全）
import {View} from 'react-native'
// Lingui国際化ライブラリ（翻訳機能）
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// React Navigationフック（ルーティング制御）
// 【Go開発者向け】useNavigationはGoのhttp.Handlerコンテキストに似た役割
import {useNavigation} from '@react-navigation/native'

// ナビゲーションの型定義（TypeScriptの型安全性確保）
import {NavigationProp} from '#/lib/routes/types'
// デザインシステム（スタイル定数とテーマフック）
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント（複合コンポーネントパターン）
import {Button, ButtonText} from '#/components/Button'
// 情報アイコン（SVGコンポーネント）
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfo} from '#/components/icons/CircleInfo'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

/**
 * エラー状態表示コンポーネント
 *
 * 【Go開発者向け説明】
 * - propsはGoの関数引数に相当します
 * - {error}: {error: string} は分割代入構文（Goにはない機能）
 *   →関数定義でプロパティを直接展開して受け取る
 *
 * 【主な機能】
 * - モデレーションサービスのエラー詳細を表示
 * - ユーザーに問題の説明と解決策を提示
 * - 前の画面への戻る機能を提供
 *
 * @param props - コンポーネントのプロパティ
 * @param props.error - エラーメッセージ文字列
 * @returns JSX要素 - エラー状態のUI
 */
export function ErrorState({error}: {error: string}) {
  // 【Go開発者向け説明 - Reactフック】
  // フックは関数コンポーネント内でのみ使用できる特殊な関数です
  // Goのコンテキスト変数に似ていますが、より厳格なルールがあります

  // テーマ情報の取得（ダークモード/ライトモード対応）
  const t = useTheme()
  // 国際化フック - 翻訳関数を取得
  const {_} = useLingui()
  // ナビゲーションフック - 画面遷移制御
  // 【Go開発者向け】TypeScript型パラメータ<NavigationProp>で型安全性を確保
  const navigation = useNavigation<NavigationProp>()

  /**
   * 戻るボタン押下時のハンドラ
   *
   * 【Go開発者向け説明 - React.useCallback】
   * - useCallbackは関数をメモ化するフック（パフォーマンス最適化）
   * - 依存配列[navigation]が変更されない限り、同じ関数インスタンスを返す
   * - これにより子コンポーネントの不要な再レンダリングを防ぐ
   *
   * 【処理フロー】
   * 1. navigation.canGoBack()で戻れるかチェック
   * 2. 戻れる場合: 前の画面に戻る
   * 3. 戻れない場合: ホーム画面に遷移（フォールバック）
   *
   * 【Go開発者向け】
   * Goのhttp.Redirectと似た動作ですが、SPAのクライアント側ルーティングです
   */
  const onPressBack = React.useCallback(() => {
    // 戻れる履歴があるかチェック（Goのスタック判定に相当）
    if (navigation.canGoBack()) {
      // 前の画面に戻る（ブラウザのhistory.back()と同じ）
      navigation.goBack()
    } else {
      // 戻れない場合はホーム画面へ遷移
      navigation.navigate('Home')
    }
  }, [navigation])

  // 【Go開発者向け説明 - JSX】
  // JSXは型安全なテンプレート構文です
  // Goのhtml/templateと異なり、TypeScriptの型チェックが適用されます
  return (
    <View style={[a.px_xl]}>
      {/* 情報アイコン表示 */}
      {/* 【Go開発者向け】style配列でスタイルをマージ可能（CSSのクラス組み合わせに似ている） */}
      <CircleInfo width={48} style={[t.atoms.text_contrast_low]} />

      {/* エラータイトル */}
      <Text style={[a.text_xl, a.font_bold, a.pb_md, a.pt_xl]}>
        {/* Transコンポーネントは自動翻訳（実行時に適切な言語文字列を表示） */}
        <Trans>Hmmmm, we couldn't load that moderation service.</Trans>
      </Text>

      {/* エラー説明文 */}
      <Text
        style={[
          a.text_md, // テキストサイズ: medium
          a.leading_normal, // 行間: normal
          a.pb_md, // パディング下: medium
          t.atoms.text_contrast_medium, // テーマ対応の文字色（中コントラスト）
        ]}>
        <Trans>
          This moderation service is unavailable. See below for more details. If
          this issue persists, contact us.
        </Trans>
      </Text>

      {/* エラー詳細表示ボックス */}
      {/* 【Go開発者向け】このViewは背景色と角丸を持つコンテナ（Goのdivに相当） */}
      <View
        style={[
          a.relative, // 相対位置指定（CSSのposition: relative）
          a.py_md, // 垂直パディング
          a.px_lg, // 水平パディング
          a.rounded_md, // 角丸
          a.mb_2xl, // マージン下: extra large
          t.atoms.bg_contrast_25, // テーマ対応の背景色（25%コントラスト）
        ]}>
        {/* エラーメッセージの実際の内容を表示 */}
        <Text style={[a.text_md, a.leading_normal]}>{error}</Text>
      </View>

      {/* ボタンエリア */}
      <View style={{flexDirection: 'row'}}>
        {/* 戻るボタン */}
        {/* 【Go開発者向け説明】
             - label: アクセシビリティ用のラベル（スクリーンリーダー対応）
             - accessibilityHint: ボタンの動作説明（視覚障害者向け）
             - onPress: クリック/タップ時のイベントハンドラ（GoのHTTPハンドラに相当）
        */}
        {/* セカンダリカラー、塗りつぶしスタイル、イベントハンドラを設定 */}
        <Button
          size="small"
          color="secondary"
          variant="solid"
          label={_(msg`Go Back`)}
          accessibilityHint="Returns to previous page"
          onPress={onPressBack}>
          <ButtonText>
            <Trans>Go Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}
