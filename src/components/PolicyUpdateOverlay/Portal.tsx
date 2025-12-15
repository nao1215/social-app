/**
 * @file ポリシー更新オーバーレイのポータルグループ
 * @description ポリシー更新UIを異なるDOM階層にレンダリングするためのポータル
 *
 * このモジュールは、ポリシー更新オーバーレイ専用のポータルグループを提供します。
 * ポータルを使用することで、コンポーネントツリーの任意の場所から、
 * 実際のレンダリング位置を別の場所（通常は最上位）に移動できます。
 *
 * @note
 * Reactのポータル機能を使うことで、z-indexやスタッキングコンテキストの
 * 問題を回避し、オーバーレイを確実に最前面に表示できます。
 */

// ポータルグループ作成ユーティリティ
import {createPortalGroup} from '#/components/Portal'

/**
 * ポリシー更新専用ポータルグループインスタンス
 *
 * @description
 * Provider, Portal, Outletの3つのコンポーネントを含むポータルグループ。
 * - Provider: ポータルの宛先を提供するラッパー
 * - Portal: コンテンツを送信するコンポーネント
 * - Outlet: コンテンツが実際にレンダリングされる場所
 */
const portalGroup = createPortalGroup()

/**
 * ポータルプロバイダーコンポーネント
 * @description アプリケーションのルートレベルでポータルシステムを初期化
 */
export const Provider = portalGroup.Provider

/**
 * ポータルコンポーネント
 * @description このコンポーネントでラップしたコンテンツをOutletの位置にレンダリング
 */
export const Portal = portalGroup.Portal

/**
 * ポータル出力先コンポーネント
 * @description Portalから送信されたコンテンツが実際に表示される場所
 */
export const Outlet = portalGroup.Outlet
