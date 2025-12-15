/**
 * @file ActionsWrapper.web.tsx
 * @description ダイレクトメッセージのメッセージアイテム用アクションラッパーコンポーネント (Web版)
 *
 * このファイルは、Webプラットフォーム専用のメッセージアクションラッパーを提供します。
 * マウスホバー時に絵文字リアクションとメニューボタンを表示し、ユーザーがメッセージに対して
 * アクション（絵文字追加、コピー、削除、通報など）を実行できるようにします。
 *
 * ◆ Go開発者向けの注意点:
 * - このファイルは「Web専用実装」です（Native版は ActionsWrapper.tsx）
 * - Webではホバーイベントが使用可能（モバイルでは長押し）
 * - React Nativeの.web.tsx拡張子は、Webビルド時のみ優先的にインポートされます
 */

// ◆ Reactフックのインポート（Goのパッケージインポートに相当）
// - useCallback: 関数のメモ化（再レンダリング時の関数再生成を防ぐ）
// - useRef: DOM要素への参照保持（Goのポインタに類似）
// - useState: コンポーネントの状態管理（再レンダリングをトリガー）
import {useCallback, useRef, useState} from 'react'
// React Native Web標準コンポーネント（Web上でネイティブUIをエミュレート）
import {Pressable, View} from 'react-native'
// AT Protocolの型定義 - チャットメッセージスキーマ
import {type ChatBskyConvoDefs} from '@atproto/api'
// 国際化対応 - メッセージ定義マクロ
import {msg} from '@lingui/macro'
// 国際化対応 - 翻訳関数提供フック
import {useLingui} from '@lingui/react'
// TypeScript型定義のインポート
import type React from 'react'

// アクティブな会話状態を管理するカスタムフック
import {useConvoActive} from '#/state/messages/convo'
// 現在のセッション情報（ログインユーザー情報）を取得するフック
import {useSession} from '#/state/session'
// トースト通知を表示するユーティリティ
import * as Toast from '#/view/com/util/Toast'
// アトミックスタイルシステムとテーマフック
import {atoms as a, useTheme} from '#/alf'
// メッセージコンテキストメニューコンポーネント
import {MessageContextMenu} from '#/components/dms/MessageContextMenu'
// ドットグリッドアイコン（メニューボタン用）
import {DotGrid_Stroke2_Corner0_Rounded as DotsHorizontalIcon} from '#/components/icons/DotGrid'
// 笑顔絵文字アイコン（絵文字ピッカー起動用）
import {EmojiSmile_Stroke2_Corner0_Rounded as EmojiSmileIcon} from '#/components/icons/Emoji'
// 絵文字リアクションピッカーコンポーネント
import {EmojiReactionPicker} from './EmojiReactionPicker'
// リアクション上限チェック用ユーティリティ関数
import {hasReachedReactionLimit} from './util'

