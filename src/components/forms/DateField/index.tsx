/**
 * 日付フィールドコンポーネント（iOS実装）
 *
 * 【概要】
 * iOS専用の日付入力コンポーネントです。ダイアログ内にインライン日付ピッカーを
 * 表示し、ユーザーが日付を選択できるようにします。
 *
 * 【主な機能】
 * - YYYY-MM-DD形式の日付文字列の入力・出力
 * - Dateオブジェクトから文字列への自動変換
 * - ダイアログ形式の日付ピッカー表示
 * - ref経由でのフォーカス制御
 *
 * 【使用方法】
 * - 入力: YYYY-MM-DD形式の文字列またはDateオブジェクト
 * - 出力: YYYY-MM-DD形式の文字列（onChangeDateコールバック経由）
 * - フォーマット変換: utils.toSimpleDateString(Date)を使用
 *
 * @module DateField/iOS - iOS専用日付フィールド実装
 */

// Reactフック - コールバックメモ化、ref制御
import {useCallback, useImperativeHandle} from 'react'
// React Nativeコアコンポーネント - キーボード制御、レイアウト
import {Keyboard, View} from 'react-native'
// サードパーティ日付ピッカー - iOS/Androidネイティブの日付選択UI
import DatePicker from 'react-native-date-picker'
// 国際化マクロとフック - 翻訳とローカライズ
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// デザインシステム - スタイリングとテーマ
import {atoms as a, useTheme} from '#/alf'
// ボタンコンポーネント - ダイアログの「完了」ボタン用
import {Button, ButtonText} from '#/components/Button'
// ダイアログコンポーネント - モーダル/ボトムシート表示
import * as Dialog from '#/components/Dialog'
// 日付フィールド型定義 - プロパティ型
import {type DateFieldProps} from '#/components/forms/DateField/types'
// 日付変換ユーティリティ - YYYY-MM-DD形式への変換
import {toSimpleDateString} from '#/components/forms/DateField/utils'
// テキストフィールドコンポーネント - ラベル表示用
import * as TextField from '#/components/forms/TextField'
// 共通ボタンコンポーネント - 日付選択トリガーボタン
import {DateFieldButton} from './index.shared'

// ユーティリティ関数を再エクスポート - 外部から利用可能に
export * as utils from '#/components/forms/DateField/utils'
// ラベルテキストコンポーネントを再エクスポート - 統一されたラベル表示
export const LabelText = TextField.LabelText

/**
 * DateField - iOS用日付入力コンポーネント
 *
 * 日付のみの入力フィールドです。YYYY-MM-DD形式の文字列またはDateオブジェクトを
 * 受け入れ、YYYY-MM-DD形式の文字列を返します。
 *
 * 【Go開発者向けメモ】
 * - useCallback: 関数のメモ化（依存配列が変わらない限り同じ関数インスタンスを再利用）
 * - useImperativeHandle: 親コンポーネントに公開するメソッドをカスタマイズ
 * - ref: 親から子コンポーネントのメソッドを呼び出す仕組み（Goにはない概念）
 *
 * @param value - 現在の日付値（YYYY-MM-DD文字列またはDateオブジェクト）
 * @param inputRef - 親コンポーネントからの参照（focus/blurメソッドを公開）
 * @param onChangeDate - 日付変更時のコールバック（YYYY-MM-DD文字列を受け取る）
 * @param testID - テスト用ID
 * @param label - フィールドのラベル
 * @param isInvalid - バリデーションエラー状態
 * @param accessibilityHint - アクセシビリティヒント
 * @param maximumDate - 選択可能な最大日付
 *
 * @example
 * <DateField
 *   value="2024-01-15"
 *   onChangeDate={(date) => console.log(date)}
 *   label="生年月日"
 * />
 */
