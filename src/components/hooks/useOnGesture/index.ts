/**
 * グローバルジェスチャーイベント監視カスタムフック（React Native版）
 *
 * このモジュールは、アプリケーション全体でのジェスチャー（タップ、スワイプ等）開始を検知します。
 *
 * 【概要】
 * - グローバルなジェスチャーイベントシステムへの接続
 * - ユーザーの操作開始を検知してコールバックを実行
 * - モーダルやドロップダウンの外側クリック検知などに使用
 *
 * 【使用場面】
 * - モーダル外をタップした時にモーダルを閉じる
 * - ドロップダウンメニューの外側をタップした時にメニューを閉じる
 * - キーボードが開いている時に画面をタップしたらキーボードを閉じる
 *
 * 【Go開発者向け補足 - useEffect】
 * - 副作用（イベントリスナーの登録/解除）を管理するフック
 * - コンポーネントのマウント時にイベントを登録、アンマウント時に解除
 * - Goのdefer文に似ているが、依存配列による制御が可能
 */

// React - useEffectフックを使用
import {useEffect} from 'react'

// グローバルジェスチャーイベント管理システム
// アプリケーション全体でジェスチャーイベントを集約管理
import {
  type GlobalGestureEvents,
  useGlobalGestureEvents,
} from '#/state/global-gesture-events'

/**
 * グローバルジェスチャー開始を監視するフック
 *
 * 【動作】
 * 1. グローバルジェスチャーイベントシステムに登録
 * 2. ジェスチャー開始（'begin'）イベントを監視
 * 3. イベント発生時にコールバックを実行
 * 4. コンポーネントアンマウント時に登録解除
 *
 * 【Go開発者向け補足 - EventEmitter パターン】
 * - このパターンは Node.js の EventEmitter に似ている
 * - Goでは channel や context を使って実装するところ
 * - events.on('begin', callback) でイベント購読
 * - events.off('begin', callback) でイベント購読解除
 *
 * 【重要】コールバック関数のメモ化
 * - onGestureCallback は useCallback でラップするか、メモ化する必要がある
 * - メモ化しないと、毎回新しい関数インスタンスが作成され、不要な再登録が発生
 * - これはパフォーマンス低下の原因となる
 *
 * @param onGestureCallback - ジェスチャー開始時に実行されるコールバック関数
 *   - useCallbackでラップするか、コンポーネント外で定義すること
 *
 * @example
 * ```typescript
 * function DropdownMenu() {
 *   const [isOpen, setIsOpen] = useState(false)
 *
 *   // useCallbackでコールバックをメモ化（重要）
 *   const handleGesture = useCallback(() => {
 *     if (isOpen) {
 *       setIsOpen(false) // メニューを閉じる
 *     }
 *   }, [isOpen])
 *
 *   // ジェスチャー開始を監視
 *   useOnGesture(handleGesture)
 *
 *   return <Menu isOpen={isOpen} />
 * }
 * ```
 */
export function useOnGesture(
  onGestureCallback: (e: GlobalGestureEvents['begin']) => void,
) {
  // グローバルジェスチャーイベントコンテキストを取得
  // GoユーザーへのNote: これはReactのContext API（グローバル状態管理）を使用
  // Goのcontext.Contextに似ているが、状態の共有とイベント管理が組み込まれている
  const ctx = useGlobalGestureEvents()

  /**
   * イベントリスナーの登録と解除の副作用
   *
   * 【処理フロー】
   * 1. グローバルジェスチャーシステムに登録
   * 2. 'begin' イベントにコールバックをバインド
   * 3. クリーンアップ時に登録解除とイベントリスナー削除
   *
   * 【Go開発者向け補足】
   * - ctx.register(): このコンポーネントがジェスチャー監視を使用していることを通知
   * - ctx.events.on(): イベントリスナーを登録（Goの channel 受信に似ている）
   * - 返り値のクリーンアップ関数: コンポーネントアンマウント時に実行
   * - これにより、メモリリークやイベントリスナーの重複を防ぐ
   */
  useEffect(() => {
    // グローバルジェスチャーイベントシステムに登録
    // 内部でリスナー数をカウントし、必要に応じてネイティブイベントを有効化
    ctx.register()

    // 'begin' イベント（ジェスチャー開始）にコールバックを登録
    // ユーザーが画面をタップ/クリックした時に onGestureCallback が呼ばれる
    ctx.events.on('begin', onGestureCallback)

    // クリーンアップ関数
    // GoユーザーへのNote: Goのdefer文に似ているが、useEffectの依存配列が
    // 変わった時や、コンポーネントがアンマウントされた時に実行される
    return () => {
      // ジェスチャーシステムから登録解除
      ctx.unregister()

      // イベントリスナーを削除
      // これにより、メモリリークを防ぎ、不要なコールバック実行を避ける
      ctx.events.off('begin', onGestureCallback)
    }
  }, [ctx, onGestureCallback]) // 依存配列: これらが変わった時にエフェクトを再実行
}
