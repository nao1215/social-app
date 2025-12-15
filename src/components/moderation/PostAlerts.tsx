/**
 * @fileoverview 投稿アラート表示コンポーネント
 *
 * 投稿に適用されたモデレーションアラートと通知を
 * ピル（pill）形式で表示するコンポーネント。
 *
 * 主な機能:
 * - モデレーションアラート（警告）の表示
 * - モデレーション通知（情報）の表示
 * - 追加の原因を受け入れるオプション
 * - 重複排除処理
 *
 * @module components/moderation/PostAlerts
 */

// React Nativeのスタイル型定義
// StyleProp: スタイルの型（Goのinterface{}に相当するが型安全）
// ViewStyle: View要素のスタイル定義
import {StyleProp, ViewStyle} from 'react-native'
// AT Protocolのモデレーション型
// ModerationCause: モデレーション原因の基底型
// ModerationUI: モデレーションUI表現（blurs, alerts, informsを含む）
import {ModerationCause, ModerationUI} from '@atproto/api'

// モデレーション原因のユニークキー生成と重複排除ユーティリティ
import {getModerationCauseKey, unique} from '#/lib/moderation'
// ピル（pill）UIコンポーネント群
// Pills: 小さな情報表示ラベルを表示するコンポーネント群
import * as Pills from '#/components/Pills'

/**
 * 投稿アラートコンポーネント
 *
 * 投稿に適用されたモデレーションアラートと通知情報を
 * ピル形式で水平方向に並べて表示します。
 *
 * @param modui - モデレーションUI情報
 * @param size - ピルのサイズ（'sm' | 'md' | 'lg'）デフォルトは'sm'
 * @param includeMute - ミュート情報を含めるか（未使用だが型定義には存在）
 * @param style - コンテナのカスタムスタイル
 * @param additionalCauses - 追加のモデレーション原因（アプリ独自の原因も可）
 *
 * @returns アラートがない場合はnullを返す（何もレンダリングしない）
 *
 * TypeScript型メモ:
 * - size?: 'sm' は TypeScript のリテラル型（Goの const に相当）
 * - ModerationCause[] | Pills.AppModerationCause[] は Union型（複数型の選択肢）
 *   Go equivalent: interface{ ModerationCause | AppModerationCause }
 */
export function PostAlerts({
  modui,
  size = 'sm', // デフォルト引数（Goの関数オプションパターンに相当）
  style,
  additionalCauses,
}: {
  modui: ModerationUI
  size?: Pills.CommonProps['size'] // Pills.CommonPropsのsizeプロパティの型を参照
  includeMute?: boolean // 現在未使用のプロパティ
  style?: StyleProp<ViewStyle>
  additionalCauses?: ModerationCause[] | Pills.AppModerationCause[]
}) {
  // 早期リターン: アラート、通知、追加原因がすべてない場合は何も表示しない
  // Go equivalent: if !modui.Alert && !modui.Inform && len(additionalCauses) == 0 { return nil }
  if (!modui.alert && !modui.inform && !additionalCauses?.length) {
    return null
  }

  return (
    // Pills.Row: ピルを水平方向に配置するコンテナコンポーネント
    <Pills.Row size={size} style={[size === 'sm' && {marginLeft: -3}, style]}>
      {/*
        アラートのレンダリング
        .filter(unique): 重複するアラートを排除
        unique関数: 配列から重複要素を削除するフィルタ関数
      */}
      {modui.alerts.filter(unique).map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)} // ユニークキーの生成
          cause={cause}
          size={size}
          noBg={size === 'sm'} // 'sm'サイズの場合は背景なし
        />
      ))}

      {/*
        通知（inform）のレンダリング
        alerts よりも重要度が低い情報的なメッセージ
      */}
      {modui.informs.filter(unique).map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}

      {/*
        追加原因のレンダリング
        オプショナルチェーン(?.)で安全にアクセス
        Go equivalent: if additionalCauses != nil { ... }
      */}
      {additionalCauses?.map(cause => (
        <Pills.Label
          key={getModerationCauseKey(cause)}
          cause={cause}
          size={size}
          noBg={size === 'sm'}
        />
      ))}
    </Pills.Row>
  )
}
