/**
 * @fileoverview Web版ツールチップコンポーネント
 *
 * Radix UIのPopoverコンポーネントを使用したツールチップ実装。
 * Web環境ではRadix UIの高機能なポップオーバーを活用し、
 * アクセシビリティとユーザビリティを両立させた吹き出しUIを提供。
 *
 * [Goユーザー向け補足]
 * - createContext: Goのcontext.Contextに類似。コンポーネントツリー全体で値を共有
 * - useContext: コンテキストから値を読み取るフック
 * - useMemo: 計算結果をメモ化するフック。依存配列が変わらない限り再計算しない
 */

import {Children, createContext, useContext, useMemo} from 'react' // React基本機能
import {View} from 'react-native' // React Nativeのビューコンポーネント
import {Popover} from 'radix-ui' // Radix UIのポップオーバーコンポーネント

import {atoms as a, flatten, select, useTheme} from '#/alf' // デザインシステム
import {transparentifyColor} from '#/alf/util/colorGeneration' // 色の透明度調整ユーティリティ
import {
  ARROW_SIZE, // 矢印のサイズ定数
  BUBBLE_MAX_WIDTH, // 吹き出しの最大幅
  MIN_EDGE_SPACE, // 画面端からの最小スペース
} from '#/components/Tooltip/const'
import {Text} from '#/components/Typography' // テキストコンポーネント

/**
 * TooltipContextTypeの型定義
 * ツールチップの表示位置と可視状態変更コールバックを管理
 * [Goユーザー向け補足] interfaceはGoのstructに相当
 */
type TooltipContextType = {
  position: 'top' | 'bottom' // ツールチップの表示位置（上または下）
  onVisibleChange: (open: boolean) => void // 可視状態が変わった時のコールバック
}

/**
 * ツールチップコンテキストの作成
 * デフォルト値として'bottom'位置と空のコールバックを設定
 */
const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom', // デフォルトは下側に表示
  onVisibleChange: () => {}, // 何もしないデフォルト実装
})
TooltipContext.displayName = 'TooltipContext' // デバッグ用の表示名

/**
 * Outerコンポーネント
 *
 * ツールチップのルートコンポーネント。Radix UIのPopover.Rootでラップし、
 * ツールチップの表示状態と位置情報をコンテキスト経由で子コンポーネントに提供。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子要素
 * @param {'top' | 'bottom'} props.position - ツールチップの表示位置（デフォルト: 'bottom'）
 * @param {boolean} props.visible - ツールチップの表示/非表示状態
 * @param {Function} props.onVisibleChange - 表示状態が変わった時のコールバック
 * @returns {JSX.Element} Popoverルートコンポーネント
 *
 * [Goユーザー向け補足]
 * useMemo: 計算結果をキャッシュ。依存配列が変わらなければ再計算しない
 */
