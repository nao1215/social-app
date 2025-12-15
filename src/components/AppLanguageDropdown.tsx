/**
 * @file AppLanguageDropdown.tsx
 * @description アプリ言語選択ドロップダウンコンポーネント - UIの表示言語を切り替える
 *
 * このファイルは、アプリケーション全体の表示言語を選択するためのドロップダウンUIを提供します。
 * 言語変更時には、フィード投稿のキャッシュをリセットして新しい言語設定で再取得します。
 *
 * ## Goユーザー向け概要
 *
 * ### React固有の概念
 * - **useCallback**: 関数をメモ化するフック。依存配列の値が変わらない限り同じ関数インスタンスを再利用
 * - **useQueryClient**: TanStack Query（React Query）のクライアント取得
 *   → Goのhttpクライアントに似ているが、キャッシュ管理・再取得・無効化などの機能を持つ
 */

// Reactのコアライブラリ
import React from 'react'
// Lingui国際化ライブラリ - 翻訳メッセージ用
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'
// TanStack Query（React Query）のクライアント取得フック
// → キャッシュ管理、クエリの無効化、再取得などを行うクライアント
import {useQueryClient} from '@tanstack/react-query'

// 言語設定のサニタイズ - 不正な言語コードを補正
import {sanitizeAppLanguageSetting} from '#/locale/helpers'
// 対応言語リスト - 全てのサポート言語の定義
import {APP_LANGUAGES} from '#/locale/languages'
// 言語設定の取得と更新フック
import {useLanguagePrefs, useLanguagePrefsApi} from '#/state/preferences'
// 投稿フィードクエリのリセット - 言語変更時にキャッシュをクリア
import {resetPostsFeedQueries} from '#/state/queries/post-feed'
// デザインシステム - スタイリング、プラットフォーム判定、テーマ
import {atoms as a, platform, useTheme} from '#/alf'
// セレクトコンポーネント - ドロップダウン選択UI
import * as Select from '#/components/Select'
// ボタンコンポーネント
import {Button} from './Button'

/**
 * アプリ言語選択ドロップダウンコンポーネント
 * App language selection dropdown component
 *
 * Goユーザー向け補足:
 * - この関数コンポーネントは、Goの関数とstructを組み合わせたようなもの
 * - 状態管理（useState, useCallback）とUI描画を1つの関数内で行う
 * - 再レンダリング時に再実行されるが、フックのメモ化により効率的に動作
 */
export function AppLanguageDropdown() {
  const t = useTheme()      // テーマ取得（色・スタイル）
  const {_} = useLingui()   // 翻訳関数取得

  // クエリクライアント取得 - キャッシュ管理とクエリ操作用
  const queryClient = useQueryClient()
  // 現在の言語設定を取得
  const langPrefs = useLanguagePrefs()
  // 言語設定を更新するAPI取得
  const setLangPrefs = useLanguagePrefsApi()
  // 現在の言語をサニタイズ（不正な値を補正）
  const sanitizedLang = sanitizeAppLanguageSetting(langPrefs.appLanguage)

  /**
   * 言語変更ハンドラー
   *
   * Goユーザー向け補足:
   * - useCallbackでメモ化された関数（不要な再作成を防ぐ）
   * - 依存配列: sanitizedLang, setLangPrefs, queryClient
   *   → これらが変わった時のみ関数を再作成
   *
   * @param value - 選択された言語コード（例: 'ja', 'en'）
   */
  const onChangeAppLanguage = React.useCallback(
    (value: string) => {
      // 空文字列チェック - 不正な値の場合は早期リターン
      if (!value) return
      // 現在の言語と異なる場合のみ更新
      if (sanitizedLang !== value) {
        setLangPrefs.setAppLanguage(sanitizeAppLanguageSetting(value))
      }

      // フィードをリセットして新しい言語でコンテンツを再取得
      // Goユーザー向け補足: キャッシュをクリアして再フェッチを促す処理
      resetPostsFeedQueries(queryClient)
    },
    [sanitizedLang, setLangPrefs, queryClient],
  )

  return (
    // Selectルートコンポーネント - ドロップダウン全体のコンテナ
    <Select.Root
      value={sanitizeAppLanguageSetting(langPrefs.appLanguage)}  // 現在選択されている値
      onValueChange={onChangeAppLanguage}>  // 値変更時のハンドラー
      {/* セレクトトリガー - ドロップダウンを開くボタン */}
      <Select.Trigger label={_(msg`Change app language`)}>
        {/* Render Props パターン - トリガーの状態に応じてボタンを動的生成 */}
        {({props}) => (
          <Button
            {...props}  // Selectから渡されたプロパティを展開
            label={props.accessibilityLabel}
            // プラットフォームごとにサイズを変更
            // Goユーザー向け補足: platform関数で環境判定（Web/iOS/Android）
            size={platform({
              web: 'tiny',      // Web: 極小サイズ
              native: 'small',  // モバイル: 小サイズ
            })}
            variant="ghost"   // ゴースト（透明背景）バリアント
            color="secondary" // セカンダリカラー
            style={[
              a.pr_xs,  // 右パディング（極小）
              a.pl_sm,  // 左パディング（小）
              // プラットフォーム別スタイル
              platform({
                web: [{alignSelf: 'flex-start'}, a.gap_sm],  // Web: 左寄せ、小ギャップ
                native: [a.gap_xs],                          // モバイル: 極小ギャップ
              }),
            ]}>
            {/* 選択された値のテキスト表示 */}
            <Select.ValueText
              placeholder={_(msg`Select an app language`)}  // プレースホルダー
              style={[t.atoms.text_contrast_medium]}        // 中コントラストテキスト色
            />
            {/* ドロップダウンアイコン（下向き矢印） */}
            <Select.Icon style={[t.atoms.text_contrast_medium]} />
          </Button>
        )}
      </Select.Trigger>
      {/* セレクトコンテンツ - ドロップダウンで表示される選択肢リスト */}
      <Select.Content
        // 各アイテムのレンダリング関数
        renderItem={({label, value}) => (
          <Select.Item value={value} label={label}>
            <Select.ItemIndicator />  {/* 選択インジケーター（チェックマーク） */}
            <Select.ItemText>{label}</Select.ItemText>  {/* アイテムテキスト */}
          </Select.Item>
        )}
        // 言語リストをアイテム配列に変換
        // Goユーザー向け補足: mapはGoのfor rangeに相当（新しいスライスを生成）
        items={APP_LANGUAGES.map(l => ({
          label: l.name,    // 表示名（例: 'Japanese'）
          value: l.code2,   // 言語コード（例: 'ja'）
        }))}
      />
    </Select.Root>
  )
}
