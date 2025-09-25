import {type Route, type RouteParams} from './types'

/**
 * ルーティング管理クラス
 *
 * 【主な機能】
 * - URL パターンマッチングと画面名の対応管理
 * - パラメータ抽出とクエリストリング処理
 * - 動的ルート生成とリバースルーティング
 * - 複数パターン対応（同一画面に複数URL）
 *
 * 【使用場面】
 * - アプリ内ナビゲーションの中枢管理
 * - Deep Link処理とURL解析
 * - SEO対応のURL生成
 *
 * 【技術的詳細】
 * - 正規表現ベースの高速なパターンマッチング
 * - TypeScript型安全性を保った柔軟なルート定義
 * - URLSearchParamsによるクエリストリング処理
 *
 * @template T ルート名とパターンの型定義
 */
export class Router<T extends Record<string, any>> {
  routes: [string, Route][] = []
  constructor(description: Record<keyof T, string | string[]>) {
    for (const [screen, pattern] of Object.entries(description)) {
      if (typeof pattern === 'string') {
        this.routes.push([screen, createRoute(pattern)])
      } else {
        pattern.forEach(subPattern => {
          this.routes.push([screen, createRoute(subPattern)])
        })
      }
    }
  }

  matchName(name: keyof T | (string & {})): Route | undefined {
    for (const [screenName, route] of this.routes) {
      if (screenName === name) {
        return route
      }
    }
  }

  matchPath(path: string): [string, RouteParams] {
    let name = 'NotFound'
    let params: RouteParams = {}
    for (const [screenName, route] of this.routes) {
      const res = route.match(path)
      if (res) {
        name = screenName
        params = res.params
        break
      }
    }
    return [name, params]
  }
}

function createRoute(pattern: string): Route {
  const pathParamNames: Set<string> = new Set()
  let matcherReInternal = pattern.replace(/:([\w]+)/g, (_m, name) => {
    pathParamNames.add(name)
    return `(?<${name}>[^/]+)`
  })
  const matcherRe = new RegExp(`^${matcherReInternal}([?]|$)`, 'i')
  return {
    match(path) {
      const {pathname, searchParams} = new URL(path, 'http://throwaway.com')
      const addedParams = Object.fromEntries(searchParams.entries())

      const res = matcherRe.exec(pathname)
      if (res) {
        return {params: Object.assign(addedParams, res.groups || {})}
      }
      return undefined
    },
    build(params = {}) {
      const str = pattern.replace(
        /:([\w]+)/g,
        (_m, name) => params[encodeURIComponent(name)] || 'undefined',
      )

      let hasQp = false
      const qp = new URLSearchParams()
      for (const paramName in params) {
        if (!pathParamNames.has(paramName)) {
          qp.set(paramName, params[paramName])
          hasQp = true
        }
      }

      return str + (hasQp ? `?${qp.toString()}` : '')
    },
  }
}