export function DateField({
  value,
  inputRef,
  onChangeDate,
  testID,
  label,
  isInvalid,
  accessibilityHint,
  maximumDate,
}: DateFieldProps) {
  // 国際化インスタンス取得 - 翻訳とローカライズ
  const {_, i18n} = useLingui()
  // テーマ取得 - ダークモード対応
  const t = useTheme()
  // ダイアログ制御フック - ダイアログの開閉を管理
  // Go開発者メモ: useDialogControl()はカスタムフックで、open/close関数を提供
  const control = Dialog.useDialogControl()

  /**
   * 内部日付変更ハンドラー
   *
   * DatePickerから受け取ったDateオブジェクトをYYYY-MM-DD形式の文字列に
   * 変換してから、親コンポーネントのコールバックを呼び出します。
   *
   * Go開発者メモ:
   * - useCallbackは関数をメモ化（依存配列が変わらない限り再生成しない）
   * - [onChangeDate]は依存配列（Goにはない概念、パフォーマンス最適化のため）
   */
  const onChangeInternal = useCallback(
    (date: Date | undefined) => {
      // 日付が選択されている場合のみ処理
      if (date) {
        // DateオブジェクトをYYYY-MM-DD形式の文字列に変換
        const formatted = toSimpleDateString(date)
        // 親コンポーネントのコールバックを呼び出し
        onChangeDate(formatted)
      }
    },
    [onChangeDate],  // onChangeDateが変わった時のみ関数を再生成
  )

  /**
   * refハンドルの設定
   *
   * 親コンポーネントが ref.current.focus() や ref.current.blur() を
   * 呼び出せるように、カスタムメソッドを公開します。
   *
   * Go開発者メモ:
   * - useImperativeHandleはRefの動作をカスタマイズするフック
   * - 親コンポーネントから子の特定のメソッドだけを呼び出せるようにする
   * - Goにはない概念（Reactのrefシステム特有）
   */
  useImperativeHandle(
    inputRef,  // 親から渡されたref
    // 公開するメソッドを定義
    () => ({
      // フォーカス時: キーボードを閉じてダイアログを開く
      focus: () => {
        Keyboard.dismiss()  // iOS: ソフトウェアキーボードを非表示
        control.open()      // ダイアログを開く
      },
      // ブラー時: ダイアログを閉じる
      blur: () => {
        control.close()     // ダイアログを閉じる
      },
    }),
    [control],  // controlが変わった時のみ再生成
  )

  return (
    // フラグメント - 複数の要素をグループ化（DOMノードを追加しない）
    // Go開発者メモ: <></>は React.Fragment の短縮記法
    <>
      {/* 日付選択トリガーボタン - タップでダイアログを開く */}
      <DateFieldButton
        label={label}
        value={value}
        // ボタンプレス時のハンドラー - キーボードを閉じてダイアログを開く
        onPress={() => {
          Keyboard.dismiss()  // ソフトウェアキーボードを非表示
          control.open()      // ダイアログを開く
        }}
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />

      {/* ダイアログコンテナ - ボトムシート形式で日付ピッカーを表示 */}
      <Dialog.Outer
        control={control}  // ダイアログの開閉制御
        testID={testID}
        // iOS固有オプション: ダイアログの拡張を防止（日付ピッカーの高さを固定）
        nativeOptions={{preventExpansion: true}}>

        {/* ダイアログハンドル - スワイプで閉じるための視覚的インジケーター */}
        <Dialog.Handle />

        {/* スクロール可能なダイアログ内容 */}
        <Dialog.ScrollableInner label={label}>
          <View style={a.gap_lg}>  {/* 大きいギャップで子要素を配置 */}

            {/* 日付ピッカーコンテナ - 中央揃え */}
            <View style={[a.relative, a.w_full, a.align_center]}>
              {/*
                DatePicker - react-native-date-pickerのコンポーネント
                iOSネイティブの日付選択UIを表示
              */}
              <DatePicker
                // タイムゾーンオフセット0 = UTC（協定世界時）として扱う
                // ローカルタイムゾーンの影響を排除し、日付のみを扱う
                timeZoneOffsetInMinutes={0}
                // テーマ適用 - ライト/ダークモード
                theme={t.scheme}
                // 現在の日付値をDateオブジェクトに変換して設定
                // Go開発者メモ: new Dateはコンストラクタ呼び出し
                date={new Date(toSimpleDateString(value))}
                // 日付変更時のコールバック
                onDateChange={onChangeInternal}
                // モード指定 - 日付のみ（時刻は含まない）
                mode="date"
                // ロケール設定 - ユーザーの言語に応じた表示
                locale={i18n.locale}
                // テスト用ID
                testID={`${testID}-datepicker`}
                // アクセシビリティ属性
                aria-label={label}
                accessibilityLabel={label}
                accessibilityHint={accessibilityHint}
                // 最大選択可能日付 - 未来の日付を制限する場合に使用
                // Go開発者メモ: 三項演算子で条件分岐
                maximumDate={
                  maximumDate
                    ? new Date(toSimpleDateString(maximumDate))
                    : undefined
                }
              />
            </View>

            {/* 「完了」ボタン - ダイアログを閉じる */}
            <Button
              label={_(msg`Done`)}  // 翻訳された「完了」ラベル
              onPress={() => control.close()}  // ダイアログを閉じる
              size="large"
              color="primary"
              variant="solid">
              <ButtonText>
                {/* Trans: 翻訳コンポーネント（ビルド時に翻訳文字列に置換） */}
                <Trans>Done</Trans>
              </ButtonText>
            </Button>
          </View>
        </Dialog.ScrollableInner>
      </Dialog.Outer>
    </>
  )
}
