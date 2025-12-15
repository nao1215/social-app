/**
 * @file 2025年8月ポリシー更新のID定義
 * @description ポリシー更新202508のユニークID
 *
 * このファイルをインポート問題を避けるため、分離して管理しています。
 * NUX（New User Experience）システムで使用される一意の識別子を提供します。
 */

// NUX定義: ユーザー体験フロー（オンボーディング、アナウンスメント等）の識別子
import {Nux} from '#/state/queries/nuxs'

/**
 * 2025年8月のポリシー更新ID
 *
 * @description
 * この更新は以下のポリシー変更を含みます:
 * - 利用規約（Terms of Service）
 * - プライバシーポリシー（Privacy Policy）
 * - 著作権ポリシー（Copyright Policy）
 * - コミュニティガイドライン（Community Guidelines）
 *
 * @constant
 * @type {string}
 */
export const ID = Nux.PolicyUpdate202508
