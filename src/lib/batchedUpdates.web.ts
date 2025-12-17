/**
 * バッチ更新ユーティリティモジュール（Web版）
 *
 * 【概要】
 * 複数の状態更新を1回のレンダリングサイクルにまとめて処理。
 * WebではReact DOM版のunstable_batchedUpdatesを使用。
 *
 * 【ネイティブ版との違い】
 * - ネイティブ: react-nativeからインポート
 * - Web: react-domからインポート
 * - 機能は同一だが、ソースが異なる
 *
 * 【React 18以降の注意点】
 * - React 18ではAutomatic Batchingが導入され、
 *   多くの場合で自動的にバッチ処理される
 * - このユーティリティは後方互換性のために残されている
 *
 * 【Goユーザー向け補足】
 * - react-dom: WebブラウザのDOMとReactを接続するライブラリ
 *   Goのnet/httpがHTTPプロトコルを扱うのに似ている
 */
export {unstable_batchedUpdates as batchedUpdates} from 'react-dom'
