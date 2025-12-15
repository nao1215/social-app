/**
 * @fileoverview ネイティブ版ツールチップコンポーネント
 *
 * React Native (iOS/Android) 環境でのツールチップ実装。
 * ターゲット要素の画面上の座標を計測し、その位置に基づいて吹き出しUIを表示。
 * アニメーション、ジェスチャー検知、セーフエリア対応を含む高機能な実装。
 *
 * [Goユーザー向け補足]
 * - createContext: Goのcontext.Contextに類似。コンポーネントツリー全体で値を共有
 * - useCallback: メモ化された関数を返すReactフック。再レンダリング時の不要な関数再生成を防ぐ
 * - useContext: コンテキストから値を読み取るフック
 * - useEffect: コンポーネントのライフサイクル（マウント/アンマウント）で副作用を実行するフック
 * - useMemo: 計算結果をメモ化するフック。依存配列が変わらない限り再計算しない
 * - useRef: 再レンダリング間で値を保持するコンテナ。Goのポインタ変数に似た役割
 * - useState: コンポーネントのローカル状態を管理するフック
 */

import {
  Children, // Reactの子要素を操作するユーティリティ
  createContext, // コンテキスト作成用
  useCallback, // メモ化されたコールバック関数を生成
  useContext, // コンテキストの値を読み取る
  useEffect, // 副作用（マウント/アンマウント処理）を実行
  useMemo, // 計算結果のメモ化
  useRef, // 再レンダリング間で値を保持
  useState, // ローカル状態管理
} from 'react'
import { useWindowDimensions, View } from 'react-native' // React Native基本コンポーネント
import Animated, { Easing, ZoomIn } from 'react-native-reanimated' // アニメーションライブラリ
import { useSafeAreaInsets } from 'react-native-safe-area-context' // セーフエリア（ノッチ対応）フック

import { atoms as a, select, useTheme } from '#/alf' // デザインシステム
import { useOnGesture } from '#/components/hooks/useOnGesture' // ジェスチャー検知カスタムフック
import { Portal } from '#/components/Portal' // ポータルコンポーネント
import {
  ARROW_HALF_SIZE, // 矢印の半分のサイズ
  ARROW_SIZE, // 矢印の基本サイズ
  BUBBLE_MAX_WIDTH, // 吹き出しの最大幅
  MIN_EDGE_SPACE, // 画面端からの最小スペース
} from '#/components/Tooltip/const'
import { Text } from '#/components/Typography' // テキストコンポーネント

/**
 * Tooltipコンポーネントはターゲット要素の座標計測を利用してネイティブUI上の吹き出しを表示する。
 * Web版と異なり、ネイティブ環境では要素の画面上の絶対座標を手動で計測する必要がある。
 */

// 視覚的な中心合わせのため矢印先端位置を微調整するオフセット値
const ARROW_VISUAL_OFFSET = ARROW_SIZE / 1.25
// 矢印の先端下に影が自然に落ちるよう、影の開始位置を調整するオフセット値
const BUBBLE_SHADOW_OFFSET = ARROW_SIZE / 3

/**
 * TooltipContextTypeの型定義
 * ツールチップの表示位置、可視状態、状態変更ハンドラーを管理
 * [Goユーザー向け補足] typeはGoのtype aliasに相当
 */
type TooltipContextType = {
  position: 'top' | 'bottom' // ツールチップの表示位置（上または下）
  visible: boolean // 現在の可視状態
  onVisibleChange: (visible: boolean) => void // 可視状態変更時のコールバック
}

/**
 * TargetMeasurementsの型定義
 * ターゲット要素の画面上の座標とサイズ情報
 * [Goユーザー向け補足] structのフィールドに相当
 */
type TargetMeasurements = {
  x: number // 画面左端からのX座標（ピクセル）
  y: number // 画面上端からのY座標（ピクセル）
  width: number // 要素の幅（ピクセル）
  height: number // 要素の高さ（ピクセル）
}

/**
 * TargetContextTypeの型定義
 * ターゲット要素の計測結果と計測制御を管理
 * [Goユーザー向け補足] interfaceはGoのstructに相当
 */
