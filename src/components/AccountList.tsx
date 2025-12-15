/**
 * @file AccountList.tsx
 * @description アカウント選択リストコンポーネント - マルチアカウント切り替え用のUIを提供
 *
 * このファイルは、ユーザーが複数のアカウント間で切り替えるためのリストUIを提供します。
 * 現在ログイン中のアカウント、他のアカウント、および新規アカウント追加オプションを表示します。
 *
 * ## Goユーザー向け概要
 *
 * ### TypeScriptの主要概念
 * - **type**: Goのstructに相当。オブジェクトの形状を定義
 * - **Union型**: 複数の型のいずれかを取る型（`string | null` など）
 *
 * ### React固有の概念
 * - **useCallback**: 関数をメモ化するフック。Goでは関数は常に新しいインスタンスだが、
 *   Reactでは不要な再作成を防ぐためにメモ化が必要
 *   → 依存配列の値が変わらない限り同じ関数インスタンスを再利用
 * - **Fragment**: 追加のDOM要素なしで複数の要素をグループ化する仮想的なコンテナ
 *   → Goでいうとスライスのようなもの（HTMLには表示されない）
 */

// Reactのコアライブラリ - UIコンポーネント作成のため
// useCallback: 関数のメモ化（不要な再作成を防ぐ）
import React, {useCallback} from 'react'
// React Nativeの基本ビューコンポーネント
import {View} from 'react-native'
// AT Protocolのアクター定義型 - プロフィール情報の型定義
import {type AppBskyActorDefs} from '@atproto/api'
// Lingui国際化ライブラリ - 多言語対応
import {msg, Trans} from '@lingui/macro'
import {useLingui} from '@lingui/react'

// アクター（ユーザー）のステータス取得フック - オンライン状態などを管理
import {useActorStatus} from '#/lib/actor-status'
// 表示名のサニタイズ - XSS対策や無効な文字の除去
import {sanitizeDisplayName} from '#/lib/strings/display-names'
// ハンドルのサニタイズ - @マークの付与や整形
import {sanitizeHandle} from '#/lib/strings/handles'
// プロフィール情報取得クエリ - 複数アカウントのプロフィールを一括取得
import {useProfilesQuery} from '#/state/queries/profile'
// セッション管理 - 現在のアカウントとアカウントリストを管理
import {type SessionAccount, useSession} from '#/state/session'
// ユーザーアバター表示コンポーネント
import {UserAvatar} from '#/view/com/util/UserAvatar'
// デザインシステム - スタイリングとテーマ
import {atoms as a, useTheme} from '#/alf'
// チェックマークアイコン - 現在選択中のアカウントに表示
import {Check_Stroke2_Corner0_Rounded as Check} from '#/components/icons/Check'
// シェブロン（矢印）アイコン - 選択可能なアカウントに表示
import {ChevronRight_Stroke2_Corner0_Rounded as Chevron} from '#/components/icons/Chevron'
// 認証バッジの状態取得フック
import {useSimpleVerificationState} from '#/components/verification'
// 認証バッジ表示コンポーネント
import {VerificationCheck} from '#/components/verification/VerificationCheck'
// ボタンコンポーネント
import {Button} from './Button'
// テキスト表示コンポーネント
import {Text} from './Typography'

/**
 * アカウント選択リストコンポーネント
 * Account selection list component for multi-account switching
 *
 * Goユーザー向け補足:
 * - この関数コンポーネントは、Goの関数とstructを組み合わせたようなもの
 * - propsオブジェクトを分割代入で受け取り、JSXを返す
 * - 再レンダリング時に再実行され、状態やpropsの変更を反映
 *
 * @param onSelectAccount - アカウント選択時のコールバック
 * @param onSelectOther - 「その他のアカウント」選択時のコールバック
 * @param otherLabel - 「その他のアカウント」ボタンのカスタムラベル
 * @param pendingDid - 処理中のアカウントDID（ローディング状態の表示用）
 */
