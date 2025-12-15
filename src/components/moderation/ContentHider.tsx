/**
 * @fileoverview コンテンツ非表示コンポーネント
 *
 * モデレーションルールに基づいてコンテンツの表示/非表示を制御するコンポーネント。
 * ユーザーがコンテンツを表示するかどうかを選択できるインタラクティブなUIを提供。
 *
 * 主な機能:
 * - モデレーションUIに基づくコンテンツのブラー処理
 * - ユーザーによる表示オーバーライド機能
 * - ラベル情報の表示とローカライゼーション
 * - モデレーション詳細ダイアログとの連携
 *
 * @module components/moderation/ContentHider
 */

// Reactライブラリ: UIコンポーネントを構築するためのコアライブラリ
// Go equivalent: React.useStateはGoの変数宣言、React.useEffectはdefer/クリーンアップ処理に相当
import React from 'react'
// React Native基本コンポーネント: モバイル/Web共通のUI要素
// StyleProp: スタイルの型定義（Goの interface{} に相当するが型安全）
// View: コンテナコンポーネント（GoのDivに相当）
// ViewStyle: ビュースタイルの型定義
import {type StyleProp, View, type ViewStyle} from 'react-native'
// AT Protocolのモデレーション型定義
// ModerationUI: モデレーション決定のUI表現（ブラー、アラート、通知を含む）
import {type ModerationUI} from '@atproto/api'
// Lingui国際化ライブラリ: 翻訳マクロとコンポーネント
// msg: メッセージID生成マクロ、Trans: 翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
// Lingui Reactフック: ロケール情報と翻訳関数を取得
import {useLingui} from '@lingui/react'

// モデレーション関連のユーティリティ関数
// ADULT_CONTENT_LABELS: アダルトコンテンツのラベル定数配列
// isJustAMute: ミュートのみが原因かどうかを判定
import {ADULT_CONTENT_LABELS, isJustAMute} from '#/lib/moderation'
// グローバルラベルの翻訳文字列を取得するフック
import {useGlobalLabelStrings} from '#/lib/moderation/useGlobalLabelStrings'
// ラベル定義とローカライズ文字列を取得するユーティリティ
import {getDefinition, getLabelStrings} from '#/lib/moderation/useLabelInfo'
// モデレーション原因の説明情報を生成するフック
import {useModerationCauseDescription} from '#/lib/moderation/useModerationCauseDescription'
// 表示名のサニタイズ処理（XSS対策など）
import {sanitizeDisplayName} from '#/lib/strings/display-names'
// ラベル定義をユーザー設定から取得するフック
import {useLabelDefinitions} from '#/state/preferences'
// デザインシステム: atoms（スタイル定数）、ブレークポイント、テーマフック
import {atoms as a, useBreakpoints, useTheme, web} from '#/alf'
// ボタンコンポーネント
import {Button} from '#/components/Button'
// モデレーション詳細ダイアログとその制御フック
import {
  ModerationDetailsDialog,
  useModerationDetailsDialogControl,
} from '#/components/moderation/ModerationDetailsDialog'
// テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * コンテンツ非表示コンポーネント（メイン）
 *
 * モデレーションUIに基づいてコンテンツの表示を制御します。
 * ブラー（ぼかし）が必要な場合はContentHiderActiveを使用し、
 * そうでない場合は通常のViewとして表示します。
 *
 * @param testID - テスト識別子
 * @param modui - モデレーションUI情報（undefinedの場合は制限なし）
 * @param ignoreMute - ミュートを無視するかどうか
 * @param style - 通常時のスタイル
 * @param activeStyle - アクティブ時（ブラー表示時）のスタイル
 * @param childContainerStyle - 子要素コンテナのスタイル
 * @param children - 子要素またはレンダープロップ関数
 *
 * Go equivalentメモ:
 * - Props型は構造体タグに相当
 * - children関数型はGoのfunc(bool) interface{}に相当
 * - オプショナルプロパティ(?)はGoのポインタ型(*string)に類似
 */
export function ContentHider({
  testID,
  modui,
  ignoreMute,
  style,
  activeStyle,
  childContainerStyle,
  children,
}: {
  testID?: string
  modui: ModerationUI | undefined
  ignoreMute?: boolean
  style?: StyleProp<ViewStyle>
  activeStyle?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
  children?: React.ReactNode | ((props: {active: boolean}) => React.ReactNode)
}) {
  // ブラー対象の最初の原因を取得（オプショナルチェーン?.で安全にアクセス）
  // Go equivalent: if modui != nil { blur = modui.Blurs[0] }
  const blur = modui?.blurs[0]

  // ブラーが不要な場合は通常表示
  // 条件: ブラーなし、またはミュートのみでignoreMuteがtrue
  if (!blur || (ignoreMute && isJustAMute(modui))) {
    return (
      <View testID={testID} style={style}>
        {/*
          children関数型の場合は{active: false}で呼び出し
          Go equivalent: if fn, ok := children.(func(bool) interface{}); ok { return fn(false) }
        */}
        {typeof children === 'function' ? children({active: false}) : children}
      </View>
    )
  }

  // ブラーが必要な場合はContentHiderActiveを使用
  return (
    <ContentHiderActive
      testID={testID}
      modui={modui}
      style={[style, activeStyle]} // スタイル配列をマージ（スプレッド演算子）
      childContainerStyle={childContainerStyle}>
      {typeof children === 'function' ? children({active: true}) : children}
    </ContentHiderActive>
  )
}

