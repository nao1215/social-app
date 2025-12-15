/**
 * @file フォローフィード未設定時の案内画面
 *
 * ユーザーがフォローフィードを持っていない場合に表示される
 * 空状態コンポーネント。デフォルトのフォローフィードを追加する
 * リンクを提供する。
 *
 * Go開発者への補足:
 * - React.useCallbackはGoのクロージャに相当し、依存配列によるメモ化を提供
 * - Reactコンポーネントは関数として定義され、JSXを返す
 */

// Reactのコアライブラリ（Goのfmtパッケージのような基本ライブラリ）
import React from 'react'
// React Nativeのビューコンポーネント（Goでいうhtml/templateに相当）
import {View} from 'react-native'
// Linguiの国際化マクロ（翻訳文字列のマーク・抽出用）
import {msg, Trans} from '@lingui/macro'
// Lingui React統合（翻訳機能へのアクセス）
import {useLingui} from '@lingui/react'

// タイムライン用の保存済みフィード定数
import {TIMELINE_SAVED_FEED} from '#/lib/constants'
// 保存済みフィード追加用のミューテーションフック（DBへの書き込み操作）
import {useAddSavedFeedsMutation} from '#/state/queries/preferences'
// デザインシステムのアトム（スタイル定義）とテーマフック
import {atoms as a, useTheme} from '#/alf'
// インラインリンクテキストコンポーネント
import {InlineLinkText} from '#/components/Link'
// タイポグラフィコンポーネント（テキスト表示用）
import {Text} from '#/components/Typography'

/**
 * フォローフィード未設定時の空状態コンポーネント
 *
 * ユーザーがフォローフィードを保存していない場合に表示され、
 * デフォルトのフォローフィードを追加するためのCTA（Call To Action）を提供する。
 *
 * @returns フォローフィード追加を促すメッセージとリンクを含むビュー
 *
 * 動作フロー:
 * 1. ユーザーがリンクをクリック
 * 2. addRecommendedFeeds コールバックが実行される
 * 3. デフォルトのフォローフィードがピン留めされた状態で追加される
 * 4. ナビゲーションを防止して現在のページに留まる
 *
 * Go開発者への補足:
 * - このコンポーネントはGoのHTMLテンプレート関数に相当
 * - useTheme, useLingui はGoのコンテキストからの値取得に似ている
 */
export function NoFollowingFeed() {
  // テーマ設定を取得（ダークモード/ライトモードなど）
  const t = useTheme()
  // 国際化用の翻訳関数を取得（Goのi18n.Tに相当）
  const {_} = useLingui()
  // 保存済みフィード追加用のミューテーション関数を取得
  // mutateAsyncはPromiseを返す非同期関数（Goのgoroutineではなく、awaitで待機）
  const {mutateAsync: addSavedFeeds} = useAddSavedFeedsMutation()

  /**
   * 推奨フィード（デフォルトのフォローフィード）を追加するコールバック
   *
   * @param e - イベントオブジェクト
   * @returns false - ナビゲーションを防止
   *
   * Go開発者への補足:
   * - React.useCallbackは関数をメモ化し、依存配列が変わらない限り同じ参照を保持
   * - Goのクロージャと似ているが、パフォーマンス最適化のためメモ化されている
   * - 依存配列 [addSavedFeeds] により、この値が変更された時のみ関数が再作成される
   */
  const addRecommendedFeeds = React.useCallback(
    (e: any) => {
      // デフォルトのブラウザ動作を防止（リンククリックによるページ遷移をキャンセル）
      e.preventDefault()

      // デフォルトのフォローフィードをピン留めして追加
      addSavedFeeds([
        {
          ...TIMELINE_SAVED_FEED, // スプレッド構文で既存プロパティをコピー（Goの構造体埋め込みに似ている）
          pinned: true, // ピン留めフラグを追加
        },
      ])

      // ナビゲーションを防止（現在のページに留まる）
      return false
    },
    [addSavedFeeds], // 依存配列: addSavedFeedsが変更された時のみこのコールバックを再作成
  )

  return (
    // フレックスボックスレイアウトでコンテンツを水平配置（中央揃え、パディング付き）
    <View style={[a.flex_row, a.flex_wrap, a.align_center, a.py_md, a.px_lg]}>
      {/* テキストスタイル: 行間を詰め、中程度のコントラスト */}
      <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
        {/* 国際化対応のテキスト（自動翻訳される） */}
        <Trans>
          Looks like you're missing a following feed.{' '}
          {/* クリック可能なインラインリンク */}
          <InlineLinkText
            to="/" // ホームページへのルート
            label={_(msg`Add the default feed of only people you follow`)} // アクセシビリティラベル
            onPress={addRecommendedFeeds} // クリック時のハンドラ
            style={[a.leading_snug]}> {/* 行間を詰めたスタイル */}
            Click here to add one.
          </InlineLinkText>
        </Trans>
      </Text>
    </View>
  )
}
