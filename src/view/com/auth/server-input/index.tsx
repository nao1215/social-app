/**
 * サーバー入力ダイアログモジュール
 *
 * このモジュールは、ユーザーがログイン時にアカウントプロバイダー（PDSサーバー）を選択するための
 * ダイアログを提供します。Blueskyの公式サーバーまたはカスタムサーバーを選択できます。
 *
 * @module ServerInputDialog
 */

// React - フック関数（useCallback: メモ化コールバック、useImperativeHandle: 親への参照公開、useRef: 参照保持、useState: 状態管理）
import {useCallback, useImperativeHandle, useRef, useState} from 'react'
// React Native - ネイティブUIコンポーネント
import {View} from 'react-native'
// React Native - ウィンドウサイズ取得フック
import {useWindowDimensions} from 'react-native'
// Lingui - 国際化マクロ（msg: 単一翻訳、Trans: JSX内翻訳）
import {msg, Trans} from '@lingui/macro'
// Lingui - 国際化フック
import {useLingui} from '@lingui/react'

// Blueskyの公式サービスURL定数
import {BSKY_SERVICE} from '#/lib/constants'
// 分析イベントのロギング
import {logEvent} from '#/lib/statsig/statsig'
// 永続化ストレージ（MMKV）へのアクセス
import * as persisted from '#/state/persisted'
// セッション情報フック（現在のアカウント一覧など）
import {useSession} from '#/state/session'
// デザインシステム（atoms: スタイル、useBreakpoints: レスポンシブ判定、useTheme: テーマ）
import {atoms as a, useBreakpoints, useTheme} from '#/alf'
// 注意書き表示コンポーネント
import {Admonition} from '#/components/Admonition'
// ボタンコンポーネント
import {Button, ButtonText} from '#/components/Button'
// ダイアログコンポーネント群
import * as Dialog from '#/components/Dialog'
// テキストフィールドコンポーネント群
import * as TextField from '#/components/forms/TextField'
// トグルボタンコンポーネント群（ラジオボタンのような選択UI）
import * as ToggleButton from '#/components/forms/ToggleButton'
// 地球アイコン
import {Globe_Stroke2_Corner0_Rounded as Globe} from '#/components/icons/Globe'
// インラインリンクテキストコンポーネント
import {InlineLinkText} from '#/components/Link'
// タイポグラフィコンポーネント
import {P, Text} from '#/components/Typography'

/**
 * サーバー入力ダイアログコンポーネント
 *
 * ユーザーがアカウントプロバイダー（PDSサーバー）を選択するためのダイアログ。
 * Bluesky公式サーバーまたはカスタムサーバーを選択できます。
 *
 * Go開発者向け:
 * - control, onSelect はプロパティ（Goのstructフィールドに相当）
 * - Dialog.DialogOuterProps['control'] は型のプロパティアクセス（Go未サポート）
 *
 * @param props - コンポーネントのプロパティ
 * @param props.control - ダイアログの開閉を制御するオブジェクト
 * @param props.onSelect - サーバーURLが選択された時のコールバック
 */
export function ServerInputDialog({
  control,
  onSelect,
}: {
  control: Dialog.DialogOuterProps['control']
  onSelect: (url: string) => void
}) {
  // ウィンドウの高さを取得（ダイアログのサイズ計算に使用）
  const {height} = useWindowDimensions()
  // Go開発者向け: useRef は値を保持するためのフック（再レンダリング時も同じ参照を保持）
  const formRef = useRef<DialogInnerRef>(null)

  // ダイアログの開閉間で選択されたオプションを永続化
  const [fixedOption, setFixedOption] = useState(BSKY_SERVICE)
  const [previousCustomAddress, setPreviousCustomAddress] = useState('')

  /**
   * ダイアログを閉じる際のコールバック
   * フォームの状態を取得し、選択されたサーバーURLをonSelectに渡す
   */
  const onClose = useCallback(() => {
    // フォームの状態を取得（null許容チェーン演算子 ?. を使用）
    const result = formRef.current?.getFormState()
    if (result) {
      onSelect(result)
      // Bluesky公式サーバー以外の場合、後で再利用するために保存
      if (result !== BSKY_SERVICE) {
        setPreviousCustomAddress(result)
      }
    }
    // ホスティングプロバイダーの選択イベントをログ
    logEvent('signin:hostingProviderPressed', {
      hostingProviderDidChange: fixedOption !== BSKY_SERVICE,
    })
  }, [onSelect, fixedOption])

  return (
    <Dialog.Outer
      control={control}
      onClose={onClose}
      nativeOptions={{minHeight: height / 2}}>
      {/* ダイアログのハンドル（引っ張って閉じる用） */}
      <Dialog.Handle />
      {/* ダイアログの内部コンテンツ */}
      <DialogInner
        formRef={formRef}
        fixedOption={fixedOption}
        setFixedOption={setFixedOption}
        initialCustomAddress={previousCustomAddress}
      />
    </Dialog.Outer>
  )
}

