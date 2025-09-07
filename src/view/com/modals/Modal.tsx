// React基本機能
import {Fragment, useEffect, useRef} from 'react'              // Reactコア機能
import {StyleSheet} from 'react-native'                       // スタイル定義
import {SafeAreaView} from 'react-native-safe-area-context'   // セーフエリア対応ビュー
import BottomSheet from '@discord/bottom-sheet/src'           // ボトムシート

// フック・状態管理・コンポーネント
import {usePalette} from '#/lib/hooks/usePalette'             // カラーパレット
import {useModalControls, useModals} from '#/state/modals'    // モーダル状態管理
import {FullWindowOverlay} from '#/components/FullWindowOverlay' // フルスクリーンオーバーレイ
import {createCustomBackdrop} from '../util/BottomSheetCustomBackdrop' // カスタム背景

// モーダルコンポーネント群
import * as CreateOrEditListModal from './CreateOrEditList'   // リスト作成・編集
import * as DeleteAccountModal from './DeleteAccount'         // アカウント削除
import * as InviteCodesModal from './InviteCodes'             // 招待コード
import * as ContentLanguagesSettingsModal from './lang-settings/ContentLanguagesSettings' // コンテンツ言語設定
import * as UserAddRemoveListsModal from './UserAddRemoveLists' // ユーザーリスト追加削除

const DEFAULT_SNAPPOINTS = ['90%']  // デフォルトスナップポイント（90%の高さ）
const HANDLE_HEIGHT = 24           // ハンドルの高さ

/**
 * モーダルコンテナコンポーネント
 * 各種モーダルを統一的に管理し、ボトムシートとして表示
 * Modal container component
 * Manages various modals uniformly and displays them as bottom sheets
 */
export function ModalsContainer() {
  const {isModalActive, activeModals} = useModals()     // モーダル状態
  const {closeModal} = useModalControls()               // モーダル操作
  const bottomSheetRef = useRef<BottomSheet>(null)      // ボトムシート参照
  const pal = usePalette('default')                     // カラーパレット
  const activeModal = activeModals[activeModals.length - 1] // アクティブなモーダル（最後に開かれたもの）

  const onBottomSheetChange = async (snapPoint: number) => {
    if (snapPoint === -1) {
      closeModal()
    }
  }

  const onClose = () => {
    bottomSheetRef.current?.close()
    closeModal()
  }

  useEffect(() => {
    if (isModalActive) {
      bottomSheetRef.current?.snapToIndex(0)
    } else {
      bottomSheetRef.current?.close()
    }
  }, [isModalActive, bottomSheetRef, activeModal?.name])

  let snapPoints: (string | number)[] = DEFAULT_SNAPPOINTS
  let element
  if (activeModal?.name === 'create-or-edit-list') {
    snapPoints = CreateOrEditListModal.snapPoints
    element = <CreateOrEditListModal.Component {...activeModal} />
  } else if (activeModal?.name === 'user-add-remove-lists') {
    snapPoints = UserAddRemoveListsModal.snapPoints
    element = <UserAddRemoveListsModal.Component {...activeModal} />
  } else if (activeModal?.name === 'delete-account') {
    snapPoints = DeleteAccountModal.snapPoints
    element = <DeleteAccountModal.Component />
  } else if (activeModal?.name === 'invite-codes') {
    snapPoints = InviteCodesModal.snapPoints
    element = <InviteCodesModal.Component />
  } else if (activeModal?.name === 'content-languages-settings') {
    snapPoints = ContentLanguagesSettingsModal.snapPoints
    element = <ContentLanguagesSettingsModal.Component />
  } else {
    return null
  }

  if (snapPoints[0] === 'fullscreen') {
    return (
      <SafeAreaView style={[styles.fullscreenContainer, pal.view]}>
        {element}
      </SafeAreaView>
    )
  }

  const Container = activeModal ? FullWindowOverlay : Fragment

  return (
    <Container>
      <BottomSheet
        ref={bottomSheetRef}
        snapPoints={snapPoints}
        handleHeight={HANDLE_HEIGHT}
        index={isModalActive ? 0 : -1}
        enablePanDownToClose
        android_keyboardInputMode="adjustResize"
        keyboardBlurBehavior="restore"
        backdropComponent={
          isModalActive ? createCustomBackdrop(onClose) : undefined
        }
        handleIndicatorStyle={{backgroundColor: pal.text.color}}
        handleStyle={[styles.handle, pal.view]}
        backgroundStyle={pal.view}
        onChange={onBottomSheetChange}>
        {element}
      </BottomSheet>
    </Container>
  )
}

const styles = StyleSheet.create({
  handle: {
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  fullscreenContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    bottom: 0,
    right: 0,
  },
})
