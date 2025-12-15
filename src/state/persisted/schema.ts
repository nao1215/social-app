/**
 * 永続化データスキーマ定義モジュール
 *
 * このモジュールはアプリケーションの永続化データの構造を定義します。
 * Zodライブラリを使用してランタイムバリデーションとTypeScript型定義を同時に提供。
 *
 * 【Goユーザー向け補足】
 * - Zod: ランタイムでの型検証ライブラリ（Goのstructタグによるバリデーションに相当）
 * - z.object: Goのstructに相当。フィールドの型と制約を定義
 * - z.infer: Zodスキーマから自動的にTypeScript型を推論（型定義の自動生成）
 * - z.optional(): Goのポインタ型に相当。nil/undefinedを許可
 * - as const: リテラル型の固定（Goの定数に相当）
 */

// Zodライブラリのインポート - スキーマ定義とバリデーションに使用
import {z} from 'zod'

// デバイスの言語コード・ロケール情報のインポート - デフォルト設定に使用
import {deviceLanguageCodes, deviceLocales} from '#/locale/deviceLocales'
// サポート言語の検索ヘルパー - アプリ言語の初期設定に使用
import {findSupportedAppLanguage} from '#/locale/helpers'
// ログシステムのインポート - エラーログ出力に使用
import {logger} from '#/logger'
// プラットフォーム情報取得モジュール - デバイス設定の取得に使用
import {PlatformInfo} from '../../../modules/expo-bluesky-swiss-army'

/**
 * 外部埋め込みコンテンツの表示オプション定数
 * 'show': 埋め込みを表示, 'hide': 埋め込みを非表示
 */
const externalEmbedOptions = ['show', 'hide'] as const

/**
 * アカウント情報スキーマ
 * ストレージに永続化されるアカウント情報の構造定義
 * accounts[]配列に保存され、基本的なアカウント情報とアクセストークンを含む
 *
 * 【Goユーザー向け補足】
 * このz.objectはGoの以下のようなstructに相当：
 * type PersistedAccount struct {
 *   Service         string  `json:"service"`
 *   DID             string  `json:"did"`
 *   Handle          string  `json:"handle"`
 *   Email           *string `json:"email,omitempty"`
 *   ...
 * }
 */
const accountSchema = z.object({
  service: z.string(),              // サービスエンドポイントURL（例: https://bsky.social）
  did: z.string(),                  // 分散型ID（Decentralized Identifier）- ユーザーの一意識別子
  handle: z.string(),               // ユーザーハンドル（例: @username.bsky.social）
  email: z.string().optional(),     // メールアドレス（任意）
  emailConfirmed: z.boolean().optional(),  // メール確認済みフラグ
  emailAuthFactor: z.boolean().optional(), // メール認証要素の有効化状態
  refreshJwt: z.string().optional(), // リフレッシュトークン（有効期限切れの可能性があるため任意）
  accessJwt: z.string().optional(),  // アクセストークン（有効期限切れの可能性があるため任意）
  signupQueued: z.boolean().optional(), // サインアップキュー待機中フラグ
  active: z.boolean().optional(),    // アクティブ状態（後方互換性のため任意）
  /**
   * アカウント状態
   * 既知の値: takendown（削除済み）, suspended（停止中）, deactivated（無効化済み）
   * @see https://github.com/bluesky-social/atproto/blob/5441fbde9ed3b22463e91481ec80cb095643e141/lexicons/com/atproto/server/getSession.json
   */
  status: z.string().optional(),
  pdsUrl: z.string().optional(),     // Personal Data Server URL（カスタムPDS利用時）
  isSelfHosted: z.boolean().optional(), // セルフホスティング利用フラグ
})
/**
 * アカウント情報の型定義
 * accountSchemaから自動的に型を推論（Goのtype aliasに相当）
 */
export type PersistedAccount = z.infer<typeof accountSchema>

/**
 * 現在のアカウント情報スキーマ
 * currentAccountフィールドに保存される
 *
 * 過去のバージョンではトークンや他の情報を含んでいたが、現在はdidフィールドの
 * 参照のみに使用される。他のフィールドは任意とされており、後方互換性のために
 * 残されているが、非推奨として扱うべき。
 */
const currentAccountSchema = accountSchema.extend({
  service: z.string().optional(),  // サービスURL（後方互換性のため）
  handle: z.string().optional(),   // ハンドル（後方互換性のため）
})
/**
 * 現在のアカウント情報の型定義
 */
export type PersistedCurrentAccount = z.infer<typeof currentAccountSchema>

/**
 * アプリケーション永続化スキーマ
 * アプリ全体の設定と状態をストレージに保存するための構造定義
 *
 * 【Goユーザー向け補足】
 * このスキーマはGoで言うと以下のような大きなconfig structに相当：
 * type Schema struct {
 *   ColorMode    string           `json:"colorMode"`
 *   DarkTheme    *string          `json:"darkTheme,omitempty"`
 *   Session      SessionConfig    `json:"session"`
 *   Reminders    RemindersConfig  `json:"reminders"`
 *   ...
 * }
 */
