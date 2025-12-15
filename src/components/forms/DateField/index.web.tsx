/**
 * 日付フィールドコンポーネント（Web実装）
 *
 * 【概要】
 * Web専用の日付入力コンポーネントです。HTML5の<input type="date">を
 * 利用して、ブラウザネイティブの日付ピッカーを表示します。
 *
 * 【主な機能】
 * - HTML5ネイティブの日付入力フィールド
 * - YYYY-MM-DD形式の日付文字列の入力・出力
 * - TextFieldコンポーネントとの見た目の統一
 * - カレンダーアイコンによる視覚的識別
 *
 * 【技術的詳細】
 * - react-native-webのunstable_createElementを使用して<input type="date">を作成
 * - TextInputをラップして、React Nativeコンポーネントとして使用可能に
 *
 * @module DateField/Web - Web専用日付フィールド実装
 */

// Reactコアライブラリ - コンポーネント作成
import React from 'react'
// React Nativeコンポーネント - スタイル管理、テキスト入力型定義
import {StyleSheet, TextInput, TextInputProps} from 'react-native'
// React Native Web内部API - DOM要素作成（unstableだが広く使われている）
// @ts-expect-error untyped
import {unstable_createElement} from 'react-native-web'

// 日付フィールド型定義 - プロパティ型
import {DateFieldProps} from '#/components/forms/DateField/types'
// 日付変換ユーティリティ - YYYY-MM-DD形式への変換
import {toSimpleDateString} from '#/components/forms/DateField/utils'
// テキストフィールドコンポーネント群 - 統一されたUI
import * as TextField from '#/components/forms/TextField'
// カレンダーアイコン - 日付フィールドの視覚的識別用
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'

// ユーティリティ関数を再エクスポート - 外部から利用可能に
export * as utils from '#/components/forms/DateField/utils'
// ラベルテキストコンポーネントを再エクスポート - 統一されたラベル表示
export const LabelText = TextField.LabelText

/**
 * InputBase - HTML5の<input type="date">をReact Nativeコンポーネントとしてラップ
 *
 * react-native-webの内部APIを使用して、HTMLのinput要素を作成し、
 * React NativeのTextInputと同じインターフェースで使用できるようにします。
 *
 * 【Go開発者向けメモ】
 * - React.forwardRef: 親コンポーネントからrefを受け取るための仕組み
 * - <HTMLInputElement>: ジェネリクス型パラメータ（Goの[T any]に相当）
 * - {...props}: スプレッド演算子でプロパティを展開
 *
 * @param style - スタイルオブジェクト
 * @param props - その他のプロパティ
 * @param ref - DOM要素への参照
 */
const InputBase = React.forwardRef<HTMLInputElement, TextInputProps>(
  ({style, ...props}, ref) => {
    // unstable_createElementでHTML要素を作成
    // Go開発者メモ: これはReact Native Webの低レベルAPIで、DOMを直接操作
    return unstable_createElement('input', {
      ...props,  // すべてのpropsを展開してinput要素に渡す
      ref,       // DOM参照を設定
      type: 'date',  // HTML5の日付入力タイプを指定
      // スタイルを平坦化して、カスタムスタイルを追加
      style: [
        StyleSheet.flatten(style),  // 配列形式のスタイルを単一オブジェクトに変換
        {
          background: 'transparent',  // 背景を透明に（親のスタイルを継承）
          border: 0,                 // ボーダーを削除（TextFieldのボーダーを使用）
        },
      ],
    })
  },
)

// displayNameを設定 - Reactデバッグツールでコンポーネント名を表示
InputBase.displayName = 'InputBase'

/**
 * Input - TextFieldのcreateInput関数でInputBaseをラップ
 *
 * TextFieldコンポーネントの標準的なスタイルと動作を適用します。
 *
 * Go開発者メモ:
 * - as unknown as typeof TextInput: 型アサーション（型の強制変換）
 * - TextFieldのスタイルシステムと統合するための型変換
 */
const Input = TextField.createInput(InputBase as unknown as typeof TextInput)

/**
 * DateField - Web用日付入力コンポーネント
 *
 * HTML5の<input type="date">を使用した日付入力フィールドです。
 * TextFieldコンポーネントと統一されたUIを提供し、ブラウザネイティブの
 * 日付ピッカーを利用します。
 *
 * 【Go開発者向けメモ】
 * - React.useCallback: 関数をメモ化してパフォーマンス最適化
 * - e.target: イベントオブジェクトからDOM要素にアクセス
 * - valueAsDate: HTML5 input[type=date]の特殊プロパティ（Dateオブジェクトを返す）
 *
 * @param value - 現在の日付値（YYYY-MM-DD文字列またはDateオブジェクト）
 * @param inputRef - 親コンポーネントからの参照
 * @param onChangeDate - 日付変更時のコールバック
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
  /**
   * 日付変更ハンドラー
   *
   * input要素のonChangeイベントから日付を取得し、YYYY-MM-DD形式の
   * 文字列に変換して親コンポーネントのコールバックを呼び出します。
   *
   * Go開発者メモ:
   * - useCallbackで関数をメモ化（依存配列が変わらない限り再生成しない）
   * - e: anyはイベントオブジェクト（型定義が不完全なため）
   */
  const handleOnChange = React.useCallback(
    (e: any) => {
      // valueAsDateまたはvalueから日付を取得
      // valueAsDateはDateオブジェクト、valueは文字列
      const date = e.target.valueAsDate || e.target.value

      // 日付が選択されている場合のみ処理
      if (date) {
        // YYYY-MM-DD形式の文字列に変換
        const formatted = toSimpleDateString(date)
        // 親コンポーネントのコールバックを呼び出し
        onChangeDate(formatted)
      }
    },
    [onChangeDate],  // onChangeDateが変わった時のみ関数を再生成
  )

  return (
    // TextFieldルートコンポーネント - バリデーション状態を管理
    <TextField.Root isInvalid={isInvalid}>
      {/* カレンダーアイコン - 日付フィールドであることを視覚的に示す */}
      <TextField.Icon icon={CalendarDays} />

      {/* 日付入力フィールド */}
      <Input
        // 現在の値をYYYY-MM-DD形式の文字列に変換
        value={toSimpleDateString(value)}
        // 親から渡された参照を設定
        // Go開発者メモ: as型アサーションで型を変換
        inputRef={inputRef as React.Ref<TextInput>}
        // ラベル設定
        label={label}
        // 変更ハンドラー設定
        onChange={handleOnChange}
        // テスト用ID
        testID={testID}
        // アクセシビリティヒント
        accessibilityHint={accessibilityHint}
        // 最大日付設定
        // @ts-expect-error not typed as <input type="date"> even though it is one
        // Go開発者メモ: maxはHTMLのinput[type=date]の属性だが型定義にない
        max={maximumDate ? toSimpleDateString(maximumDate) : undefined}
      />
    </TextField.Root>
  )
}
