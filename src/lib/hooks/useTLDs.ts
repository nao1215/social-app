/**
 * TLD（トップレベルドメイン）パーサーフック
 *
 * 【概要】
 * tldtsライブラリを遅延ロードしてURLのドメイン解析機能を提供。
 * ドメイン名からTLD、サブドメイン、パブリックサフィックスを抽出。
 *
 * 【遅延ロードの理由】
 * - tldtsは比較的大きなライブラリ（全TLDのデータベースを含む）
 * - 初期バンドルサイズを削減するために動的インポート
 * - 必要になるまでロードを遅延
 *
 * 【tldtsの機能】
 * - parse(): URLを解析してドメイン情報を取得
 * - getDomain(): ドメイン名のみを抽出
 * - getPublicSuffix(): .co.jpなどのパブリックサフィックスを取得
 *
 * 【使用例】
 * const tlds = useTLDs()
 * if (tlds) {
 *   const parsed = tlds.parse('https://www.example.co.jp')
 *   // → { domain: 'example.co.jp', subdomain: 'www', ... }
 * }
 *
 * 【Goユーザー向け補足】
 * - 動的インポート: Goのpluginパッケージに相当する動的モジュール読み込み
 * - useState初期値undefined: 読み込み完了前の状態
 */
import {useEffect, useState} from 'react'
import type tldts from 'tldts'

/**
 * TLD解析ライブラリを遅延ロードして返すフック
 *
 * @returns tldtsライブラリのインスタンス（ロード中はundefined）
 */
export function useTLDs() {
  const [tlds, setTlds] = useState<typeof tldts>()

  useEffect(() => {
    // @ts-expect-error - valid path
    import('tldts/dist/index.cjs.min.js').then(tlds => {
      setTlds(tlds)
    })
  }, [])

  return tlds
}
