/**
 * 日付フォーマット用カスタムフック
 *
 * このモジュールは date-fns ライブラリのローカライズされたフォーマッター関数を提供します。
 *
 * 【概要】
 * - アプリケーションがサポートする全言語に対応した日付フォーマット機能
 * - date-fns にデフォルトで含まれていない言語の場合は英語にフォールバック
 * - ユーザーの言語設定に基づいて自動的に適切なロケールを選択
 *
 * 【Go開発者向け補足】
 * - Reactの「カスタムフック」は、状態ロジックを再利用可能な関数として抽出するパターン
 * - Goの関数と異なり、Reactフックはコンポーネントのライフサイクルと結びついている
 * - useXxx という命名規則が慣例（Goでは特に命名規則はない）
 *
 * @see {@link https://github.com/date-fns/date-fns/blob/main/docs/i18n.md}
 */

// Reactライブラリ - フックを使用するために必要
import React from 'react'
// date-fnsライブラリ - 日付フォーマット機能とロケール型定義
import {formatDistance, type Locale} from 'date-fns'
// date-fns でサポートされている全ロケールをインポート
// 各ロケールオブジェクトには、その言語での月名、曜日名、相対時間表現などが含まれる
import {
  ca,     // カタルーニャ語
  cy,     // ウェールズ語
  da,     // デンマーク語
  de,     // ドイツ語
  el,     // ギリシャ語
  enGB,   // イギリス英語
  eo,     // エスペラント語
  es,     // スペイン語
  eu,     // バスク語
  fi,     // フィンランド語
  fr,     // フランス語
  fy,     // フリジア語
  gd,     // スコットランドゲール語
  gl,     // ガリシア語
  hi,     // ヒンディー語
  hu,     // ハンガリー語
  id,     // インドネシア語
  it,     // イタリア語
  ja,     // 日本語
  km,     // クメール語
  ko,     // 韓国語
  nl,     // オランダ語
  pl,     // ポーランド語
  pt,     // ポルトガル語（ポルトガル）
  ptBR,   // ポルトガル語（ブラジル）
  ro,     // ルーマニア語
  ru,     // ロシア語
  sv,     // スウェーデン語
  th,     // タイ語
  tr,     // トルコ語
  uk,     // ウクライナ語
  vi,     // ベトナム語
  zhCN,   // 中国語（簡体字）
  zhHK,   // 中国語（繁体字・香港）
  zhTW,   // 中国語（繁体字・台湾）
} from 'date-fns/locale'

// アプリケーションでサポートされる言語の型定義
import {type AppLanguage} from '#/locale/languages'
// ユーザーの言語設定を取得するフック
import {useLanguagePrefs} from '#/state/preferences'

/**
 * 言語コードからdate-fnsロケールオブジェクトへのマッピング
 *
 * 【仕組み】
 * - アプリの言語設定（AppLanguage）をキーとして、対応するdate-fnsロケールを保持
 * - undefined の言語は date-fns に含まれていないため、英語にフォールバック
 * - Record<K, V> はGoのmap[K]Vに相当するTypeScriptの型
 *
 * 【対応状況】
 * - サポート済み: 28言語（date-fnsに含まれている）
 * - 未サポート: 7言語（an, ast, ga, ia, ne など）→ 英語フォールバック
 *
 * @see {@link AppLanguage}
 */
const locales: Record<AppLanguage, Locale | undefined> = {
  en: undefined,           // 英語（デフォルト）- date-fnsのデフォルトなのでundefined
  an: undefined,           // アラゴン語 - date-fnsに未収録
  ast: undefined,          // アストゥリアス語 - date-fnsに未収録
  ca,                      // カタルーニャ語
  cy,                      // ウェールズ語
  da,                      // デンマーク語
  de,                      // ドイツ語
  el,                      // ギリシャ語
  ['en-GB']: enGB,         // イギリス英語
  eo,                      // エスペラント語
  es,                      // スペイン語
  eu,                      // バスク語
  fi,                      // フィンランド語
  fr,                      // フランス語
  fy,                      // フリジア語
  ga: undefined,           // アイルランド語 - date-fnsに未収録
  gd,                      // スコットランドゲール語
  gl,                      // ガリシア語
  hi,                      // ヒンディー語
  hu,                      // ハンガリー語
  ia: undefined,           // インターリングア - date-fnsに未収録
  id,                      // インドネシア語
  it,                      // イタリア語
  ja,                      // 日本語
  km,                      // クメール語
  ko,                      // 韓国語
  ne: undefined,           // ネパール語 - date-fnsに未収録
  nl,                      // オランダ語
  pl,                      // ポーランド語
  ['pt-PT']: pt,           // ポルトガル語（ポルトガル）
  ['pt-BR']: ptBR,         // ポルトガル語（ブラジル）
  ro,                      // ルーマニア語
  ru,                      // ロシア語
  sv,                      // スウェーデン語
  th,                      // タイ語
  tr,                      // トルコ語
  uk,                      // ウクライナ語
  vi,                      // ベトナム語
  ['zh-Hans-CN']: zhCN,    // 中国語（簡体字・中国）
  ['zh-Hant-HK']: zhHK,    // 中国語（繁体字・香港）
  ['zh-Hant-TW']: zhTW,    // 中国語（繁体字・台湾）
}

/**
 * ローカライズされた日付距離フォーマット関数を返すカスタムフック
 *
 * 【機能】
 * - 「3日前」「2時間後」のような相対時間表現をユーザーの言語で提供
 * - ユーザーの言語設定が変更されると、自動的に新しいロケールで再生成
 *
 * 【Go開発者向け補足 - useCallback】
 * - useCallback は関数をメモ化（キャッシュ）するReactフック
 * - Goには同等の概念はないが、パフォーマンス最適化のための仕組み
 * - 依存配列[appLanguage]が変わらない限り、同じ関数インスタンスを返す
 * - これにより、この関数を props として渡した子コンポーネントの不要な再レンダリングを防ぐ
 *
 * 【使用例】
 * ```typescript
 * const formatDistance = useFormatDistance()
 * const result = formatDistance(new Date(2024, 0, 1), new Date(2024, 0, 3))
 * // 日本語の場合: "2日"
 * // 英語の場合: "2 days"
 * ```
 *
 * @returns ローカライズされた formatDistance 関数
 * @see {@link formatDistance} - date-fnsの元の関数ドキュメント
 */
export function useFormatDistance() {
  // ユーザーの言語設定を取得（例: 'ja', 'en', 'es' など）
  const {appLanguage} = useLanguagePrefs()

  // useCallback: appLanguage が変わった時のみ関数を再生成
  // GoユーザーへのNote: これは関数のメモ化で、Goにはない概念
  // 依存配列 [appLanguage] に含まれる値が変わるまで、同じ関数を返す
  return React.useCallback<typeof formatDistance>(
    (date, baseDate, options) => {
      // 現在の言語に対応するロケールオブジェクトを取得
      // 対応するロケールがない場合は undefined となり、date-fnsは英語を使用
      const locale = locales[appLanguage as AppLanguage]

      // date-fns の formatDistance を呼び出し、ロケールオプションを追加
      // スプレッド構文 {...options} でオプションをマージ（Goの struct embedding に似ている）
      return formatDistance(date, baseDate, {...options, locale: locale})
    },
    [appLanguage], // 依存配列: appLanguage が変更された時のみ関数を再生成
  )
}
