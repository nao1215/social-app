/**
 * インテントハンドラーフックモジュール
 *
 * 【概要】
 * ディープリンク/URLスキームからのインテントを処理するフック群。
 * 外部アプリやシステムからBlueskyアプリを起動した際の動作を制御。
 *
 * 【対応インテント】
 * - compose: 投稿作成画面を開く（テキスト、画像、動画指定可能）
 * - verify-email: メール確認コードの処理
 * - age-assurance: 年齢確認リダイレクト処理
 * - apply-ota: OTAアップデートの適用
 *
 * 【ディープリンク形式】
 * - bluesky://intent/compose?text=Hello
 * - bluesky://intent/verify-email?code=123456
 *
 * 【セキュリティ対策】
 * - 外部URLの画像読み込みを防止（IP漏洩対策）
 * - 画像URI形式のバリデーション
 *
 * 【Goユーザー向け補足】
 * - Linking.useURL(): アプリ起動時のURL取得（Goのos.Args相当）
 * - useEffect: URLの変更検知と処理（Goのgoroutineでの監視に相当）
 */
import React from 'react'
import {Alert} from 'react-native'
import * as Linking from 'expo-linking'

import {useOpenComposer} from '#/lib/hooks/useOpenComposer'
import {logger} from '#/logger'
import {isNative} from '#/platform/detection'
import {useSession} from '#/state/session'
import {useCloseAllActiveElements} from '#/state/util'
import {
  parseAgeAssuranceRedirectDialogState,
  useAgeAssuranceRedirectDialogControl,
} from '#/components/ageAssurance/AgeAssuranceRedirectDialog'
import {useIntentDialogs} from '#/components/intents/IntentDialogs'
import {Referrer} from '../../../modules/expo-bluesky-swiss-army'
import {useApplyPullRequestOTAUpdate} from './useOTAUpdates'

/**
 * サポートするインテントタイプ
 */
type IntentType = 'compose' | 'verify-email' | 'age-assurance' | 'apply-ota'

/**
 * 画像URI形式のバリデーション正規表現
 * 形式: path|width|height
 * 例: /path/to/image.jpg|1920|1080
 */
const VALID_IMAGE_REGEX = /^[\w.:\-_/]+\|\d+(\.\d+)?\|\d+(\.\d+)?$/

/**
 * 前回処理したインテントURL
 * アカウント切り替え時もリセットされないようにReact外で保持
 */
let previousIntentUrl = ''

/**
 * インテントハンドラーフック
 *
 * 【動作】
 * 1. アプリ起動時/フォアグラウンド復帰時のURLを監視
 * 2. インテント形式のURLをパース
 * 3. インテントタイプに応じた処理を実行
 * 4. 同じURLの重複処理を防止
 */
