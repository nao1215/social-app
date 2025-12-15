/**
 * @file ActionsWrapper.tsx
 * @description ダイレクトメッセージのメッセージアイテム用アクションラッパーコンポーネント (React Native版)
 *
 * このファイルは、React Nativeプラットフォーム（iOS/Android）専用のメッセージアクションラッパーを提供します。
 * メッセージに対してコンテキストメニュー（長押しメニュー）を表示し、メッセージのコピー、削除、
 * 通報などのアクションを実行可能にします。
 *
 * ◆ Go開発者向けの注意点:
 * - このファイルは「プラットフォーム固有実装」です（Web版は別ファイル ActionsWrapper.web.tsx）
 * - React Nativeでは、ファイル名の拡張子(.tsx, .web.tsx, .ios.tsx等)でプラットフォーム別コードを切り替え可能
 * - Goでいうビルドタグ(//go:build)に近い仕組みです
 */

// React Native標準コンポーネント
// GoのHTML template相当のUI構築要素
import {View} from 'react-native'
// AT Protocolの型定義 - チャット関連のスキーマ定義
import {type ChatBskyConvoDefs} from '@atproto/api'
// 国際化対応 - メッセージ定義用のマクロ関数（Goのi18nライブラリに相当）
import {msg} from '@lingui/macro'
// 国際化対応 - 多言語翻訳フック（実行時に言語を切り替える）
import {useLingui} from '@lingui/react'

// アトミックスタイルシステム - 再利用可能なスタイル定義（Tailwind CSSに類似）
import {atoms as a} from '#/alf'
// メッセージコンテキストメニューコンポーネント
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'

/**
 * ActionsWrapper コンポーネント
 *
 * @description
 * React Nativeプラットフォーム用のメッセージアクションラッパー。
 * メッセージを長押しすると、アクションメニュー（コピー、削除、通報など）を表示します。
 *
 * ◆ Reactのコンポーネントパターン（Goの関数との違い）:
 * - Reactコンポーネントは関数として定義されますが、JSX（HTML風の構文）を返します
 * - Goのテンプレートエンジン(html/template)とは異なり、コンポーネント内でロジックと描画を統合
 * - 戻り値のJSXは、最終的にネイティブUI（iOS: UIView, Android: View）に変換されます
 *
 * @param {Object} props - コンポーネントのプロパティ（Goの構造体フィールドに相当）
 * @param {ChatBskyConvoDefs.MessageView} props.message - 表示するメッセージオブジェクト
 * @param {boolean} props.isFromSelf - メッセージが自分自身からのものか（送信者判定）
 * @param {React.ReactNode} props.children - ラップされる子要素（メッセージUI本体）
 *
 * @returns {JSX.Element} メッセージラッパーのUI要素
 *
 * ◆ 処理フロー:
 * 1. useLinguiフックで多言語対応の翻訳関数を取得
 * 2. MessageContextMenuでメッセージ全体をラップ
 * 3. ネイティブプラットフォームでのみアクセシビリティアクションを有効化
 * 4. メッセージの送信者に応じて配置を調整（自分: 右寄せ、他人: 左寄せ）
 */
export function ActionsWrapper({
  message,
  isFromSelf,
  children,
}: {
  message: ChatBskyConvoDefs.MessageView
  isFromSelf: boolean
  children: React.ReactNode
}) {
  /**
   * useLingui - 国際化対応フック
   *
   * ◆ Reactフックとは（Goとの対比）:
   * - Goでは状態管理にグローバル変数や構造体フィールドを使用
   * - Reactでは「フック」というパターンで、コンポーネント内に状態やロジックを注入
   * - `_` は翻訳関数（Goの i18n.Translate に相当）
   */
  const {_} = useLingui()

  return (
    // MessageContextMenu: コンテキストメニュー機能を提供するラッパー
    <MessageContextMenu message={message}>
      {/*
        ◆ Render Propsパターン:
        - 子要素として関数を渡すパターン（Goにはない概念）
        - triggerオブジェクトにはメニュー制御用のメソッドとプロパティが含まれる
      */}
      {trigger =>
        // will always be true, since this file is platform split
        // このファイルはプラットフォーム分割されているため、常にtrueになります
        trigger.isNative && (
          <View style={[a.flex_1, a.relative]}>
            {/*
              ◆ アクセシビリティ対応（スクリーンリーダー用）:
              - accessible: この要素がアクセシブルであることを宣言
              - accessibilityActions: 実行可能なアクションを定義
              - onAccessibilityAction: アクションが実行された時の処理

              Goでの類似概念: WAI-ARIA属性を手動でHTMLに追加するのに相当
            */}
            <View
              style={[
                {maxWidth: '80%'}, // メッセージの最大幅を画面の80%に制限
                isFromSelf
                  ? [a.self_end, a.align_end] // 自分のメッセージ: 右寄せ
                  : [a.self_start, a.align_start], // 他人のメッセージ: 左寄せ
              ]}
              accessible={true}
              accessibilityActions={[
                {name: 'activate', label: _(msg`Open message options`)},
              ]}
              onAccessibilityAction={() => trigger.control.open('full')}>
              {/* 実際のメッセージコンテンツを表示 */}
              {children}
            </View>
          </View>
        )
      }
    </MessageContextMenu>
  )
}
