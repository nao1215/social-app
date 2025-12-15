/**
 * ルーティング型定義モジュール
 * Routing type definitions module
 *
 * 【主な機能】
 * - アプリ全体のナビゲーション構造を型定義
 * - 各画面のパラメータ型を厳密に定義
 * - タブナビゲーター、スタックナビゲーターの型階層管理
 * - TypeScriptによる型安全なナビゲーション
 *
 * 【使用場面】
 * - ナビゲーション呼び出し時の型チェック
 * - 画面コンポーネントでのprops型定義
 * - Deep Linkのパラメータ検証
 *
 * 【アーキテクチャ】
 * BottomTabNavigator (タブバー)
 *   ├─ HomeTab → HomeTabNavigator
 *   ├─ SearchTab → SearchTabNavigator
 *   ├─ NotificationsTab → NotificationsTabNavigator
 *   ├─ MessagesTab → MessagesTabNavigatorNavigator
 *   └─ MyProfileTab → MyProfileTabNavigator
 *
 * 各タブ内にスタックナビゲーターが配置され、
 * CommonNavigatorParamsで定義された共通画面に遷移可能
 *
 * 【Goユーザー向け補足】
 * - type alias はGoのtype定義に相当
 * - interfaceはGoのstructに相当（メソッドは持たない）
 * - ジェネリクス<T>はGoのtype parametersに相当
 */

// React Navigationの型定義をインポート
// NavigationState: ナビゲーター全体の状態を表す型
// PartialState: 部分的な状態（初期化中など）を表す型
// Import React Navigation type definitions
// NavigationState: Type representing entire navigator state
// PartialState: Type representing partial state (during initialization, etc.)
import {type NavigationState, type PartialState} from '@react-navigation/native'

// ネイティブスタックナビゲーターのprop型をインポート
// 型安全なナビゲーション操作（push, pop, navigate等）を提供
// Import native stack navigator prop type
// Provides type-safe navigation operations (push, pop, navigate, etc.)
import {type NativeStackNavigationProp} from '@react-navigation/native-stack'

// 動画フィード画面のソースコンテキスト型をインポート
// Import video feed screen source context type
import {type VideoFeedSourceContext} from '#/screens/VideoFeed/types'

// NativeStackScreenPropsを再エクスポート
// 画面コンポーネントのprops型として使用される
// Re-export NativeStackScreenProps
// Used as props type for screen components
export type {NativeStackScreenProps} from '@react-navigation/native-stack'

/**
 * 全ナビゲーターで共通して使用される画面パラメータ型定義
 * Screen parameter type definitions common to all navigators
 *
 * 各画面名をキー、パラメータオブジェクトを値とするRecord型です。
 * undefinedは「パラメータ不要」を意味します。
 *
 * Each screen name as key, parameter object as value in a Record type.
 * undefined means "no parameters required".
 *
 * 【Goユーザー向け補足】
 * - この型はGoのmap[string]interface{}に近いが、キーごとに異なる値の型を持つ
 * - undefined はGoのnil相当だが、「値が存在しない」ことを明示的に型で表現
 * - オプショナルフィールド (?) はGoのポインタ型 (*string など) に相当
 */
