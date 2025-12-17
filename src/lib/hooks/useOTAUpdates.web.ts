/**
 * OTAアップデートフック（Web版・スタブ実装）
 *
 * 【概要】
 * Web環境ではOTA（Over The Air）アップデートは不要。
 * ネイティブ版との互換性のためにスタブ実装を提供。
 *
 * 【Webでは不要な理由】
 * - Webアプリはサーバーから常に最新のJSバンドルを取得
 * - ブラウザのキャッシュ制御で更新管理
 * - Expo Updatesはネイティブアプリ専用の機能
 *
 * 【Goユーザー向け補足】
 * - スタブ実装: 同じインターフェースで何もしない実装
 *   Goのnop（no operation）実装に相当
 */

/**
 * OTA更新チェックフック（Web版・何もしない）
 */
export function useOTAUpdates() {}

/**
 * PRデプロイ適用フック（Web版・スタブ）
 * ネイティブ版と同じインターフェースを提供
 */
export function useApplyPullRequestOTAUpdate() {
  return {
    tryApplyUpdate: () => {},                    // 更新適用（何もしない）
    revertToEmbedded: () => {},                  // 埋め込み版に戻す（何もしない）
    isCurrentlyRunningPullRequestDeployment: false,  // PRデプロイ実行中でない
    currentChannel: 'web-build',                 // Webビルドチャンネル
    pending: false,                              // 保留中でない
  }
}
