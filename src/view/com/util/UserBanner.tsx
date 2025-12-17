/**
 * ユーザーバナーコンポーネント
 * User Banner Component
 *
 * 【概要】
 * プロフィールページの上部に表示されるバナー画像コンポーネント。
 * 表示専用モードと編集可能モードの両方をサポート。
 *
 * 【主な機能】
 * - バナー画像の表示
 * - カメラまたはライブラリからの画像選択（編集モード）
 * - 画像のトリミング（3:1アスペクト比）
 * - バナーの削除
 * - モデレーションによるぼかし表示
 *
 * 【Goユーザー向け補足】
 * - useCallback: 関数のメモ化（Goには直接の対応なし、キャッシュに似る）
 * - useState: コンポーネント内状態管理
 * - Pressable: タップ可能なコンポーネント
 * - async/await: 非同期処理（Goのgoroutine + channelに似る）
 */

// Reactフック
// React hooks
import {useCallback, useState} from 'react'

// React Nativeの基本コンポーネント
// React Native basic components
import {Pressable, StyleSheet, View} from 'react-native'

// Expo Image（高性能画像コンポーネント）
// Expo Image (high-performance image component)
import {Image} from 'expo-image'

// AT Protocol APIのモデレーションUI型
// AT Protocol API moderation UI type
import {type ModerationUI} from '@atproto/api'

// 国際化マクロ（翻訳文字列）
// Internationalization macro (translation strings)
import {msg, Trans} from '@lingui/macro'

// 国際化フック
// Internationalization hook
import {useLingui} from '@lingui/react'

// カメラ/フォトライブラリ権限フック
// Camera/photo library permission hooks
import {
  useCameraPermission,
  usePhotoLibraryPermission,
} from '#/lib/hooks/usePermissions'

// 画像圧縮ユーティリティ
// Image compression utility
import {compressIfNeeded} from '#/lib/media/manip'

// 画像ピッカー関数（カメラ、クロッパー、ライブラリ）
// Image picker functions (camera, cropper, library)
import {openCamera, openCropper, openPicker} from '#/lib/media/picker'

// 選択された画像の型
// Selected image type
import {type PickerImage} from '#/lib/media/picker.shared'

// ロガー
// Logger
import {logger} from '#/logger'

// プラットフォーム検出
// Platform detection
import {isAndroid, isNative} from '#/platform/detection'

// コンポーザー用画像型と関数
// Composer image type and functions
import {
  type ComposerImage,
  compressImage,
  createComposerImage,
} from '#/state/gallery'

// 画像編集ダイアログ
// Image edit dialog
import {EditImageDialog} from '#/view/com/composer/photos/EditImageDialog'

// イベント伝播停止コンポーネント
// Event propagation stopper component
import {EventStopper} from '#/view/com/util/EventStopper'

// デザインシステム（atoms、トークン、テーマ）
// Design system (atoms, tokens, theme)
import {atoms as a, tokens, useTheme} from '#/alf'

// ダイアログ制御フック
// Dialog control hook
import {useDialogControl} from '#/components/Dialog'

// シートラッパー（モバイルでのシート表示制御）
// Sheet wrapper (mobile sheet display control)
import {useSheetWrapper} from '#/components/Dialog/sheet-wrapper'

// アイコンコンポーネント
// Icon components
import {
  Camera_Filled_Stroke2_Corner0_Rounded as CameraFilledIcon,
  Camera_Stroke2_Corner0_Rounded as CameraIcon,
} from '#/components/icons/Camera'
import {StreamingLive_Stroke2_Corner0_Rounded as LibraryIcon} from '#/components/icons/StreamingLive'
import {Trash_Stroke2_Corner0_Rounded as TrashIcon} from '#/components/icons/Trash'

// メニューコンポーネント
// Menu components
import * as Menu from '#/components/Menu'