type TargetContextType = {
  targetMeasurements: TargetMeasurements | undefined // 計測結果（未計測の場合はundefined）
  setTargetMeasurements: (measurements: TargetMeasurements) => void // 計測結果を設定する関数
  shouldMeasure: boolean // 計測すべきかどうかのフラグ
}

/**
 * ツールチップコンテキストの作成
 * デフォルト値として'bottom'位置、非表示状態、空のコールバックを設定
 */
const TooltipContext = createContext<TooltipContextType>({
  position: 'bottom', // デフォルトは下側表示
  visible: false, // デフォルトは非表示
  onVisibleChange: () => { }, // 何もしないデフォルト実装
})
TooltipContext.displayName = 'TooltipContext' // デバッグ用の表示名

/**
 * ターゲットコンテキストの作成
 * 計測結果の初期値はundefined、計測フラグはfalse
 */
const TargetContext = createContext<TargetContextType>({
  targetMeasurements: undefined, // 初期状態では未計測
  setTargetMeasurements: () => { }, // 何もしないデフォルト実装
  shouldMeasure: false, // 初期状態では計測不要
})
TargetContext.displayName = 'TargetContext' // デバッグ用の表示名

/**
 * Outerコンポーネント
 *
 * ツールチップのルートコンポーネント。表示状態とターゲット計測結果を
 * 2つのコンテキスト経由で子要素に共有する。
 *
 * 表示制御のロジック:
 * 1. requestVisibleがtrueかつ計測完了 → 表示
 * 2. requestVisibleがfalse → 非表示かつ計測結果をクリア
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 子要素
 * @param {'top' | 'bottom'} props.position - ツールチップの表示位置（デフォルト: 'bottom'）
 * @param {boolean} props.visible - 外部から要求される表示状態
 * @param {Function} props.onVisibleChange - 表示状態が変わった時のコールバック
 * @returns {JSX.Element} コンテキストプロバイダー
 *
 * [Goユーザー向け補足]
 * useState: コンポーネントのローカル状態。変更すると再レンダリングが発生
 * useMemo: 計算結果をメモ化。依存配列が変わらなければ再計算しない
 */
export function Outer({
  children,
  position = 'bottom', // デフォルトは下側表示
  visible: requestVisible, // 外部からの表示リクエスト
  onVisibleChange,
}: {
  children: React.ReactNode
  position?: 'top' | 'bottom'
  visible: boolean
  onVisibleChange: (visible: boolean) => void
}) {
  /**
   * 内部の実際の表示状態
   * 外部入力（requestVisible）に合わせつつ、ターゲット計測完了までは表示を保留する遅延用ステート。
   * [Goユーザー向け補足] useState: 状態管理フック。第1要素が現在値、第2要素が更新関数
   */
  const [visible, setVisible] = useState<boolean>(false)

  /**
   * ターゲット要素の計測結果を保持
   * 初期値はundefined（未計測状態）
   */
  const [targetMeasurements, setTargetMeasurements] = useState<
    | {
      x: number
      y: number
      width: number
      height: number
    }
    | undefined
  >(undefined)

  /**
   * 表示制御ロジック
   * レンダリング中に直接状態を更新（条件付き）
   * 注意: この書き方はReactの推奨パターンではないが、同期的な状態更新が必要な場合に使用
   */
  if (requestVisible && !visible && targetMeasurements) {
    // 表示リクエストがあり、まだ非表示で、計測が完了していれば表示
    setVisible(true)
  } else if (!requestVisible && visible) {
    // 表示リクエストがなくなったら非表示にし、計測結果もクリア
    setVisible(false)
    setTargetMeasurements(undefined)
  }

  /**
   * ツールチップコンテキストの値をメモ化
   * position, visible, onVisibleChange のいずれかが変わった時のみ新しいオブジェクトを生成
   */
  const ctx = useMemo(
    () => ({ position, visible, onVisibleChange }),
    [position, visible, onVisibleChange],
  )

  /**
   * ターゲットコンテキストの値をメモ化
   * requestVisible, targetMeasurements, setTargetMeasurements のいずれかが変わった時のみ再生成
   */
  const targetCtx = useMemo(
    () => ({
      targetMeasurements,
      setTargetMeasurements,
      shouldMeasure: requestVisible, // 表示リクエストがある時のみ計測を実行
    }),
    [requestVisible, targetMeasurements, setTargetMeasurements],
  )

  // 2つのコンテキストプロバイダーで子要素をラップ
  return (
    <TooltipContext.Provider value={ctx}>
      <TargetContext.Provider value={targetCtx}>
        {children}
      </TargetContext.Provider>
    </TooltipContext.Provider>
  )
}