/**
 * ActionsWrapper コンポーネント (Web版)
 *
 * @description
 * Webプラットフォーム用のメッセージアクションラッパー。
 * マウスホバーまたはキーボードフォーカス時に、絵文字リアクションボタンと
 * コンテキストメニューボタンを表示します。
 *
 * ◆ React StateとGoの違い:
 * - Goでは構造体フィールドで状態を管理し、明示的に再描画を呼び出す
 * - ReactではuseStateで状態を管理し、状態変更時に自動的に再レンダリング
 * - 状態の更新は非同期で行われる（Goの即座の代入とは異なる）
 *
 * @param {Object} props - コンポーネントのプロパティ
 * @param {ChatBskyConvoDefs.MessageView} props.message - 表示するメッセージオブジェクト
 * @param {boolean} props.isFromSelf - メッセージが自分自身からのものか
 * @param {React.ReactNode} props.children - ラップされる子要素（メッセージUI本体）
 *
 * @returns {JSX.Element} メッセージラッパーのUI要素
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
   * ◆ useRefフック - DOM要素への参照を保持
   *
   * Goでの類似概念:
   * - Goのポインタ変数に似ていますが、Reactのライフサイクルを通じて値を保持
   * - 値の変更は再レンダリングをトリガーしない（useStateとの違い）
   * - DOM操作やイベント処理で要素にアクセスする際に使用
   */
  const viewRef = useRef(null)

  // テーマ情報を取得（ライトモード/ダークモードの色設定など）
  const t = useTheme()
  // 多言語翻訳関数を取得
  const {_} = useLingui()
  // アクティブな会話（チャット）の状態を取得
  const convo = useConvoActive()
  // 現在ログイン中のアカウント情報を取得
  const {currentAccount} = useSession()

  /**
   * ◆ useStateフック - コンポーネントの状態管理
   *
   * Goでの類似概念:
   * - Goでは構造体フィールドやグローバル変数で状態を管理
   * - Reactでは useState で状態を宣言し、setShowActions で更新
   * - 状態の更新は再レンダリングをトリガーし、UIが自動的に更新される
   *
   * showActions: アクションボタン（絵文字、メニュー）の表示/非表示状態
   */
  const [showActions, setShowActions] = useState(false)

  /**
   * ◆ useCallbackフック - 関数のメモ化
   *
   * Goでの類似概念:
   * - Goでは関数は通常再利用されるが、Reactでは再レンダリング時に関数が再生成される
   * - useCallbackは関数を「記憶」し、依存配列が変わらない限り同じ関数インスタンスを返す
   * - パフォーマンス最適化のため、子コンポーネントへの props 渡しで使用
   *
   * マウスが要素に入った時にアクションボタンを表示
   */
  const onMouseEnter = useCallback(() => {
    setShowActions(true)
  }, []) // 依存配列が空なので、この関数は常に同じインスタンス

  /**
   * マウスが要素から離れた時にアクションボタンを非表示
   */
  const onMouseLeave = useCallback(() => {
    setShowActions(false)
  }, [])

  /**
   * フォーカスイベントハンドラ
   *
   * ◆ イベント処理の詳細:
   * - キーボードフォーカスが移動した際に呼び出される
   * - relatedTarget: フォーカスを失った要素（移動元）
   * - relatedTargetがnullの場合、ドロップダウンメニューが閉じた後のフォーカス復帰なので無視
   *
   * Goでの類似概念:
   * - Goではイベントループでイベントを手動処理
   * - Reactではイベントハンドラを宣言的に定義し、フレームワークが自動的に処理
   */
  const onFocus = useCallback<React.FocusEventHandler>(e => {
    // ドロップダウンメニューが閉じた後のフォーカス復帰は無視
    if (e.nativeEvent.relatedTarget == null) return
    setShowActions(true)
  }, [])

  /**
   * 絵文字選択時の処理
   *
   * ◆ 処理フロー:
   * 1. 既に同じ絵文字でリアクションしているか確認
   * 2. 既にリアクション済み → リアクションを削除
   * 3. 未リアクション → 新規リアクションを追加
   * 4. エラー発生時はトースト通知を表示
   *
   * ◆ 非同期処理とエラーハンドリング（Goとの対比）:
   * - Goでは `if err != nil` でエラーチェック
   * - JavaScriptでは Promise の .catch() でエラーハンドリング
   * - convo.removeReaction() と convo.addReaction() は非同期関数
   */
  const onEmojiSelect = useCallback(
    (emoji: string) => {
      // 既に同じ絵文字でリアクション済みか確認
      if (
        message.reactions?.find(
          reaction =>
            reaction.value === emoji &&
            reaction.sender.did === currentAccount?.did,
        )
      ) {
        // リアクション削除（楽観的更新 - UIは即座に更新、バックエンドは非同期）
        convo
          .removeReaction(message.id, emoji)
          .catch(() => Toast.show(_(msg`Failed to remove emoji reaction`)))
      } else {
        // リアクション上限に達している場合は追加しない
        if (hasReachedReactionLimit(message, currentAccount?.did)) return
        // リアクション追加
        convo
          .addReaction(message.id, emoji)
          .catch(() =>
            Toast.show(_(msg`Failed to add emoji reaction`), 'xmark'),
          )
      }
    },
    // ◆ 依存配列: これらの値が変更された時のみ関数を再生成
    [_, convo, message, currentAccount?.did],
  )

  return (
    <View
      // ◆ Web専用のイベントハンドラ
      // @ts-expect-error web only - TypeScriptはこれらをWeb専用プロパティとして認識しない
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      onFocus={onFocus}
      onBlur={onMouseLeave}
      // ◆ Flexboxレイアウト:
      // - flex_1: flex: 1（利用可能なスペースを占有）
      // - isFromSelf ? flex_row : flex_row_reverse
      //   自分のメッセージ: アクション左、メッセージ右
      //   他人のメッセージ: メッセージ左、アクション右
      style={[a.flex_1, isFromSelf ? a.flex_row : a.flex_row_reverse]}
      ref={viewRef}>
      {/* アクションボタン群（絵文字、メニュー）のコンテナ */}
      <View
        style={[
          a.justify_center,
          a.flex_row,
          a.align_center,
          isFromSelf
            ? [a.mr_xs, {marginLeft: 'auto'}, a.flex_row_reverse]
            : [a.ml_xs, {marginRight: 'auto'}],
        ]}>
        {/* 絵文字リアクションピッカー */}
        <EmojiReactionPicker message={message} onEmojiSelect={onEmojiSelect}>
          {/*
            ◆ Render Propsパターン:
            - 子要素として関数を受け取り、props/state/controlを提供
            - これにより親コンポーネントが子の描画方法を制御可能
          */}
          {({props, state, isNative, control}) => {
            // always false, file is platform split
            // Web版なので常にfalse
            if (isNative) return null
            // ホバー時またはメニューが開いている時に表示（opacity: 1）
            const showMenuTrigger = showActions || control.isOpen ? 1 : 0
            return (
              <Pressable
                {...props} // EmojiReactionPickerから提供されたpropsを展開
                style={[
                  {opacity: showMenuTrigger}, // 透明度でフェードイン/アウト
                  a.p_xs, // padding: extra small
                  a.rounded_full, // 完全な円形
                  // ホバーまたはプレス時に背景色を変更
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <EmojiSmileIcon
                  size="md"
                  style={t.atoms.text_contrast_medium}
                />
              </Pressable>
            )
          }}
        </EmojiReactionPicker>

        {/* メッセージコンテキストメニュー */}
        <MessageContextMenu message={message}>
          {({props, state, isNative, control}) => {
            // always false, file is platform split
            if (isNative) return null
            const showMenuTrigger = showActions || control.isOpen ? 1 : 0
            return (
              <Pressable
                {...props}
                style={[
                  {opacity: showMenuTrigger},
                  a.p_xs,
                  a.rounded_full,
                  (state.hovered || state.pressed) && t.atoms.bg_contrast_25,
                ]}>
                <DotsHorizontalIcon
                  size="md"
                  style={t.atoms.text_contrast_medium}
                />
              </Pressable>
            )
          }}
        </MessageContextMenu>
      </View>

      {/* 実際のメッセージコンテンツ */}
      <View
        style={[{maxWidth: '80%'}, isFromSelf ? a.align_end : a.align_start]}>
        {children}
      </View>
    </View>
  )
}
