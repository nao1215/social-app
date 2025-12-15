/**
 * @file リスト非表示画面コンポーネント
 *
 * リストが非表示になっている理由（作成者のブロック、コミュニティガイドライン違反など）を
 * 表示し、ユーザーに適切なアクション（購読解除、リスト削除、戻る）を提供する。
 *
 * Go開発者への補足:
 * - Reactコンポーネントは関数として定義され、propsを受け取りJSXを返す（Goのテンプレート関数に相当）
 * - React.useState, React.useCallbackなどのフックはコンポーネント内で状態や副作用を管理
 * - interfaceはGoのstructに相当する型定義
 */

// Reactのコアライブラリ
import React from 'react'
// React Nativeのビューコンポーネント
import {View} from 'react-native'
// AT Protocolのグラフ定義（リスト、ブロック、ミュートなど）
import {AppBskyGraphDefs} from '@atproto/api'
// Linguiの国際化マクロ
import {msg, Trans} from '@lingui/macro'
// Lingui React統合
import {useLingui} from '@lingui/react'
// TanStack Queryのクライアントフック（キャッシュ管理）
import {useQueryClient} from '@tanstack/react-query'

// 前の画面に戻るためのカスタムフック
import {useGoBack} from '#/lib/hooks/useGoBack'
// ハンドル文字列のサニタイズ（@マークの削除など）
import {sanitizeHandle} from '#/lib/strings/handles'
// ロガーユーティリティ
import {logger} from '#/logger'
// リストクエリのルートキー定義
import {RQKEY_ROOT as listQueryRoot} from '#/state/queries/list'
// リストブロック・ミュート操作用のミューテーションフック
import {useListBlockMutation, useListMuteMutation} from '#/state/queries/list'
// プリファレンス型定義とフィード削除ミューテーション
import {
  UsePreferencesQueryResponse,
  useRemoveFeedMutation,
} from '#/state/queries/preferences'
// セッション管理（現在のユーザー情報）
import {useSession} from '#/state/session'
// トースト通知ユーティリティ
import * as Toast from '#/view/com/util/Toast'
// 中央寄せビューコンポーネント
import {CenteredView} from '#/view/com/util/Views'
// デザインシステムのアトム、ブレークポイント、テーマフック
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// 目にスラッシュが入ったアイコン（非表示を表す）
import {EyeSlash_Stroke2_Corner0_Rounded as EyeSlash} from '#/components/icons/EyeSlash'
// ローディングスピナー
import {Loader} from '#/components/Loader'
// コンテンツ表示/非表示を制御するフック
import {useHider} from '#/components/moderation/Hider'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

/**
 * リスト非表示画面コンポーネント
 *
 * @param list - 非表示になっているリストの情報（Go的にはstructのポインタに相当）
 * @param preferences - ユーザーのプリファレンス設定
 * @returns リスト非表示理由の説明と対応アクションボタンを含むビュー
 *
 * 機能:
 * - リストが非表示になっている理由を表示
 * - 所有者の場合: リストを表示するオプション
 * - 購読者の場合: 購読解除またはフィードから削除するオプション
 * - すべてのユーザー: 前の画面に戻るオプション
 *
 * Go開発者への補足:
 * - プロパティの分割代入は Go の構造体フィールドアクセスに似ている
 * - interfaceベースの型定義により型安全性を確保
 */
