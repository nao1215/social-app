/**
 * FABコンポーネント（ネイティブ版）
 * FAB Component (Native Version)
 *
 * 【概要】
 * ネイティブアプリ（iOS/Android）用のFABエクスポート。
 * FABInnerを直接再エクスポート。
 *
 * 【Goユーザー向け補足】
 * - プラットフォーム別ファイル: .tsx（ネイティブ）と.web.tsx（Web）で分岐
 * - Goのbuild tagsに相当
 */
export {FABInner as FAB} from './FABInner'
