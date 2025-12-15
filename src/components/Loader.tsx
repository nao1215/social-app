/**
 * Loader.tsx
 *
 * 回転アニメーション付きのローディングスピナーコンポーネント
 * データ読み込み中や処理中であることを視覚的に表示する
 *
 * 主な機能:
 * - 連続的な回転アニメーション（無限ループ）
 * - react-native-reanimatedを使用した滑らかなアニメーション
 * - テーマに応じた色の自動調整
 * - カスタマイズ可能なサイズとスタイル
 *
 * Goユーザー向けの補足:
 * - React.useEffect: コンポーネントのマウント/アンマウント時に副作用を実行するフック
 *   - 第1引数: 実行する関数（副作用）
 *   - 第2引数: 依存配列（この配列の値が変わった時のみ再実行）
 * - useSharedValue: アニメーション用の共有値（複数のコンポーネント間で共有可能）
 * - useAnimatedStyle: アニメーション値からスタイルを動的に生成するフック
 */

// Reactのコア機能
import React from 'react'
// react-native-reanimated: 高性能なアニメーションライブラリ
// Goユーザー向けの補足: これはネイティブスレッドで実行される最適化されたアニメーションライブラリ
import Animated, {
  Easing,                  // イージング関数（アニメーションの加減速カーブ）
  useAnimatedStyle,        // アニメーション値からスタイルを生成するフック
  useSharedValue,          // アニメーション用の共有値を作成するフック
  withRepeat,              // アニメーションを繰り返すヘルパー関数
  withTiming,              // タイミングベースのアニメーションを作成するヘルパー関数
} from 'react-native-reanimated'

// デザインシステム関連のインポート
import {atoms as a, flatten, useTheme} from '#/alf'  // アトミックスタイル、フラット化関数、テーマフック
import {Props, useCommonSVGProps} from '#/components/icons/common'  // アイコン共通プロパティ
import {Loader_Stroke2_Corner0_Rounded as Icon} from '#/components/icons/Loader'  // ローダーアイコンSVG

/**
 * Loader - 回転アニメーション付きのローディングスピナーコンポーネント
 *
 * データ読み込み中や処理中であることを視覚的に表示する。
 * アイコンが連続的に回転し、処理が進行中であることを示す。
 *
 * アニメーション詳細:
 * - 0度から360度まで0.5秒で回転
 * - 線形イージング（一定速度）
 * - 無限ループ
 *
 * @param props - アイコンのプロパティ（サイズ、スタイル、色など）
 *
 * Goユーザー向けの補足:
 * - Propsはinterface/typeで定義された構造体に相当
 * - スプレッド演算子 {...props} で全プロパティを展開して渡す（Goの埋め込みに似ている）
 */
export function Loader(props: Props) {
  // 現在のテーマを取得（ライト/ダークモード対応）
  const t = useTheme()
  // SVGアイコン用の共通プロパティ（サイズ、色など）を取得
  const common = useCommonSVGProps(props)
  // 回転角度を保持する共有値（初期値: 0度）
  // Goユーザー向けの補足: useSharedValue は Go の atomic.Value に似ているが、
  // アニメーション専用で、ネイティブスレッドからアクセス可能
  const rotation = useSharedValue(0)

  // 回転アニメーションのスタイルを動的に生成
  // Goユーザー向けの補足: useAnimatedStyle はフック（useState的）で、
  // rotation の値が変わるたびに新しいスタイルオブジェクトを返す
  const animatedStyles = useAnimatedStyle(() => ({
    // transform: 回転変換を適用
    // rotation.get() で現在の回転角度を取得し、CSS の rotate に変換
    transform: [{rotate: rotation.get() + 'deg'}],
  }))

  // コンポーネントマウント時にアニメーション開始
  // Goユーザー向けの補足: useEffect は Go の defer に似ているが、より強力
  // - 第1引数: マウント時に実行される関数
  // - 第2引数: 依存配列 [rotation] - rotation が変わった時のみ再実行
  //   空配列 [] の場合はマウント時のみ実行（componentDidMount相当）
  React.useEffect(() => {
    // rotation の値をアニメーション付きで更新
    rotation.set(() =>
      // withRepeat: アニメーションを繰り返す
      withRepeat(
        // withTiming: タイミングベースのアニメーション
        // 0.5秒（500ms）で0から360度まで線形に変化
        withTiming(360, {duration: 500, easing: Easing.linear}),
        -1  // リピート回数: -1は無限ループ
      )
    )
  }, [rotation])

  return (
    // Animated.View: アニメーション可能なViewコンポーネント
    <Animated.View
      style={[
        a.relative,                                // position: relative
        a.justify_center,                          // justify-content: center（縦方向中央揃え）
        a.align_center,                            // align-items: center（横方向中央揃え）
        {width: common.size, height: common.size}, // アイコンサイズに合わせたコンテナサイズ
        animatedStyles,                            // 回転アニメーション適用
      ]}>
      {/* ローダーアイコン */}
      <Icon
        // Goユーザー向けの補足: スプレッド演算子 {...props} で
        // props の全プロパティを Icon に渡す（Goの埋め込み型に似ている）
        {...props}
        style={[
          a.absolute,                    // position: absolute
          a.inset_0,                     // top: 0, right: 0, bottom: 0, left: 0
          t.atoms.text_contrast_high,    // テーマに応じた高コントラストテキスト色
          flatten(props.style),          // 外部から渡されたスタイルを配列から単一オブジェクトにフラット化
        ]}
      />
    </Animated.View>
  )
}