export function AccountList({
  onSelectAccount,
  onSelectOther,
  otherLabel,
  pendingDid,
}: {
  onSelectAccount: (account: SessionAccount) => void  // アカウント選択ハンドラー
  onSelectOther: () => void                           // その他選択ハンドラー
  otherLabel?: string                                 // オプションのカスタムラベル
  pendingDid: string | null                           // 処理中のDID（nullなら処理中でない）
}) {
  // セッション情報取得 - 現在のアカウントと全アカウントリスト
  const {currentAccount, accounts} = useSession()
  // テーマ取得 - 色やスタイルの統一
  const t = useTheme()
  // 翻訳関数取得
  const {_} = useLingui()
  // プロフィール情報取得 - 全アカウントのプロフィールを一括取得
  // Goユーザー向け補足: useProfilesQueryはReact Queryフック（非同期データ取得用）
  // → Goのgoroutineやチャネルに似ているが、キャッシュ・再試行・更新が自動化されている
  const {data: profiles} = useProfilesQuery({
    handles: accounts.map(acc => acc.did), // 全アカウントのDIDを配列で渡す
  })

  /**
   * アカウント追加ボタン押下ハンドラー
   *
   * Goユーザー向け補足:
   * - useCallbackで関数をメモ化（キャッシュ）
   * - 依存配列（[onSelectOther]）の値が変わらない限り、同じ関数インスタンスを再利用
   * - パフォーマンス最適化: 子コンポーネントへの不要な再レンダリングを防ぐ
   */
  const onPressAddAccount = useCallback(() => {
    onSelectOther() // 親コンポーネントのハンドラーを呼び出し
  }, [onSelectOther])

  return (
    <View
      // ポインターイベント制御 - 処理中はタッチ操作を無効化
      pointerEvents={pendingDid ? 'none' : 'auto'}
      style={[
        a.rounded_md,              // 中程度の角丸
        a.overflow_hidden,         // はみ出し部分を隠す
        {borderWidth: 1},          // 1pxのボーダー
        t.atoms.border_contrast_low, // 低コントラストボーダー色
      ]}>
      {/* アカウントリストのマッピング - 各アカウントごとにアイテムと区切り線を表示 */}
      {accounts.map(account => (
        // Fragmentで複数要素をグループ化（余計なDOM要素を追加しない）
        <React.Fragment key={account.did}>
          {/* 個別のアカウントアイテム */}
          <AccountItem
            // プロフィール情報を検索して渡す（DIDで一致するものを探す）
            profile={profiles?.profiles.find(p => p.did === account.did)}
            account={account}
            onSelect={onSelectAccount}
            // 現在のアカウントかどうかのフラグ
            isCurrentAccount={account.did === currentAccount?.did}
            // 処理中のアカウントかどうかのフラグ
            isPendingAccount={account.did === pendingDid}
          />
          {/* 区切り線 */}
          <View style={[{borderBottomWidth: 1}, t.atoms.border_contrast_low]} />
        </React.Fragment>
      ))}
      {/* 「その他のアカウント」追加ボタン */}
      <Button
        testID="chooseAddAccountBtn"
        style={[a.flex_1]}
        // 処理中の場合はonPressをundefinedにして無効化
        onPress={pendingDid ? undefined : onPressAddAccount}
        label={_(msg`Sign in to account that is not listed`)}>
        {/* Render Props パターン - ボタンの状態に応じて動的にUIを生成 */}
        {({hovered, pressed}) => (
          <View
            style={[
              a.flex_1,
              a.flex_row,         // 横方向レイアウト
              a.align_center,     // 縦方向中央揃え
              {height: 48},       // 固定高さ
              // ホバーまたは押下時に背景色を変更
              (hovered || pressed) && t.atoms.bg_contrast_25,
            ]}>
            <Text
              style={[
                a.font_bold,           // 太字
                a.flex_1,              // 残りスペースを占有
                a.flex_row,
                a.py_sm,               // 縦方向の小パディング
                a.leading_tight,       // タイトな行間
                t.atoms.text_contrast_medium, // 中コントラストテキスト色
                {paddingLeft: 56},     // 左パディング（アバター分のスペース確保）
              ]}>
              {/* カスタムラベルがあればそれを、なければデフォルトの翻訳テキストを表示 */}
              {otherLabel ?? <Trans>Other account</Trans>}
            </Text>
            {/* シェブロン（右矢印）アイコン */}
            <Chevron size="sm" style={[t.atoms.text, a.mr_md]} />
          </View>
        )}
      </Button>
    </View>
  )
}

