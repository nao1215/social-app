// BlueskyラベラーDIDとBskyエージェントをインポート
// Import Bluesky labeler DID and Bsky agent
import {BSKY_LABELER_DID, BskyAgent} from '@atproto/api'

// テストユーザー判定関数をインポート
// Import test user determination function
import {IS_TEST_USER} from '#/lib/constants'
// 追加モデレーション機関設定関数をインポート
// Import additional moderation authorities configuration function
import {configureAdditionalModerationAuthorities} from './additional-moderation-authorities'
// ラベラー設定読み込み関数をインポート
// Import labeler configuration reading function
import {readLabelers} from './agent-config'
// セッションアカウント型をインポート
// Import session account type
import {SessionAccount} from './types'

/**
 * ゲストユーザー用のモデレーション設定関数
 * 未ログイン状態で使用するデフォルトのコンテンツモデレーション設定を適用
 * 
 * Moderation configuration function for guest users
 * Applies default content moderation settings for unauthenticated state
 */
export function configureModerationForGuest() {
  // このグローバル変更はテスト用のコードでのみ許可される
  // 他のグローバルな動作はここに追加しないこと！
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler() // Blueskyアプリラベラーに切り替え / Switch to Bluesky app labeler
  configureAdditionalModerationAuthorities() // 追加モデレーション機関を設定 / Configure additional moderation authorities
}

/**
 * アカウント固有のモデレーション設定関数
 * ログインユーザーのモデレーション設定を適用（個人設定やテスト環境対応を含む）
 * 
 * Account-specific moderation configuration function
 * Applies moderation settings for logged-in users (including personal settings and test environment support)
 */
export async function configureModerationForAccount(
  agent: BskyAgent, // Blueskyエージェント / Bluesky agent
  account: SessionAccount, // セッションアカウント情報 / Session account information
) {
  // このグローバル変更はテスト用のコードでのみ許可される
  // 他のグローバルな動作はここに追加しないこと！
  // This global mutation is *only* OK because this code is only relevant for testing.
  // Don't add any other global behavior here!
  switchToBskyAppLabeler() // Blueskyアプリラベラーに切り替え / Switch to Bluesky app labeler
  
  // テストユーザーの場合はテスト環境用ラベラーに切り替えを試行
  // Try to switch to test environment labeler for test users
  if (IS_TEST_USER(account.handle)) {
    await trySwitchToTestAppLabeler(agent)
  }

  // 以下のコードは実際に本番環境で使用される（グローバルではない）
  // The code below is actually relevant to production (and isn't global)
  
  // ユーザーのラベラー設定をローカルストレージから読み込み
  // Read user's labeler settings from local storage
  const labelerDids = await readLabelers(account.did).catch(_ => {})
  if (labelerDids) {
    // Blueskyデフォルトラベラー以外のラベラーをヘッダーに設定
    // Set labelers other than Bluesky default labeler in header
    agent.configureLabelersHeader(
      labelerDids.filter(did => did !== BSKY_LABELER_DID),
    )
  } else {
    // ストレージにヘッダーがない場合は初回リクエストで送信しない
    // これを修正したい場合は、ここで設定クエリをブロックすることができる
    // If there are no headers in the storage, we'll not send them on the initial requests.
    // If we wanted to fix this, we could block on the preferences query here.
  }

  // 追加モデレーション機関を設定
  // Configure additional moderation authorities
  configureAdditionalModerationAuthorities()
}

/**
 * Blueskyアプリラベラーに切り替える内部関数
 * デフォルトのBlueskyモデレーションラベラーを設定
 * 
 * Internal function to switch to Bluesky app labeler
 * Sets the default Bluesky moderation labeler
 */
function switchToBskyAppLabeler() {
  BskyAgent.configure({appLabelers: [BSKY_LABELER_DID]})
}

/**
 * テスト環境用ラベラーへの切り替えを試行する非同期関数
 * テスト環境でのみ使用され、テスト用モデレーション機関を設定
 * 
 * Async function to try switching to test environment labeler
 * Used only in test environment to set test moderation authority
 */
async function trySwitchToTestAppLabeler(agent: BskyAgent) {
  // テスト用モデレーション機関のハンドルを解決してDIDを取得
  // Resolve test moderation authority handle to get DID
  const did = (
    await agent
      .resolveHandle({handle: 'mod-authority.test'}) // テスト用モデレーション機関のハンドル / Test moderation authority handle
      .catch(_ => undefined) // エラー時はundefinedを返す / Return undefined on error
  )?.data.did
  
  if (did) {
    // テスト環境モデレーション使用の警告を出力
    // Output warning about using test environment moderation
    console.warn('USING TEST ENV MODERATION')
    // テスト用ラベラーに切り替え
    // Switch to test labeler
    BskyAgent.configure({appLabelers: [did]})
  }
}
