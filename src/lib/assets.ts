/**
 * 画像アセットモジュール（Web版）
 *
 * 【概要】
 * アプリケーションで使用する静的画像アセットへの参照を提供。
 * Web環境ではURLパスを使用（ネイティブ版とは実装が異なる）。
 *
 * 【プラットフォーム別実装】
 * - Web版（このファイル）: URLパス文字列を使用
 * - ネイティブ版（.native.ts）: require()でバンドル画像を参照
 *
 * 【Goユーザー向け補足】
 * - ImageRequireSource: React Native固有の画像ソース型
 * - @ts-ignore: TypeScript型チェックを一時的に無効化
 *   Goではビルドタグで同様のことを行う
 */
import {ImageRequireSource} from 'react-native'

/** デフォルトアバター画像（ユーザーがアバターを設定していない場合に表示） */
// @ts-ignore we need to pretend -prf
export const DEF_AVATAR: ImageRequireSource = {uri: '/img/default-avatar.png'}

/** スプラッシュ画像（アプリ起動時に表示） */
// @ts-ignore we need to pretend -prf
export const CLOUD_SPLASH: ImageRequireSource = {uri: '/img/splash.png'}
