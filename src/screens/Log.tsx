/**
 * @file Log.tsx
 * @description システムログ表示画面コンポーネント
 *
 * アプリケーション内で記録されたログエントリを時系列で表示する開発者向けツール画面。
 * ログの詳細情報（メタデータ）を展開/折りたたみ可能で、デバッグやトラブルシューティングに使用。
 *
 * 主な機能:
 * - ログエントリのリスト表示
 * - ログレベル別のアイコン表示（info/warn/error）
 * - 詳細メタデータの展開/折りたたみ
 * - 相対時間表示（"5分前"など）
 *
 * Go開発者向け補足:
 * - useState: コンポーネント内のローカル状態管理。値が変わるとUIが再描画される
 * - useCallback: 関数のメモ化。依存配列が変わらない限り同じ関数インスタンスを返す
 * - useFocusEffect: 画面がフォーカスされた時に実行される副作用フック
 * - LayoutAnimation: UIの変更時にアニメーションを適用（iOSのUIView.animateに相当）
 */

// React関連のインポート - Reactフックとネイティブコンポーネント
// Go開発者向け: useCallbackとuseStateはReactの状態管理の基本フック
import {useCallback, useState} from 'react'
import {LayoutAnimation, View} from 'react-native'
import {Pressable} from 'react-native'
// 国際化関連 - メッセージと翻訳コンポーネント
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// ナビゲーション関連 - 画面フォーカス時の効果フック
import {useFocusEffect} from '@react-navigation/native'

// 時間表示 - 相対時間表示フック（"5分前"など）
import {useGetTimeAgo} from '#/lib/hooks/useTimeAgo'
// ルーティング型定義 - 画面パラメータの型情報
// Go開発者向け: typeはGoのstructに相当する型エイリアス
import {
  type CommonNavigatorParams,
  type NativeStackScreenProps,
} from '#/lib/routes/types'
// ログダンプ - システムログエントリの取得
import {getEntries} from '#/logger/logDump'
// UI状態管理 - 毎分更新のティック、最小シェルモード設定
import {useTickEveryMinute} from '#/state/shell'
import {useSetMinimalShellMode} from '#/state/shell'
// スタイリングシステム - CSSアトムとテーマ
import {atoms as a, useTheme} from '#/alf'
// シェブロンアイコン - 展開/折りたたみのUI
import {
  ChevronBottom_Stroke2_Corner0_Rounded as ChevronBottomIcon,
  ChevronTop_Stroke2_Corner0_Rounded as ChevronTopIcon,
} from '#/components/icons/Chevron'
// 情報アイコン - 通常ログ用
import {CircleInfo_Stroke2_Corner0_Rounded as CircleInfoIcon} from '#/components/icons/CircleInfo'
// 警告アイコン - エラー・警告ログ用
import {Warning_Stroke2_Corner0_Rounded as WarningIcon} from '#/components/icons/Warning'
// レイアウトコンポーネント - 画面レイアウト構造
import * as Layout from '#/components/Layout'
// タイポグラフィ - テキストコンポーネント
import {Text} from '#/components/Typography'

/**
 * システムログ画面コンポーネント
 *
 * アプリケーション内で記録された全てのログエントリを表示。
 * 各ログはクリックで詳細メタデータを展開可能。
 *
 * ログレベル:
 * - info: 通常の情報ログ（CircleInfoアイコン）
 * - warn: 警告ログ（Warningアイコン）
 * - error: エラーログ（Warningアイコン、赤色）
 *
 * @param props - React Navigation画面プロパティ
 *
 * Go開発者向け:
 * - この関数はGoの関数と同様だが、JSX（UI記述）を返す
 * - propsパラメータは使用していないが、型定義により画面として登録される
 */