/**
 * コンテンツ非表示コンポーネント（アクティブ状態）
 *
 * 実際にブラーされたコンテンツを表示するコンポーネント。
 * ユーザーがクリックして表示/非表示を切り替えられるUIを提供します。
 *
 * @param testID - テスト識別子
 * @param modui - モデレーションUI情報（必須）
 * @param style - コンテナスタイル
 * @param childContainerStyle - 子要素コンテナのスタイル
 * @param children - 子要素
 *
 * React.PropsWithChildrenメモ:
 * - Reactが提供するユーティリティ型
 * - childrenプロパティを自動的に追加
 * - Go equivalent: type PropsWithChildren[T] struct { T; Children interface{} }
 */
function ContentHiderActive({
  testID,
  modui,
  style,
  childContainerStyle,
  children,
}: React.PropsWithChildren<{
  testID?: string
  modui: ModerationUI
  style?: StyleProp<ViewStyle>
  childContainerStyle?: StyleProp<ViewStyle>
}>) {
  // useTheme: テーマ情報を取得（ダークモード対応など）
  // Go equivalent: theme := GetThemeFromContext(ctx)
  const t = useTheme()

  // useLingui: 国際化関数を取得
  // _: メッセージ翻訳関数（Goのi18n.Tに相当）
  const {_} = useLingui()

  // useBreakpoints: レスポンシブデザイン用のブレークポイント情報
  // gtMobile: モバイルより大きい画面かどうか（タブレット/デスクトップ）
  const {gtMobile} = useBreakpoints()

  // useState: コンポーネントのローカル状態管理
  // override: ユーザーが警告を無視してコンテンツを表示するかどうか
  // Go equivalent: var override bool
  // setOverride: 状態更新関数（Goの変数代入に相当するが、再レンダリングをトリガー）
  const [override, setOverride] = React.useState(false)

  // モデレーション詳細ダイアログの制御用フック
  // ダイアログの開閉状態を管理
  const control = useModerationDetailsDialogControl()

  // ユーザー設定からラベル定義を取得
  const {labelDefs} = useLabelDefinitions()

  // グローバルラベルの翻訳文字列を取得
  const globalLabelStrings = useGlobalLabelStrings()

  // 国際化インスタンスを取得（ロケール情報を含む）
  const {i18n} = useLingui()

  // ブラー原因を取得
  const blur = modui?.blurs[0]

  // モデレーション原因の説明情報を生成
  const desc = useModerationCauseDescription(blur)

  /**
   * ラベル名のメモ化計算
   *
   * useMemo: 計算結果をキャッシュして不要な再計算を防ぐ
   * Go equivalent: sync.OnceやキャッシュMap
   *
   * 複雑なロジック:
   * 1. ユーザー自身が設定したラベルの場合、複数のラベル名を結合
   * 2. アダルトコンテンツラベルは重複排除して1つのみ表示
   * 3. 最大2つのラベルを表示
   */
  const labelName = React.useMemo(() => {
    // ブラー情報がない場合は未定義を返す
    if (!modui?.blurs || !blur) {
      return undefined
    }

    // ラベル以外、またはユーザー自身が設定していないラベルの場合は
    // デフォルトの説明名を返す
    if (
      blur.type !== 'label' ||
      (blur.type === 'label' && blur.source.type !== 'user')
    ) {
      return desc.name
    }

    // アダルトコンテンツラベルの重複を防ぐフラグ
    let hasAdultContentLabel = false

    // ユーザー自身が設定したブラーラベルを抽出・処理
    const selfBlurNames = modui.blurs
      .filter(cause => {
        // ラベル型以外は除外
        if (cause.type !== 'label') {
          return false
        }
        // ユーザー自身が設定していないラベルは除外
        if (cause.source.type !== 'user') {
          return false
        }
        // アダルトコンテンツラベルの重複チェック
        if (ADULT_CONTENT_LABELS.includes(cause.label.val)) {
          // 既にアダルトラベルがある場合は除外
          if (hasAdultContentLabel) {
            return false
          }
          hasAdultContentLabel = true
        }
        return true
      })
      .slice(0, 2) // 最大2つのラベルのみ表示
      .map(cause => {
        // ラベル型でない場合はスキップ
        if (cause.type !== 'label') {
          return
        }

        // ラベル定義を取得
        const def = cause.labelDef || getDefinition(labelDefs, cause.label)

        // pornまたはsexualラベルは「Adult Content」として統一表示
        if (def.identifier === 'porn' || def.identifier === 'sexual') {
          return _(msg`Adult Content`)
        }

        // ローカライズされたラベル名を返す
        return getLabelStrings(i18n.locale, globalLabelStrings, def).name
      })

    // 自己ラベルがない場合はデフォルト名を使用
    if (selfBlurNames.length === 0) {
      return desc.name
    }

    // 重複を除去してカンマ区切りで結合
    // [...new Set(array)]: Setを使用して重複排除（スプレッド演算子で配列化）
    // Go equivalent: unique := make(map[string]struct{}); for _, v := range arr { unique[v] = struct{}{} }
    return [...new Set(selfBlurNames)].join(', ')
  }, [
    // 依存配列: これらの値が変更された時のみ再計算
    // Go equivalent: 関数の引数として渡される値
    _,
    modui?.blurs,
    blur,
    desc.name,
    labelDefs,
    i18n.locale,
    globalLabelStrings,
  ])

  return (
    <View testID={testID} style={[a.overflow_hidden, style]}>
      {/* モデレーション詳細を表示するダイアログ */}
      <ModerationDetailsDialog control={control} modcause={blur} />

      {/* メインの表示/非表示切り替えボタン */}
      <Button
        onPress={e => {
          // イベント伝播を防止（親要素へのクリックイベントを止める）
          // Go equivalent: event.StopPropagation()
          e.preventDefault()
          e.stopPropagation()

          // オーバーライド不可の場合は詳細ダイアログを開く
          if (!modui.noOverride) {
            // setOverride(v => !v): 関数形式の状態更新
            // 現在の値を基に新しい値を計算（トグル）
            // Go equivalent: override = !override
            setOverride(v => !v)
          } else {
            control.open()
          }
        }}
        label={desc.name}
        accessibilityHint={
          modui.noOverride
            ? _(msg`Learn more about the moderation applied to this content`)
            : override
              ? _(msg`Hides the content`)
              : _(msg`Shows the content`)
        }>
        {/* Render Props パターン: ボタンの状態を受け取る関数 */}
        {/* Go equivalent: func(state ButtonState) View */}
        {state => (
          <View
            style={[
              a.flex_row,
              a.w_full,
              a.justify_start,
              a.align_center,
              a.py_md,
              a.px_lg,
              a.gap_xs,
              a.rounded_sm,
              t.atoms.bg_contrast_25,
              // 条件付きスタイル（レスポンシブ対応）
              gtMobile && [a.gap_sm, a.py_lg, a.mt_xs, a.px_xl],
              // ホバー/プレス時のスタイル変更
              (state.hovered || state.pressed) && t.atoms.bg_contrast_50,
            ]}>
            {/* 警告アイコン */}
            <desc.icon
              size="md"
              fill={t.atoms.text_contrast_medium.color}
              style={{marginLeft: -2}}
            />
            {/* ラベル名テキスト */}
            <Text
              style={[
                a.flex_1,
                a.text_left,
                a.font_bold,
                a.leading_snug,
                gtMobile && [a.font_bold],
                t.atoms.text_contrast_medium,
                web({
                  marginBottom: 1,
                }),
              ]}
              numberOfLines={2}>
              {labelName}
            </Text>
            {/* オーバーライド可能な場合に表示/非表示ボタンを表示 */}
            {!modui.noOverride && (
              <Text
                style={[
                  a.font_bold,
                  a.leading_snug,
                  gtMobile && [a.font_bold],
                  t.atoms.text_contrast_high,
                  web({
                    marginBottom: 1,
                  }),
                ]}>
                {/* 三項演算子: override ? 'Hide' : 'Show' */}
                {/* Go equivalent: if override { return "Hide" } else { return "Show" } */}
                {override ? <Trans>Hide</Trans> : <Trans>Show</Trans>}
              </Text>
            )}
          </View>
        )}
      </Button>

      {/* ラベルソース情報の表示（ラベル作成者） */}
      {/* 条件: ソース情報あり、ラベル型、オーバーライドしていない */}
      {desc.source && blur.type === 'label' && !override && (
        <Button
          onPress={e => {
            e.preventDefault()
            e.stopPropagation()
            control.open()
          }}
          label={_(
            msg`Learn more about the moderation applied to this content`,
          )}
          style={[a.pt_sm]}>
          {state => (
            <Text
              style={[
                a.flex_1,
                a.text_sm,
                a.font_normal,
                a.leading_snug,
                t.atoms.text_contrast_medium,
                a.text_left,
              ]}>
              {/* ラベル作成者の表示 */}
              {desc.sourceType === 'user' ? (
                <Trans>Labeled by the author.</Trans>
              ) : (
                // sanitizeDisplayName: XSS攻撃を防ぐため表示名をサニタイズ
                <Trans>Labeled by {sanitizeDisplayName(desc.source!)}.</Trans>
              )}{' '}
              {/* "Learn more"リンク */}
              <Text
                style={[
                  {color: t.palette.primary_500},
                  a.text_sm,
                  // ホバー時にアンダーラインを表示（Web限定）
                  state.hovered && [web({textDecoration: 'underline'})],
                ]}>
                <Trans>Learn more.</Trans>
              </Text>
            </Text>
          )}
        </Button>
      )}

      {/* オーバーライド時のみ子要素を表示 */}
      {override && <View style={childContainerStyle}>{children}</View>}
    </View>
  )
}
