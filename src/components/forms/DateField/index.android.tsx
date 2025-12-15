/**
 * 日付フィールドコンポーネント（Android実装）
 *
 * 【概要】
 * Android専用の日付入力コンポーネントです。モーダル形式の日付ピッカーを
 * 表示し、ユーザーが日付を選択できるようにします。
 *
 * 【主な機能】
 * - YYYY-MM-DD形式の日付文字列の入力・出力
 * - Dateオブジェクトから文字列への自動変換
 * - モーダル形式の日付ピッカー表示
 * - ref経由でのフォーカス制御
 *
 * 【プラットフォーム差異】
 * - iOS: ダイアログ内にインライン日付ピッカーを表示
 * - Android: モーダルウィンドウとして日付ピッカーを表示
 * - Web: HTML5の<input type="date">を使用
 *
 * @module DateField/Android - Android専用日付フィールド実装
 */

// Reactフック - コールバックメモ化、ref制御、状態管理
import {useCallback, useImperativeHandle, useState} from 'react'
// React Nativeコアコンポーネント - キーボード制御
import {Keyboard} from 'react-native'
// サードパーティ日付ピッカー - Androidネイティブの日付選択UI
import DatePicker from 'react-native-date-picker'
// 国際化フック - ローカライズ
import {useLingui} from '@lingui/react'

