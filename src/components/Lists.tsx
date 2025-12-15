/**
 * Lists.tsx
 *
 * リスト表示用のユーティリティコンポーネント群
 * 無限スクロールリストのフッター、プレースホルダー（ローディング/エラー/空状態）を提供
 *
 * 主な機能:
 * - ListFooter: 無限スクロールの末尾表示（次ページ読み込み中、エラー、終了メッセージ）
 * - ListMaybePlaceholder: リスト全体のプレースホルダー（ローディング、エラー、空状態）
 * - 国際化対応（Lingui）
 * - レスポンシブデザイン（モバイル/デスクトップで異なる表示）
 *
 * Goユーザー向けの補足:
 * - memo: Reactのメモ化高階コンポーネント（propsが変わらない限り再レンダリングしない）
 * - React.ReactNode: Reactで表示可能な任意の要素（string, number, JSX, nullなど）
 * - StyleProp<ViewStyle>: React Nativeのスタイル型（配列またはオブジェクト）
 * - 三項演算子 condition ? true : false はGoと同じ
 */

// Reactのメモ化高階コンポーネント
// Goユーザー向けの補足: memoはpropsが変わらない限りコンポーネントを再レンダリングしない最適化
import {memo} from 'react'
// React Nativeのスタイル型とViewコンポーネント
import {type StyleProp, View, type ViewStyle} from 'react-native'
// 国際化（i18n）のためのLingui - メッセージ定義とコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// Reactの型定義
import type React from 'react'

// エラーメッセージのクリーンアップユーティリティ
import {cleanError} from '#/lib/strings/errors'
// 中央揃えビューコンポーネント
import {CenteredView} from '#/view/com/util/Views'
// デザインシステム関連
import {atoms as a, flatten, useBreakpoints, useTheme} from '#/alf'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// エラー表示コンポーネント
import {Error} from '#/components/Error'
// ローダー（スピナー）コンポーネント
import {Loader} from '#/components/Loader'
// テキスト表示コンポーネント
import {Text} from '#/components/Typography'

/**
 * ListFooter - 無限スクロールリストのフッターコンポーネント
 *
 * 無限スクロール時のリスト末尾に表示される要素を管理。
 * 次ページ読み込み中、エラー、リスト終了メッセージなどを表示。
 *
 * 表示パターン:
 * 1. isFetchingNextPage=true: ローディングスピナー表示
 * 2. error: エラーメッセージとリトライボタン表示
 * 3. !hasNextPage && showEndMessage: 終了メッセージ表示
 * 4. その他: 何も表示しない（null）
 *
 * @param isFetchingNextPage - 次ページ取得中フラグ
 * @param hasNextPage - 次ページが存在するかどうか
 * @param error - エラーメッセージ（あればエラー表示）
 * @param onRetry - リトライボタン押下時のコールバック
 * @param height - フッターの高さ（デフォルト: 180）
 * @param style - 追加のスタイル
 * @param showEndMessage - 終了メッセージを表示するかどうか
 * @param endMessageText - カスタム終了メッセージテキスト
 * @param renderEndMessage - カスタム終了メッセージレンダラー
 *
 * Goユーザー向けの補足:
 * - ? は省略可能なプロパティを示す（Goのポインタ型に似ている）
 * - 三項演算子 A ? B : C は条件に応じて値を返す（Goと同じ）
 */
