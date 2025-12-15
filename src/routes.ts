/**
 * =============================================================================
 * ルーティング設定ファイル
 * =============================================================================
 *
 * このファイルは、Blueskyアプリケーションの全ルーティング（URL <-> 画面のマッピング）を定義します。
 *
 * 📋 主な役割：
 * 1. 全画面のURLパスとパラメータを定義
 * 2. ディープリンク対応（bsky://、https://bsky.app）
 * 3. Web・ネイティブ共通のルーティングロジック
 *
 * 🔗 ルーティングの仕組み：
 * - Routerクラスがパスと画面名のマッピングを管理
 * - '/profile/:name' のような動的パラメータをサポート
 * - Navigation.tsx でこのルーターを使用してナビゲーションを実装
 *
 * 💡 Go開発者向け補足：
 * - このファイルはGoでいうルーティングテーブル（gorilla/mux等）に相当します
 * - Router<AllNavigatableRoutes> は型安全なルーティングを提供します
 * - '/profile/:name' のような構文はGoのHTTPルーターと同じです
 */

// ルーティングライブラリ
import {Router} from '#/lib/routes/router'                    // カスタムルータークラス
import {type FlatNavigatorParams} from './lib/routes/types'  // ナビゲーターパラメータ型定義

/**
 * ナビゲート可能な全ルートの型定義
 *
 * 💡 Go開発者向け補足：
 * - typeはGoのtype aliasに相当します
 * - Omit<T, K>はTypeScriptのユーティリティ型で、指定したキーを除外します
 * - Goでいう構造体の埋め込みとは逆で、フィールドを除外する操作です
 */
type AllNavigatableRoutes = Omit<
  FlatNavigatorParams,
  'NotFound' | 'SharedPreferencesTester'  // エラー画面とテスト画面は除外
>

/**
 * =============================================================================
 * ルーティング定義
 * =============================================================================
 *
 * 全画面のURLパスと画面名のマッピングを定義します。
 *
 * 🔗 パス形式：
 * - 静的パス: '/search'
 * - 動的パラメータ: '/profile/:name'
 * - 複数パス対応: ['/profile/:name', '/profile/:name/rss']
 *
 * 💡 Go開発者向け補足：
 * - このオブジェクトはGoでいうマップ（map[string]string）のような構造です
 * - キーは画面名（型安全）、値はURLパス
 * - new Router<T>() は型パラメータを使った型安全なルーター初期化です
 */