export type CommonNavigatorParams = {
  // エラー・システム画面 / Error & System screens
  NotFound: undefined // 404 Not Foundページ / 404 Not Found page

  // リスト管理画面 / List management screens
  Lists: undefined // リスト一覧 / Lists overview

  // モデレーション関連画面 / Moderation related screens
  Moderation: undefined // モデレーション設定トップ / Moderation settings top
  ModerationModlists: undefined // モデレーションリスト管理 / Moderation list management
  ModerationMutedAccounts: undefined // ミュート済みアカウント一覧 / Muted accounts list
  ModerationBlockedAccounts: undefined // ブロック済みアカウント一覧 / Blocked accounts list
  ModerationInteractionSettings: undefined // インタラクション設定 / Interaction settings
  ModerationVerificationSettings: undefined // 認証設定 / Verification settings

  // 設定画面群 / Settings screens
  Settings: undefined // 設定トップ / Settings top
  LanguageSettings: undefined // 言語設定 / Language settings
  AppPasswords: undefined // アプリパスワード管理 / App password management
  SavedFeeds: undefined // 保存済みフィード / Saved feeds
  PreferencesFollowingFeed: undefined // フォローフィード設定 / Following feed preferences
  PreferencesThreads: undefined // スレッド表示設定 / Thread preferences
  PreferencesExternalEmbeds: undefined // 外部埋め込み設定 / External embeds preferences
  AccessibilitySettings: undefined // アクセシビリティ設定 / Accessibility settings
  AppearanceSettings: undefined // 外観設定（テーマなど） / Appearance settings (theme, etc.)
  AccountSettings: undefined // アカウント設定 / Account settings
  PrivacyAndSecuritySettings: undefined // プライバシー・セキュリティ設定 / Privacy & security settings
  ActivityPrivacySettings: undefined // アクティビティプライバシー設定 / Activity privacy settings
  ContentAndMediaSettings: undefined // コンテンツ・メディア設定 / Content & media settings

  // 通知設定画面群 / Notification settings screens
  NotificationSettings: undefined // 通知設定トップ / Notification settings top
  ReplyNotificationSettings: undefined // リプライ通知設定 / Reply notification settings
  MentionNotificationSettings: undefined // メンション通知設定 / Mention notification settings
  QuoteNotificationSettings: undefined // 引用通知設定 / Quote notification settings
  LikeNotificationSettings: undefined // いいね通知設定 / Like notification settings
  RepostNotificationSettings: undefined // リポスト通知設定 / Repost notification settings
  NewFollowerNotificationSettings: undefined // 新規フォロワー通知設定 / New follower notification settings
  LikesOnRepostsNotificationSettings: undefined // リポストへのいいね通知設定 / Likes on reposts notification settings
  RepostsOnRepostsNotificationSettings: undefined // リポストへのリポスト通知設定 / Reposts on reposts notification settings
  ActivityNotificationSettings: undefined // アクティビティ通知設定 / Activity notification settings
  MiscellaneousNotificationSettings: undefined // その他の通知設定 / Miscellaneous notification settings
  LegacyNotificationSettings: undefined // レガシー通知設定 / Legacy notification settings

  // その他設定 / Other settings
  InterestsSettings: undefined // 興味・関心設定 / Interests settings
  AboutSettings: undefined // アプリについて / About app
  AppIconSettings: undefined // アプリアイコン設定 / App icon settings

  // プロフィール関連画面 / Profile related screens
  // name: ハンドル名またはDID / handle name or DID
  Profile: {name: string; hideBackButton?: boolean} // プロフィールページ / Profile page
  ProfileFollowers: {name: string} // フォロワー一覧 / Followers list
  ProfileFollows: {name: string} // フォロー一覧 / Following list
  ProfileKnownFollowers: {name: string} // 知り合いのフォロワー / Known followers
  ProfileSearch: {name: string; q?: string} // プロフィール内検索 / Profile search
  ProfileList: {name: string; rkey: string} // プロフィールのリスト / Profile list

  // 投稿関連画面 / Post related screens
  // name: 投稿者のハンドル/DID, rkey: 投稿のレコードキー
  // name: poster's handle/DID, rkey: post record key
  PostThread: {name: string; rkey: string} // 投稿スレッド詳細 / Post thread detail
  PostLikedBy: {name: string; rkey: string} // いいねしたユーザー一覧 / Liked by users list
  PostRepostedBy: {name: string; rkey: string} // リポストしたユーザー一覧 / Reposted by users list
  PostQuotes: {name: string; rkey: string} // 引用投稿一覧 / Quote posts list

  // カスタムフィード関連 / Custom feed related
  ProfileFeed: {
    name: string // フィード作成者のハンドル/DID / Feed creator's handle/DID
    rkey: string // フィードのレコードキー / Feed record key
    feedCacheKey?: 'discover' | 'explore' | undefined // キャッシュキー / Cache key
  }
  ProfileFeedLikedBy: {name: string; rkey: string} // フィードをいいねしたユーザー一覧 / Feed liked by users list
  ProfileLabelerLikedBy: {name: string} // ラベラーをいいねしたユーザー一覧 / Labeler liked by users list

  // 検索・発見 / Search & Discovery
  Search: {q?: string} // 検索画面（クエリオプショナル） / Search screen (query optional)
  Hashtag: {tag: string; author?: string} // ハッシュタグ検索 / Hashtag search
  Topic: {topic: string} // トピック検索 / Topic search
  Feeds: undefined // フィード一覧 / Feeds list

  // メッセージング / Messaging
  MessagesConversation: {conversation: string; embed?: string; accept?: true} // 会話詳細 / Conversation detail
  MessagesSettings: undefined // メッセージ設定 / Message settings
  MessagesInbox: undefined // 受信箱 / Inbox

  // 通知 / Notifications
  NotificationsActivityList: {posts: string} // アクティビティ通知一覧 / Activity notifications list

  // スターターパック / Starter Pack
  Start: {name: string; rkey: string} // スターターパック開始 / Starter pack start
  StarterPack: {name: string; rkey: string; new?: boolean} // スターターパック詳細 / Starter pack detail
  StarterPackShort: {code: string} // スターターパック短縮URL / Starter pack short URL
  StarterPackWizard: {
    fromDialog?: boolean // ダイアログから起動されたか / Launched from dialog
    targetDid?: string // ターゲットDID / Target DID
    onSuccess?: () => void // 成功時のコールバック / Success callback
  }
  StarterPackEdit: {rkey?: string} // スターターパック編集 / Starter pack edit

  // その他 / Others
  VideoFeed: VideoFeedSourceContext // 動画フィード / Video feed
  Bookmarks: undefined // ブックマーク / Bookmarks

  // デバッグ・サポート画面 / Debug & Support screens
  Debug: undefined // デバッグ画面 / Debug screen
  DebugMod: undefined // モデレーションデバッグ / Moderation debug
  SharedPreferencesTester: undefined // SharedPreferencesテスター / SharedPreferences tester
  Log: undefined // ログ表示 / Log display
  Support: undefined // サポート / Support

  // 法的文書 / Legal documents
  PrivacyPolicy: undefined // プライバシーポリシー / Privacy policy
  TermsOfService: undefined // 利用規約 / Terms of service
  CommunityGuidelines: undefined // コミュニティガイドライン / Community guidelines
  CopyrightPolicy: undefined // 著作権ポリシー / Copyright policy
}