export function useIntentHandler() {
  const incomingUrl = Linking.useURL()
  const composeIntent = useComposeIntent()
  const verifyEmailIntent = useVerifyEmailIntent()
  const ageAssuranceRedirectDialogControl =
    useAgeAssuranceRedirectDialogControl()
  const {currentAccount} = useSession()
  const {tryApplyUpdate} = useApplyPullRequestOTAUpdate()

  React.useEffect(() => {
    const handleIncomingURL = (url: string) => {
      const referrerInfo = Referrer.getReferrerInfo()
      if (referrerInfo && referrerInfo.hostname !== 'bsky.app') {
        logger.metric('deepLink:referrerReceived', {
          to: url,
          referrer: referrerInfo?.referrer,
          hostname: referrerInfo?.hostname,
        })
      }

      // We want to be able to support bluesky:// deeplinks. It's unnatural for someone to use a deeplink with three
      // slashes, like bluesky:///intent/follow. However, supporting just two slashes causes us to have to take care
      // of two cases when parsing the url. If we ensure there is a third slash, we can always ensure the first
      // path parameter is in pathname rather than in hostname.
      if (url.startsWith('bluesky://') && !url.startsWith('bluesky:///')) {
        url = url.replace('bluesky://', 'bluesky:///')
      }

      const urlp = new URL(url)
      const [_, intent, intentType] = urlp.pathname.split('/')

      // On native, our links look like bluesky://intent/SomeIntent, so we have to check the hostname for the
      // intent check. On web, we have to check the first part of the path since we have an actual hostname
      const isIntent = intent === 'intent'
      const params = urlp.searchParams

      if (!isIntent) return

      switch (intentType as IntentType) {
        case 'compose': {
          composeIntent({
            text: params.get('text'),
            imageUrisStr: params.get('imageUris'),
            videoUri: params.get('videoUri'),
          })
          return
        }
        case 'verify-email': {
          const code = params.get('code')
          if (!code) return
          verifyEmailIntent(code)
          return
        }
        case 'age-assurance': {
          const state = parseAgeAssuranceRedirectDialogState({
            result: params.get('result') ?? undefined,
            actorDid: params.get('actorDid') ?? undefined,
          })

          /*
           * If we don't have an account or the account doesn't match, do
           * nothing. By the time the user switches to their other account, AA
           * state should be ready for them.
           */
          if (
            state &&
            currentAccount &&
            state.actorDid === currentAccount.did
          ) {
            ageAssuranceRedirectDialogControl.open(state)
          }
          return
        }
        case 'apply-ota': {
          const channel = params.get('channel')
          if (!channel) {
            Alert.alert('Error', 'No channel provided to look for.')
          } else {
            tryApplyUpdate(channel)
          }
        }
        default: {
          return
        }
      }
    }

    if (incomingUrl) {
      if (previousIntentUrl === incomingUrl) {
        return
      }
      handleIncomingURL(incomingUrl)
      previousIntentUrl = incomingUrl
    }
  }, [
    incomingUrl,
    composeIntent,
    verifyEmailIntent,
    ageAssuranceRedirectDialogControl,
    currentAccount,
    tryApplyUpdate,
  ])
}

export function useComposeIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {openComposer} = useOpenComposer()
  const {hasSession} = useSession()

  return React.useCallback(
    ({
      text,
      imageUrisStr,
      videoUri,
    }: {
      text: string | null
      imageUrisStr: string | null
      videoUri: string | null
    }) => {
      if (!hasSession) return
      closeAllActiveElements()

      // Whenever a video URI is present, we don't support adding images right now.
      if (videoUri) {
        const [uri, width, height] = videoUri.split('|')
        openComposer({
          text: text ?? undefined,
          videoUri: {uri, width: Number(width), height: Number(height)},
        })
        return
      }

      const imageUris = imageUrisStr
        ?.split(',')
        .filter(part => {
          // For some security, we're going to filter out any image uri that is external. We don't want someone to
          // be able to provide some link like "bluesky://intent/compose?imageUris=https://IHaveYourIpNow.com/image.jpeg
          // and we load that image
          if (part.includes('https://') || part.includes('http://')) {
            return false
          }
          // We also should just filter out cases that don't have all the info we need
          return VALID_IMAGE_REGEX.test(part)
        })
        .map(part => {
          const [uri, width, height] = part.split('|')
          return {uri, width: Number(width), height: Number(height)}
        })

      setTimeout(() => {
        openComposer({
          text: text ?? undefined,
          imageUris: isNative ? imageUris : undefined,
        })
      }, 500)
    },
    [hasSession, closeAllActiveElements, openComposer],
  )
}

function useVerifyEmailIntent() {
  const closeAllActiveElements = useCloseAllActiveElements()
  const {verifyEmailDialogControl: control, setVerifyEmailState: setState} =
    useIntentDialogs()
  return React.useCallback(
    (code: string) => {
      closeAllActiveElements()
      setState({
        code,
      })
      setTimeout(() => {
        control.open()
      }, 1000)
    },
    [closeAllActiveElements, control, setState],
  )
}
