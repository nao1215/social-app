/**
 * Statsig機能フラグ（ゲート）の型定義
 * Type definition for Statsig feature flags (gates)
 * 各フラグはA/Bテストや段階的機能リリースに使用される
 * Each flag is used for A/B testing or gradual feature rollout
 */
export type Gate =
  // アルファベット順を維持してください / Keep this alphabetic please.
  | 'alt_share_icon' // 代替共有アイコンの表示 / Show alternative share icon
  | 'cta_above_post_heading' // 投稿見出し上のCTA表示 / Show CTA above post heading
  | 'cta_above_post_replies' // 投稿返信上のCTA表示 / Show CTA above post replies
  | 'debug_show_feedcontext' // フィードコンテキストのデバッグ表示 / Debug display of feed context
  | 'debug_subscriptions' // サブスクリプションのデバッグ機能 / Debug subscription functionality
  | 'disable_onboarding_policy_update_notice' // オンボーディングのポリシー更新通知を無効化 / Disable onboarding policy update notice
  | 'explore_show_suggested_feeds' // 探索画面での推奨フィード表示 / Show suggested feeds in explore
  | 'old_postonboarding' // 旧版の投稿後オンボーディング / Old post-onboarding flow
  | 'onboarding_add_video_feed' // オンボーディングでの動画フィード追加 / Add video feed during onboarding
  | 'onboarding_suggested_accounts' // オンボーディングでの推奨アカウント表示 / Show suggested accounts in onboarding
  | 'onboarding_value_prop' // オンボーディングでの価値提案表示 / Show value proposition in onboarding
  | 'post_follow_profile_suggested_accounts' // プロフィールフォロー後の推奨アカウント / Suggested accounts after following profile
  | 'remove_show_latest_button' // 「最新を表示」ボタンの削除 / Remove "show latest" button
  | 'test_gate_1' // テスト用ゲート1 / Test gate 1
  | 'test_gate_2' // テスト用ゲート2 / Test gate 2
  | 'welcome_modal' // ウェルカムモーダルの表示 / Show welcome modal
