/**
 * @file ブックマーク空状態コンポーネント
 * @description ブックマークが1つもない場合に表示される空状態UI
 *
 * 機能:
 * - ブックマーク削除アイコンの表示
 * - 「まだ保存されていません」メッセージ
 * - ホームに戻るリンク
 *
 * @note EmptyState: ユーザーに次のアクションを促すためのUXパターン
 */

// React Nativeのビューコンポーネント
import {View} from 'react-native'
// Lingui国際化: メッセージ定義とコンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// デザインシステム: atoms（スタイルユーティリティ）とテーマフック
import {atoms as a, useTheme} from '#/alf'
// ボタンテキストコンポーネント
import {ButtonText} from '#/components/Button'
// ブックマーク削除アイコン（大サイズ）
import {BookmarkDeleteLarge} from '#/components/icons/Bookmark'
// リンクコンポーネント（React Navigation統合）
import {Link} from '#/components/Link'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * @function EmptyState
 * @description ブックマーク空状態コンポーネント
 *
 * ブックマークが1つもない場合に表示される画面。
 * アイコン、メッセージ、ホームへのリンクで構成される。
 *
 * @returns {JSX.Element} 空状態のUI
 *
 * @note
 * - useTheme: テーマ情報を取得するフック（ダークモード対応）
 * - useLingui: 国際化関数を取得するフック
 * - Link: React Navigationのナビゲーション機能を持つリンクコンポーネント
 */
export function EmptyState() {
  // テーマ情報を取得
  const t = useTheme()
  // 国際化関数を取得
  const {_} = useLingui()

  return (
    <View
      style={[
        a.align_center, // 中央揃え
        {
          paddingVertical: 64, // 上下パディング（64px）
        },
      ]}>
      {/* ブックマーク削除アイコン（大サイズ） */}
      <BookmarkDeleteLarge
        width={64}
        fill={t.atoms.text_contrast_medium.color}
      />
      {/* メッセージエリア */}
      <View style={[a.pt_sm]}>
        <Text
          style={[
            a.text_lg, // 大きいテキスト
            a.font_medium, // 中太フォント
            a.text_center, // 中央揃え
            t.atoms.text_contrast_medium, // テーマカラー
          ]}>
          <Trans>Nothing saved yet</Trans>
        </Text>
      </View>
      {/* ホームに戻るリンク */}
      <View style={[a.pt_2xl]}>
        <Link
          to="/" // ホーム画面へのパス
          action="navigate" // ナビゲーションアクション
          label={_(
            msg({
              message: `Go home`,
              context: `Button to go back to the home timeline`,
            }),
          )}
          size="small"
          color="secondary">
          <ButtonText>
            <Trans context="Button to go back to the home timeline">
              Go home
            </Trans>
          </ButtonText>
        </Link>
      </View>
    </View>
  )
}