/**
 * ボトムタブナビゲーターのパラメータ型定義
 * Bottom tab navigator parameter type definition
 *
 * CommonNavigatorParamsを継承し、5つのタブ画面を追加定義。
 * 各タブは内部にスタックナビゲーターを持つ。
 *
 * Inherits CommonNavigatorParams and adds 5 tab screen definitions.
 * Each tab contains a stack navigator internally.
 *
 * 【Goユーザー向け補足】
 * - & は型の交差（intersection）でGoの構造体埋め込み（embedding）に相当
 * - CommonNavigatorParams & {...} で全フィールドをマージ
 */
export type BottomTabNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined // ホームタブ / Home tab
  SearchTab: undefined // 検索タブ / Search tab
  NotificationsTab: undefined // 通知タブ / Notifications tab
  MyProfileTab: undefined // マイプロフィールタブ / My profile tab
  MessagesTab: undefined // メッセージタブ / Messages tab
}

/**
 * ホームタブ内のナビゲーターパラメータ
 * Home tab navigator parameters
 */
export type HomeTabNavigatorParams = CommonNavigatorParams & {
  Home: undefined // ホーム画面 / Home screen
}

/**
 * 検索タブ内のナビゲーターパラメータ
 * Search tab navigator parameters
 */
export type SearchTabNavigatorParams = CommonNavigatorParams & {
  Search: {q?: string} // 検索画面（オプショナルなクエリ） / Search screen (optional query)
}

/**
 * 通知タブ内のナビゲーターパラメータ
 * Notifications tab navigator parameters
 */
export type NotificationsTabNavigatorParams = CommonNavigatorParams & {
  Notifications: undefined // 通知画面 / Notifications screen
}

/**
 * マイプロフィールタブ内のナビゲーターパラメータ
 * My profile tab navigator parameters
 */
export type MyProfileTabNavigatorParams = CommonNavigatorParams & {
  MyProfile: {name: 'me'; hideBackButton: true} // 自分のプロフィール（戻るボタン非表示） / Own profile (hide back button)
}

/**
 * メッセージタブ内のナビゲーターパラメータ
 * Messages tab navigator parameters
 */
export type MessagesTabNavigatorParams = CommonNavigatorParams & {
  Messages: {
    pushToConversation?: string // 会話IDへ直接プッシュ / Push directly to conversation ID
    animation?: 'push' | 'pop' // アニメーション種類 / Animation type
  }
}

