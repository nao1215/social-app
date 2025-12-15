/**
 * @fileoverview プロフィールヘッダーアラート表示コンポーネント
 *
 * プロフィールページのヘッダー部分に表示される
 * モデレーションアラートと通知を表示するコンポーネント。
 *
 * 主な機能:
 * - プロフィールビュー用のモデレーション情報表示
 * - 大きめのサイズ（'lg'）でのピル表示
 * - アラートと通知の重複排除
 *
 * @module components/moderation/ProfileHeaderAlerts
 */

// React Nativeのスタイル型定義
import {StyleProp, ViewStyle} from 'react-native'
// AT Protocolのモデレーション決定型
// ModerationDecision: モデレーションの最終的な決定を表す型
// 複数のコンテキスト（投稿表示、プロフィール表示など）に対するUI情報を提供
import {ModerationDecision} from '@atproto/api'

// モデレーション原因のユニークキー生成と重複排除ユーティリティ
import {getModerationCauseKey, unique} from '#/lib/moderation'
// ピル（pill）UIコンポーネント群
import * as Pills from '#/components/Pills'

/**
 * プロフィールヘッダーアラートコンポーネント
 *
 * プロフィールページのヘッダーに表示されるモデレーション情報を
 * ピル形式で表示します。PostAlertsと異なり、常に'lg'サイズを使用します。
 *
 * @param moderation - モデレーション決定オブジェクト
 * @param style - コンテナのカスタムスタイル（現在未使用だが型定義には存在）
 *
 * @returns アラートと通知がない場合はnullを返す
 *
 * ModerationDecisionメモ:
 * - AT Protocolのモデレーション決定を表すクラス
 * - .ui(context)メソッドで特定コンテキスト用のUIを取得
 * - 'profileView'コンテキスト: プロフィール閲覧時のモデレーションUI
 * - Go equivalent: moderation.UI("profileView")
 */
export function ProfileHeaderAlerts({
  moderation,
}: {
  moderation: ModerationDecision
  style?: StyleProp<ViewStyle> // 型定義にあるが現在未使用
}) {
  // プロフィール表示コンテキストでのモデレーションUIを取得
  // .ui('profileView'): 特定のコンテキストに応じたモデレーション表示情報を取得
  const modui = moderation.ui('profileView')

  // 早期リターン: アラートも通知もない場合は何も表示しない
  // Go equivalent: if !modui.Alert && !modui.Inform { return nil }
  if (!modui.alert && !modui.inform) {
    return null
  }

  return (
    // Pills.Row: ピルを水平方向に配置するコンテナ
    // size="lg": プロフィールヘッダーでは大きめのサイズを使用
    <Pills.Row size="lg">
      {/*
        アラートのレンダリング
        .filter(unique): 重複するアラートを排除
        .map(): 各アラートをPills.Labelコンポーネントに変換

        map関数メモ（Go開発者向け）:
        - JavaScriptの配列メソッド
        - Go equivalent:
          var labels []Component
          for _, cause := range modui.Alerts { labels = append(labels, NewPillsLabel(cause)) }
      */}
      {modui.alerts.filter(unique).map(cause => (
        <Pills.Label
          size="lg"
          key={getModerationCauseKey(cause)} // Reactのリストレンダリングに必要なユニークキー
          cause={cause}
        />
      ))}

      {/*
        通知（inform）のレンダリング
        アラートよりも重要度が低い情報的なメッセージ
        例: 「このアカウントは新規作成されました」など
      */}
      {modui.informs.filter(unique).map(cause => (
        <Pills.Label
          size="lg"
          key={getModerationCauseKey(cause)}
          cause={cause}
        />
      ))}
    </Pills.Row>
  )
}
