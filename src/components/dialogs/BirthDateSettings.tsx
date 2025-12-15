/**
 * 生年月日設定ダイアログコンポーネント
 *
 * このモジュールは、ユーザーの生年月日を設定・変更するためのダイアログを提供します。
 * 年齢に基づいた制限チェック（13歳未満の利用禁止、18歳未満への警告）を含みます。
 *
 * 【主な機能】
 * - 生年月日の表示と編集
 * - 年齢計算と制限チェック（13歳未満は保存不可、18歳未満には警告表示）
 * - サーバーへの生年月日保存
 * - エラーハンドリングと表示
 *
 * 【Goユーザー向け補足】
 * - React: UIコンポーネントライブラリ（Goのhtml/templateに似た役割）
 * - View: React Nativeのコンテナコンポーネント（HTMLのdivに相当）
 * - msg/Trans: 国際化（i18n）ライブラリLinguiのマクロ（翻訳文字列の定義）
 */

// Reactのコアライブラリをインポート（useStateなどのフックを使用）
import React from 'react'
// React NativeのViewコンポーネント（HTMLのdivに相当するコンテナ）
import {View} from 'react-native'
// 国際化ライブラリLingui: msgは翻訳キー定義、Transは翻訳テキスト表示
import {msg, Trans} from '@lingui/macro'
// useLingui: 現在の言語設定と翻訳関数を取得するフック
import {useLingui} from '@lingui/react'

// エラーメッセージをユーザーフレンドリーにクリーンアップする関数
import {cleanError} from '#/lib/strings/errors'
// 日付から年齢を計算、過去の日付を取得するユーティリティ関数
import {getAge, getDateAgo} from '#/lib/strings/time'
// ロギングユーティリティ（エラーログなど）
import {logger} from '#/logger'
// プラットフォーム検出（iOS、Web判定）
import {isIOS, isWeb} from '#/platform/detection'
// ユーザー設定の取得・更新を行うReact Queryフック
import {
  usePreferencesQuery,
  type UsePreferencesQueryResponse,
  usePreferencesSetBirthDateMutation,
} from '#/state/queries/preferences'
// エラーメッセージ表示コンポーネント
import {ErrorMessage} from '#/view/com/util/error/ErrorMessage'
// スタイルシステム: atoms（a）はスタイルユーティリティ、useThemeはテーマフック
import {atoms as a, useTheme, web} from '#/alf'
// 警告・情報メッセージを表示するAdmonitionコンポーネント
import {Admonition} from '#/components/Admonition'
// ボタンコンポーネント群
import {Button, ButtonIcon, ButtonText} from '#/components/Button'
// ダイアログ（モーダル）コンポーネント群
import * as Dialog from '#/components/Dialog'
// 日付入力フィールドコンポーネント
import {DateField} from '#/components/forms/DateField'
// インラインリンクテキストコンポーネント
import {InlineLinkText} from '#/components/Link'
// ローディングスピナーコンポーネント
import {Loader} from '#/components/Loader'
// テキスト表示コンポーネント
import {Text} from '#/components/Typography'

/**
 * 生年月日設定ダイアログのメインコンポーネント
 *
 * ユーザー設定から生年月日を読み込み、編集可能なダイアログとして表示します。
 * ローディング状態、エラー状態、正常状態を適切にハンドリングします。
 *
 * @param {object} props - コンポーネントのprops
 * @param {Dialog.DialogControlProps} props.control - ダイアログの開閉を制御するオブジェクト
 *
 * 【Goユーザー向け補足】
 * - {control}: {control: Dialog.DialogControlProps} - 分割代入で引数からcontrolプロパティを抽出
 *   Goでは func(props struct{ control DialogControlProps }) のような構造体引数に相当
 * - ?: 三項演算子（条件 ? 真の値 : 偽の値）
 */
