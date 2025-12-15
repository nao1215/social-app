/**
 * @fileoverview ポータルグループ作成モジュール
 *
 * React Portalパターンを実装し、ツリー外の別の場所にコンポーネントを描画する機能を提供。
 * モーダル、トーストメッセージ、ツールチップなど、DOM階層を超えてレンダリングする必要がある
 * UI要素に使用される。Context APIを活用して親子間でポータル情報を共有。
 *
 * [Goユーザー向け補足]
 * - createContext: Goのcontext.Contextに類似。コンポーネントツリー全体で値を共有
 * - useCallback: メモ化された関数を返すReactフック。再レンダリング時の不要な関数再生成を防ぐ
 * - useEffect: コンポーネントのライフサイクル（マウント/アンマウント）で副作用を実行するフック
 * - useId: 一意のIDを生成するフック。サーバー/クライアント間で安定したIDを保証
 * - useMemo: 計算結果をメモ化するフック。依存配列が変わらない限り再計算しない
 * - useRef: 再レンダリング間で値を保持するコンテナ。Goのポインタ変数に似た役割
 * - useState: コンポーネントのローカル状態を管理するフック
 */

import {
  createContext, // コンテキスト作成用（ツリー全体で値を共有）
  Fragment, // 余分なDOMノードを追加せずに複数要素をグループ化
  useCallback, // メモ化されたコールバック関数を生成
  useContext, // コンテキストの値を読み取る
  useEffect, // 副作用（マウント/アンマウント処理）を実行
  useId, // 一意のID生成
  useMemo, // 計算結果のメモ化
  useRef, // 再レンダリング間で値を保持
  useState, // ローカル状態管理
} from 'react'

/**
 * Componentの型定義
 * [Goユーザー向け補足] type宣言はGoのtype aliasに相当
 */
type Component = React.ReactElement

/**
 * ContextTypeの型定義
 * ポータルコンテキストで共有される値とメソッドの構造
 * [Goユーザー向け補足] interfaceはGoのstructに相当。メソッドシグネチャも含む
 */
type ContextType = {
  outlet: Component | null // 現在描画中のポータルコンテンツ（null許容）
  append(id: string, component: Component): void // ポータルコンポーネントを追加
  remove(id: string): void // ポータルコンポーネントを削除
}

/**
 * ComponentMapの型定義
 * IDをキーとしてコンポーネントを管理するマップ
 * [Goユーザー向け補足] map[string]*Component に相当
 */
type ComponentMap = {
  [id: string]: Component | null
}

/**
 * ポータルグループを作成する関数
 *
 * ポータル機能を提供するProvider、Outlet、Portalの3つのコンポーネントを返す。
 * - Provider: ポータルコンテキストを提供
 * - Outlet: ポータルされたコンポーネントを描画する場所
 * - Portal: 子コンポーネントをOutletに転送
 *
 * @returns {Object} Provider, Outlet, Portalコンポーネントを含むオブジェクト
 *
 * [Goユーザー向け補足]
 * この関数はクロージャーを使用してプライベートなContextを作成する。
 * Goのファクトリーパターンに類似。
 */