export function LogScreen({}: NativeStackScreenProps<
  CommonNavigatorParams,
  'Log'
>) {
  // テーマフック - カラーとスタイルの管理
  const t = useTheme()
  // 国際化フック - UI文字列の翻訳
  const {_} = useLingui()
  // 最小シェルモード設定 - ヘッダー/フッターの表示制御
  const setMinimalShellMode = useSetMinimalShellMode()
  // 展開状態 - 展開中のログエントリIDの配列（Go開発者向け: []string型に相当）
  const [expanded, setExpanded] = useState<string[]>([])
  // 時間表示フック - 相対時間文字列生成関数
  const timeAgo = useGetTimeAgo()
  // 毎分ティック - 相対時間表示の自動更新用（"5分前" → "6分前"）
  const tick = useTickEveryMinute()

  /**
   * 画面フォーカス時の効果
   * 画面が表示される度に最小シェルモードを無効化（フルUIを表示）
   *
   * Go開発者向け:
   * - useFocusEffectは画面のライフサイクルフック
   * - useCallbackは関数をメモ化し、不要な再実行を防ぐ
   */
  useFocusEffect(
    useCallback(() => {
      setMinimalShellMode(false)
    }, [setMinimalShellMode]),
  )

  /**
   * ログエントリの展開/折りたたみトグラー
   * アニメーション付きで詳細情報の表示を切り替え
   *
   * @param id - ログエントリの一意ID
   * @returns トグル実行関数
   *
   * Go開発者向け:
   * - カリー化された関数（id => () => {...}）でクロージャを作成
   * - LayoutAnimationはiOSのUIView.animateに相当
   */
  const toggler = (id: string) => () => {
    // 次のレイアウト変更にイージングアニメーションを適用
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut)
    if (expanded.includes(id)) {
      // 既に展開中の場合は折りたたむ（配列から削除）
      setExpanded(expanded.filter(v => v !== id))
    } else {
      // 折りたたまれている場合は展開（配列に追加）
      setExpanded([...expanded, id])
    }
  }

  // UIのレンダリング - ログエントリのリスト表示
  return (
    <Layout.Screen>
      {/* ヘッダー - 戻るボタンとタイトル */}
      <Layout.Header.Outer>
        <Layout.Header.BackButton />
        <Layout.Header.Content>
          <Layout.Header.TitleText>
            <Trans>System log</Trans>
          </Layout.Header.TitleText>
        </Layout.Header.Content>
        <Layout.Header.Slot />
      </Layout.Header.Outer>
      {/* コンテンツ - ログエントリのリスト */}
      <Layout.Content>
        {/* 全ログエントリを取得してマップ（Go開発者向け: for rangeループに相当） */}
        {getEntries()
          .slice(0) // 配列のコピーを作成（元配列を保護）
          .map(entry => {
            return (
              <View key={`entry-${entry.id}`}>
                {/* ログエントリ行 - クリックで詳細を展開/折りたたみ */}
                <Pressable
                  style={[
                    a.flex_row,
                    a.align_center,
                    a.py_md,
                    a.px_sm,
                    a.border_b,
                    t.atoms.border_contrast_low,
                    t.atoms.bg,
                    a.gap_sm,
                  ]}
                  onPress={toggler(entry.id)}
                  accessibilityLabel={_(msg`View debug entry`)}
                  accessibilityHint={_(
                    msg`Opens additional details for a debug entry`,
                  )}>
                  {/* ログレベル別アイコン - warn/errorは警告アイコン、それ以外は情報アイコン */}
                  {entry.level === 'warn' || entry.level === 'error' ? (
                    <WarningIcon size="sm" fill={t.palette.negative_500} />
                  ) : (
                    <CircleInfoIcon size="sm" />
                  )}
                  {/* ログメッセージエリア - コンテキストとメッセージを表示 */}
                  <View
                    style={[
                      a.flex_1,
                      a.flex_row,
                      a.justify_start,
                      a.align_center,
                      a.gap_sm,
                    ]}>
                    {/* コンテキスト - ログの発生元やカテゴリ */}
                    {entry.context && (
                      <Text style={[t.atoms.text_contrast_medium]}>
                        ({String(entry.context)})
                      </Text>
                    )}
                    {/* メッセージ本文 */}
                    <Text>{String(entry.message)}</Text>
                  </View>
                  {/* シェブロンアイコン - メタデータがある場合のみ表示 */}
                  {entry.metadata &&
                    Object.keys(entry.metadata).length > 0 &&
                    (expanded.includes(entry.id) ? (
                      <ChevronTopIcon
                        size="sm"
                        style={[t.atoms.text_contrast_low]}
                      />
                    ) : (
                      <ChevronBottomIcon
                        size="sm"
                        style={[t.atoms.text_contrast_low]}
                      />
                    ))}
                  {/* タイムスタンプ - 相対時間表示（"5分前"など） */}
                  <Text style={[{minWidth: 40}, t.atoms.text_contrast_medium]}>
                    {timeAgo(entry.timestamp, tick)}
                  </Text>
                </Pressable>
                {/* メタデータ詳細 - 展開時のみ表示 */}
                {expanded.includes(entry.id) && (
                  <View
                    style={[
                      t.atoms.bg_contrast_25,
                      a.rounded_xs,
                      a.p_sm,
                      a.border_b,
                      t.atoms.border_contrast_low,
                    ]}>
                    <View style={[a.px_sm, a.py_xs]}>
                      {/* JSON整形表示 - 等幅フォントで見やすく */}
                      <Text style={[a.leading_snug, {fontFamily: 'monospace'}]}>
                        {JSON.stringify(entry.metadata, null, 2)}
                      </Text>
                    </View>
                  </View>
                )}
              </View>
            )
          })}
      </Layout.Content>
    </Layout.Screen>
  )
}
