/**
 * @fileoverview レポートダイアログコピー文字列フック
 *
 * レポート対象の種類に応じたUI文言（タイトル、サブタイトル）を
 * 生成するカスタムフック。国際化（i18n）に対応。
 *
 * @module components/moderation/ReportDialog/copy
 */

// React useMemoフック: 計算結果のメモ化
import {useMemo} from 'react'
// Lingui国際化ライブラリ
// msg: 翻訳メッセージID生成マクロ
import {msg} from '@lingui/macro'
// Lingui Reactフック: 翻訳関数を取得
import {useLingui} from '@lingui/react'

// レポート対象のパース済み型定義
import {ParsedReportSubject} from './types'

/**
 * レポート対象に応じたコピー文字列を取得するカスタムフック
 *
 * カスタムフックメモ（Go開発者向け）:
 * - Reactカスタムフック: use で始まる関数で、他のフックを呼び出し可能
 * - Go equivalent: ヘルパー関数や構造体メソッドに相当
 * - useMemoでメモ化し、subjectが変更された時のみ再計算
 *
 * @param subject - レポート対象の情報
 * @returns タイトルとサブタイトルを含むオブジェクト
 *
 * @example
 * const { title, subtitle } = useCopyForSubject(subject)
 * // title: "Report this user"
 * // subtitle: "Why should this user be reviewed?"
 */
export function useCopyForSubject(subject: ParsedReportSubject) {
  // useLingui: 翻訳関数を取得
  // _: メッセージ翻訳関数（Goのi18n.Tに相当）
  const {_} = useLingui()

  // useMemo: 計算結果をメモ化
  // 依存配列[_, subject]のいずれかが変更された時のみ再計算
  // Go equivalent: sync.Onceやキャッシュマップで同様の最適化を実現
  return useMemo(() => {
    // switch文でsubject.typeを判定（Discriminated Union）
    // Go equivalent: switch subject.Type() { case "account": ... }
    switch (subject.type) {
      case 'account': {
        return {
          title: _(msg`Report this user`),
          subtitle: _(msg`Why should this user be reviewed?`),
        }
      }
      case 'post': {
        return {
          title: _(msg`Report this post`),
          subtitle: _(msg`Why should this post be reviewed?`),
        }
      }
      case 'list': {
        return {
          title: _(msg`Report this list`),
          subtitle: _(msg`Why should this list be reviewed?`),
        }
      }
      case 'feed': {
        return {
          title: _(msg`Report this feed`),
          subtitle: _(msg`Why should this feed be reviewed?`),
        }
      }
      case 'starterPack': {
        return {
          title: _(msg`Report this starter pack`),
          subtitle: _(msg`Why should this starter pack be reviewed?`),
        }
      }
      case 'chatMessage': {
        return {
          title: _(msg`Report this message`),
          subtitle: _(msg`Why should this message be reviewed?`),
        }
      }
    }
  }, [_, subject]) // 依存配列: _（翻訳関数）とsubject（対象情報）
}
