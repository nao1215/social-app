/**
 * デバイス権限管理フックモジュール
 *
 * 【概要】
 * カメラ、フォトライブラリ、ビデオライブラリへのアクセス権限を管理。
 * 権限リクエスト、状態確認、設定画面への誘導を提供。
 *
 * 【対応権限】
 * - フォトライブラリ: 画像選択・保存
 * - ビデオライブラリ: 動画選択・保存
 * - カメラ: 写真撮影・動画撮影
 *
 * 【プラットフォーム差異】
 * - iOS/Android: OSの権限システムを使用
 * - Web: <input type="file">を使用、権限不要
 *
 * 【Goユーザー向け補足】
 * - expo-camera/expo-media-library: ネイティブ権限APIのラッパー
 * - Linking.openSettings(): システム設定アプリを開く
 */
import {Linking} from 'react-native'
import {useCameraPermissions as useExpoCameraPermissions} from 'expo-camera'
import * as MediaLibrary from 'expo-media-library'

import {isWeb} from '#/platform/detection'
import {Alert} from '#/view/com/util/Alert'

/**
 * 権限不足時のアラートを表示
 *
 * 【表示内容】
 * 「Permission needed」というタイトルで、
 * 設定アプリへの誘導ボタンを含むアラートを表示。
 *
 * @param perm 権限の種類（'photo library', 'camera'など）
 */
const openPermissionAlert = (perm: string) => {
  Alert.alert(
    'Permission needed',
    `Bluesky does not have permission to access your ${perm}.`,
    [
      {
        text: 'Cancel',
        style: 'cancel',
      },
      {text: 'Open Settings', onPress: () => Linking.openSettings()},
    ],
  )
}

/**
 * フォトライブラリ権限フック
 *
 * 【機能】
 * - 写真へのアクセス権限を管理
 * - 必要に応じて権限をリクエスト
 * - 権限がない場合は設定画面へ誘導
 *
 * 【権限状態】
 * - granted: 権限あり
 * - undetermined: 未確定（リクエスト可能）
 * - denied: 拒否済み（設定から変更が必要）
 *
 * @returns requestPhotoAccessIfNeeded: 権限リクエスト関数
 */
export function usePhotoLibraryPermission() {
  const [res, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['photo'],
  })

  /**
   * 必要に応じてフォトライブラリ権限をリクエスト
   * @returns 権限が得られた場合true
   */
  const requestPhotoAccessIfNeeded = async () => {
    // Web環境では<input type="file">を使用するため権限不要
    if (isWeb) {
      return true
    }

    if (res?.granted) {
      // 既に権限あり
      return true
    } else if (!res || res.status === 'undetermined' || res?.canAskAgain) {
      // 権限をリクエスト
      const {canAskAgain, granted, status} = await requestPermission()

      // リクエスト不可で未確定の場合はアラートを表示
      if (!canAskAgain && status === 'undetermined') {
        openPermissionAlert('photo library')
      }

      return granted
    } else {
      // 拒否済み: 設定画面へ誘導
      openPermissionAlert('photo library')
      return false
    }
  }
  return {requestPhotoAccessIfNeeded}
}

/**
 * ビデオライブラリ権限フック
 *
 * 【機能】
 * - 動画へのアクセス権限を管理
 * - フォトライブラリ権限と同様の動作
 *
 * @returns requestVideoAccessIfNeeded: 権限リクエスト関数
 */
export function useVideoLibraryPermission() {
  const [res, requestPermission] = MediaLibrary.usePermissions({
    granularPermissions: ['video'],
  })

  /**
   * 必要に応じてビデオライブラリ権限をリクエスト
   * @returns 権限が得られた場合true
   */
  const requestVideoAccessIfNeeded = async () => {
    // Web環境では権限不要
    if (isWeb) {
      return true
    }

    if (res?.granted) {
      return true
    } else if (!res || res.status === 'undetermined' || res?.canAskAgain) {
      const {canAskAgain, granted, status} = await requestPermission()

      if (!canAskAgain && status === 'undetermined') {
        openPermissionAlert('video library')
      }

      return granted
    } else {
      openPermissionAlert('video library')
      return false
    }
  }
  return {requestVideoAccessIfNeeded}
}

/**
 * カメラ権限フック
 *
 * 【機能】
 * - カメラへのアクセス権限を管理
 * - expo-cameraの権限APIを使用
 *
 * @returns requestCameraAccessIfNeeded: 権限リクエスト関数
 */
export function useCameraPermission() {
  const [res, requestPermission] = useExpoCameraPermissions()

  /**
   * 必要に応じてカメラ権限をリクエスト
   * @returns 権限が得られた場合true
   */
  const requestCameraAccessIfNeeded = async () => {
    if (res?.granted) {
      return true
    } else if (!res || res?.status === 'undetermined' || res?.canAskAgain) {
      const updatedRes = await requestPermission()
      return updatedRes?.granted
    } else {
      openPermissionAlert('camera')
      return false
    }
  }

  return {requestCameraAccessIfNeeded}
}
