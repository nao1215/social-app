/**
 * @file 保存済みフィードゼロ時の空状態画面
 *
 * ユーザーが一つもフィードを保存していない場合に表示される空状態コンポーネント。
 * 推奨フィードを一括適用するCTAボタンを提供する。
 *
 * 重要: このコンポーネントのCTAボタンは既存の保存済みフィードを完全に上書きするため、
 * ユーザーが本当にフィードを保存していない場合のみ表示すべき。
 *
 * Go開発者への補足:
 * - React.useCallbackはGoのクロージャに相当するがメモ化されている
 * - async/awaitはGoのgoroutineとは異なり、シングルスレッドで動作する非同期処理
 */

// Reactのコアライブラリ
import React from 'react'
// React Nativeのビューコンポーネント
import {View} from 'react-native'
// AT ProtocolのTID（Timestamp Identifier）生成ユーティリティ
import {TID} from '@atproto/common-web'
// Linguiの国際化マクロ
import {msg, Trans} from '@lingui/macro'
// Lingui React統合
import {useLingui} from '@lingui/react'

// 推奨される保存済みフィードの定数リスト
import {RECOMMENDED_SAVED_FEEDS} from '#/lib/constants'
// 保存済みフィードを上書きするミューテーションフック
import {useOverwriteSavedFeedsMutation} from '#/state/queries/preferences'
// デザインシステムのアトムとテーマフック
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// プラスアイコンコンポーネント
import {PlusLarge_Stroke2_Corner0_Rounded as Plus} from '#/components/icons/Plus'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

/**
 * 保存済みフィードがゼロの場合の空状態コンポーネント
 *
 * 明示的に命名されているのは、このコンポーネントのCTAボタンを押すと
 * すべての保存済みフィードが上書きされるため。
 * ユーザーが実際に他のフィードを保存していない場合のみ表示すべき。
 *
 * @returns 推奨フィード適用を促すメッセージとボタンを含むビュー
 *
 * 動作フロー:
 * 1. ユーザーが「推奨を使用」ボタンをクリック
 * 2. 推奨フィードリストに新しいTIDを割り当て
 * 3. 既存の保存済みフィードを完全に上書き
 * 4. 処理中はボタンが無効化される
 *
 * Go開発者への補足:
 * - このコンポーネントはGoのHTMLテンプレート関数に相当
 * - useOverwriteSavedFeedsMutationはDBへの書き込み操作を表す
 */
export function NoSavedFeedsOfAnyType() {
  // テーマ設定を取得
  const t = useTheme()
  // 国際化用の翻訳関数を取得
  const {_} = useLingui()
  // 保存済みフィード上書き用のミューテーションを取得
  // isPending: 処理中かどうかのフラグ（Goのsync.WaitGroupのような役割）
  // mutateAsync: 非同期ミューテーション関数
  const {isPending, mutateAsync: overwriteSavedFeeds} =
    useOverwriteSavedFeedsMutation()

  /**
   * 推奨フィードを追加するコールバック（非同期）
   *
   * Go開発者への補足:
   * - async関数はGoのgoroutineではなく、Promiseを返す関数
   * - awaitはGoのチャネル受信 (<-ch) に似ているが、より高レベルの抽象化
   * - React.useCallbackは依存配列が変わらない限り同じ関数参照を保持
   */
  const addRecommendedFeeds = React.useCallback(async () => {
    // 推奨フィードリストの各アイテムに新しいTID（Timestamp Identifier）を割り当て
    // map関数は配列の各要素を変換（Goのfor rangeループ + append に相当）
    await overwriteSavedFeeds(
      RECOMMENDED_SAVED_FEEDS.map(f => ({
        ...f, // スプレッド構文で既存プロパティをコピー
        id: TID.nextStr(), // 新しいタイムスタンプベースのIDを生成
      })),
    )
  }, [overwriteSavedFeeds]) // 依存配列: この値が変わった時のみ関数を再作成

  return (
    // フレックスボックスレイアウト: 横並び、折り返しあり、両端揃え
    <View
      style={[a.flex_row, a.flex_wrap, a.justify_between, a.p_xl, a.gap_md]}>
      {/* 説明テキスト: 行間を詰め、中程度のコントラスト、最大幅310px */}
      <Text
        style={[a.leading_snug, t.atoms.text_contrast_medium, {maxWidth: 310}]}>
        {/* 国際化対応のメッセージ */}
        <Trans>
          Looks like you haven't saved any feeds! Use our recommendations or
          browse more below.
        </Trans>
      </Text>

      {/* 推奨フィード適用ボタン */}
      {/* 処理中は無効化（二重送信防止）、プライマリカラー、ソリッドスタイル */}
      <Button
        disabled={isPending}
        label={_(msg`Apply default recommended feeds`)}
        size="small"
        variant="solid"
        color="primary"
        onPress={addRecommendedFeeds}>
        {/* 左側にプラスアイコンを配置 */}
        <ButtonIcon icon={Plus} position="left" />
        {/* ボタンのテキスト */}
        <ButtonText>{_(msg`Use recommended`)}</ButtonText>
      </Button>
    </View>
  )
}
