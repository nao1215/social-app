/**
 * Bluesky スターターパック型定義モジュール
 *
 * このモジュールは、AT Protocolのスターターパック（新規ユーザー向けの
 * おすすめユーザーコレクション）を扱うための型定義とユーティリティ関数を提供します。
 *
 * ## スターターパック（Starter Pack）とは
 * 新規ユーザーがBlueskyを始める際に、興味のある分野のユーザーをまとめて
 * フォローできるようにするための機能です。例えば「テクノロジー」「アート」
 * 「音楽」などのテーマごとに、おすすめユーザーをパッケージ化できます。
 *
 * ## スターターパックビューの種類
 * - **StarterPackViewBasic**: 基本情報（タイトル、作成者、参加者数）
 * - **StarterPackView**: 詳細情報（基本 + 説明、フィード、参加ユーザーリスト）
 *
 * ## Goユーザー向け補足
 * - `type AnyStarterPackView = A | B`は、Goのインターフェース型や型の和集合に相当
 * - SDKの`is*`関数は、Goのtype assertionやtype switchに相当する型判定機能
 * - AT Protocolの型定義は、Goの`struct`タグと同様にスキーマ定義に基づく
 *
 * @module types/bsky/starterPack
 */

// AT Protocol SDKから、スターターパック関連の型定義をインポート
import {AppBskyGraphDefs} from '@atproto/api'

/**
 * スターターパック基本ビュー型判定関数
 *
 * SDKが提供する型判定関数を再エクスポートします。
 * この関数は、与えられたオブジェクトがStarterPackViewBasic型かどうかを
 * TypeScriptの型ガード（type guard）として判定します。
 *
 * ## Goユーザー向け補足
 * Goのtype assertionに相当する機能です：
 * ```go
 * func isBasicView(v interface{}) bool {
 *     _, ok := v.(StarterPackViewBasic)
 *     return ok
 * }
 * ```
 *
 * TypeScriptでは、type predicateにより型の絞り込みが可能：
 * ```typescript
 * if (isBasicView(pack)) {
 *   // この時点でpackはStarterPackViewBasic型として扱える
 *   console.log(pack.creator)
 * }
 * ```
 */
export const isBasicView = AppBskyGraphDefs.isStarterPackViewBasic

/**
 * スターターパック詳細ビュー型判定関数
 *
 * SDKが提供する型判定関数を再エクスポートします。
 * この関数は、与えられたオブジェクトがStarterPackView型（詳細版）かどうかを
 * TypeScriptの型ガード（type guard）として判定します。
 *
 * ## Goユーザー向け補足
 * Goのtype assertionに相当する機能です：
 * ```go
 * func isView(v interface{}) bool {
 *     _, ok := v.(StarterPackView)
 *     return ok
 * }
 * ```
 *
 * 詳細ビューには、基本ビューよりも多くの情報が含まれます：
 * - 参加ユーザーの詳細リスト
 * - スターターパックの説明文
 * - 関連フィード情報
 */
export const isView = AppBskyGraphDefs.isStarterPackView

/**
 * 全スターターパックビュー型のユニオン型
 *
 * SDKがエクスポートする全てのスターターパックビュー型を統合したユニオン型です。
 * この型を使用することで、異なるコンテキストで取得されたスターターパック情報を
 * 統一的に扱うことができます。
 *
 * ## 含まれる型
 *
 * ### 1. AppBskyGraphDefs.StarterPackViewBasic
 * 基本的なスターターパック情報：
 * - **uri**: スターターパックのAT URI（at://...）
 * - **cid**: コンテンツID（Content Identifier）
 * - **record**: レコードデータ（タイトル、説明など）
 * - **creator**: 作成者のプロフィール情報
 * - **listItemCount**: 参加ユーザー数
 * - **joinedWeekCount**: 週間参加者数（オプション）
 * - **joinedAllTimeCount**: 累計参加者数（オプション）
 * - **labels**: コンテンツラベル（モデレーション用）
 * - **indexedAt**: インデックス作成日時
 *
 * **使用例**: リスト表示、検索結果、プレビュー
 *
 * ### 2. AppBskyGraphDefs.StarterPackView
 * 詳細なスターターパック情報（基本 + 以下）：
 * - **list**: 参加ユーザーの詳細リスト（ListView）
 * - **listItemsSample**: サンプルユーザーリスト（プレビュー用）
 * - **feeds**: 関連フィード情報（オプション）
 *
 * **使用例**: 詳細画面、参加確認モーダル、フルプレビュー
 *
 * ## Goユーザー向け補足
 * Goでの同等の表現：
 * ```go
 * // インターフェース型による抽象化
 * type AnyStarterPackView interface {
 *     GetURI() string
 *     GetCreator() Profile
 *     isStarterPackView()  // マーカーメソッド
 * }
 *
 * // 具体的な型
 * type StarterPackViewBasic struct {
 *     URI      string
 *     CID      string
 *     Creator  Profile
 *     // ...
 * }
 *
 * type StarterPackView struct {
 *     StarterPackViewBasic  // 埋め込み
 *     List                  ListView
 *     ListItemsSample       []ListItem
 *     Feeds                 []Feed
 * }
 *
 * // 型判定とtype switch
 * func handleStarterPack(pack AnyStarterPackView) {
 *     switch p := pack.(type) {
 *     case *StarterPackView:
 *         // 詳細情報を使った処理
 *         fmt.Printf("参加ユーザー数: %d\n", len(p.ListItemsSample))
 *     case *StarterPackViewBasic:
 *         // 基本情報のみ使った処理
 *         fmt.Printf("作成者: %s\n", p.Creator.DisplayName)
 *     }
 * }
 * ```
 *
 * ## AT Protocol URIについて
 * AT ProtocolではURIスキーム`at://`を使用してリソースを識別します：
 * ```
 * at://did:plc:abc123/app.bsky.graph.starterpack/xyz789
 * └─┬─┘ └────┬────┘ └──────────┬──────────┘ └──┬──┘
 *   │        │                  │                │
 * scheme   DID          collection name      record key
 * ```
 *
 * @example
 * ```typescript
 * // 基本ビューの使用例
 * function renderStarterPackCard(pack: AnyStarterPackView) {
 *   // 全てのビュー型で共通のフィールドにアクセス
 *   console.log(pack.record.name)  // スターターパック名
 *   console.log(pack.creator.displayName)  // 作成者名
 *   console.log(pack.listItemCount)  // 参加ユーザー数
 *
 *   // 型ガードで詳細型を判定
 *   if (isView(pack)) {
 *     // StarterPackView型（詳細版）
 *     pack.listItemsSample?.forEach(item => {
 *       console.log(item.subject.displayName)  // サンプルユーザー表示
 *     })
 *   }
 * }
 *
 * // 型の絞り込み例
 * function displayDetailedStarterPack(pack: AnyStarterPackView) {
 *   if (!isView(pack)) {
 *     console.error('詳細情報が必要です')
 *     return
 *   }
 *   // ここではpackはStarterPackView型として扱える
 *   console.log(`リストURI: ${pack.list.uri}`)
 *   console.log(`参加者サンプル数: ${pack.listItemsSample?.length ?? 0}`)
 * }
 * ```
 */
export type AnyStarterPackView =
  | AppBskyGraphDefs.StarterPackViewBasic  // 基本スターターパックビュー
  | AppBskyGraphDefs.StarterPackView       // 詳細スターターパックビュー
