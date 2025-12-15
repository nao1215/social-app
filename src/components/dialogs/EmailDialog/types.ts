/**
 * メールダイアログの型定義モジュール
 *
 * このモジュールは、メール設定・確認ダイアログで使用される型定義を提供します。
 * ダイアログには複数の画面（更新、確認、リマインダー、2FA管理）があり、
 * それぞれの画面固有のプロパティを持つユニオン型で表現されています。
 *
 * 【Goユーザー向け補足】
 * - type: TypeScriptの型エイリアス（Goのtype宣言に相当）
 * - enum: 列挙型（Goのconst iota パターンに似ている）
 * - union type (|): 複数の型のうちいずれかを表す型（Goのinterface{}とtype switchに似ている）
 */

// ReactNodeをインポート（JSX要素、文字列、数値など、レンダリング可能な値の型）
import {type ReactNode} from 'react'

// ダイアログ制御のprops型をインポート
import {type DialogControlProps} from '#/components/Dialog'

/**
 * メールダイアログのprops型
 *
 * 【Goユーザー向け補足】
 * - この型はGoの構造体フィールドに相当
 */
export type EmailDialogProps = {
  control: DialogControlProps // ダイアログの開閉制御オブジェクト
}

/**
 * メールダイアログ内部コンポーネントのprops型
 *
 * 現在はEmailDialogPropsと同じだが、将来の拡張のために分離
 *
 * 【Goユーザー向け補足】
 * - & 演算子: 型の交差（intersection）。両方の型のプロパティを持つ
 * - {} は空のオブジェクト型。将来追加プロパティを定義できる
 */
export type EmailDialogInnerProps = EmailDialogProps & {}

/**
 * メールダイアログ画面の構成定義（ユニオン型）
 *
 * 各画面は id プロパティで識別され、画面固有の追加プロパティを持ちます。
 * この型は Tagged Union パターンを使用しています。
 *
 * 【Goユーザー向け補足】
 * - | 演算子: ユニオン型（いずれかの型）。Goのinterface{}とtype switchに似ている
 * - Tagged Union: 識別子フィールド（id）で型を判別するパターン
 * - ?: オプショナルプロパティ（値が存在しない可能性）
 */
export type Screen =
  | {
      // メールアドレス更新画面
      id: ScreenID.Update
    }
  | {
      // メール確認画面
      id: ScreenID.Verify
      instructions?: ReactNode[] // 確認手順の説明（オプショナル）
      onVerify?: () => void // 確認完了時のコールバック（オプショナル）
      onCloseWithoutVerifying?: () => void // 確認せずに閉じた時のコールバック（オプショナル）
    }
  | {
      // 確認リマインダー画面
      id: ScreenID.VerificationReminder
    }
  | {
      // 2要素認証管理画面
      id: ScreenID.Manage2FA
    }

/**
 * 画面識別子の列挙型
 *
 * 各画面を識別するための定数を定義します。
 * 文字列列挙型を使用して、デバッグ時に値が読みやすくなっています。
 *
 * 【Goユーザー向け補足】
 * - enum: 列挙型。Goのconst ( ... iota )パターンに似ている
 * - 文字列列挙型: 各値に文字列を割り当てる（数値列挙型もある）
 */
export enum ScreenID {
  Update = 'Update', // メールアドレス更新
  Verify = 'Verify', // メール確認
  VerificationReminder = 'VerificationReminder', // 確認リマインダー
  Manage2FA = 'Manage2FA', // 2要素認証管理
}

/**
 * 画面コンポーネントのprops型（ジェネリック）
 *
 * 各画面コンポーネントが受け取るpropsを定義します。
 * ジェネリック型 T により、特定の画面IDに対応する設定型を抽出します。
 *
 * @template T - 画面ID（ScreenIDの値）
 *
 * 【Goユーザー向け補足】
 * - <T extends ScreenID>: ジェネリック型パラメータ（Goの型パラメータに相当）
 * - Extract<A, B>: TypeScriptの組み込みユーティリティ型。条件に一致する型のみ抽出
 * - 例: Extract<Screen, {id: ScreenID.Verify}> は Verify画面の型のみを抽出
 */
export type ScreenProps<T extends ScreenID> = {
  config: Extract<Screen, {id: T}> // 指定されたIDの画面設定（型安全に抽出）
  showScreen: (screen: Screen) => void // 別の画面を表示する関数
}