/**
 * Go開発者向け: TypeScriptの型エイリアス（Goの type 宣言に相当）
 * DialogInner コンポーネントが公開するメソッドのインターフェース
 */
type DialogInnerRef = {getFormState: () => string | null}

/**
 * ダイアログの内部コンテンツコンポーネント
 *
 * サーバー選択フォームの実装。Bluesky公式サーバーまたはカスタムサーバーを選択可能。
 *
 * @param props - コンポーネントのプロパティ
 * @param props.formRef - 親コンポーネントに公開するメソッドへの参照
 * @param props.fixedOption - 現在選択されているオプション（'bsky.social' または 'custom'）
 * @param props.setFixedOption - オプションを変更する関数
 * @param props.initialCustomAddress - カスタムアドレスの初期値
 */
function DialogInner({
  formRef,
  fixedOption,
  setFixedOption,
  initialCustomAddress,
}: {
  formRef: React.Ref<DialogInnerRef>
  fixedOption: string
  setFixedOption: (opt: string) => void
  initialCustomAddress: string
}) {
  // ダイアログのコンテキストを取得（閉じる機能など）
  const control = Dialog.useDialogContext()
  const {_} = useLingui()
  const t = useTheme()
  const {accounts} = useSession()
  // レスポンシブデザイン判定（gtMobile: モバイルより大きい画面か）
  const {gtMobile} = useBreakpoints()
  // カスタムサーバーアドレスの状態
  const [customAddress, setCustomAddress] = useState(initialCustomAddress)
  // PDSサーバーアドレスの履歴（最大5件）
  const [pdsAddressHistory, setPdsAddressHistory] = useState<string[]>(
    persisted.get('pdsAddressHistory') || [],
  )

  /**
   * Go開発者向け: useImperativeHandle は子コンポーネントから親に公開するメソッドを定義
   * - 第一引数: 親から渡された ref
   * - 第二引数: 公開するメソッドを返す関数
   * - 第三引数: 依存配列
   *
   * 親コンポーネントがformRef.current.getFormState()を呼び出せるようにする
   */
  useImperativeHandle(
    formRef,
    () => ({
      /**
       * フォームの状態を取得し、正規化されたサーバーURLを返す
       */
      getFormState: () => {
        let url
        // カスタムオプションが選択されている場合
        if (fixedOption === 'custom') {
          url = customAddress.trim().toLowerCase()
          if (!url) {
            return null
          }
        } else {
          // Bluesky公式サーバーが選択されている場合
          url = fixedOption
        }

        // URLスキームがない場合、自動的に追加
        if (!url.startsWith('http://') && !url.startsWith('https://')) {
          if (url === 'localhost' || url.startsWith('localhost:')) {
            url = `http://${url}` // localhostはhttpを使用
          } else {
            url = `https://${url}` // その他はhttpsを使用
          }
        }

        // カスタムサーバーの場合、履歴に保存（最大5件まで）
        if (fixedOption === 'custom') {
          if (!pdsAddressHistory.includes(url)) {
            const newHistory = [url, ...pdsAddressHistory.slice(0, 4)]
            setPdsAddressHistory(newHistory)
            // 永続化ストレージに保存
            persisted.write('pdsAddressHistory', newHistory)
          }
        }

        return url
      },
    }),
    [customAddress, fixedOption, pdsAddressHistory],
  )

  // 初回ユーザーかどうか（アカウントが0件）
  const isFirstTimeUser = accounts.length === 0

  return (
    <Dialog.ScrollableInner
      accessibilityDescribedBy="dialog-description"
      accessibilityLabelledBy="dialog-title">
      <View style={[a.relative, a.gap_md, a.w_full]}>
        {/* ダイアログタイトル */}
        <Text nativeID="dialog-title" style={[a.text_2xl, a.font_bold]}>
          <Trans>Choose your account provider</Trans>
        </Text>
        {/* サーバー選択トグルボタン（Bluesky公式 or カスタム） */}
        <ToggleButton.Group
          label="Preferences"
          values={[fixedOption]}
          onChange={values => setFixedOption(values[0])}>
          <ToggleButton.Button name={BSKY_SERVICE} label={_(msg`Bluesky`)}>
            <ToggleButton.ButtonText>{_(msg`Bluesky`)}</ToggleButton.ButtonText>
          </ToggleButton.Button>
          <ToggleButton.Button
            testID="customSelectBtn"
            name="custom"
            label={_(msg`Custom`)}>
            <ToggleButton.ButtonText>{_(msg`Custom`)}</ToggleButton.ButtonText>
          </ToggleButton.Button>
        </ToggleButton.Group>

        {/* 初回ユーザーにBluesky公式サーバーを推奨するヒント */}
        {fixedOption === BSKY_SERVICE && isFirstTimeUser && (
          <Admonition type="tip">
            <Trans>
              Bluesky is an open network where you can choose your own provider.
              If you're new here, we recommend sticking with the default Bluesky
              Social option.
            </Trans>
          </Admonition>
        )}

        {/* カスタムサーバーが選択された場合、サーバーアドレス入力フィールドを表示 */}
        {fixedOption === 'custom' && (
          <View
            style={[
              a.border,
              t.atoms.border_contrast_low,
              a.rounded_sm,
              a.px_md,
              a.py_md,
            ]}>
            <TextField.LabelText nativeID="address-input-label">
              <Trans>Server address</Trans>
            </TextField.LabelText>
            <TextField.Root>
              <TextField.Icon icon={Globe} />
              <Dialog.Input
                testID="customServerTextInput"
                value={customAddress}
                onChangeText={setCustomAddress}
                label="my-server.com"
                accessibilityLabelledBy="address-input-label"
                autoCapitalize="none"
                keyboardType="url"
              />
            </TextField.Root>
            {/* 過去に入力したサーバーアドレス履歴を表示（最大5件） */}
            {pdsAddressHistory.length > 0 && (
              <View style={[a.flex_row, a.flex_wrap, a.mt_xs]}>
                {pdsAddressHistory.map(uri => (
                  <Button
                    key={uri}
                    variant="ghost"
                    color="primary"
                    label={uri}
                    style={[a.px_sm, a.py_xs, a.rounded_sm, a.gap_sm]}
                    onPress={() => setCustomAddress(uri)}>
                    <ButtonText>{uri}</ButtonText>
                  </Button>
                ))}
              </View>
            )}
          </View>
        )}

        {/* セルフホスティングに関する説明テキスト */}
        <View style={[a.py_xs]}>
          <P
            style={[
              t.atoms.text_contrast_medium,
              a.text_sm,
              a.leading_snug,
              a.flex_1,
            ]}>
            {isFirstTimeUser ? (
              <Trans>
                If you're a developer, you can host your own server.
              </Trans>
            ) : (
              <Trans>
                Bluesky is an open network where you can choose your hosting
                provider. If you're a developer, you can host your own server.
              </Trans>
            )}{' '}
            <InlineLinkText
              label={_(msg`Learn more about self hosting your PDS.`)}
              to="https://atproto.com/guides/self-hosting">
              <Trans>Learn more.</Trans>
            </InlineLinkText>
          </P>
        </View>

        {/* 完了ボタン */}
        <View style={gtMobile && [a.flex_row, a.justify_end]}>
          <Button
            testID="doneBtn"
            variant="outline"
            color="primary"
            size="small"
            onPress={() => control.close()}
            label={_(msg`Done`)}>
            <ButtonText>{_(msg`Done`)}</ButtonText>
          </Button>
        </View>
      </View>
    </Dialog.ScrollableInner>
  )
}
