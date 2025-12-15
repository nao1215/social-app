/**
 * 双方向テキスト（Bidirectional Text）制御モジュール
 * Bidirectional text control module
 *
 * 【主な機能】
 * - アラビア語やヘブライ語などRTL（右から左）言語とLTR（左から右）言語の混在テキストを制御
 * - Unicode双方向アルゴリズムの制御文字を使用して、強制的にLTR表示を実現
 *
 * Key features:
 * - Controls mixed text of RTL (right-to-left) languages like Arabic/Hebrew and LTR (left-to-right) languages
 * - Uses Unicode bidirectional algorithm control characters to force LTR display
 *
 * 【使用場面】
 * - ユーザー名やハンドル名の表示（RTL文字が含まれる場合も一貫したLTR表示）
 * - UIラベルやボタンテキストでの混在言語表示
 *
 * Use cases:
 * - Displaying usernames and handles (consistent LTR display even with RTL characters)
 * - Mixed language display in UI labels and button text
 *
 * 参考：Unicode双方向テキスト制御
 * Reference: Unicode Bidirectional Text Control
 * https://www.unicode.org/reports/tr9/#Directional_Formatting_Characters
 */

/**
 * Unicode制御文字：左から右への埋め込み（Left-to-Right Embedding）
 * この文字以降のテキストを強制的にLTR方向で処理
 *
 * Unicode control character: Left-to-Right Embedding
 * Forces text after this character to be processed in LTR direction
 *
 * 【Goユーザー向け補足】
 * - \u202A は Unicode コードポイント U+202A の文字リテラル（Goでも同じ記法）
 * - 不可視文字（画面には表示されないがテキスト方向を制御）
 */
const LEFT_TO_RIGHT_EMBEDDING = '\u202A'

/**
 * Unicode制御文字：方向フォーマットのポップ（Pop Directional Formatting）
 * 最後の方向埋め込みを終了し、元の方向に戻す
 *
 * Unicode control character: Pop Directional Formatting
 * Ends the last directional embedding and returns to original direction
 */
const POP_DIRECTIONAL_FORMATTING = '\u202C'

/**
 * 文字列を強制的にLTR（左から右）方向で表示する関数
 * Function to force display string in LTR (left-to-right) direction
 *
 * テキストをLTR埋め込み文字とポップ文字で囲むことで、
 * RTL文字が含まれていても全体をLTR方向で表示します。
 *
 * By surrounding text with LTR embedding and pop characters,
 * displays entire text in LTR direction even if RTL characters are included.
 *
 * 【処理の流れ】
 * 1. 文字列の先頭にLTR埋め込み文字を追加
 * 2. 文字列の末尾にポップ文字を追加
 * 3. これにより文字列全体がLTR方向で処理される
 *
 * 【使用例】
 * forceLTR('Hello مرحبا World')
 * → '\u202AHello مرحبا World\u202C'
 * → 画面上では「Hello مرحبا World」がLTR方向で表示
 *
 * 【Goユーザー向け補足】
 * - 文字列連結は + 演算子（Goと同じ）
 * - Goでも同じロジックで実装可能: `"\u202A" + str + "\u202C"`
 *
 * @param str 制御対象の文字列 / String to be controlled
 * @returns LTR方向に制御された文字列 / String controlled in LTR direction
 */
export function forceLTR(str: string) {
  return LEFT_TO_RIGHT_EMBEDDING + str + POP_DIRECTIONAL_FORMATTING
}
