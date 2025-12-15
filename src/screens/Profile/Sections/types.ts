/**
 * プロフィールセクションの型定義
 *
 * 【Go開発者向け説明】
 * このファイルはTypeScriptの型定義のみを含みます（Goの型定義に相当）。
 * interfaceはGoのstructに相当し、コンパイル時の型チェックに使用されます。
 *
 * 【モジュールの役割】
 * プロフィール画面のセクション（タブ）コンポーネントで使用される
 * 共通インターフェースを定義します。
 * - Reactの参照（ref）を通じたスクロール制御
 * - プロフィールタブ（投稿、返信、メディアなど）間の統一API
 *
 * 【使用例】
 * プロフィール画面のタブコンポーネントは、このSectionRefインターフェースを
 * 実装することで、親コンポーネントからスクロール制御を受けられます。
 *
 * 【Goとの対応】
 * ```go
 * // Goでの同等の定義
 * type SectionRef interface {
 *     ScrollToTop()
 * }
 * ```
 */

/**
 * プロフィールセクションの参照インターフェース
 *
 * 【Go開発者向け説明】
 * - TypeScriptのinterfaceはGoのinterfaceと同様に、構造的型付けを提供します
 * - ただし、Goと異なり明示的な実装宣言は不要（Duck Typing）
 * - このオブジェクトを持つコンポーネントは、親からスクロール操作を受けられます
 *
 * 【Reactのrefパターン】
 * Reactでは、親コンポーネントが子コンポーネントの関数を直接呼び出すために
 * refという仕組みを使います。これはGoの関数ポインタに似ていますが、
 * Reactのライフサイクルに統合されています。
 *
 * 【使用例】
 * ```typescript
 * const sectionRef = useRef<SectionRef>(null)
 * // 親コンポーネントからスクロール実行
 * sectionRef.current?.scrollToTop()
 * ```
 */
export interface SectionRef {
  /**
   * セクションの最上部にスクロールする関数
   *
   * 【Go開発者向け説明】
   * - この関数はGoのメソッドに相当します
   * - 戻り値なし（void型はGoのfunc()に相当）
   * - プロフィールタブの切り替え時や、ユーザーがタブバーをタップした際に呼び出されます
   *
   * 【実装パターン】
   * 各セクションコンポーネント（Feed、Replies、Mediaなど）は、
   * React.forwardRefとuseImperativeHandleを使ってこの関数を公開します。
   */
  scrollToTop: () => void
}
