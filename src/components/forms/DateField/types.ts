/**
 * 日付フィールド型定義
 *
 * 【概要】
 * 日付入力コンポーネントで使用される型定義を提供します。
 * 日付の選択、バリデーション、アクセシビリティ対応に必要な
 * プロパティとメソッドを定義しています。
 *
 * 【Go開発者向けメモ】
 * - type: TypeScriptの型エイリアス（Goのtype定義に相当）
 * - interface: Goのstructやinterfaceに相当する型定義
 * - Reactコンポーネントへの参照や関数型を定義
 *
 * @module DateField/types - 日付フィールドの型定義モジュール
 */

/**
 * DateFieldRef - 日付フィールドへの参照型
 *
 * 親コンポーネントから日付フィールドを制御するためのメソッドを定義します。
 * Reactのref（参照）を通じて、フォーカスやブラー操作を可能にします。
 *
 * 【Go開発者向けメモ】
 * - Goのinterfaceに相当する型定義
 * - void: 戻り値なし（Goの空の戻り値に相当）
 * - () => void: 引数なし・戻り値なしの関数型（Goの func()）
 *
 * @example
 * const ref = useRef<DateFieldRef>(null)
 * ref.current?.focus() // フォーカスを設定
 */
export type DateFieldRef = {
  /** フィールドにフォーカスを設定するメソッド */
  focus: () => void
  /** フィールドからフォーカスを外すメソッド */
  blur: () => void
}

/**
 * DateFieldProps - 日付フィールドコンポーネントのプロパティ型
 *
 * 日付入力コンポーネントに渡す設定値を定義します。
 * 日付の値、変更ハンドラー、ラベル、バリデーション状態などを含みます。
 *
 * 【Go開発者向けメモ】
 * - Goのstructに相当する型定義
 * - ?: オプショナルフィールド（Goのポインタやomitempty相当）
 * - string | Date: Union型（文字列またはDate型を受け入れる）
 * - (date: string) => void: コールバック関数型（Goの func(date string)）
 * - React.Ref<T>: Reactの参照型（親から子コンポーネントにアクセスする仕組み）
 *
 * @example
 * <DateField
 *   value="2024-01-15"
 *   onChangeDate={(date) => console.log(date)}
 *   label="生年月日"
 * />
 */
export type DateFieldProps = {
  /** 現在の日付値（YYYY-MM-DD形式の文字列またはDateオブジェクト） */
  value: string | Date
  /** 日付変更時のコールバック関数（YYYY-MM-DD形式の文字列を受け取る） */
  onChangeDate: (date: string) => void
  /** フィールドのラベル（アクセシビリティにも使用） */
  label: string
  /** 日付フィールドへの参照（親コンポーネントから制御するため） */
  inputRef?: React.Ref<DateFieldRef>
  /** バリデーションエラー状態（trueの場合エラー表示） */
  isInvalid?: boolean
  /** テスト用のID（自動テストで要素を特定するため） */
  testID?: string
  /** アクセシビリティヒント（スクリーンリーダーに読み上げられる補足説明） */
  accessibilityHint?: string
  /** 選択可能な最大日付（これ以降の日付は選択不可） */
  maximumDate?: string | Date
}