/**
 * Targetコンポーネント
 *
 * ツールチップのトリガーとなる要素をラップし、その画面上の座標を計測する。
 * React NativeのView.measureメソッドを使用して、要素の絶対座標とサイズを取得。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - トリガーとなる子要素
 * @returns {JSX.Element} 計測可能なViewコンポーネント
 *
 * [Goユーザー向け補足]
 * useRef: 再レンダリング間で値を保持するコンテナ。ここではDOM要素への参照を保持
 * useEffect: コンポーネントのライフサイクルフック。依存配列の値が変わると再実行される
 */
export function Target({ children }: { children: React.ReactNode }) {
  const { shouldMeasure, setTargetMeasurements } = useContext(TargetContext) // コンテキストから計測制御を取得
  const targetRef = useRef<View>(null) // View要素への参照を保持するref

  /**
   * 計測ロジック
   * shouldMeasureがtrueの時、View要素のmeasureメソッドを呼び出して座標を取得
   *
   * [Goユーザー向け補足]
   * useEffect: 第2引数の依存配列の値が変わると、第1引数の関数が実行される
   * - shouldMeasureがtrueになった時に計測を実行
   */
  useEffect(() => {
    if (!shouldMeasure) return // 計測不要な場合は早期リターン

    /**
     * React NativeのView.measureメソッドを呼び出し
     * コールバックで以下のパラメータを受け取る:
     * - _x, _y: View内部の相対座標（未使用なのでアンダースコア付き）
     * - width, height: 要素のサイズ
     * - pageX, pageY: 画面全体での絶対座標
     */
    targetRef.current?.measure((_x, _y, width, height, pageX, pageY) => {
      // 全ての値が有効な場合のみ計測結果を設定
      if (pageX !== undefined && pageY !== undefined && width && height) {
        setTargetMeasurements({ x: pageX, y: pageY, width, height })
      }
    })
  }, [shouldMeasure, setTargetMeasurements]) // これらの値が変わると再実行

  return (
    // collapsable={false}: React Nativeの最適化を無効化し、確実にViewを保持
    // ref: このView要素への参照をtargetRefに設定
    <View collapsable={false} ref={targetRef}>
      {children}
    </View>
  )
}

/**
 * Contentコンポーネント
 *
 * ツールチップの実際のコンテンツ（吹き出し本体）を描画する。
 * コンテキストから状態と計測結果を取得し、Portalを通じてBubbleコンポーネントをレンダリング。
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - ツールチップ内に表示するコンテンツ
 * @param {string} props.label - アクセシビリティ用のラベル（スクリーンリーダー向け）
 * @returns {JSX.Element | null} Bubbleコンポーネント（条件により非表示の場合はnull）
 *
 * [Goユーザー向け補足]
 * useCallback: 関数をメモ化。依存配列が変わらない限り同じ関数インスタンスを返す
 */
export function Content({
  children,
  label,
}: {
  children: React.ReactNode
  label: string
}) {
  const { position, visible, onVisibleChange } = useContext(TooltipContext) // ツールチップコンテキストから取得
  const { targetMeasurements } = useContext(TargetContext) // ターゲット計測結果を取得

  /**
   * ツールチップを閉じる関数（メモ化）
   * onVisibleChangeをfalseで呼び出すラッパー関数
   */
  const requestClose = useCallback(() => {
    onVisibleChange(false)
  }, [onVisibleChange])

  // 非表示または計測未完了の場合は何もレンダリングしない
  if (!visible || !targetMeasurements) return null

  return (
    // Portalを使用してDOMツリーの外側にレンダリング
    <Portal>
      <Bubble
        label={label}
        position={position}
        /**
         * Portal配下ではコンテキストが届かないため、
         * 計測情報と閉じる処理を明示的にpropsとして渡す。
         */
        targetMeasurements={targetMeasurements}
        requestClose={requestClose}>
        {children}
      </Bubble>
    </Portal>
  )
}