export function BirthDateSettingsDialog({
  control,
}: {
  control: Dialog.DialogControlProps
}) {
  // テーマ設定を取得（ダークモード/ライトモードの色など）
  const t = useTheme()
  // 国際化: _は翻訳関数（_('key')で翻訳テキスト取得）
  const {_} = useLingui()
  // ユーザー設定をサーバーから取得（React Queryによる自動キャッシング）
  // 【Goユーザー向け】分割代入で複数の戻り値を受け取る（Goの複数戻り値に似ている）
  const {isLoading, error, data: preferences} = usePreferencesQuery()

  return (
    // ダイアログの外枠コンポーネント
    // preventExpansion: ネイティブアプリでダイアログの拡張を防ぐ
    <Dialog.Outer control={control} nativeOptions={{preventExpansion: true}}>
      {/* ダイアログを引っ張るためのハンドル（モバイルUI） */}
      <Dialog.Handle />
      {/* スクロール可能なダイアログ内部コンテンツ */}
      <Dialog.ScrollableInner
        label={_(msg`My Birthday`)}
        style={web({maxWidth: 400})}> {/* Webのみ最大幅400pxを適用 */}
        <View style={[a.gap_sm]}> {/* 子要素間に小さな隙間を設定 */}
          {/* タイトル */}
          <Text style={[a.text_xl, a.font_bold]}>
            <Trans>My Birthday</Trans>
          </Text>
          {/* プライバシー説明テキスト */}
          <Text style={[a.leading_snug, t.atoms.text_contrast_medium]}>
            <Trans>
              This information is private and not shared with other users.
            </Trans>
          </Text>

          {/* 条件分岐レンダリング: ローディング、エラー、正常状態 */}
          {isLoading ? (
            // ローディング中: 大きなスピナーを表示
            <Loader size="xl" />
          ) : error || !preferences ? (
            // エラー時または設定が取得できない場合: エラーメッセージ表示
            <ErrorMessage
              message={
                error?.toString() ||
                _(
                  msg`We were unable to load your birth date preferences. Please try again.`,
                )
              }
              style={[a.rounded_sm]}
            />
          ) : (
            // 正常時: 実際の編集フォームを表示
            <BirthdayInner control={control} preferences={preferences} />
          )}
        </View>

        {/* ダイアログを閉じるボタン（×ボタン） */}
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

/**
 * 生年月日編集フォームの内部コンポーネント
 *
 * 実際の日付入力フィールドと保存ロジックを担当します。
 * 年齢に基づく制限チェックと警告表示を行います。
 *
 * @param {object} props - コンポーネントのprops
 * @param {Dialog.DialogControlProps} props.control - ダイアログ制御
 * @param {UsePreferencesQueryResponse} props.preferences - ユーザー設定データ
 *
 * 【Goユーザー向け補足】
 * - React.useState: 状態管理フック。[現在値, 更新関数]を返す
 * - React.useCallback: 関数のメモ化。依存配列の値が変わらない限り同じ関数インスタンスを返す
 * - async/await: 非同期処理（GoのgoroutineとchannelとはAPIレベルで異なるがPromiseベース）
 */
function BirthdayInner({
  control,
  preferences,
}: {
  control: Dialog.DialogControlProps
  preferences: UsePreferencesQueryResponse
}) {
  // 翻訳関数を取得
  const {_} = useLingui()
  // 日付の状態管理
  // 初期値: 既存の生年月日 または 18年前の日付（デフォルト）
  // 【Goユーザー向け】useState<string>のようなジェネリクスで型を指定
  const [date, setDate] = React.useState(
    preferences.birthDate || getDateAgo(18),
  )
  // 生年月日更新のミューテーション（サーバーへの保存）
  // 【Goユーザー向け】分割代入で必要なプロパティのみ取得（Goの複数戻り値に似ている）
  const {
    isPending, // 保存処理中かどうか
    isError, // エラーが発生したかどうか
    error, // エラーオブジェクト
    mutateAsync: setBirthDate, // 非同期保存関数（リネーム）
  } = usePreferencesSetBirthDateMutation()
  // 元の値から変更されたかどうか
  const hasChanged = date !== preferences.birthDate

  // 現在入力されている日付から年齢を計算
  const age = getAge(new Date(date))
  const isUnder13 = age < 13 // 13歳未満（利用不可）
  const isUnder18 = age >= 13 && age < 18 // 13歳以上18歳未満（警告表示）

  // 保存ハンドラー（メモ化された関数）
  // 【Goユーザー向け】useCallbackは関数のメモ化。依存配列の値が変わらない限り再生成しない
  const onSave = React.useCallback(async () => {
    try {
      // 日付が変更されている場合のみサーバーに保存
      if (hasChanged) {
        await setBirthDate({birthDate: date})
      }
      // 保存後、ダイアログを閉じる
      control.close()
    } catch (e: any) {
      // エラーをログに記録
      logger.error(`setBirthDate failed`, {message: e.message})
    }
  }, [date, setBirthDate, control, hasChanged]) // 依存配列: これらが変わると関数が再生成される

  return (
    <View style={a.gap_lg} testID="birthDateSettingsDialog">
      {/* 日付入力フィールド（iOSでは中央寄せ） */}
      <View style={isIOS && [a.w_full, a.align_center]}>
        <DateField
          testID="birthdayInput"
          value={date}
          onChangeDate={newDate => setDate(new Date(newDate))} // アロー関数で新しい日付を設定
          label={_(msg`Birthday`)}
          accessibilityHint={_(msg`Enter your birth date`)}
        />
      </View>

      {/* 18歳未満の警告（変更があった場合のみ表示） */}
      {isUnder18 && hasChanged && (
        <Admonition type="info">
          <Trans>
            The birthdate you've entered means you are under 18 years old.
            Certain content and features may be unavailable to you.
          </Trans>
        </Admonition>
      )}

      {/* 13歳未満のエラー（常に表示） */}
      {isUnder13 && (
        <Admonition type="error">
          <Trans>
            You must be at least 13 years old to use Bluesky. Read our{' '}
            <InlineLinkText
              to="https://bsky.social/about/support/tos"
              label={_(msg`Terms of Service`)}>
              Terms of Service
            </InlineLinkText>{' '}
            for more information.
          </Trans>
        </Admonition>
      )}

      {/* 保存エラーメッセージ */}
      {isError ? (
        <ErrorMessage message={cleanError(error)} style={[a.rounded_sm]} />
      ) : undefined}

      {/* 保存/完了ボタン（Webでは右寄せ） */}
      <View style={isWeb && [a.flex_row, a.justify_end]}>
        {/* 13歳未満の場合は無効化 */}
        <Button
          label={hasChanged ? _(msg`Save birthday`) : _(msg`Done`)}
          size="large"
          onPress={onSave}
          variant="solid"
          color="primary"
          disabled={isUnder13}>
          <ButtonText>
            {hasChanged ? <Trans>Save</Trans> : <Trans>Done</Trans>}
          </ButtonText>
          {/* 保存処理中はローディングアイコンを表示 */}
          {isPending && <ButtonIcon icon={Loader} />}
        </Button>
      </View>
    </View>
  )
}