export const router = new Router<AllNavigatableRoutes>({
  // =============================================================================
  // メインタブ画面
  // =============================================================================
  Home: '/',                              // ホームタブ（タイムライン）
  Search: '/search',                      // 検索タブ
  Feeds: '/feeds',                        // フィード一覧
  Notifications: '/notifications',        // 通知一覧
  NotificationsActivityList: '/notifications/activity',  // 通知アクティビティ詳細
  LegacyNotificationSettings: '/notifications/settings', // 旧通知設定（後方互換性）
  Settings: '/settings',                  // 設定画面
  Lists: '/lists',                        // リスト一覧

  // =============================================================================
  // モデレーション（コンテンツ管理）
  // =============================================================================
  Moderation: '/moderation',                            // モデレーション設定トップ
  ModerationModlists: '/moderation/modlists',           // モデレーションリスト
  ModerationMutedAccounts: '/moderation/muted-accounts', // ミュート済みアカウント
  ModerationBlockedAccounts: '/moderation/blocked-accounts', // ブロック済みアカウント
  ModerationInteractionSettings: '/moderation/interaction-settings', // インタラクション設定
  ModerationVerificationSettings: '/moderation/verification-settings', // 認証設定

  // =============================================================================
  // プロフィール・投稿・リスト
  // =============================================================================
  // 💡 Go開発者向け補足：
  // - 配列形式は複数のパスパターンをサポートするためです
  // - '/profile/:name/rss' はRSSフィード用の代替パスです
  Profile: ['/profile/:name', '/profile/:name/rss'],  // プロフィール画面
  ProfileFollowers: '/profile/:name/followers',        // フォロワー一覧
  ProfileFollows: '/profile/:name/follows',            // フォロー一覧
  ProfileKnownFollowers: '/profile/:name/known-followers', // 知っているフォロワー
  ProfileSearch: '/profile/:name/search',              // プロフィール内検索
  ProfileList: '/profile/:name/lists/:rkey',           // リスト詳細
  PostThread: '/profile/:name/post/:rkey',             // 投稿スレッド
  PostLikedBy: '/profile/:name/post/:rkey/liked-by',   // 投稿のいいね一覧
  PostRepostedBy: '/profile/:name/post/:rkey/reposted-by', // 投稿のリポスト一覧
  PostQuotes: '/profile/:name/post/:rkey/quotes',      // 投稿の引用一覧
  ProfileFeed: '/profile/:name/feed/:rkey',            // カスタムフィード
  ProfileFeedLikedBy: '/profile/:name/feed/:rkey/liked-by', // フィードのいいね一覧
  ProfileLabelerLikedBy: '/profile/:name/labeler/liked-by', // ラベラーのいいね一覧

  // =============================================================================
  // デバッグ・ログ
  // =============================================================================
  Debug: '/sys/debug',          // Storybookデバッグ画面
  DebugMod: '/sys/debug-mod',   // モデレーション状態デバッグ
  Log: '/sys/log',              // ログビューア

  // =============================================================================
  // 設定画面（詳細）
  // =============================================================================
  LanguageSettings: '/settings/language',                   // 言語設定
  AppPasswords: '/settings/app-passwords',                  // アプリパスワード管理
  PreferencesFollowingFeed: '/settings/following-feed',     // フォローフィード設定
  PreferencesThreads: '/settings/threads',                  // スレッド設定
  PreferencesExternalEmbeds: '/settings/external-embeds',   // 外部埋め込み設定
  AccessibilitySettings: '/settings/accessibility',         // アクセシビリティ設定
  AppearanceSettings: '/settings/appearance',               // 外観設定
  SavedFeeds: '/settings/saved-feeds',                      // 保存したフィード
  AccountSettings: '/settings/account',                     // アカウント設定
  PrivacyAndSecuritySettings: '/settings/privacy-and-security', // プライバシー・セキュリティ
  ActivityPrivacySettings: '/settings/privacy-and-security/activity', // アクティビティプライバシー
  ContentAndMediaSettings: '/settings/content-and-media',   // コンテンツ・メディア設定
  InterestsSettings: '/settings/interests',                 // 興味・関心設定
  AboutSettings: '/settings/about',                         // アプリについて
  AppIconSettings: '/settings/app-icon',                    // アプリアイコン設定

  // =============================================================================
  // 通知設定（詳細）
  // =============================================================================
  NotificationSettings: '/settings/notifications',          // 通知設定トップ
  ReplyNotificationSettings: '/settings/notifications/replies',     // リプライ通知
  MentionNotificationSettings: '/settings/notifications/mentions',  // メンション通知
  QuoteNotificationSettings: '/settings/notifications/quotes',      // 引用通知
  LikeNotificationSettings: '/settings/notifications/likes',        // いいね通知
  RepostNotificationSettings: '/settings/notifications/reposts',    // リポスト通知
  NewFollowerNotificationSettings: '/settings/notifications/new-followers', // 新しいフォロワー通知
  LikesOnRepostsNotificationSettings:
    '/settings/notifications/likes-on-reposts',                     // リポストのいいね通知
  RepostsOnRepostsNotificationSettings:
    '/settings/notifications/reposts-on-reposts',                   // リポストのリポスト通知
  ActivityNotificationSettings: '/settings/notifications/activity', // アクティビティ通知
  MiscellaneousNotificationSettings: '/settings/notifications/miscellaneous', // その他の通知

  // =============================================================================
  // サポート・ポリシー
  // =============================================================================
  Support: '/support',                            // サポートページ
  PrivacyPolicy: '/support/privacy',              // プライバシーポリシー
  TermsOfService: '/support/tos',                 // 利用規約
  CommunityGuidelines: '/support/community-guidelines', // コミュニティガイドライン
  CopyrightPolicy: '/support/copyright',          // 著作権ポリシー

  // =============================================================================
  // ハッシュタグ・トピック
  // =============================================================================
  Hashtag: '/hashtag/:tag',    // ハッシュタグページ
  Topic: '/topic/:topic',      // トピックページ

  // =============================================================================
  // メッセージング（DM）
  // =============================================================================
  Messages: '/messages',                          // メッセージ一覧
  MessagesSettings: '/messages/settings',         // メッセージ設定
  MessagesInbox: '/messages/inbox',               // メッセージ受信箱
  MessagesConversation: '/messages/:conversation', // 会話詳細

  // =============================================================================
  // スターターパック
  // =============================================================================
  Start: '/start/:name/:rkey',                    // スターターパック開始
  StarterPackEdit: '/starter-pack/edit/:rkey',    // スターターパック編集
  StarterPack: '/starter-pack/:name/:rkey',       // スターターパック詳細
  StarterPackShort: '/starter-pack-short/:code',  // スターターパック短縮URL
  StarterPackWizard: '/starter-pack/create',      // スターターパック作成ウィザード

  // =============================================================================
  // その他の機能
  // =============================================================================
  VideoFeed: '/video-feed',    // 動画フィード
  Bookmarks: '/saved',         // ブックマーク（保存した投稿）
})
