/**
 * @file レポートダイアログの型定義
 * @description レポートダイアログで使用される型定義を提供します。
 *              投稿、アカウント、リスト、フィード、スターターパック、メッセージなど
 *              様々なコンテンツタイプのレポートをサポートします。
 *
 * Go開発者向け補足:
 * - TypeScriptのtypeはGoのtype aliasやstructに相当します
 * - ユニオン型（|）はGoのインターフェースによる多様性に似ています
 */

// ダイアログコンポーネントの型定義をインポート
import * as Dialog from '#/components/Dialog'

/**
 * @type ReportDialogProps
 * @description レポートダイアログコンポーネントのプロパティ型定義
 *
 * このコンポーネントは以下のコンテンツタイプをサポート:
 * - post: 投稿のレポート
 * - list: リストのレポート
 * - feedgen: カスタムフィードのレポート
 * - starterpack: スターターパックのレポート
 * - other: その他のコンテンツのレポート
 * - account: アカウントのレポート
 * - convoMessage: 会話メッセージのレポート
 *
 * Go開発者向け補足:
 * - この型定義はユニオン型（discriminated union）を使用しており、
 *   Goのインターフェースと型アサーションの組み合わせに似ています
 * - 各バリアント（パターン）は'type'フィールドで区別されます
 */
export type ReportDialogProps = {
  control: Dialog.DialogOuterProps['control'] // ダイアログの開閉制御
  params:
    | {
        // URI/CIDベースのコンテンツレポート（投稿、リスト、フィード、スターターパック等）
        type: 'post' | 'list' | 'feedgen' | 'starterpack' | 'other'
        uri: string // コンテンツのAT Protocol URI
        cid: string // コンテンツのCID（Content Identifier）
      }
    | {
        // アカウントレポート
        type: 'account'
        did: string // レポート対象アカウントのDID（Decentralized Identifier）
      }
    | {
        // 会話メッセージレポート
        type: 'convoMessage'
        // メッセージIDは別途コンテキストから取得されるため、ここでは指定不要
      }
}
