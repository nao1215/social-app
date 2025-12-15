/**
 * ヘッダーオフセット計算カスタムフック
 *
 * このモジュールは、コンテンツ表示時にヘッダー領域を考慮したオフセット値を計算します。
 *
 * 【概要】
 * - モバイルデバイスでナビゲーションバーとタブバーの高さを計算
 * - デスクトップ/タブレットでは0を返す（固定ヘッダーなし）
 * - フォントスケール（アクセシビリティ設定）を考慮した動的な高さ計算
 *
 * 【使用場面】
 * - スクロール位置の調整
 * - コンテンツの padding/margin 計算
 * - 固定要素の位置調整
 *
 * 【Go開発者向け補足】
 * - カスタムフックは、状態やロジックを再利用可能な形で抽出するReactのパターン
 * - この関数は単純な計算だけだが、他のフックを組み合わせてリアクティブな値を返す
 * - Goの関数と異なり、Reactフックはコンポーネントの再レンダリング時に再実行される
 */

// React Nativeの画面サイズ取得フック（Goの syscall.GetWindowRect() に相当）
import {useWindowDimensions} from 'react-native'

// レスポンシブデザインのためのメディアクエリフック
// デスクトップ、タブレット、モバイルの判定に使用
import {useWebMediaQueries} from '#/lib/hooks/useWebMediaQueries'

/**
 * ヘッダーのオフセット値を計算して返す
 *
 * 【計算ロジック】
 * 1. デスクトップ/タブレット → 0px（固定ヘッダーなし）
 * 2. モバイル → ナビゲーションバー + タブバー + テキスト高さ - 調整値
 *
 * 【内訳】
 * - navBarHeight: 52px（固定）
 * - tabBarPad: 23px（パディング10px + ボーダー10px + 余白3px）
 * - tabBarText: フォントスケールを考慮したテキスト高さ
 * - 調整値: -4px（ブラウザレンダリングの微調整）
 *
 * 【Go開発者向け補足】
 * - この関数は状態を持たないが、他のフック（useWebMediaQueries, useWindowDimensions）を呼び出す
 * - Reactのルールにより、フック内でのみ他のフックを呼び出せる
 * - fontScale はOSのアクセシビリティ設定によって変わる（1.0が標準、最大3.0程度）
 *
 * @returns ヘッダーオフセット値（ピクセル単位）
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const headerOffset = useHeaderOffset()
 *   // モバイル: 81px (52 + 23 + 20 - 4)
 *   // デスクトップ: 0px
 *
 *   return <View style={{paddingTop: headerOffset}} />
 * }
 * ```
 */
export function useHeaderOffset() {
  // メディアクエリで現在のデバイス種別を取得
  // GoユーザーへのNote: これらの値はウィンドウサイズの変更時に自動更新される
  const {isDesktop, isTablet} = useWebMediaQueries()

  // フォントスケール倍率を取得（ユーザーのアクセシビリティ設定）
  // 通常は1.0、視覚補助が必要なユーザーは1.5〜3.0に設定している
  const {fontScale} = useWindowDimensions()

  // デスクトップまたはタブレットの場合は固定ヘッダーがないため0を返す
  if (isDesktop || isTablet) {
    return 0
  }

  // モバイルデバイスの場合のヘッダー高さ計算

  // ナビゲーションバーの固定高さ（例: 「戻る」ボタンやタイトル表示領域）
  const navBarHeight = 52

  // タブバーのパディング合計
  // - 上下パディング: 各10px
  // - ボーダー幅: 合計3px
  const tabBarPad = 10 + 10 + 3

  // タブバーのテキスト高さ（標準行高）
  const normalLineHeight = 20

  // フォントスケールを適用したテキスト高さ
  // 例: fontScale=1.5 の場合、20 * 1.5 = 30px
  const tabBarText = normalLineHeight * fontScale

  // 全体のオフセット値を計算
  // 注: 何らかの理由で計算が4ピクセルずれるため、微調整として-4している
  // おそらくブラウザのレンダリングエンジンやボーダーボックスの扱いによるもの
  return navBarHeight + tabBarPad + tabBarText - 4
}
