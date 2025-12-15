/**
 * Bluesky プロフィールビュー型定義モジュール
 *
 * このモジュールは、AT ProtocolのSDKがエクスポートする全てのプロフィールビュー型を
 * 統合したユニオン型を提供します。プロフィール表示や検索結果など、様々なコンテキストで
 * 使用されるプロフィール情報を型安全に扱うための定義です。
 *
 * ## プロフィールビューの種類
 * - **ProfileViewBasic**: 基本情報（表示名、ハンドル、アバター）
 * - **ProfileView**: 標準情報（基本 + フォロー数、説明など）
 * - **ProfileViewDetailed**: 詳細情報（標準 + 投稿数、バナー画像など）
 *
 * ## Goユーザー向け補足
 * TypeScriptの`type`は、Goの型エイリアス（type alias）や複数の型の和集合に相当します。
 * ```go
 * // Goでの同等の表現
 * type AnyProfileView interface {
 *     ProfileViewBasic | ProfileView | ProfileViewDetailed | ChatProfileViewBasic
 * }
 * ```
 *
 * ## AT Protocol型について
 * - `AppBskyActorDefs`: アプリケーション層のアクター（ユーザー）定義
 * - `ChatBskyActorDefs`: チャット機能のアクター定義
 * これらは分散型SNSプロトコル（AT Protocol）のスキーマ定義に基づいています。
 *
 * @module types/bsky/profile
 */

// AT Protocol SDKから、アプリケーション層とチャット層のアクター定義をインポート
import {type AppBskyActorDefs, type ChatBskyActorDefs} from '@atproto/api'

/**
 * 全プロフィールビュー型のユニオン型
 *
 * SDKがエクスポートする全てのプロフィールビュー型を統合したユニオン型です。
 * この型を使用することで、異なるコンテキストで取得されたプロフィール情報を
 * 統一的に扱うことができます。
 *
 * ## 含まれる型
 * 1. **AppBskyActorDefs.ProfileViewBasic**
 *    - 最小限のプロフィール情報（表示名、ハンドル、アバター、ラベル）
 *    - 使用例: リスト表示、検索結果の候補
 *
 * 2. **AppBskyActorDefs.ProfileView**
 *    - 標準的なプロフィール情報（基本 + フォロワー数、説明、インデックス日時）
 *    - 使用例: フォローリスト、投稿者情報
 *
 * 3. **AppBskyActorDefs.ProfileViewDetailed**
 *    - 詳細なプロフィール情報（標準 + 投稿数、バナー画像、ピン投稿）
 *    - 使用例: プロフィール画面、詳細モーダル
 *
 * 4. **ChatBskyActorDefs.ProfileViewBasic**
 *    - チャット用の基本プロフィール情報
 *    - 使用例: ダイレクトメッセージ、チャットリスト
 *
 * ## Goユーザー向け補足
 * Goのインターフェース型やtype switchに相当します：
 * ```go
 * type AnyProfileView interface {
 *     isProfileView()  // マーカーメソッド
 * }
 *
 * func handleProfile(profile AnyProfileView) {
 *     switch p := profile.(type) {
 *     case ProfileViewBasic:
 *         // 基本情報のみ使用
 *     case ProfileView:
 *         // 標準情報使用
 *     case ProfileViewDetailed:
 *         // 詳細情報使用
 *     case ChatProfileViewBasic:
 *         // チャット情報使用
 *     }
 * }
 * ```
 *
 * @example
 * ```typescript
 * function displayProfile(profile: AnyProfileView) {
 *   // 全てのプロフィールビュー型で共通のフィールドにアクセス
 *   console.log(profile.displayName)
 *   console.log(profile.handle)
 *
 *   // 型ガードで詳細型を判定
 *   if ('followersCount' in profile) {
 *     // ProfileView または ProfileViewDetailed
 *     console.log(`フォロワー: ${profile.followersCount}`)
 *   }
 *
 *   if ('postsCount' in profile) {
 *     // ProfileViewDetailed のみ
 *     console.log(`投稿数: ${profile.postsCount}`)
 *   }
 * }
 * ```
 */
export type AnyProfileView =
  | AppBskyActorDefs.ProfileViewBasic      // 基本プロフィール（アプリ層）
  | AppBskyActorDefs.ProfileView           // 標準プロフィール（アプリ層）
  | AppBskyActorDefs.ProfileViewDetailed   // 詳細プロフィール（アプリ層）
  | ChatBskyActorDefs.ProfileViewBasic     // 基本プロフィール（チャット層）
