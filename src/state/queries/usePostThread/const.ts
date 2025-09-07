// eslint-disable-next-line @typescript-eslint/no-unused-vars
// 投稿スレッドAPIの型定義をインポート（型参照のみ）
// Import type definitions for post thread API (type reference only)
import {type AppBskyUnspeccedGetPostThreadV2} from '@atproto/api'

/**
 * リニア表示モードで表示する下方向の投稿数（デフォルト10件）
 * Number of posts to display below in linear view mode (default 10)
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const LINEAR_VIEW_BELOW = 10

/**
 * リニア表示モードの分岐係数（1：一列表示）
 * Branching factor for linear view mode (1: single column display)
 * See the `branchingFactor` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const LINEAR_VIEW_BF = 1

/**
 * ツリー表示モードで表示する下方向の投稿数（デフォルト4件）
 * Number of posts to display below in tree view mode (default 4)
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BELOW = 4

/**
 * ツリー表示モードの分岐係数（undefined：無制限分岐）
 * Branching factor for tree view mode (undefined: unlimited branching)
 * See the `branchingFactor` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BF = undefined

/**
 * デスクトップ版ツリー表示モードで表示する下方向の投稿数（6件）
 * Number of posts to display below in tree view mode for desktop (6)
 * See the `below` param on {@link AppBskyUnspeccedGetPostThreadV2.QueryParams}
 */
export const TREE_VIEW_BELOW_DESKTOP = 6
