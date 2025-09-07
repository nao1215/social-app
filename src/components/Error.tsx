// React Nativeの基本ビューコンポーネント
import {View} from 'react-native'
// Lingui国際化ライブラリ - メッセージの多言語対応
import {msg, Trans} from '@lingui/macro'   // 翻訳メッセージ用マクロ
import {useLingui} from '@lingui/react'   // Lingui Reactフック

// ナビゲーション用フック - 前のページに戻る機能
import {useGoBack} from '#/lib/hooks/useGoBack'
// 中央揃えレイアウトコンポーネント
import {CenteredView} from '#/view/com/util/Views'
// デザインシステム - スタイル、ブレイクポイント、テーマ
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// ボタンコンポーネントとボタンテキスト
import {Button, ButtonText} from '#/components/Button'
// タイポグラフィコンポーネント
import {Text} from '#/components/Typography'

/**
 * エラー表示コンポーネント - エラー状態をユーザーに表示し、適切なアクションを提供
 * Error display component showing error state with appropriate actions for users
 */
export function Error({
  title,          // エラータイトル
  message,        // エラーメッセージ
  onRetry,        // 再試行ハンドラー
  onGoBack,       // 戻るアクションハンドラー
  hideBackButton, // 戻るボタンを非表示にするフラグ
  sideBorders = true, // サイドボーダー表示フラグ（デフォルト: 表示）
}: {
  title?: string           // オプションのタイトル
  message?: string         // オプションのメッセージ
  onRetry?: () => unknown  // オプションの再試行コールバック
  onGoBack?: () => unknown // オプションの戻るコールバック
  hideBackButton?: boolean // オプションの戻るボタン非表示フラグ
  sideBorders?: boolean    // オプションのサイドボーダー表示フラグ
}) {
  const {_} = useLingui()           // 翻訳関数を取得
  const t = useTheme()              // 現在のテーマ取得
  const {gtMobile} = useBreakpoints() // モバイル以上のサイズかどうかのブレイクポイント
  const goBack = useGoBack(onGoBack) // 戻るアクションのハンドラーを取得

  return (
    <CenteredView
      style={[
        a.h_full_vh,                    // ビューポートの高さをフル活用
        a.align_center,                 // 中央揃え（横方向）
        a.gap_5xl,                      // 要素間の大きなギャップ
        !gtMobile && a.justify_between, // モバイルでは上下に分散配置
        t.atoms.border_contrast_low,    // 低コントラストボーダー
        {paddingTop: 175, paddingBottom: 110}, // 上下のパディング
      ]}
      sideBorders={sideBorders}> {/* サイドボーダーの表示制御 */}
      {/* エラー情報表示エリア */}
      <View style={[a.w_full, a.align_center, a.gap_lg]}>
        {/* エラータイトル */}
        <Text style={[a.font_bold, a.text_3xl]}>{title}</Text>
        {/* エラーメッセージ */}
        <Text
          style={[
            a.text_md,                      // 中サイズフォント
            a.text_center,                  // テキスト中央揃え
            t.atoms.text_contrast_high,     // 高コントラストテキスト色
            {lineHeight: 1.4},              // 行間設定
            gtMobile ? {width: 450} : [a.w_full, a.px_lg], // モバイル以上では固定幅、モバイルではフル幅+横パディング
          ]}>
          {message}
        </Text>
      </View>
      {/* アクションボタンエリア */}
      <View style={[a.gap_md, gtMobile ? {width: 350} : [a.w_full, a.px_lg]]}>
        {/* 再試行ボタン（再試行ハンドラーがある場合のみ表示） */}
        {onRetry && (
          <Button
            variant="solid"
            color="primary"  // プライマリカラー（選択しやすいアクション）
            label={_(msg`Press to retry`)} // アクセシビリティラベル
            onPress={onRetry}
            size="large"
            style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
            <ButtonText>
              <Trans>Retry</Trans> {/* 翻訳可能な「再試行」テキスト */}
            </ButtonText>
          </Button>
        )}
        {/* 戻るボタン（非表示フラグが立っていない場合のみ表示） */}
        {!hideBackButton && (
          <Button
            variant="solid"
            color={onRetry ? 'secondary' : 'primary'} // 再試行ボタンがある場合はセカンダリ、なければプライマリ
            label={_(msg`Return to previous page`)} // アクセシビリティラベル
            onPress={goBack}
            size="large"
            style={[a.rounded_sm, a.overflow_hidden, {paddingVertical: 10}]}>
            <ButtonText>
              <Trans>Go Back</Trans> {/* 翻訳可能な「戻る」テキスト */}
            </ButtonText>
          </Button>
        )}
      </View>
    </CenteredView>
  )
}
