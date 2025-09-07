import {View} from 'react-native'

import {atoms as a, useTheme, type ViewStyleProp} from '#/alf'  // テーマ・スタイル・型定義

/**
 * 区切り線コンポーネント
 * セクション間や要素間の視覚的な区切りを提供する
 * 
 * @param style - 追加のカスタムスタイル
 */
export function Divider({style}: ViewStyleProp) {
  const t = useTheme()  // 現在のテーマ取得

  return (
    <View style={[
      a.w_full,                    // 幅100%
      a.border_t,                  // 上部にボーダー
      t.atoms.border_contrast_low, // 低コントラストボーダー色（テーマ対応）
      style                        // 外部から渡されたカスタムスタイル
    ]} />
  )
}