/**
 * フラットナビゲーターのパラメータ（タブなし構造用）
 * Flat navigator parameters (for non-tab structure)
 *
 * Web版などタブバーを使用しない場合のルート構造。
 * For root structure when tab bar is not used (e.g., web version).
 */
export type FlatNavigatorParams = CommonNavigatorParams & {
  Home: undefined // ホーム画面 / Home screen
  Search: {q?: string} // 検索画面 / Search screen
  Feeds: undefined // フィード一覧 / Feeds list
  Notifications: undefined // 通知画面 / Notifications screen
  Messages: {pushToConversation?: string; animation?: 'push' | 'pop'} // メッセージ画面 / Messages screen
}

/**
 * 全ナビゲーターの統合パラメータ型
 * Unified parameter type for all navigators
 *
 * アプリ内の全画面パラメータを統合した型。
 * navigation.navigate() の型チェックに使用される。
 *
 * Unified type of all screen parameters in the app.
 * Used for type checking navigation.navigate().
 *
 * 【Goユーザー向け補足】
 * - 複数の型を & で結合し、全フィールドを持つ統合型を生成
 */
export type AllNavigatorParams = CommonNavigatorParams & {
  HomeTab: undefined // ホームタブ / Home tab
  Home: undefined // ホーム画面 / Home screen
  SearchTab: undefined // 検索タブ / Search tab
  Search: {q?: string} // 検索画面 / Search screen
  Feeds: undefined // フィード一覧 / Feeds list
  NotificationsTab: undefined // 通知タブ / Notifications tab
  Notifications: undefined // 通知画面 / Notifications screen
  MyProfileTab: undefined // マイプロフィールタブ / My profile tab
  MessagesTab: undefined // メッセージタブ / Messages tab
  Messages: {animation?: 'push' | 'pop'} // メッセージ画面 / Messages screen
}

/**
 * ナビゲーションプロパティの型エイリアス
 * Navigation property type alias
 *
 * 注意：
 * これは厳密には100%正確ではないが、実用上十分に機能する。
 * TypeScriptの達人ならより正確な型定義が可能かもしれない。
 *
 * NOTE:
 * This isn't strictly correct but it should be close enough.
 * A TS wizard might be able to get this 100%.
 * -prf
 *
 * 【Goユーザー向け補足】
 * - type alias で複雑な型に短い名前を付ける
 * - NavigationProp<T> はGoのジェネリクス型に相当
 */
export type NavigationProp = NativeStackNavigationProp<AllNavigatorParams>

/**
 * ナビゲーション状態の型定義
 * Navigation state type definition
 *
 * 完全な状態（NavigationState）または部分的な状態（PartialState）を表現。
 * 初期化中やリストア中は部分的な状態となる。
 *
 * Represents complete state (NavigationState) or partial state (PartialState).
 * During initialization or restoration, state is partial.
 *
 * 【Goユーザー向け補足】
 * - | はユニオン型（OR）でGoのinterface{}に近いが型安全
 * - Omit<T, K> はTからKフィールドを除外した型を生成
 */
export type State =
  | NavigationState // 完全な状態 / Complete state
  | Omit<PartialState<NavigationState>, 'stale'> // 部分的な状態（staleフィールドを除外） / Partial state (excluding stale field)

/**
 * ルートパラメータの型定義
 * Route parameters type definition
 *
 * 【Goユーザー向け補足】
 * - Record<K, V> はGoのmap[K]Vに相当
 * - ここではmap[string]stringに相当する型
 */
export type RouteParams = Record<string, string>

/**
 * ルートマッチング結果の型定義
 * Route matching result type definition
 */
export type MatchResult = {params: RouteParams}

/**
 * ルートオブジェクトの型定義
 * Route object type definition
 *
 * URLパターンマッチングとURL生成の両方の機能を持つ。
 * Has both URL pattern matching and URL generation functionality.
 *
 * 【Goユーザー向け補足】
 * - interfaceはGoのstructに相当するが、ここではメソッド型の定義
 * - (path: string) => MatchResult は関数型（Goのfunc(string) MatchResultに相当）
 */
export type Route = {
  match: (path: string) => MatchResult | undefined // URLをマッチングしてパラメータを抽出 / Match URL and extract parameters
  build: (params?: Record<string, any>) => string // パラメータからURLを生成 / Generate URL from parameters
}
