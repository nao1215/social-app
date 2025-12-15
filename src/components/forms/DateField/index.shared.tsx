/**
 * 日付フィールド共通ボタンコンポーネント
 *
 * 【概要】
 * iOS/Androidで共通利用される日付選択ボタンコンポーネントです。
 * TextFieldの見た目を持ちながら、実際にはボタンとして機能し、
 * プラットフォームごとに異なる日付ピッカーを開きます。
 *
 * 【プラットフォーム別動作】
 * - iOS: ダイアログにインライン日付ピッカーを表示
 * - Android: モーダル形式の日付ピッカーを表示
 * - Web: ネイティブの<input type="date">を使用（このファイルは未使用）
 *
 * 【デザイン】
 * TextField.Inputと同じ見た目を持つが、入力不可のボタンとして動作
 *
 * @module DateField/index.shared - プラットフォーム共通の日付ボタンコンポーネント
 */

// React Nativeコアコンポーネント - タッチ可能なボタンとレイアウト
import {Pressable, View} from 'react-native'
// 国際化フック - 日付のローカライズ表示用
import {useLingui} from '@lingui/react'

// デザインシステム - スタイリング、テーマ、プラットフォーム固有処理
import {atoms as a, native, useTheme, web} from '#/alf'
// テキストフィールドコンポーネント群 - スタイル統一のため
import * as TextField from '#/components/forms/TextField'
// インタラクション状態管理 - ホバー、プレス、フォーカス状態の追跡
import {useInteractionState} from '#/components/hooks/useInteractionState'
// カレンダーアイコン - 日付フィールドの視覚的識別用
import {CalendarDays_Stroke2_Corner0_Rounded as CalendarDays} from '#/components/icons/CalendarDays'
// タイポグラフィコンポーネント - テキスト表示用
import {Text} from '#/components/Typography'

/**
 * DateFieldButton - 日付選択ボタンコンポーネント
 *
 * TextFieldのように見えるボタンで、プレス時にプラットフォーム固有の
 * 日付ピッカーを開きます。実際の入力フィールドではなく、視覚的な
 * 一貫性を保つためのボタンコンポーネントです。
 *
 * 【Go開発者向けメモ】
 * - 分割代入: {label, value, ...} = props（構造体のフィールド展開に相当）
 * - ?: オプショナルプロパティ（Goのポインタ型に相当）
 *
 * @param label - フィールドのラベル（アクセシビリティ用）
 * @param value - 現在の日付値（表示用）
 * @param onPress - ボタンがプレスされた時のハンドラー
 * @param isInvalid - バリデーションエラー状態
 * @param accessibilityHint - アクセシビリティヒント
 */