/**
 * アカウントアイテムコンポーネント - 個別のアカウント表示と選択機能
 * Individual account item component with selection functionality
 *
 * Goユーザー向け補足:
 * - これはプライベート関数コンポーネント（export されていない）
 * - Goのパッケージ内部関数に相当（小文字で始まる関数）
 *
 * @param profile - プロフィール詳細情報（オプション - データ取得中はundefined）
 * @param account - セッションアカウント情報
 * @param onSelect - アカウント選択時のコールバック
 * @param isCurrentAccount - 現在ログイン中のアカウントかどうか
 * @param isPendingAccount - 処理中のアカウントかどうか
 */
function AccountItem({
  profile,
  account,
  onSelect,
  isCurrentAccount,
  isPendingAccount,
}: {
  profile?: AppBskyActorDefs.ProfileViewDetailed // オプション（?）- 取得前はundefined
  account: SessionAccount
  onSelect: (account: SessionAccount) => void
  isCurrentAccount: boolean
  isPendingAccount: boolean
}) {
  const t = useTheme()  // テーマ取得
  const {_} = useLingui()  // 翻訳関数取得
  // 認証バッジの状態を取得（公式アカウントや認証済みマークの表示判定）
  const verification = useSimpleVerificationState({profile})
  // ライブ（オンライン）状態を取得 - アバターにライブバッジを表示するため
  const {isActive: live} = useActorStatus(profile)

  /**
   * アカウント選択ハンドラー
   *
   * Goユーザー向け補足:
   * - useCallbackでメモ化し、不要な再作成を防ぐ
   * - 依存配列に account と onSelect を指定（これらが変わったら再作成）
   */
  const onPress = useCallback(() => {
    onSelect(account)  // 親コンポーネントのハンドラーを呼び出し
  }, [account, onSelect])

  return (
    <Button
      testID={`chooseAccountBtn-${account.handle}`}
      key={account.did}
      style={[a.w_full]}  // 幅100%
      onPress={onPress}
      // アクセシビリティラベル - 現在のアカウントかどうかで文言を変更
      label={
        isCurrentAccount
          ? _(msg`Continue as ${account.handle} (currently signed in)`)
          : _(msg`Sign in as ${account.handle}`)
      }>
      {/* Render Props パターン - ボタンの状態に応じて動的にUIを生成 */}
      {({hovered, pressed}) => (
        <View
          style={[
            a.flex_1,
            a.flex_row,        // 横方向レイアウト
            a.align_center,    // 縦方向中央揃え
            a.px_md,           // 横方向の中パディング
            a.gap_sm,          // 子要素間の小ギャップ
            {height: 56},      // 固定高さ
            // ホバー、押下、または処理中の場合に背景色を変更
            (hovered || pressed || isPendingAccount) && t.atoms.bg_contrast_25,
          ]}>
          {/* ユーザーアバター */}
          <UserAvatar
            avatar={profile?.avatar}
            size={36}
            // ラベラー（モデレーター）アカウントの場合は専用アバター表示
            type={profile?.associated?.labeler ? 'labeler' : 'user'}
            live={live}         // ライブ状態
            hideLiveBadge      // ライブバッジは非表示（リスト表示では不要）
          />

          {/* 表示名とハンドル */}
          <View style={[a.flex_1, a.gap_2xs, a.pr_2xl]}>
            {/* 表示名と認証バッジ */}
            <View style={[a.flex_row, a.align_center, a.gap_xs]}>
              <Text
                emoji  // 絵文字レンダリング有効
                style={[a.font_bold, a.leading_tight]}
                numberOfLines={1}>  {/* 1行のみ表示（長い場合は省略記号） */}
                {/* 表示名の優先順位: profile.displayName > profile.handle > account.handle */}
                {sanitizeDisplayName(
                  profile?.displayName || profile?.handle || account.handle,
                )}
              </Text>
              {/* 認証バッジ（条件付きレンダリング） */}
              {verification.showBadge && (
                <View>
                  <VerificationCheck
                    width={12}
                    // 認証者（verifier）かどうかで表示を変更
                    verifier={verification.role === 'verifier'}
                  />
                </View>
              )}
            </View>
            {/* ハンドル（@username形式） */}
            <Text style={[a.leading_tight, t.atoms.text_contrast_medium]}>
              {sanitizeHandle(account.handle, '@')}
            </Text>
          </View>

          {/* 右端のアイコン - 現在のアカウントならチェックマーク、そうでなければシェブロン */}
          {isCurrentAccount ? (
            <Check size="sm" style={[{color: t.palette.positive_600}]} />
          ) : (
            <Chevron size="sm" style={[t.atoms.text]} />
          )}
        </View>
      )}
    </Button>
  )
}