/**
 * Bubbleコンポーネント（内部コンポーネント）
 *
 * 吹き出しの実際のUI描画を担当。ターゲット要素の座標、画面サイズ、セーフエリアを考慮して
 * 最適な表示位置を計算し、矢印付きの吹き出しをレンダリング。
 *
 * 位置計算の複雑なロジック:
 * 1. ターゲットの中心に合わせて吹き出しを配置
 * 2. 画面端からはみ出る場合は位置を調整
 * 3. 上下の表示領域が不足する場合は反対側に配置
 * 4. セーフエリア（ノッチ）を考慮
 *
 * @param {Object} props - プロパティ
 * @param {React.ReactNode} props.children - 吹き出し内のコンテンツ
 * @param {string} props.label - アクセシビリティラベル
 * @param {'top' | 'bottom'} props.position - 希望する表示位置
 * @param {Function} props.requestClose - 閉じる処理のコールバック
 * @param {TargetMeasurements} props.targetMeasurements - ターゲット要素の計測結果
 *
 * [Goユーザー向け補足]
 * useTheme: カスタムフック。現在のテーマ情報を取得
 * useSafeAreaInsets: セーフエリア（iOSノッチなど）の情報を取得するフック
 * useWindowDimensions: 画面サイズを取得するフック
 * useState: 吹き出し自身のサイズを管理
 * useMemo: 複雑な位置計算結果をメモ化。依存値が変わった時のみ再計算
 */
