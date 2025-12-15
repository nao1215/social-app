/**
 * @file ポリシー更新オーバーレイのレイアウトコンポーネント
 * @description フルスクリーンオーバーレイのレイアウトとスタイリング
 *
 * このモジュールは、ポリシー更新コンテンツを表示するための
 * レスポンシブなオーバーレイUIを提供します。
 * デスクトップとモバイルで異なる背景スタイルとレイアウトを適用します。
 */

// React型定義: ReactNodeは任意のReact要素（Goのinterface{}に相当）
import {type ReactNode} from 'react'
// React Nativeのスクロール可能ビューとビューコンテナ
import {ScrollView, View} from 'react-native'
// セーフエリア対応フック（ノッチやステータスバーを考慮したレイアウト）
import {
  useSafeAreaFrame,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
// グラデーション背景コンポーネント（Expoライブラリ）
import {LinearGradient} from 'expo-linear-gradient'

// プラットフォーム検出ユーティリティ
import {isAndroid, isNative} from '#/platform/detection'
// アクセシビリティ設定フック（アニメーション無効化など）
import {useA11y} from '#/state/a11y'
// デザインシステムとユーティリティ
import {atoms as a, flatten, useBreakpoints, useTheme, web} from '#/alf'
// 色の透明度変換ユーティリティ
import {transparentifyColor} from '#/alf/util/colorGeneration'
// キーボードフォーカス管理（タブナビゲーション制御）
import {FocusScope} from '#/components/FocusScope'
// スクロールロック（オーバーレイ表示中のバックグラウンドスクロール防止）
import {LockScroll} from '#/components/LockScroll'

/**
 * オーバーレイの左右余白（ガター）サイズ
 * デスクトップ表示時に使用されます
 */
const GUTTER = 24

/**
 * オーバーレイコンポーネント
 *
 * @description
 * ポリシー更新コンテンツを表示するためのフルスクリーンオーバーレイ。
 * レスポンシブデザインで、デスクトップではモーダル風、モバイルでは
 * フルスクリーン表示されます。
 *
 * @param {Object} props - コンポーネントのprops
 * @param {ReactNode} props.children - オーバーレイ内に表示するコンテンツ
 * @param {string} props.label - アクセシビリティラベル（スクリーンリーダー用）
 *
 * @returns {JSX.Element} オーバーレイUI
 *
 * @example
 * ```tsx
 * <Overlay label="Policy Update">
 *   <PolicyContent />
 * </Overlay>
 * ```
 */
export function Overlay({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  // テーマ情報を取得（ライト/ダークモード）
  const t = useTheme()
  // ブレークポイント判定（画面サイズによる表示切り替え）
  const {gtPhone} = useBreakpoints() // gtPhone: スマホより大きい画面
  // アクセシビリティ設定（アニメーション削減モード）
  const {reduceMotionEnabled} = useA11y()
  // セーフエリアのインセット（ノッチ、ステータスバー等の領域）
  const insets = useSafeAreaInsets()
  // 画面のフレーム情報（幅、高さ）
  const frame = useSafeAreaFrame()

  return (
    <>
      {/* スクロールロック: オーバーレイ表示中はバックグラウンドのスクロールを無効化 */}
      <LockScroll />

      {/* 背景オーバーレイ層 */}
      <View style={[a.fixed, a.inset_0, !reduceMotionEnabled && a.fade_in]}>
        {gtPhone ? (
          // デスクトップ: 半透明の黒背景
          <View style={[a.absolute, a.inset_0, {opacity: 0.8}]}>
            <View
              style={[
                a.fixed,
                a.inset_0,
                {backgroundColor: t.palette.black},
                !reduceMotionEnabled && a.fade_in, // アニメーション削減が無効なら、フェードイン
              ]}
            />
          </View>
        ) : (
          // モバイル: グラデーション背景（上から下に向かって濃くなる）
          <LinearGradient
            colors={[
              transparentifyColor(t.atoms.bg.backgroundColor, 0), // 完全透明
              t.atoms.bg.backgroundColor, // 通常の背景色
              t.atoms.bg.backgroundColor, // 通常の背景色（維持）
            ]}
            start={[0.5, 0]} // グラデーション開始位置（中央上）
            end={[0.5, 1]}   // グラデーション終了位置（中央下）
            style={[a.absolute, a.inset_0]}
          />
        )}
      </View>

      {/* スクロール可能なコンテンツ領域 */}
      <ScrollView
        showsVerticalScrollIndicator={false} // スクロールバーを非表示
        style={[
          a.z_10, // z-index: 10（背景より前面）
          gtPhone &&
            web({
              // デスクトップ: 左右と上下にパディング
              paddingHorizontal: GUTTER,
              paddingVertical: '10vh', // ビューポート高さの10%
            }),
        ]}
        contentContainerStyle={[a.align_center]}> {/* 中央揃え */}

        {/**
         * このコンテナは中央揃えのダイアログが画面上部からはみ出すのを防ぎ、
         * スタックされたダイアログが相対的に整列して表示されるように
         * 「自然な」中央配置を提供します。
         */}
        <View
          style={[
            a.w_full,      // 幅100%
            a.z_20,        // z-index: 20
            a.align_center, // 水平中央揃え
            // モバイル: 下揃え + 最小高さを画面全体に
            !gtPhone && [a.justify_end, {minHeight: frame.height}],
            // ネイティブアプリ: 下部パディングをセーフエリアまたは2xlのいずれか大きい方に設定
            isNative && [
              {
                paddingBottom: Math.max(insets.bottom, a.p_2xl.padding),
              },
            ],
          ]}>

          {/* モバイル: 上部のグラデーションスペーサー */}
          {!gtPhone && (
            <View
              style={[
                a.flex_1,  // フレックス成長
                a.w_full,  // 幅100%
                {
                  // 最小高さをセーフエリア上部または2xlパディングのいずれか大きい方に設定
                  minHeight: Math.max(insets.top, a.p_2xl.padding),
                },
              ]}>
              {/* 上から下へのグラデーション（透明から背景色へ） */}
              <LinearGradient
                colors={[
                  transparentifyColor(t.atoms.bg.backgroundColor, 0),
                  t.atoms.bg.backgroundColor,
                ]}
                start={[0.5, 0]}
                end={[0.5, 1]}
                style={[a.absolute, a.inset_0]}
              />
            </View>
          )}

          {/* フォーカススコープ: キーボードナビゲーションをこの範囲内に制限 */}
          <FocusScope>
            <View
              accessible={isAndroid} // Android: アクセシビリティを有効化
              role="dialog"          // Web: ダイアログロール
              aria-role="dialog"     // ネイティブ: ARIAロール
              aria-label={label}     // スクリーンリーダー用ラベル
              style={flatten([
                a.relative,  // 相対位置指定
                a.w_full,    // 幅100%
                a.p_2xl,     // パディング: 2xlサイズ
                t.atoms.bg,  // テーマの背景色
                // アニメーション削減が無効なら、ズーム＆フェードインアニメーション
                !reduceMotionEnabled && a.zoom_fade_in,
                // デスクトップ: モーダル風のスタイリング
                gtPhone && [
                  a.rounded_md,               // 角丸: 中サイズ
                  a.border,                   // ボーダー表示
                  t.atoms.shadow_lg,          // 大きめの影
                  t.atoms.border_contrast_low, // 低コントラストのボーダー色
                  web({
                    maxWidth: 420, // 最大幅420px（読みやすい幅に制限）
                  }),
                ],
              ])}>
              {/* 実際のコンテンツ */}
              {children}
            </View>
          </FocusScope>
        </View>
      </ScrollView>
    </>
  )
}
