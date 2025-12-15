/**
 * @file ポリシー更新オーバーレイのメインコンポーネント
 * @description ポリシー/利用規約更新をユーザーに通知するフルスクリーンオーバーレイ
 *
 * このモジュールは、アプリの利用規約やプライバシーポリシーが更新された際に
 * ユーザーに通知するためのオーバーレイUIを提供します。
 * ユーザーは変更内容を確認し、同意してから続行する必要があります。
 */

// React Hooks: useEffectは副作用処理（Goのdefer/init()に近い概念）
import {useEffect} from 'react'
// React Nativeのビューコンポーネント
import {View} from 'react-native'

// プラットフォーム検出ユーティリティ
import {isIOS} from '#/platform/detection'
// デザインシステム（atoms）
import {atoms as a} from '#/alf'
// フルウィンドウオーバーレイコンポーネント（iOS/Android固有の最前面表示）
import {FullWindowOverlay} from '#/components/FullWindowOverlay'
// ポリシー更新コンテキストフック
import {usePolicyUpdateContext} from '#/components/PolicyUpdateOverlay/context'
// ポータルコンポーネント（DOM階層を超えてレンダリング）
import {Portal} from '#/components/PolicyUpdateOverlay/Portal'
// 2025年8月のポリシー更新コンテンツ
import {Content} from '#/components/PolicyUpdateOverlay/updates/202508'

// 公開エクスポート: コンテキストプロバイダー
export {Provider} from '#/components/PolicyUpdateOverlay/context'
// 公開エクスポート: コンテキストフック
export {usePolicyUpdateContext} from '#/components/PolicyUpdateOverlay/context'
// 公開エクスポート: ポータル出力先
export {Outlet} from '#/components/PolicyUpdateOverlay/Portal'

/**
 * ポリシー更新オーバーレイコンポーネント
 *
 * @description
 * フルスクリーンオーバーレイとしてポリシー更新通知を表示します。
 * ユーザーがポリシー更新を完了するまで、このオーバーレイが表示され続けます。
 *
 * @returns {JSX.Element | null} オーバーレイUI、または完了済みの場合はnull
 *
 * @example
 * ```tsx
 * // アプリのルートレベルで使用
 * <Provider>
 *   <App />
 *   <PolicyUpdateOverlay />
 * </Provider>
 * ```
 *
 * @note
 * - ユーザーがサインイン/サインアップ/オンボーディングを完了した後に表示されます
 * - テスト環境（e2e）では無効化されます
 * - ポリシー更新をクリアする方法: `window.clearNux()` を参照（/state/queries/nuxs）
 */
export function PolicyUpdateOverlay() {
  // コンテキストから状態と準備完了コールバックを取得
  const {state, setIsReadyToShowOverlay} = usePolicyUpdateContext()

  /**
   * useEffect: コンポーネントのマウント時に副作用を実行
   * Goでは明示的なライフサイクルがありませんが、init()関数に近い概念です。
   * 第2引数の依存配列が空でない場合、依存値が変更されるたびに再実行されます。
   */
  useEffect(() => {
    /**
     * オーバーレイを表示する準備ができたことをコンテキストに通知します。
     * これにより、データの準備が整っていても、実際にレンダリングされるまで
     * オーバーレイが表示されないようにします。
     */
    setIsReadyToShowOverlay()
  }, [setIsReadyToShowOverlay]) // 依存配列: この関数が変更された場合のみ再実行

  /*
   * ローカルテスト・デバッグ用のNUX状態クリア方法については、
   * `/state/queries/nuxs` の `window.clearNux` の例を参照してください。
   */

  // ポリシー更新が完了済みの場合は何も表示しない
  if (state.completed) return null

  return (
    <Portal>
      {/* FullWindowOverlay: iOS/Androidでウィンドウ全体を覆うネイティブオーバーレイ */}
      <FullWindowOverlay>
        <View
          style={[
            a.fixed,  // 固定位置配置
            a.inset_0, // 上下左右すべて0（画面全体を覆う）
            // iOSでFullWindowOverlayを使用する際にzIndexを設定すると、
            // タップがそのまま下のコンテンツに通過してしまう問題があるため、
            // iOSでは設定しません。FullWindowOverlayがすでにその役割を果たしています。
            !isIOS && {zIndex: 9999},
          ]}>
          {/* ポリシー更新の実際のコンテンツを表示 */}
          <Content state={state} />
        </View>
      </FullWindowOverlay>
    </Portal>
  )
}