export function Outer({
  children,
  position = 'bottom', // デフォルトは下側表示
  visible,
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  /**
   * コンテキスト値をメモ化
   * position または onVisibleChange が変わった時のみ新しいオブジェクトを生成
   */
  const ctx = useMemo(
    () => ({position, onVisibleChange}),
    [position, onVisibleChange],
  )
  return (
    // Radix UIのPopoverルート。open状態とonOpenChangeハンドラーを渡す
    <Popover.Root open={visible} onOpenChange={onVisibleChange}>
      <TooltipContext.Provider value={ctx}>{children}</TooltipContext.Provider>
    </Popover.Root>
  )
}

/**
 * Targetコンポーネント
 *
 * ツールチップのトリガー（表示のきっかけとなる）要素をラップする。
 * Radix UIのPopover.Triggerを使用し、子要素に対してツールチップ表示機能を付与。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - トリガーとなる子要素
 * @returns {JSX.Element} Popoverトリガーコンポーネント
 *
 * [Goユーザー向け補足]
 * asChild: Radix UIの特殊なprops。ラッパー要素を作らず、子要素に直接propsを渡す
 * collapsable={false}: React Nativeの最適化を無効化し、確実にViewを保持
 */
export function Target({children}: {children: React.ReactNode}) {
  return (
    // asChild により、内部のViewがトリガーとして機能する
    <Popover.Trigger asChild>
      <View collapsable={false}>{children}</View>
    </Popover.Trigger>
  )
}

/**
 * Contentコンポーネント
 *
 * ツールチップの実際のコンテンツ（吹き出し本体）を描画する。
 * Radix UIのPopover.Portalを使用してDOMツリーの外側にレンダリングし、
 * z-index問題を回避。テーマに応じた背景色、影、矢印を自動で適用。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - ツールチップ内に表示するコンテンツ
 * @param {string} props.label - アクセシビリティ用のラベル（スクリーンリーダー向け）
 * @returns {JSX.Element} Popoverコンテンツコンポーネント
 *
 * [Goユーザー向け補足]
 * useTheme: 現在のテーマ（ライト/ダーク/ディム）を取得するカスタムフック
 * useContext: コンテキストから値を読み取るフック
 */
export function Content({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const t = useTheme() // 現在のテーマ情報を取得
  const {position, onVisibleChange} = useContext(TooltipContext) // コンテキストから位置と変更ハンドラーを取得
  return (
    // Popover.Portal により、DOMツリーの外側（document.bodyの末尾など）にレンダリング
    <Popover.Portal>
      <Popover.Content
        className="radix-popover-content" // CSS クラス名
        aria-label={label} // アクセシビリティ用のラベル
        side={position} // 表示位置（上または下）
        sideOffset={4} // トリガー要素からのオフセット（4px）
        collisionPadding={MIN_EDGE_SPACE} // 画面端との衝突を避けるためのパディング
        onInteractOutside={() => onVisibleChange(false)} // 外側クリック時に閉じる
        style={flatten([
          a.rounded_sm, // 角丸スタイル
          // テーマに応じた背景色を選択
          select(t.name, {
            light: t.atoms.bg, // ライトテーマ: 通常背景
            dark: t.atoms.bg_contrast_100, // ダークテーマ: コントラスト背景
            dim: t.atoms.bg_contrast_100, // ディムテーマ: コントラスト背景
          }),
          {
            minWidth: 'max-content', // コンテンツに応じた最小幅
            // テーマに応じた影を設定（黒色を20%透明化）
            boxShadow: select(t.name, {
              light: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
              dark: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
              dim: `0 0 24px ${transparentifyColor(t.palette.black, 0.2)}`,
            }),
          },
        ])}>
        {/* ポップオーバーの矢印 */}
        <Popover.Arrow
          width={ARROW_SIZE} // 矢印の幅
          height={ARROW_SIZE / 2} // 矢印の高さ（幅の半分）
          // テーマに応じた矢印の色（背景色と同じ）
          fill={select(t.name, {
            light: t.atoms.bg.backgroundColor,
            dark: t.atoms.bg_contrast_100.backgroundColor,
            dim: t.atoms.bg_contrast_100.backgroundColor,
          })}
        />
        {/* コンテンツ本体のコンテナ */}
        <View style={[a.px_md, a.py_sm, {maxWidth: BUBBLE_MAX_WIDTH}]}>
          {children}
        </View>
      </Popover.Content>
    </Popover.Portal>
  )
}

/**
 * TextBubbleコンポーネント
 *
 * テキストを簡潔なツールチップとして表示するためのヘルパーコンポーネント。
 * 複数の子要素を配列に変換し、それぞれをTextコンポーネントでレンダリング。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - ツールチップに表示するテキスト（複数可）
 * @returns {JSX.Element} Contentコンポーネントでラップされたテキスト
 *
 * [Goユーザー向け補足]
 * Children.toArray: React.childrenを配列に変換するユーティリティ
 * map: 配列の各要素に対して処理を実行し、新しい配列を返す（Goのfor rangeに類似）
 */
export function TextBubble({children}: {children: React.ReactNode}) {
  const c = Children.toArray(children) // 子要素を配列に変換
  return (
    // ラベルは全ての子要素をスペース区切りで結合
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}> {/* 要素間に小さな隙間を設定 */}
        {/* 各子要素をTextコンポーネントでレンダリング */}
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
