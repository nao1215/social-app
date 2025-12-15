/**
 * @file ポリシー更新の設定ファイル
 * @description 現在アクティブなポリシー更新IDを管理
 *
 * このモジュールは、アプリケーション全体で使用される現在のポリシー更新IDを
 * 一元管理します。更新IDは各ポリシー更新バージョンごとに異なります。
 */

// 2025年8月のポリシー更新ID定義をインポート
import {ID} from '#/components/PolicyUpdateOverlay/updates/202508/config'

/**
 * 現在アクティブなポリシー更新ID
 *
 * @description
 * 一度に1つのポリシー更新のみがアクティブになります。
 * このIDは、ユーザーがどのポリシー更新を確認したかを追跡するために使用されます。
 * ここで設定することで、更新IDとその関係性を明確にします。
 *
 * @constant
 * @type {string}
 *
 * @note
 * 新しいポリシー更新をデプロイする際は、このIDを更新する必要があります。
 * 例: 次回の更新では `updates/202509/config` からインポートする形になります。
 */
export const ACTIVE_UPDATE_ID = ID
