/**
 * メールダイアログのメインコンポーネント
 *
 * このモジュールは、メールアドレスの設定・確認に関する複数の画面を持つダイアログを提供します。
 * 画面の切り替えは内部状態で管理され、以下の画面が利用可能です：
 * - Update: メールアドレス更新
 * - Verify: メール確認
 * - VerificationReminder: 確認リマインダー
 * - Manage2FA: 2要素認証管理
 *
 * 【Goユーザー向け補足】
 * - useState: 状態管理フック（コンポーネントのローカル状態）
 * - useCallback: 関数のメモ化フック（依存配列が変わらない限り同じ関数インスタンス）
 * - switch文: Goと同じ条件分岐構文
 */

// Reactのフックをインポート
import {useCallback, useState} from 'react'
// 国際化ライブラリLingui
import {msg} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// Web専用スタイルユーティリティ
import {web} from '#/alf'
// ダイアログコンポーネント群
import * as Dialog from '#/components/Dialog'
// 状態を持つダイアログコントロールの型
import {type StatefulControl} from '#/components/dialogs/Context'
// グローバルダイアログコンテキストフック
import {useGlobalDialogsControlContext} from '#/components/dialogs/Context'
// アカウントメール状態を取得するフック
import {useAccountEmailState} from '#/components/dialogs/EmailDialog/data/useAccountEmailState'
// 各画面コンポーネントをインポート
import {Manage2FA} from '#/components/dialogs/EmailDialog/screens/Manage2FA'
import {Update} from '#/components/dialogs/EmailDialog/screens/Update'
import {VerificationReminder} from '#/components/dialogs/EmailDialog/screens/VerificationReminder'
import {Verify} from '#/components/dialogs/EmailDialog/screens/Verify'
// 型定義をインポート
import {type Screen, ScreenID} from '#/components/dialogs/EmailDialog/types'

// 型をエクスポート（他のモジュールから利用可能に）
export type {Screen} from '#/components/dialogs/EmailDialog/types'
// ScreenIDをEmailDialogScreenIDとしてエクスポート（名前の衝突を避けるため）
export {ScreenID as EmailDialogScreenID} from '#/components/dialogs/EmailDialog/types'

export function useEmailDialogControl() {
  return useGlobalDialogsControlContext().emailDialogControl
}

export function EmailDialog() {
  const {_} = useLingui()
  const emailDialogControl = useEmailDialogControl()
  const {isEmailVerified} = useAccountEmailState()
  const onClose = useCallback(() => {
    if (!isEmailVerified) {
      if (emailDialogControl.value?.id === ScreenID.Verify) {
        emailDialogControl.value.onCloseWithoutVerifying?.()
      }
    }
    emailDialogControl.clear()
  }, [isEmailVerified, emailDialogControl])

  return (
    <Dialog.Outer control={emailDialogControl.control} onClose={onClose}>
      <Dialog.Handle />

      <Dialog.ScrollableInner
        label={_(msg`Make adjustments to email settings for your account`)}
        style={web({maxWidth: 400})}>
        <Inner control={emailDialogControl} />
        <Dialog.Close />
      </Dialog.ScrollableInner>
    </Dialog.Outer>
  )
}

function Inner({control}: {control: StatefulControl<Screen>}) {
  const [screen, showScreen] = useState(() => control.value)

  if (!screen) return null

  switch (screen.id) {
    case ScreenID.Update: {
      return <Update config={screen} showScreen={showScreen} />
    }
    case ScreenID.Verify: {
      return <Verify config={screen} showScreen={showScreen} />
    }
    case ScreenID.VerificationReminder: {
      return <VerificationReminder config={screen} showScreen={showScreen} />
    }
    case ScreenID.Manage2FA: {
      return <Manage2FA config={screen} showScreen={showScreen} />
    }
    default: {
      return null
    }
  }
}