const schema = z.object({
  colorMode: z.enum(['system', 'light', 'dark']),  // カラーモード: システム/ライト/ダーク
  darkTheme: z.enum(['dim', 'dark']).optional(),   // ダークテーマの種類: 薄暗い/真っ黒（任意）
  session: z.object({
    accounts: z.array(accountSchema),              // 保存されたアカウントの配列
    currentAccount: currentAccountSchema.optional(), // 現在選択中のアカウント（任意）
  }),
  reminders: z.object({
    lastEmailConfirm: z.string().optional(),       // 最後のメール確認リマインダー日時（任意）
  }),
  languagePrefs: z.object({
    /**
     * 投稿翻訳のターゲット言語
     * BCP-47形式の2文字言語コード（地域なし）
     */
    primaryLanguage: z.string(),
    /**
     * ユーザーが読める言語、フィードに渡される
     * BCP-47形式の2文字言語コード配列（地域なし）
     */
    contentLanguages: z.array(z.string()),
    /**
     * コンポーザー内で設定される、ユーザーが現在投稿している言語
     * 複数言語はカンマで区切られる
     * BCP-47形式の2文字言語コード（地域なし）
     */
    postLanguage: z.string(),
    /**
     * ユーザーの投稿言語履歴、コンポーザーの言語セレクタの事前入力に使用
     * 各値内で複数言語はカンマで区切られる
     * BCP-47形式の2文字言語コード（地域なし）
     */
    postLanguageHistory: z.array(z.string()),
    /**
     * アプリのUI翻訳用の言語
     * BCP-47形式の2文字言語コード（地域あり/なし）
     * {@link AppLanguage}と一致する
     */
    appLanguage: z.string(),
  }),
  requireAltTextEnabled: z.boolean(),  // alt-text必須設定（将来的にサーバー移行予定）
  largeAltBadgeEnabled: z.boolean().optional(),  // 大型alt-textバッジ有効化（任意）
  externalEmbeds: z
    .object({
      giphy: z.enum(externalEmbedOptions).optional(),        // Giphy埋め込み設定
      tenor: z.enum(externalEmbedOptions).optional(),        // Tenor埋め込み設定
      youtube: z.enum(externalEmbedOptions).optional(),      // YouTube埋め込み設定
      youtubeShorts: z.enum(externalEmbedOptions).optional(), // YouTube Shorts埋め込み設定
      twitch: z.enum(externalEmbedOptions).optional(),       // Twitch埋め込み設定
      vimeo: z.enum(externalEmbedOptions).optional(),        // Vimeo埋め込み設定
      spotify: z.enum(externalEmbedOptions).optional(),      // Spotify埋め込み設定
      appleMusic: z.enum(externalEmbedOptions).optional(),   // Apple Music埋め込み設定
      soundcloud: z.enum(externalEmbedOptions).optional(),   // SoundCloud埋め込み設定
      flickr: z.enum(externalEmbedOptions).optional(),       // Flickr埋め込み設定
    })
    .optional(),
  invites: z.object({
    copiedInvites: z.array(z.string()),  // コピーした招待コードの配列
  }),
  onboarding: z.object({
    step: z.string(),  // オンボーディングの現在のステップ
  }),
  hiddenPosts: z.array(z.string()).optional(),  // 非表示投稿URI配列（将来的にサーバー移行予定）
  useInAppBrowser: z.boolean().optional(),      // アプリ内ブラウザ使用設定（任意）
  lastSelectedHomeFeed: z.string().optional(),  // 最後に選択したホームフィード（任意）
  pdsAddressHistory: z.array(z.string()).optional(), // PDSアドレス履歴（任意）
  disableHaptics: z.boolean().optional(),       // ハプティクス無効化設定（任意）
  disableAutoplay: z.boolean().optional(),      // 自動再生無効化設定（任意）
  kawaii: z.boolean().optional(),               // かわいいモード設定（任意）
  hasCheckedForStarterPack: z.boolean().optional(), // スターターパック確認済みフラグ（任意）
  subtitlesEnabled: z.boolean().optional(),     // 字幕有効化設定（任意）
  /** @deprecated 非推奨 */
  mutedThreads: z.array(z.string()),            // ミュートされたスレッドの配列
  trendingDisabled: z.boolean().optional(),     // トレンド無効化設定（任意）
  trendingVideoDisabled: z.boolean().optional(), // トレンド動画無効化設定（任意）
})
/**
 * 永続化スキーマの型定義
 * アプリケーション全体の設定と状態の型
 */
export type Schema = z.infer<typeof schema>

