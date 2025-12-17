/**
 * ビルドフラグモジュール
 *
 * 【概要】
 * コンパイル時に決定される機能フラグを定義。
 * 開発環境とプロダクション環境で動作を切り替えるために使用。
 *
 * 【フラグの役割】
 * - LOGIN_INCLUDE_DEV_SERVERS: ログイン画面に開発サーバーを表示するか
 * - PWI_ENABLED: Public Web Interface（未ログイン時のWeb表示）の有効化
 *
 * 【Goユーザー向け補足】
 * - ビルドフラグ: Goのビルドタグやldflags（-X）に相当
 * - これらの値はビルド時に固定され、実行時には変更不可
 * - 環境変数とは異なり、コード内でハードコードされている
 */

/**
 * ログイン画面に開発サーバーの選択肢を含めるかどうか
 *
 * 【用途】
 * - trueの場合: localhost, staging.bsky.devなどが選択可能
 * - 開発者やテスターがステージング環境にログインできる
 */
export const LOGIN_INCLUDE_DEV_SERVERS = true

/**
 * Public Web Interface（PWI）の有効化フラグ
 *
 * 【用途】
 * - trueの場合: ログインしていないユーザーもWebで一部コンテンツを閲覧可能
 * - SEO対策やユーザー獲得のために重要
 */
export const PWI_ENABLED = true
