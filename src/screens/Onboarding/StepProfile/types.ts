/**
 * アバター作成機能の型定義モジュール
 *
 * 【概要】
 * オンボーディングのプロフィール設定ステップで使用する
 * アバタークリエーターの絵文字アイコンと背景色を定義します。
 *
 * 【主な機能】
 * - 利用可能な絵文字アイコンの定義
 * - アバター背景色のカラーパレット定義
 * - 絵文字とコンポーネントのマッピング
 *
 * 【拡張方法】
 * 新しいアイコンを追加する場合:
 * 1. emojiNames 配列にアイコン名を追加
 * 2. emojiItems レコードにアイコン情報を追加
 */

import {Alien_Stroke2_Corner0_Rounded as Alien} from '#/components/icons/Alien'
import {Apple_Stroke2_Corner0_Rounded as Apple} from '#/components/icons/Apple'
import {At_Stroke2_Corner0_Rounded as At} from '#/components/icons/At'
import {Atom_Stroke2_Corner0_Rounded as Atom} from '#/components/icons/Atom'
import {Celebrate_Stroke2_Corner0_Rounded as Celebrate} from '#/components/icons/Celebrate'
import {
  EmojiArc_Stroke2_Corner0_Rounded as EmojiArc,
  EmojiHeartEyes_Stroke2_Corner0_Rounded as EmojiHeartEyes,
} from '#/components/icons/Emoji'
import {Explosion_Stroke2_Corner0_Rounded as Explosion} from '#/components/icons/Explosion'
import {GameController_Stroke2_Corner0_Rounded as GameController} from '#/components/icons/GameController'
import {Lab_Stroke2_Corner0_Rounded as Lab} from '#/components/icons/Lab'
import {Leaf_Stroke2_Corner0_Rounded as Leaf} from '#/components/icons/Leaf'
import {MusicNote_Stroke2_Corner0_Rounded as MusicNote} from '#/components/icons/MusicNote'
import {Rose_Stroke2_Corner0_Rounded as Rose} from '#/components/icons/Rose'
import {Shaka_Stroke2_Corner0_Rounded as Shaka} from '#/components/icons/Shaka'
import {UFO_Stroke2_Corner0_Rounded as UFO} from '#/components/icons/UFO'
import {Zap_Stroke2_Corner0_Rounded as Zap} from '#/components/icons/Zap'

/**
 * 利用可能な絵文字アイコン名のリスト
 *
 * 【Go言語との対応】Goのconst配列に相当
 *
 * アイコンを追加・削除する場合:
 * 1. この配列にアイコン名を追加/削除
 * 2. emojiItems レコードに対応する項目を追加/削除
 */
export const emojiNames = [
  'at',
  'arc',
  'heartEyes',
  'alien',
  'apple',
  'atom',
  'celebrate',
  'gameController',
  'leaf',
  'musicNote',
  'rose',
  'shaka',
  'ufo',
  'zap',
  'explosion',
  'lab',
] as const

/** 絵文字名の型（emojiNames配列から自動生成） */
export type EmojiName = (typeof emojiNames)[number]

/**
 * 絵文字アイコン情報の型定義
 *
 * 【Goとの対応】Goのstructに相当
 */
export interface Emoji {
  /** 絵文字の識別名 */
  name: EmojiName
  /** React コンポーネント（アイコン） */
  component: typeof EmojiArc
}

/**
 * 絵文字名からEmojiオブジェクトへのマッピング
 *
 * 【Goとの対応】Goのmap[string]Emojiに相当
 */
export const emojiItems: Record<EmojiName, Emoji> = {
  at: {
    name: 'at',
    component: At,
  },
  arc: {
    name: 'arc',
    component: EmojiArc,
  },
  heartEyes: {
    name: 'heartEyes',
    component: EmojiHeartEyes,
  },
  alien: {
    name: 'alien',
    component: Alien,
  },
  apple: {
    name: 'apple',
    component: Apple,
  },
  atom: {
    name: 'atom',
    component: Atom,
  },
  celebrate: {
    name: 'celebrate',
    component: Celebrate,
  },
  gameController: {
    name: 'gameController',
    component: GameController,
  },
  leaf: {
    name: 'leaf',
    component: Leaf,
  },
  musicNote: {
    name: 'musicNote',
    component: MusicNote,
  },
  rose: {
    name: 'rose',
    component: Rose,
  },
  shaka: {
    name: 'shaka',
    component: Shaka,
  },
  ufo: {
    name: 'ufo',
    component: UFO,
  },
  zap: {
    name: 'zap',
    component: Zap,
  },
  explosion: {
    name: 'explosion',
    component: Explosion,
  },
  lab: {
    name: 'lab',
    component: Lab,
  },
}

/**
 * アバター背景色のカラーパレット
 *
 * 【カラー構成】
 * - #FE8311: オレンジ
 * - #FED811: イエロー
 * - #73DF84: グリーン
 * - #1185FE: ブルー
 * - #EF75EA: ピンク
 * - #F55454: レッド
 */
export const avatarColors = [
  '#FE8311',
  '#FED811',
  '#73DF84',
  '#1185FE',
  '#EF75EA',
  '#F55454',
] as const

/** アバター背景色の型（avatarColors配列から自動生成） */
export type AvatarColor = (typeof avatarColors)[number]