export function UserBanner({
  type,
  banner,
  moderation,
  onSelectNewBanner,
}: {
  type?: 'labeler' | 'default'
  banner?: string | null
  moderation?: ModerationUI
  onSelectNewBanner?: (img: PickerImage | null) => void
}) {
  const t = useTheme()
  const {_} = useLingui()
  const {requestCameraAccessIfNeeded} = useCameraPermission()
  const {requestPhotoAccessIfNeeded} = usePhotoLibraryPermission()
  const sheetWrapper = useSheetWrapper()
  const [rawImage, setRawImage] = useState<ComposerImage | undefined>()
  const editImageDialogControl = useDialogControl()

  const onOpenCamera = useCallback(async () => {
    if (!(await requestCameraAccessIfNeeded())) {
      return
    }
    onSelectNewBanner?.(
      await compressIfNeeded(
        await openCamera({
          aspect: [3, 1],
        }),
      ),
    )
  }, [onSelectNewBanner, requestCameraAccessIfNeeded])

  const onOpenLibrary = useCallback(async () => {
    if (!(await requestPhotoAccessIfNeeded())) {
      return
    }
    const items = await sheetWrapper(openPicker())
    if (!items[0]) {
      return
    }

    try {
      if (isNative) {
        onSelectNewBanner?.(
          await compressIfNeeded(
            await openCropper({
              imageUri: items[0].path,
              aspectRatio: 3 / 1,
            }),
          ),
        )
      } else {
        setRawImage(await createComposerImage(items[0]))
        editImageDialogControl.open()
      }
    } catch (e: any) {
      if (!String(e).includes('Canceled')) {
        logger.error('Failed to crop banner', {error: e})
      }
    }
  }, [
    onSelectNewBanner,
    requestPhotoAccessIfNeeded,
    sheetWrapper,
    editImageDialogControl,
  ])

  const onRemoveBanner = useCallback(() => {
    onSelectNewBanner?.(null)
  }, [onSelectNewBanner])

  const onChangeEditImage = useCallback(
    async (image: ComposerImage) => {
      const compressed = await compressImage(image)
      onSelectNewBanner?.(compressed)
    },
    [onSelectNewBanner],
  )

  // setUserBanner is only passed as prop on the EditProfile component
  return onSelectNewBanner ? (
    <>
      <EventStopper onKeyDown={true}>
        <Menu.Root>
          <Menu.Trigger label={_(msg`Edit avatar`)}>
            {({props}) => (
              <Pressable {...props} testID="changeBannerBtn">
                {banner ? (
                  <Image
                    testID="userBannerImage"
                    style={styles.bannerImage}
                    source={{uri: banner}}
                    accessible={true}
                    accessibilityIgnoresInvertColors
                  />
                ) : (
                  <View
                    testID="userBannerFallback"
                    style={[styles.bannerImage, t.atoms.bg_contrast_25]}
                  />
                )}
                <View
                  style={[
                    styles.editButtonContainer,
                    t.atoms.bg_contrast_25,
                    a.border,
                    t.atoms.border_contrast_low,
                  ]}>
                  <CameraFilledIcon
                    height={14}
                    width={14}
                    style={t.atoms.text}
                  />
                </View>
              </Pressable>
            )}
          </Menu.Trigger>
          <Menu.Outer showCancel>
            <Menu.Group>
              {isNative && (
                <Menu.Item
                  testID="changeBannerCameraBtn"
                  label={_(msg`Upload from Camera`)}
                  onPress={onOpenCamera}>
                  <Menu.ItemText>
                    <Trans>Upload from Camera</Trans>
                  </Menu.ItemText>
                  <Menu.ItemIcon icon={CameraIcon} />
                </Menu.Item>
              )}

              <Menu.Item
                testID="changeBannerLibraryBtn"
                label={_(msg`Upload from Library`)}
                onPress={onOpenLibrary}>
                <Menu.ItemText>
                  {isNative ? (
                    <Trans>Upload from Library</Trans>
                  ) : (
                    <Trans>Upload from Files</Trans>
                  )}
                </Menu.ItemText>
                <Menu.ItemIcon icon={LibraryIcon} />
              </Menu.Item>
            </Menu.Group>
            {!!banner && (
              <>
                <Menu.Divider />
                <Menu.Group>
                  <Menu.Item
                    testID="changeBannerRemoveBtn"
                    label={_(msg`Remove Banner`)}
                    onPress={onRemoveBanner}>
                    <Menu.ItemText>
                      <Trans>Remove Banner</Trans>
                    </Menu.ItemText>
                    <Menu.ItemIcon icon={TrashIcon} />
                  </Menu.Item>
                </Menu.Group>
              </>
            )}
          </Menu.Outer>
        </Menu.Root>
      </EventStopper>

      <EditImageDialog
        control={editImageDialogControl}
        image={rawImage}
        onChange={onChangeEditImage}
        aspectRatio={3}
      />
    </>
  ) : banner &&
    !((moderation?.blur && isAndroid) /* android crashes with blur */) ? (
    <Image
      testID="userBannerImage"
      style={[styles.bannerImage, t.atoms.bg_contrast_25]}
      contentFit="cover"
      source={{uri: banner}}
      blurRadius={moderation?.blur ? 100 : 0}
      accessible={true}
      accessibilityIgnoresInvertColors
    />
  ) : (
    <View
      testID="userBannerFallback"
      style={[
        styles.bannerImage,
        type === 'labeler' ? styles.labelerBanner : t.atoms.bg_contrast_25,
      ]}
    />
  )
}

const styles = StyleSheet.create({
  editButtonContainer: {
    position: 'absolute',
    width: 24,
    height: 24,
    bottom: 8,
    right: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  bannerImage: {
    width: '100%',
    height: 150,
  },
  labelerBanner: {
    backgroundColor: tokens.color.temp_purple,
  },
})
