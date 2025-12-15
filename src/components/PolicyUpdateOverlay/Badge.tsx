/**
 * @file ポリシー更新オーバーレイのバッジコンポーネント
 * @description ポリシー更新のアナウンスメント表示用バッジUI
 *
 * このモジュールはポリシー更新通知に表示される「Announcement」バッジを提供します。
 * Blueskyロゴと「Announcement」テキストを含む、丸みを帯びたバッジUIです。
 */

// React Nativeのビューコンポーネント（Goのコンテナ要素に相当）
import {View} from 'react-native'
// 国際化対応のテキスト翻訳コンポーネント
import {Trans} from '@lingui/macro'

// Blueskyロゴアイコンコンポーネント
import {Logo} from '#/view/icons/Logo'
// デザインシステム（atoms）とテーマフック
import {atoms as a, useTheme} from '#/alf'
// テキスト表示コンポーネント
import {Text} from '#/components/Typography'

/**
 * ポリシー更新バッジコンポーネント
 *
 * @description
 * ポリシー更新オーバーレイの上部に表示されるアナウンスメントバッジ。
 * プライマリカラーの背景にBlueskyロゴと「Announcement」テキストを表示します。
 *
 * @returns {JSX.Element} バッジUI要素
 *
 * @example
 * ```tsx
 * <Badge />
 * ```
 */
export function Badge() {
  // useTheme: 現在のテーマ（ライト/ダーク）を取得するReactフック
  // Goの context.Context に似た仕組みで、コンポーネントツリー全体でテーマ情報を共有
  const t = useTheme()

  return (
    <View style={[a.align_start]}>
      {/* バッジ本体コンテナ */}
      <View
        style={[
          a.pl_md,        // 左パディング: 中サイズ
          a.pr_lg,        // 右パディング: 大サイズ
          a.py_sm,        // 上下パディング: 小サイズ
          a.rounded_full, // 完全な角丸（カプセル形状）
          a.flex_row,     // 横並びレイアウト（flexDirection: 'row'）
          a.align_center, // 縦方向中央揃え（alignItems: 'center'）
          a.gap_xs,       // 子要素間の間隔: 極小サイズ
          {
            // プライマリカラーの淡い背景色（25%の明度）
            backgroundColor: t.palette.primary_25,
          },
        ]}>
        {/* Blueskyロゴアイコン - プライマリカラー600（濃い色）で塗りつぶし */}
        <Logo fill={t.palette.primary_600} width={14} />

        {/* アナウンスメントテキスト */}
        <Text
          style={[
            a.font_bold, // 太字フォント
            {
              // プライマリカラー600（ロゴと同じ濃い色）
              color: t.palette.primary_600,
            },
          ]}>
          {/* 国際化対応のテキスト - 各言語に翻訳される */}
          <Trans>Announcement</Trans>
        </Text>
      </View>
    </View>
  )
}