export function createPortalGroup() {
  // ポータル用のコンテキストを作成（デフォルト値は空の実装）
  const Context = createContext<ContextType>({
    outlet: null,
    append: () => {}, // 何もしないデフォルト実装
    remove: () => {}, // 何もしないデフォルト実装
  })
  Context.displayName = 'PortalContext' // デバッグ用の表示名

  /**
   * Providerコンポーネント
   *
   * ポータルの状態管理を行い、子コンポーネントにコンテキストを提供する。
   * 複数のPortalコンポーネントを一元管理し、Outletで一括描画する。
   *
   * @param {React.PropsWithChildren<{}>} props - 子要素を含むprops
   * @returns {JSX.Element} コンテキストプロバイダー
   *
   * [Goユーザー向け補足]
   * useRef: 再レンダリング間で値を保持。Goで言うとポインタ変数に近い
   * useState: コンポーネントのローカル状態。変更すると再レンダリングが発生
   * useCallback: 関数をメモ化。依存配列が変わらない限り同じ関数インスタンスを返す
   */
  function Provider(props: React.PropsWithChildren<{}>) {
    // ポータルコンポーネントをIDで管理するマップ（再レンダリングで保持）
    const map = useRef<ComponentMap>({})
    // 現在描画すべきポータルコンテンツ（変更時に再レンダリング）
    const [outlet, setOutlet] = useState<ContextType['outlet']>(null)

    /**
     * ポータルコンポーネントを追加する関数
     * 既存IDの場合は何もしない（重複防止）
     */
    const append = useCallback<ContextType['append']>((id, component) => {
      if (map.current[id]) return // 既に存在する場合は早期リターン
      // Fragmentでラップしてkey属性を付与（Reactのリスト要件）
      map.current[id] = <Fragment key={id}>{component}</Fragment>
      // マップの全値を新しいFragmentにまとめて描画更新
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    /**
     * ポータルコンポーネントを削除する関数
     * マップからnullを設定し、描画を更新
     */
    const remove = useCallback<ContextType['remove']>(id => {
      map.current[id] = null // nullを設定（完全削除ではなく無効化）
      // マップの全値を再度まとめて描画更新
      setOutlet(<>{Object.values(map.current)}</>)
    }, [])

    /**
     * コンテキストに渡す値をメモ化
     * outlet, append, removeのいずれかが変わった時のみ新しいオブジェクトを生成
     *
     * [Goユーザー向け補足]
     * useMemo: 計算結果をキャッシュ。依存配列が変わらなければ再計算しない
     */
    const contextValue = useMemo(
      () => ({
        outlet,
        append,
        remove,
      }),
      [outlet, append, remove],
    )

    // コンテキストプロバイダーで子要素をラップ
    return (
      <Context.Provider value={contextValue}>{props.children}</Context.Provider>
    )
  }

  /**
   * Outletコンポーネント
   *
   * Portalでポータルされた全てのコンポーネントを描画する場所。
   * コンテキストからoutlet（描画内容）を取得して返すだけのシンプルなコンポーネント。
   *
   * @returns {Component | null} ポータルされたコンポーネント群（またはnull）
   *
   * [Goユーザー向け補足]
   * useContext: コンテキストから値を読み取るフック。Goのcontext.Valueに類似
   */
  function Outlet() {
    const ctx = useContext(Context) // コンテキストから現在の値を取得
    return ctx.outlet // 描画すべきコンテンツを返す（nullの場合もある）
  }

  /**
   * Portalコンポーネント
   *
   * 子要素をOutletの位置に転送するコンポーネント。
   * マウント時にappend、アンマウント時にremoveを呼び出す。
   * このコンポーネント自体は何も描画しない（return null）。
   *
   * @param {React.PropsWithChildren<{}>} children - ポータルする子要素
   * @returns {null} 常にnullを返す（実際の描画はOutletで行う）
   *
   * [Goユーザー向け補足]
   * useEffect: コンポーネントのライフサイクルフック
   * - 第1引数の関数: マウント時に実行
   * - 戻り値の関数: アンマウント時に実行（クリーンアップ）
   * - 第2引数の配列: 依存配列。これらが変わると再実行される
   * useId: 一意のIDを生成。サーバーサイドレンダリングでも安定
   */
  function Portal({children}: React.PropsWithChildren<{}>) {
    const {append, remove} = useContext(Context) // コンテキストから操作関数を取得
    const id = useId() // このPortalインスタンス用の一意なIDを生成

    /**
     * マウント時にポータルコンポーネントを登録、アンマウント時に削除
     * 依存配列にid, children, append, removeを指定し、これらが変わると再実行
     */
    useEffect(() => {
      append(id, children as Component) // マウント時: Outletに登録
      return () => remove(id) // アンマウント時: Outletから削除（クリーンアップ）
    }, [id, children, append, remove])

    return null // このコンポーネント自体は何も描画しない
  }

  // Provider, Outlet, Portalの3つのコンポーネントを返す
  return {Provider, Outlet, Portal}
}

/**
 * デフォルトのポータルグループを作成
 * アプリケーション全体で共有される標準のポータル実装
 */
const DefaultPortal = createPortalGroup()

/**
 * デフォルトポータルグループのコンポーネントをエクスポート
 *
 * 使用例:
 * ```tsx
 * <Provider>
 *   <div>
 *     <Portal>
 *       <Modal>モーダル内容</Modal>
 *     </Portal>
 *     <Outlet /> {/* ここにModalが描画される *\/}
 *   </div>
 * </Provider>
 * ```
 */
export const Provider = DefaultPortal.Provider
export const Outlet = DefaultPortal.Outlet
export const Portal = DefaultPortal.Portal