export function ListFooter({
  isFetchingNextPage,
  hasNextPage,
  error,
  onRetry,
  height,
  style,
  showEndMessage = false,
  endMessageText,
  renderEndMessage,
}: {
  isFetchingNextPage?: boolean
  hasNextPage?: boolean
  error?: string
  onRetry?: () => Promise<unknown>
  height?: number
  style?: StyleProp<ViewStyle>
  showEndMessage?: boolean
  endMessageText?: string
  renderEndMessage?: () => React.ReactNode
}) {
  const t = useTheme()  // 現在のテーマを取得

  return (
    <View
      style={[
        a.w_full,                      // width: 100%
        a.align_center,                // align-items: center（横方向中央揃え）
        a.border_t,                    // border-top: 1px（上部ボーダー）
        a.pb_lg,                       // padding-bottom: large
        t.atoms.border_contrast_low,   // テーマに応じたボーダー色（低コントラスト）
        {height: height ?? 180, paddingTop: 30},  // デフォルト高さ180、上部パディング30
        flatten(style),                // 外部から渡されたスタイルをフラット化
      ]}>
      {/* 次ページ取得中の場合 */}
      {isFetchingNextPage ? (
        <Loader size="xl" />
      ) : error ? (
        /* エラーがある場合 */
        <ListFooterMaybeError error={error} onRetry={onRetry} />
      ) : !hasNextPage && showEndMessage ? (
        /* 次ページがなく、終了メッセージ表示が有効な場合 */
        renderEndMessage ? (
          /* カスタムレンダラーがある場合はそれを使用 */
          renderEndMessage()
        ) : (
          /* デフォルトの終了メッセージ */
          <Text style={[a.text_sm, t.atoms.text_contrast_low]}>
            {/* カスタムテキストまたはデフォルトテキスト */}
            {endMessageText ?? <Trans>You have reached the end</Trans>}
          </Text>
        )
      ) : null}
      {/* 何も該当しない場合は何も表示しない */}
    </View>
  )
}

/**
 * ListFooterMaybeError - リストフッターのエラー表示コンポーネント（内部用）
 *
 * エラーメッセージとリトライボタンを含むコンパクトなエラー表示。
 * ListFooter内でのみ使用される。
 *
 * @param error - エラーメッセージ
 * @param onRetry - リトライボタン押下時のコールバック
 *
 * Goユーザー向けの補足:
 * - null チェック (!error) で早期リターンするパターンはGoと同じ
 */
function ListFooterMaybeError({
  error,
  onRetry,
}: {
  error?: string
  onRetry?: () => Promise<unknown>
}) {
  const t = useTheme()      // テーマ取得
  const {_} = useLingui()   // 国際化関数取得

  // エラーがない場合は何も表示しない
  if (!error) return null

  return (
    <View style={[a.w_full, a.px_lg]}>
      <View
        style={[
          a.flex_row,                  // flex-direction: row（横並び）
          a.gap_md,                    // gap: medium（子要素間の間隔）
          a.p_md,                      // padding: medium
          a.rounded_sm,                // border-radius: small（角丸）
          a.align_center,              // align-items: center
          t.atoms.bg_contrast_25,      // テーマに応じた背景色（25%コントラスト）
        ]}>
        {/* エラーメッセージテキスト */}
        <Text
          style={[a.flex_1, a.text_sm, t.atoms.text_contrast_medium]}
          numberOfLines={2}>          {/* 最大2行表示 */}
          {error ? (
            cleanError(error)          // エラーメッセージをクリーンアップ
          ) : (
            <Trans>Oops, something went wrong!</Trans>
          )}
        </Text>
        {/* リトライボタン */}
        <Button
          variant="solid"
          label={_(msg`Press to retry`)}  // アクセシビリティラベル
          style={[
            a.align_center,            // align-items: center
            a.justify_center,          // justify-content: center
            a.rounded_sm,              // border-radius: small
            a.overflow_hidden,         // overflow: hidden
            a.px_md,                   // padding-horizontal: medium
            a.py_sm,                   // padding-vertical: small
          ]}
          onPress={onRetry}>
          <ButtonText>
            <Trans>Retry</Trans>
          </ButtonText>
        </Button>
      </View>
    </View>
  )
}

