/**
 * アラートダイアログ再エクスポート（ネイティブ版）
 * Alert Dialog Re-export (Native Version)
 *
 * 【概要】
 * React NativeのAlertコンポーネントをそのまま再エクスポート。
 * iOS/AndroidではOSネイティブのアラートダイアログが表示される。
 *
 * 【Goユーザー向け補足】
 * - re-export: Goのエイリアスインポート（import alias = "package"）に相当
 * - Alert.alert(): ブロッキングダイアログ（Goのfmt.Scanfに似た待機UI）
 *
 * 【使用例】
 * ```typescript
 * Alert.alert(
 *   'タイトル',
 *   'メッセージ',
 *   [
 *     { text: 'キャンセル', style: 'cancel' },
 *     { text: 'OK', onPress: () => doSomething() }
 *   ]
 * )
 * ```
 */
export {Alert} from 'react-native'