/**
 * デフォルト設定値
 * アプリ初回起動時またはストレージが空の場合に使用されるデフォルト値
 *
 * 【Goユーザー向け補足】
 * Goのvar defaults = Schema{...}に相当する初期値定義
 */
export const defaults: Schema = {
  colorMode: 'system',  // システムのカラーモードに従う
  darkTheme: 'dim',     // ダークテーマはdim（薄暗い）
  session: {
    accounts: [],            // 初期状態ではアカウントなし
    currentAccount: undefined, // 現在のアカウントなし
  },
  reminders: {
    lastEmailConfirm: undefined, // メール確認リマインダーなし
  },
  languagePrefs: {
    primaryLanguage: deviceLanguageCodes[0] || 'en',  // デバイスの第一言語または英語
    contentLanguages: deviceLanguageCodes || [],       // デバイスの言語コード全て
    postLanguage: deviceLanguageCodes[0] || 'en',      // 投稿言語もデバイスの第一言語
    // 投稿言語履歴：デバイス言語 + 主要言語（en, ja, pt, de）の最大6件
    postLanguageHistory: (deviceLanguageCodes || [])
      .concat(['en', 'ja', 'pt', 'de'])
      .slice(0, 6),
    // まず完全な言語タグ（地域含む）を試し、フォールバックとして言語コードのみを使用
    appLanguage: findSupportedAppLanguage([
      deviceLocales.at(0)?.languageTag,
      deviceLanguageCodes[0],
    ]),
  },
  requireAltTextEnabled: false,      // alt-text必須機能は無効
  largeAltBadgeEnabled: false,       // 大型alt-textバッジは無効
  externalEmbeds: {},                 // 外部埋め込み設定は空
  mutedThreads: [],                   // ミュートスレッドなし
  invites: {
    copiedInvites: [],                // コピーした招待コードなし
  },
  onboarding: {
    step: 'Home',                     // オンボーディングはホーム画面から開始
  },
  hiddenPosts: [],                    // 非表示投稿なし
  useInAppBrowser: undefined,         // アプリ内ブラウザ設定未定義
  lastSelectedHomeFeed: undefined,    // 最後に選択したフィード未定義
  pdsAddressHistory: [],              // PDSアドレス履歴なし
  disableHaptics: false,              // ハプティクスは有効
  disableAutoplay: PlatformInfo.getIsReducedMotionEnabled(), // システムの視差効果削減設定に従う
  kawaii: false,                      // かわいいモード無効
  hasCheckedForStarterPack: false,    // スターターパック未確認
  subtitlesEnabled: true,             // 字幕は有効
  trendingDisabled: false,            // トレンド表示は有効
  trendingVideoDisabled: false,       // トレンド動画表示は有効
}

/**
 * JSON文字列からスキーマオブジェクトへのパース試行関数
 * ストレージから読み込んだJSON文字列をパースし、スキーマバリデーションを実行
 *
 * 【Goユーザー向け補足】
 * json.Unmarshal + バリデーションを組み合わせた処理に相当
 *
 * @param rawData パース対象のJSON文字列
 * @returns パース成功時はSchemaオブジェクト、失敗時はundefined
 */
export function tryParse(rawData: string): Schema | undefined {
  let objData
  // JSON文字列をオブジェクトにパース（Goのjson.Unmarshalに相当）
  try {
    objData = JSON.parse(rawData)
  } catch (e) {
    logger.error('persisted state: failed to parse root state from storage', {
      message: e,
    })
  }
  if (!objData) {
    return undefined
  }
  // Zodスキーマによるバリデーション実行（safeParse = バリデーション失敗時にエラーをスローしない）
  const parsed = schema.safeParse(objData)
  if (parsed.success) {
    return objData  // バリデーション成功
  } else {
    // バリデーション失敗時、エラー詳細をログ出力
    const errors =
      parsed.error?.errors?.map(e => ({
        code: e.code,
        // @ts-ignore exists on some types
        expected: e?.expected,
        path: e.path?.join('.'),
      })) || []
    logger.error(`persisted store: data failed validation on read`, {errors})
    return undefined
  }
}

/**
 * スキーマオブジェクトをJSON文字列に変換する試行関数
 * ストレージに保存する前にバリデーションを実行し、JSON文字列化
 *
 * 【Goユーザー向け補足】
 * バリデーション + json.Marshalを組み合わせた処理に相当
 *
 * @param value JSON化するSchemaオブジェクト
 * @returns 変換成功時はJSON文字列、失敗時はundefined
 */
export function tryStringify(value: Schema): string | undefined {
  try {
    // Zodスキーマによるバリデーション実行（parse = 失敗時にエラーをスロー）
    schema.parse(value)
    // JSON文字列化（Goのjson.Marshalに相当）
    return JSON.stringify(value)
  } catch (e) {
    logger.error(`persisted state: failed stringifying root state`, {
      message: e,
    })
    return undefined
  }
}
