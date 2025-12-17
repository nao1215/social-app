/**
 * カラースキームスタイル選択フック
 *
 * 【概要】
 * 現在のテーマ（ライト/ダーク）に応じてスタイルを選択。
 * ダークモード対応の簡潔な実装パターン。
 *
 * 【使用例】
 * const textColor = useColorSchemeStyle('#000', '#fff')
 * const containerStyle = useColorSchemeStyle(
 *   {backgroundColor: 'white'},
 *   {backgroundColor: 'black'}
 * )
 *
 * 【注意点】
 * - 両方のスタイルを事前に定義する必要がある
 * - より複雑なテーマ対応にはAlfデザインシステムを使用
 *
 * 【Goユーザー向け補足】
 * - ジェネリクス<T>: Goのジェネリクスと同様の型パラメータ
 * - 三項演算子: Goのif-elseに相当
 */
import {useTheme} from '#/lib/ThemeContext'

/**
 * テーマに応じてスタイルを選択するフック
 *
 * @param lightStyle ライトモード時のスタイル
 * @param darkStyle ダークモード時のスタイル
 * @returns 現在のテーマに対応するスタイル
 */
export function useColorSchemeStyle<T>(lightStyle: T, darkStyle: T) {
  const colorScheme = useTheme().colorScheme
  return colorScheme === 'dark' ? darkStyle : lightStyle
}