export function ListHiddenScreen({
  list,
  preferences,
}: {
  list: AppBskyGraphDefs.ListView // リストビュー型（GoのstructタグでJSONマッピングするのと同様）
  preferences: UsePreferencesQueryResponse // プリファレンスクエリレスポンス型
}) {
  // 国際化用の翻訳関数を取得
  const {_} = useLingui()
  // テーマ設定を取得
  const t = useTheme()
  // 現在のアカウント情報を取得
  const {currentAccount} = useSession()
  // ブレークポイント判定（モバイルより大きい画面かどうか）
  const {gtMobile} = useBreakpoints()
  // 現在のユーザーがリストの所有者かどうかを判定
  const isOwner = currentAccount?.did === list.creator.did
  // 前の画面に戻る関数を取得
  const goBack = useGoBack()
  // TanStack Queryのクライアント（キャッシュ無効化に使用）
  const queryClient = useQueryClient()

  // リストがモデレーションリスト（ブロック/ミュート用リスト）かどうかを判定
  const isModList = list.purpose === AppBskyGraphDefs.MODLIST

  /**
   * 処理中フラグの状態管理
   *
   * Go開発者への補足:
   * - React.useStateは状態管理フック（Goにはない概念）
   * - [値, 更新関数] のタプルを返す
   * - setIsProcessingを呼ぶとコンポーネントが再レンダリングされる
   */
  const [isProcessing, setIsProcessing] = React.useState(false)
  // リストブロック操作用のミューテーション
  const listBlockMutation = useListBlockMutation()
  // リストミュート操作用のミューテーション
  const listMuteMutation = useListMuteMutation()
  // 保存済みフィード削除用のミューテーション
  const {mutateAsync: removeSavedFeed} = useRemoveFeedMutation()

  // コンテンツ表示/非表示を制御する関数を取得
  const {setIsContentVisible} = useHider()

  // 保存済みフィード設定から現在のリストを検索
  // findはGoのfor rangeループで条件に合う最初の要素を探すのと同じ
  const savedFeedConfig = preferences.savedFeeds.find(f => f.value === list.uri)

  /**
   * リストの購読を解除する処理
   *
   * モデレーションリストからの購読解除を処理する。
   * ミュート状態とブロック状態を順次解除し、キャッシュを無効化する。
   *
   * @async
   * Go開発者への補足:
   * - async関数はPromiseを返す関数（Goのgoroutineとは異なる）
   * - awaitで非同期処理の完了を待つ（Goのチャネル受信に似ているが高レベル）
   * - try-catchはGoのif err != nilに相当するエラーハンドリング
   */
  const onUnsubscribe = async () => {
    // 処理中フラグをtrueに設定（ボタンを無効化するため）
    setIsProcessing(true)

    // リストがミュートされている場合、ミュートを解除
    if (list.viewer?.muted) {
      try {
        // ミュート解除のAPIリクエストを実行（Goのhttp.Postに相当）
        await listMuteMutation.mutateAsync({uri: list.uri, mute: false})
      } catch (e) {
        // エラー時は処理中フラグをリセット
        setIsProcessing(false)
        // エラーをログに記録（Goのlog.Errorに相当）
        logger.error('Failed to unmute list', {message: e})
        // ユーザーにエラートーストを表示
        Toast.show(
          _(
            msg`There was an issue. Please check your internet connection and try again.`,
          ),
        )
        return // 早期リターンでこれ以上の処理を中断
      }
    }

    // リストがブロックされている場合、ブロックを解除
    if (list.viewer?.blocked) {
      try {
        // ブロック解除のAPIリクエストを実行
        await listBlockMutation.mutateAsync({uri: list.uri, block: false})
      } catch (e) {
        // エラー時は処理中フラグをリセット
        setIsProcessing(false)
        // エラーをログに記録
        logger.error('Failed to unblock list', {message: e})
        // ユーザーにエラートーストを表示
        Toast.show(
          _(
            msg`There was an issue. Please check your internet connection and try again.`,
          ),
        )
        return // 早期リターンでこれ以上の処理を中断
      }
    }

    // リストクエリのキャッシュを無効化（再フェッチを促す）
    // Goでいうとキャッシュストアからエントリーをクリアするのと同じ
    queryClient.invalidateQueries({
      queryKey: [listQueryRoot],
    })

    // 成功トーストを表示
    Toast.show(_(msg`Unsubscribed from list`))
    // 処理中フラグをfalseに戻す
    setIsProcessing(false)
  }

  /**
   * 保存済みフィードからリストを削除する処理
   *
   * ユーザーの保存済みフィードリストから現在のリストを削除する。
   *
   * @async
   * Go開発者への補足:
   * - finallyブロックはGoのdeferに似ており、成功/失敗に関わらず実行される
   */
  const onRemoveList = async () => {
    // 保存済みフィード設定が存在しない場合は早期リターン
    if (!savedFeedConfig) return

    try {
      // フィード削除のAPIリクエストを実行
      await removeSavedFeed(savedFeedConfig)
      // 成功トーストを表示
      Toast.show(_(msg`Removed from saved feeds`))
    } catch (e) {
      // エラーをログに記録
      logger.error('Failed to remove list from saved feeds', {message: e})
      // ユーザーにエラートーストを表示
      Toast.show(
        _(
          msg`There was an issue. Please check your internet connection and try again.`,
        ),
      )
    } finally {
      // 成功・失敗に関わらず処理中フラグをリセット（Goのdeferに相当）
      setIsProcessing(false)
    }
  }

  return (
    // 中央寄せビュー: 垂直方向のレイアウト、上下パディング、サイドボーダー付き
    <CenteredView
      style={[
        a.flex_1, // フレックス成長率1（利用可能なスペースを埋める）
        a.align_center, // 子要素を中央揃え
        a.gap_5xl, // 大きなギャップ（子要素間の余白）
        !gtMobile && a.justify_between, // モバイルの場合は両端揃え
        t.atoms.border_contrast_low, // 低コントラストのボーダー
        {paddingTop: 175, paddingBottom: 110}, // カスタムパディング
      ]}
      sideBorders={true}> {/* サイドボーダーを表示 */}

      {/* アイコンとメッセージセクション */}
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        {/* 目にスラッシュのアイコン（非表示を視覚的に表現） */}
        <EyeSlash
          style={{color: t.atoms.text_contrast_medium.color}}
          height={42}
          width={42}
        />

        {/* タイトルと説明テキストのコンテナ */}
        <View style={[a.gap_sm, a.align_center]}>
          {/* タイトル: ブロック状態または非表示状態に応じて表示 */}
          <Text style={[a.font_bold, a.text_3xl]}>
            {/* 作成者がブロックしている、またはブロックされている場合 */}
            {list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
              <Trans>Creator has been blocked</Trans>
            ) : (
              <Trans>List has been hidden</Trans>
            )}
          </Text>

          {/* 説明テキスト: 状況に応じた詳細メッセージ */}
          <Text
            style={[
              a.text_md, // 中サイズのテキスト
              a.text_center, // テキスト中央揃え
              a.px_md, // 水平方向の中パディング
              t.atoms.text_contrast_high, // 高コントラストのテキスト
              {lineHeight: 1.4}, // 行高さ
            ]}>
            {/* ブロック状態の場合 */}
            {list.creator.viewer?.blocking || list.creator.viewer?.blockedBy ? (
              <Trans>
                Either the creator of this list has blocked you or you have
                blocked the creator.
              </Trans>
            ) : isOwner ? (
              // 所有者の場合
              <Trans>
                This list – created by you – contains possible violations of
                Bluesky's community guidelines in its name or description.
              </Trans>
            ) : (
              // 他のユーザーが作成したリストの場合
              <Trans>
                This list – created by{' '}
                <Text style={[a.font_bold]}>
                  {sanitizeHandle(list.creator.handle, '@')} {/* @を削除してハンドルを表示 */}
                </Text>{' '}
                – contains possible violations of Bluesky's community guidelines
                in its name or description.
              </Trans>
            )}
          </Text>
        </View>
      </View>

      {/* アクションボタンセクション */}
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        {/* 条件付きボタングループ */}
        <View style={[a.gap_md]}>
          {/* 保存済みフィードに含まれている場合: 削除ボタンを表示 */}
          {savedFeedConfig ? (
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Remove from saved feeds`)}
              onPress={onRemoveList}
              disabled={isProcessing}> {/* 処理中は無効化 */}
              <ButtonText>
                <Trans>Remove from saved feeds</Trans>
              </ButtonText>
              {/* 処理中はローディングアイコンを表示 */}
              {isProcessing ? (
                <ButtonIcon icon={Loader} position="right" />
              ) : null}
            </Button>
          ) : null}

          {/* 所有者の場合: リストを表示するボタン */}
          {isOwner ? (
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Show list anyway`)}
              onPress={() => setIsContentVisible(true)} // コンテンツを表示状態に設定
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Show anyway</Trans>
              </ButtonText>
            </Button>
          ) : list.viewer?.muted || list.viewer?.blocked ? (
            // ミュートまたはブロックしている場合: 購読解除ボタン
            <Button
              variant="solid"
              color="secondary"
              size="large"
              label={_(msg`Unsubscribe from list`)}
              onPress={() => {
                // モデレーションリストの場合は購読解除、それ以外は削除
                if (isModList) {
                  onUnsubscribe()
                } else {
                  onRemoveList()
                }
              }}
              disabled={isProcessing}>
              <ButtonText>
                <Trans>Unsubscribe from list</Trans>
              </ButtonText>
              {/* 処理中はローディングアイコンを表示 */}
              {isProcessing ? (
                <ButtonIcon icon={Loader} position="right" />
              ) : null}
            </Button>
          ) : null}
        </View>

        {/* 戻るボタン（常に表示） */}
        <Button
          variant="solid"
          color="primary" // プライマリカラー（強調）
          label={_(msg`Return to previous page`)}
          onPress={goBack} // 前の画面に戻る
          size="large"
          disabled={isProcessing}>
          <ButtonText>
            <Trans>Go Back</Trans>
          </ButtonText>
        </Button>
      </View>
    </CenteredView>
  )
}
