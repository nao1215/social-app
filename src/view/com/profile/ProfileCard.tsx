/**
 * プロフィールカードコンポーネント（フォローボタン付き）
 *
 * 【モジュール概要】
 * フォローボタンを含むプロフィールカードを表示するラッパーコンポーネント。
 * フォロワー一覧、フォロー中一覧、スターターパックなどで使用。
 *
 * 【主な機能】
 * - プロフィール情報表示（アバター、名前、ハンドル、説明文）
 * - フォローボタン表示と操作
 * - モデレーション（コンテンツフィルタリング）適用
 * - 境界線表示の制御（リスト最初の要素で非表示）
 *
 * 【使用箇所】
 * - ProfileFollowers.tsx（フォロワー一覧）
 * - ProfileFollows.tsx（フォロー中一覧）
 * - スターターパックのプロフィールリスト
 *
 * 【Go開発者向け補足】
 * - View: React Nativeの基本コンテナ（Goのdiv要素に相当）
 * - AppBskyActorDefs: AT Protocolのアクター定義型（Goのstructに類似）
 * - atoms (a): デザインシステムのスタイル定義（CSS-in-JS）
 */
import {View} from 'react-native' // React Nativeの基本UIコンポーネント
import {type AppBskyActorDefs} from '@atproto/api' // AT Protocol APIの型定義

import {useModerationOpts} from '#/state/preferences/moderation-opts' // モデレーション設定フック
import {atoms as a, useTheme} from '#/alf' // Alfデザインシステム
import * as ProfileCard from '#/components/ProfileCard' // プロフィールカードコンポーネント群

/**
 * ProfileCardWithFollowBtn - フォローボタン付きプロフィールカード
 *
 * 【機能説明】
 * ユーザープロフィール情報をカード形式で表示し、フォローボタンを提供。
 * モデレーション設定に基づいてコンテンツフィルタリングを適用。
 *
 * 【表示内容】
 * - アバター画像
 * - 表示名とハンドル
 * - プロフィール説明文
 * - フォローボタン（フォロー状態に応じて変化）
 * - モデレーション警告（必要に応じて）
 *
 * 【Go開発者向け補足】
 * - interface: TypeScriptの型定義（Goのstructに相当）
 * - ?: オプショナルプロパティ（省略可能な引数）
 * - = 'ProfileCard': デフォルト値設定
 * - return null: 早期リターン（Goのif err != nil { return nil }に類似）
 *
 * @param profile - プロフィールビューデータ（ユーザー情報）
 * @param noBorder - 境界線非表示フラグ（リスト最初の要素など）
 * @param logContext - ログコンテキスト（分析用、デフォルト: 'ProfileCard'）
 * @returns JSX要素 - プロフィールカード（モデレーション設定未取得時はnull）
 */
export function ProfileCardWithFollowBtn({
  profile,
  noBorder,
  logContext = 'ProfileCard', // デフォルト値: 'ProfileCard'
}: {
  profile: AppBskyActorDefs.ProfileView // プロフィールビューデータ
  noBorder?: boolean // 境界線非表示フラグ（オプショナル）
  logContext?: 'ProfileCard' | 'StarterPackProfilesList' // ログコンテキスト（2つの値のみ許可）
}) {
  const t = useTheme() // テーマ設定取得（ライト/ダークモード）
  const moderationOpts = useModerationOpts() // モデレーション設定取得

  // モデレーション設定が未取得の場合、何も表示しない
  // 【Go開発者向け補足】早期リターンパターン（Goのガード節に類似）
  if (!moderationOpts) return null

  /**
   * JSX返却: プロフィールカード表示
   *
   * 【構造説明】
   * - View: コンテナ（パディングと境界線を設定）
   * - ProfileCard.Default: 実際のプロフィールカード表示
   *
   * 【スタイル説明】
   * - a.py_md: 上下パディング（medium）
   * - a.px_xl: 左右パディング（extra large）
   * - !noBorder && [...]: 境界線表示条件（noBorderがfalseの場合のみ）
   * - a.border_t: 上部境界線
   * - t.atoms.border_contrast_low: テーマに応じた境界線色（低コントラスト）
   *
   * 【Go開発者向け補足】
   * - style={[...]}: スタイル配列（複数スタイルをマージ、Goのスライスに類似）
   * - && 演算子: 条件付きスタイル適用（Goのif文に相当）
   */
  return (
    <View
      style={[
        a.py_md, // 上下パディング: medium
        a.px_xl, // 左右パディング: extra large
        !noBorder && [a.border_t, t.atoms.border_contrast_low], // 境界線（条件付き）
      ]}>
      <ProfileCard.Default
        profile={profile} // プロフィールデータ
        moderationOpts={moderationOpts} // モデレーション設定
        logContext={logContext} // ログコンテキスト（分析追跡用）
      />
    </View>
  )
}