/**
 * ListMaybePlaceholder - リスト全体のプレースホルダーコンポーネント
 *
 * リストデータの状態に応じて、ローディング、エラー、空状態を表示。
 * リスト本体を表示する前の全画面プレースホルダー。
 *
 * 表示優先順位:
 * 1. isLoading=true: ローディングスピナー表示
 * 2. isError=true: エラー画面表示（リトライボタン付き）
 * 3. noEmpty=false: 空状態メッセージ表示
 * 4. その他: null（何も表示しない）
 *
 * @param isLoading - ローディング中フラグ
 * @param noEmpty - 空でないフラグ（falseの場合は空状態表示）
 * @param isError - エラーフラグ
 * @param emptyTitle - 空状態のタイトル
 * @param emptyMessage - 空状態のメッセージ
 * @param errorTitle - エラー画面のタイトル
 * @param errorMessage - エラー画面のメッセージ
 * @param emptyType - 空状態のタイプ（'page' or 'results'）
 * @param onRetry - リトライボタン押下時のコールバック
 * @param onGoBack - 戻るボタン押下時のコールバック
 * @param hideBackButton - 戻るボタンを非表示にするか
 * @param sideBorders - 左右にボーダーを表示するか
 * @param topBorder - 上部にボーダーを表示するか
 *
 * Goユーザー向けの補足:
 * - React.ReactNode: 任意のReact要素を返すことができる型（interface{}に似ている）
 * - let で変数を定義し、後でmemo()で再代入（Goでは一般的でない）
 */
let ListMaybePlaceholder = ({
  isLoading,
  noEmpty,
  isError,
  emptyTitle,
  emptyMessage,
  errorTitle,
  errorMessage,
  emptyType = 'page',
  onRetry,
  onGoBack,
  hideBackButton,
  sideBorders,
  topBorder = false,
}: {
  isLoading: boolean
  noEmpty?: boolean
  isError?: boolean
  emptyTitle?: string
  emptyMessage?: string
  errorTitle?: string
  errorMessage?: string
  emptyType?: 'page' | 'results'
  onRetry?: () => Promise<unknown>
  onGoBack?: () => void
  hideBackButton?: boolean
  sideBorders?: boolean
  topBorder?: boolean
}): React.ReactNode => {
  const t = useTheme()                              // テーマ取得
  const {_} = useLingui()                           // 国際化関数取得
  const {gtMobile, gtTablet} = useBreakpoints()    // レスポンシブブレークポイント取得

  // ローディング中の場合
  if (isLoading) {
    return (
      <CenteredView
        style={[
          a.h_full_vh,                 // height: 100vh（画面全体の高さ）
          a.align_center,              // align-items: center
          // レスポンシブレイアウト
          !gtMobile ? a.justify_between : a.gap_5xl,  // モバイル: 上下配置、デスクトップ: 大きな間隔
          t.atoms.border_contrast_low,
          {paddingTop: 175, paddingBottom: 110},  // 上下パディング
        ]}
        sideBorders={sideBorders ?? gtMobile}      // サイドボーダー（デフォルトはモバイル以上で表示）
        topBorder={topBorder && !gtTablet}>        {/* トップボーダー（タブレット以下で表示） */}
        <View style={[a.w_full, a.align_center, {top: 100}]}>
          <Loader size="xl" />
        </View>
      </CenteredView>
    )
  }

  // エラーの場合
  if (isError) {
    return (
      <Error
        title={errorTitle ?? _(msg`Oops!`)}  // エラータイトル（デフォルト: "Oops!"）
        message={errorMessage ?? _(msg`Something went wrong!`)}  // エラーメッセージ
        onRetry={onRetry}
        onGoBack={onGoBack}
        sideBorders={sideBorders}
        hideBackButton={hideBackButton}
      />
    )
  }

  // 空状態の場合（noEmptyがfalseの場合）
  if (!noEmpty) {
    return (
      <Error
        title={
          emptyTitle ??
          (emptyType === 'results'
            ? _(msg`No results found`)       // 検索結果なしの場合
            : _(msg`Page not found`))        // ページが見つからない場合
        }
        message={
          emptyMessage ??
          _(msg`We're sorry! We can't find the page you were looking for.`)
        }
        onRetry={onRetry}
        onGoBack={onGoBack}
        hideBackButton={hideBackButton}
        sideBorders={sideBorders}
      />
    )
  }

  // どの条件にも該当しない場合は何も表示しない
  return null
}

// Goユーザー向けの補足: memo()はReactの高階コンポーネント（HOC）
// propsが変わらない限りコンポーネントを再レンダリングしない最適化
// Goでは関数を変数に代入して再定義するパターンは一般的でないが、
// JavaScriptでは変数の再代入が可能
ListMaybePlaceholder = memo(ListMaybePlaceholder)

// メモ化されたコンポーネントをエクスポート
export {ListMaybePlaceholder}