// デザインシステム - テーマ管理
import {useTheme} from '#/alf'
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
 * DateField - Android用日付入力コンポーネント
 *
 * モーダル形式の日付ピッカーを使用した日付入力フィールドです。
 * ボタンをタップするとモーダルが開き、日付を選択できます。
 *
 * 【Go開発者向けメモ】
 * - useState: 状態管理フック（open状態を管理）
 * - useCallback: 関数のメモ化（パフォーマンス最適化）
 * - useImperativeHandle: refで公開するメソッドをカスタマイズ
 *
 * @param value - 現在の日付値（YYYY-MM-DD文字列またはDateオブジェクト）
 * @param inputRef - 親コンポーネントからの参照（focus/blurメソッドを公開）
 * @param onChangeDate - 日付変更時のコールバック（YYYY-MM-DD文字列を受け取る）
 * @param label - フィールドのラベル
 * @param isInvalid - バリデーションエラー状態
 * @param testID - テスト用ID
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
  label,
  isInvalid,
  testID,
  accessibilityHint,
  maximumDate,
}: DateFieldProps) {
  // 国際化インスタンス取得 - ロケール設定用
  const {i18n} = useLingui()
  // テーマ取得 - ライト/ダークモード対応
  const t = useTheme()
  // モーダルの開閉状態管理
  // Go開発者メモ: useState<boolean>(false)は初期値falseのbool状態を作成
  const [open, setOpen] = useState(false)

  /**
   * 内部日付変更ハンドラー
   *
   * DatePickerから受け取ったDateオブジェクトをYYYY-MM-DD形式の文字列に
   * 変換し、モーダルを閉じてから親コンポーネントのコールバックを呼び出します。
   *
   * Go開発者メモ:
   * - useCallbackで関数をメモ化（依存配列が変わらない限り再生成しない）
   * - [onChangeDate, setOpen]は依存配列（これらが変わった時のみ関数を再生成）
   */
  const onChangeInternal = useCallback(
    (date: Date) => {
      // モーダルを閉じる
      setOpen(false)

      // DateオブジェクトをYYYY-MM-DD形式の文字列に変換
      const formatted = toSimpleDateString(date)
      // 親コンポーネントのコールバックを呼び出し
      onChangeDate(formatted)
    },
    [onChangeDate, setOpen],  // これらが変わった時のみ関数を再生成
  )

  /**
   * refハンドルの設定
   *
   * 親コンポーネントが ref.current.focus() や ref.current.blur() を
   * 呼び出せるように、カスタムメソッドを公開します。
   *
   * Go開発者メモ:
   * - useImperativeHandleはRefの動作をカスタマイズするフック
   * - 空の依存配列[]は初回のみ実行（関数が変わらないため）
   */
  useImperativeHandle(
    inputRef,  // 親から渡されたref
    // 公開するメソッドを定義
    () => ({
      // フォーカス時: キーボードを閉じてモーダルを開く
      focus: () => {
        Keyboard.dismiss()  // Android: ソフトウェアキーボードを非表示
        setOpen(true)       // モーダルを開く
      },
      // ブラー時: モーダルを閉じる
      blur: () => {
        setOpen(false)      // モーダルを閉じる
      },
    }),
    [],  // 依存なし（関数は常に同じ）
  )

  /**
   * ボタンプレスハンドラー
   *
   * 日付選択ボタンがタップされた時にモーダルを開きます。
   *
   * Go開発者メモ: useCallbackでメモ化（再レンダリング時の不要な関数再生成を防止）
   */
  const onPress = useCallback(() => {
    setOpen(true)  // モーダルを開く
  }, [])

  /**
   * キャンセルハンドラー
   *
   * ユーザーがキャンセルボタンを押した時にモーダルを閉じます。
   *
   * Go開発者メモ: useCallbackでメモ化
   */
  const onCancel = useCallback(() => {
    setOpen(false)  // モーダルを閉じる
  }, [])

  return (
    // フラグメント - 複数の要素をグループ化
    // Go開発者メモ: <></>は React.Fragment の短縮記法
    <>
      {/* 日付選択トリガーボタン - タップでモーダルを開く */}
      <DateFieldButton
        label={label}
        value={value}
        onPress={onPress}  // ボタンプレス時にモーダルを開く
        isInvalid={isInvalid}
        accessibilityHint={accessibilityHint}
      />

      {/*
        条件付きレンダリング - openがtrueの時のみDatePickerを表示
        Go開発者メモ: open && <Component>は条件分岐の短縮記法
        （openがtrueの時のみ右側を評価・レンダリング）
      */}
      {open && (
        /*
          DatePicker - react-native-date-pickerのモーダルコンポーネント

          【注意事項】
          Android実装のDatePickerは現在、テーマに応じたデフォルトボタン色の
          変更に対応しておらず、16進数カラーコードのみを受け付けます。

          以下のPRがマージされたら、buttonColorの設定を削除できる可能性があります:
          https://github.com/henninghall/react-native-date-picker/pull/871
        */
        <DatePicker
          modal  // モーダル形式で表示
          open   // 開いた状態で表示（openプロパティをtrueに設定）
          // タイムゾーンオフセット0 = UTC（協定世界時）として扱う
          timeZoneOffsetInMinutes={0}
          // テーマ適用 - ライト/ダークモード
          theme={t.scheme}
          // ボタン色設定 - テーマに応じた色を16進数で指定
          // @ts-ignore TODO: 型定義が不完全なため無視
          // Go開発者メモ: 三項演算子でライト/ダークモードに応じた色を設定
          buttonColor={t.name === 'light' ? '#000000' : '#ffffff'}
          // 現在の日付値をDateオブジェクトに変換
          date={new Date(value)}
          // 日付確定時のコールバック
          onConfirm={onChangeInternal}
          // キャンセル時のコールバック
          onCancel={onCancel}
          // モード指定 - 日付のみ（時刻は含まない）
          mode="date"
          // ロケール設定 - ユーザーの言語に応じた表示
          locale={i18n.locale}
          // 24時間制の設定ソース - ロケールに従う
          is24hourSource="locale"
          // テスト用ID
          testID={`${testID}-datepicker`}
          // アクセシビリティ属性
          aria-label={label}
          accessibilityLabel={label}
          accessibilityHint={accessibilityHint}
          // 最大選択可能日付 - 未来の日付を制限する場合に使用
          // Go開発者メモ: 三項演算子で条件分岐
          maximumDate={
            maximumDate ? new Date(toSimpleDateString(maximumDate)) : undefined
          }
        />
      )}
    </>
  )
}