function Bubble({
  children,
  label,
  position,
  requestClose,
  targetMeasurements,
}: {
  children: React.ReactNode
  label: string
  position: TooltipContextType['position']
  requestClose: () => void
  targetMeasurements: Exclude<
    TargetContextType['targetMeasurements'],
    undefined
  >
}) {
  const t = useTheme() // 現在のテーマ（ライト/ダーク/ディム）
  const insets = useSafeAreaInsets() // セーフエリア情報（top, bottom, left, right）
  const dimensions = useWindowDimensions() // 画面サイズ（width, height）

  /**
   * 吹き出し自身のサイズを保持
   * onLayoutで計測されるまではundefined
   */
  const [bubbleMeasurements, setBubbleMeasurements] = useState<
    | {
      width: number
      height: number
    }
    | undefined
  >(undefined)

  /**
   * 吹き出しの最終的な表示座標を計算（メモ化）
   *
   * この関数は以下の処理を行う:
   * 1. ターゲット要素の中心に吹き出しを配置
   * 2. 画面端からはみ出る場合の調整
   * 3. 上下の空きスペースに応じた位置決定
   * 4. 矢印の位置計算
   *
   * [Goユーザー向け補足]
   * useMemo: 計算コストの高い処理をキャッシュ。依存配列の値が変わらなければ再計算しない
   */
  const coords = useMemo(() => {
    // 吹き出しサイズが未計測の場合はダミー座標を返す（opacity: 0で非表示）
    if (!bubbleMeasurements)
      return {
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        tipTop: 0,
        tipLeft: 0,
      }

    // 各種寸法を取得
    const { width: ww, height: wh } = dimensions // 画面サイズ
    const maxTop = insets.top // セーフエリア上端
    const maxBottom = wh - insets.bottom // セーフエリア下端
    const { width: cw, height: ch } = bubbleMeasurements // 吹き出しサイズ
    const minLeft = MIN_EDGE_SPACE // 左端の最小マージン
    const maxLeft = ww - minLeft // 右端の最大位置

    // 計算用の変数を初期化
    let computedPosition: 'top' | 'bottom' = position // 実際の表示位置（初期値は希望位置）
    let top = targetMeasurements.y + targetMeasurements.height // 初期top位置（ターゲットの下）
    // 吹き出しをターゲットの中心に合わせる（ただし最小マージンは確保）
    let left = Math.max(
      minLeft,
      targetMeasurements.x + targetMeasurements.width / 2 - cw / 2,
    )
    const tipTranslate = ARROW_HALF_SIZE * -1 // 矢印の基準オフセット
    let tipTop = tipTranslate // 矢印のtop位置

    // 右端からはみ出る場合の調整
    if (left + cw > maxLeft) {
      left -= left + cw - maxLeft // はみ出た分だけ左にシフト
    }

    // 矢印の左位置を計算（ターゲットの中心を指すように）
    let tipLeft =
      targetMeasurements.x -
      left +
      targetMeasurements.width / 2 -
      ARROW_HALF_SIZE

    let bottom = top + ch // 吹き出しの下端位置

    /**
     * 上側に配置する内部関数
     * ターゲットの上に吹き出しを配置し、矢印も調整
     */
    function positionTop() {
      top = top - ch - targetMeasurements.height // ターゲットの上に配置
      bottom = top + ch
      tipTop = tipTop + ch // 矢印を吹き出しの下側に
      computedPosition = 'top'
    }

    /**
     * 下側に配置する内部関数
     * ターゲットの下に吹き出しを配置し、矢印も調整
     */
    function positionBottom() {
      top = targetMeasurements.y + targetMeasurements.height // ターゲットの下に配置
      bottom = top + ch
      tipTop = tipTranslate // 矢印を吹き出しの上側に
      computedPosition = 'bottom'
    }

    // 位置決定ロジック
    if (position === 'top') {
      positionTop() // まず希望通り上側に配置
      if (top < maxTop) {
        // 上端からはみ出る場合は下側に変更
        positionBottom()
      }
    } else {
      // デフォルトは下側
      if (bottom > maxBottom) {
        // 下端からはみ出る場合は上側に変更
        positionTop()
      }
    }

    // 視覚的な微調整オフセットを適用
    if (computedPosition === 'bottom') {
      top += ARROW_VISUAL_OFFSET
      bottom += ARROW_VISUAL_OFFSET
    } else {
      top -= ARROW_VISUAL_OFFSET
      bottom -= ARROW_VISUAL_OFFSET
    }

    // 最終的な座標を返す
    return {
      computedPosition,
      top,
      bottom,
      left,
      right: left + cw,
      tipTop,
      tipLeft,
    }
  }, [position, targetMeasurements, bubbleMeasurements, insets, dimensions])

  /**
   * ツールチップを閉じる処理のラッパー
   * 吹き出しサイズをクリアしてから元のrequestCloseを呼び出す
   *
   * [Goユーザー向け補足]
   * useCallback: 関数をメモ化。依存配列が変わらない限り同じ関数インスタンスを返す
   */
  const requestCloseWrapped = useCallback(() => {
    setBubbleMeasurements(undefined) // 吹き出しサイズをリセット
    requestClose() // 親に閉じるリクエストを通知
  }, [requestClose])

  /**
   * ジェスチャー（タッチ/クリック）検知
   * 吹き出し外部をタップした時に閉じる処理を実行
   *
   * [Goユーザー向け補足]
   * useOnGesture: カスタムフック。画面全体のジェスチャーイベントを監視
   * useCallback: イベントハンドラーをメモ化してパフォーマンスを最適化
   */
  useOnGesture(
    useCallback(
      e => {
        const { x, y } = e // タッチ/クリック座標を取得
        // 吹き出しの矩形範囲内かどうかを判定
        const isInside =
          x > coords.left &&
          x < coords.right &&
          y > coords.top &&
          y < coords.bottom

        // 外部をタップした場合は閉じる
        if (!isInside) {
          requestCloseWrapped()
        }
      },
      [coords, requestCloseWrapped], // これらの値が変わるとハンドラーを再生成
    ),
  )

  /**
   * 吹き出しUIのレンダリング
   * 3層構造: 外側コンテナ > アニメーションラッパー > (矢印 + コンテンツ本体)
   */
  return (
    <View
      // アクセシビリティ設定（スクリーンリーダー対応）
      accessible // スクリーンリーダーで読み上げ可能にする
      role="alert" // 重要な通知として扱う
      accessibilityHint="" // ヒントは空（labelで十分）
      accessibilityLabel={label} // スクリーンリーダー用のラベル
      // Android向けアクセシビリティ設定
      importantForAccessibility="yes" // このViewを重要な要素として扱う
      // iOS向けアクセシビリティ設定
      accessibilityViewIsModal // モーダルとして扱い、背後の要素を無視
      style={[
        a.absolute, // 絶対配置
        a.align_start, // 左寄せ
        {
          width: BUBBLE_MAX_WIDTH, // 最大幅を設定
          opacity: bubbleMeasurements ? 1 : 0, // サイズ計測完了まで非表示
          top: coords.top, // 計算されたtop座標
          left: coords.left, // 計算されたleft座標
        },
      ]}>
      {/* アニメーションラッパー: ズームイン効果 */}
      <Animated.View
        entering={ZoomIn.easing(Easing.out(Easing.exp))} // 指数関数的なイージングでズームイン
        style={{ transformOrigin: oppposite(position) }}> {/* アニメーションの基準点を設定 */}
        {/* 矢印部分: 45度回転した正方形で実現 */}
        <View
          style={[
            a.absolute, // 絶対配置
            a.top_0, // 親の上端基準
            a.z_10, // z-indexを10に設定（コンテンツより手前）
            t.atoms.bg, // 基本背景色
            // テーマに応じた背景色を選択
            select(t.name, {
              light: t.atoms.bg, // ライトテーマ
              dark: t.atoms.bg_contrast_100, // ダークテーマ
              dim: t.atoms.bg_contrast_100, // ディムテーマ
            }),
            {
              borderTopLeftRadius: a.rounded_2xs.borderRadius, // 左上角を丸める
              borderBottomRightRadius: a.rounded_2xs.borderRadius, // 右下角を丸める
              width: ARROW_SIZE, // 矢印のサイズ
              height: ARROW_SIZE,
              transform: [{ rotate: '45deg' }], // 45度回転してダイヤモンド形に
              top: coords.tipTop, // 計算された矢印のtop位置
              left: coords.tipLeft, // 計算された矢印のleft位置
            },
          ]}
        />
        {/* コンテンツ本体 */}
        <View
          style={[
            a.px_md, // 横パディング（中サイズ）
            a.py_sm, // 縦パディング（小サイズ）
            a.rounded_sm, // 角丸（小サイズ）
            // テーマに応じた背景色
            select(t.name, {
              light: t.atoms.bg, // ライトテーマ
              dark: t.atoms.bg_contrast_100, // ダークテーマ
              dim: t.atoms.bg_contrast_100, // ディムテーマ
            }),
            t.atoms.shadow_md, // 中程度の影
            {
              shadowOpacity: 0.2, // 影の不透明度20%
              shadowOffset: {
                width: 0, // 横方向のオフセットなし
                // 縦方向のオフセット: 表示位置に応じて上下を反転
                height:
                  BUBBLE_SHADOW_OFFSET *
                  (coords.computedPosition === 'bottom' ? -1 : 1),
              },
            },
          ]}
          /**
           * onLayout: このViewのレイアウトが決定された時に呼ばれるコールバック
           * ここで吹き出しのサイズを計測し、位置計算に使用する
           *
           * [Goユーザー向け補足]
           * React Nativeのライフサイクルイベント。DOMのonLoadに類似
           */
          onLayout={e => {
            setBubbleMeasurements({
              width: e.nativeEvent.layout.width, // 実際の幅
              height: e.nativeEvent.layout.height, // 実際の高さ
            })
          }}>
          {children} {/* 吹き出し内に表示するコンテンツ */}
        </View>
      </Animated.View>
    </View>
  )
}

function oppposite(position: 'top' | 'bottom') {
  // 表示位置に応じてアニメーションの基準点を切り替える。
  switch (position) {
    case 'top':
      return 'center bottom'
    case 'bottom':
      return 'center top'
    default:
      return 'center'
  }
}

/**
 * TextBubbleは文字列を簡潔なツールチップとして表示するためのラッパー。
 */
export function TextBubble({ children }: { children: React.ReactNode }) {
  const c = Children.toArray(children)
  return (
    <Content label={c.join(' ')}>
      <View style={[a.gap_xs]}>
        {c.map((child, i) => (
          <Text key={i} style={[a.text_sm, a.leading_snug]}>
            {child}
          </Text>
        ))}
      </View>
    </Content>
  )
}