export function DateFieldButton({
  label,
  value,
  onPress,
  isInvalid,
  accessibilityHint,
}: {
  label: string
  value: string | Date
  onPress: () => void
  isInvalid?: boolean
  accessibilityHint?: string
}) {
  // 国際化インスタンス取得 - 日付を現在のロケールでフォーマット
  // Go開発者メモ: useLingui()はフックで、関数コンポーネント内でのみ使用可能
  const {i18n} = useLingui()
  // テーマ取得 - カラーパレットとダークモード対応
  const t = useTheme()

  // プレス状態管理 - ボタンが押されている状態を追跡
  // Go開発者メモ: useInteractionState()はカスタムフックで、状態とイベントハンドラーを返す
  const {
    state: pressed,      // プレス状態（true/false）
    onIn: onPressIn,     // プレス開始ハンドラー
    onOut: onPressOut,   // プレス終了ハンドラー
  } = useInteractionState()

  // ホバー状態管理 - マウスカーソルがボタン上にある状態を追跡（Web専用）
  const {
    state: hovered,      // ホバー状態
    onIn: onHoverIn,     // ホバー開始ハンドラー
    onOut: onHoverOut,   // ホバー終了ハンドラー
  } = useInteractionState()

  // フォーカス状態管理 - キーボードフォーカス状態を追跡
  const {state: focused, onIn: onFocus, onOut: onBlur} = useInteractionState()

  // TextFieldの共有スタイル取得 - 一貫した視覚的フィードバックのため
  // 各種インタラクション状態に応じたスタイルオブジェクトを取得
  const {chromeHover, chromeFocus, chromeError, chromeErrorHover} =
    TextField.useSharedInputStyles()

  return (
    // 外側のコンテナ - 全幅でポジション相対
    <View
      style={[a.relative, a.w_full]}
      // Web専用のマウスイベント処理を追加
      // Go開発者メモ: ...はスプレッド演算子でオブジェクトを展開（Goのスライス展開に類似）
      {...web({
        onMouseOver: onHoverIn,   // Web: マウスオーバー時にホバー状態ON
        onMouseOut: onHoverOut,   // Web: マウスアウト時にホバー状態OFF
      })}>
      {/*
        Pressable - タッチ可能なボタンコンポーネント
        Go開発者メモ: JSXはHTMLライクな構文でUIを記述（React特有の記法）
      */}
      <Pressable
        // アクセシビリティ属性 - スクリーンリーダー対応
        aria-label={label}                    // Web標準のARIAラベル
        accessibilityLabel={label}            // React Native用のラベル
        accessibilityHint={accessibilityHint} // 補足説明（操作方法など）
        // イベントハンドラー - ユーザーインタラクション処理
        onPress={onPress}         // タップ/クリック時
        onPressIn={onPressIn}     // プレス開始時
        onPressOut={onPressOut}   // プレス終了時
        onFocus={onFocus}         // フォーカス取得時
        onBlur={onBlur}           // フォーカス喪失時
        // スタイル配列 - 複数のスタイルを結合
        // Go開発者メモ: [...]は配列リテラル、条件に応じたスタイル適用が可能
        style={[
          // 基本スタイル - パディング、ボーダー設定
          {
            paddingLeft: 14,
            paddingRight: 14,
            borderColor: 'transparent',  // デフォルトでは透明ボーダー
            borderWidth: 2,              // 2pxのボーダー（状態変化で色が変わる）
          },
          // プラットフォーム固有スタイル
          native({
            paddingTop: 10,
            paddingBottom: 10,
          }),
          web(a.py_md),  // Web: 中サイズの縦パディング
          // レイアウトスタイル
          a.flex_row,         // 横並び（FlexDirectionRow）
          a.flex_1,           // フレックス成長率1
          a.w_full,           // 全幅
          a.rounded_sm,       // 小さい角丸
          t.atoms.bg_contrast_25,  // テーマの背景色（軽いコントラスト）
          a.align_center,     // 垂直中央揃え
          // インタラクション状態に応じたスタイル適用
          // Go開発者メモ: 三項演算子でスタイルを条件分岐
          hovered ? chromeHover : {},                           // ホバー時
          focused || pressed ? chromeFocus : {},                // フォーカスまたはプレス時
          isInvalid || isInvalid ? chromeError : {},            // エラー時
          (isInvalid || isInvalid) && (hovered || focused)      // エラー＋インタラクション時
            ? chromeErrorHover
            : {},
        ]}>
        {/* カレンダーアイコン - 日付フィールドであることを視覚的に示す */}
        <TextField.Icon icon={CalendarDays} />
        {/* 選択中の日付を表示するテキスト */}
        <Text
          style={[
            a.text_md,      // 中サイズのテキスト
            a.pl_xs,        // 左パディング（アイコンとの間隔）
            t.atoms.text,   // テーマのテキスト色
            // 行高さをフォントサイズの1.1875倍に設定（視認性向上）
            {lineHeight: a.text_md.fontSize * 1.1875},
          ]}>
          {/*
            日付をローカライズして表示
            Go開発者メモ: {}内はJavaScript式を埋め込む（テンプレート変数展開に類似）
            timeZone: 'UTC'で協定世界時として扱う（タイムゾーンの影響を排除）
          */}
          {i18n.date(value, {timeZone: 'UTC'})}
        </Text>
      </Pressable>
    </View>
  )
}
