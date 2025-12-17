/**
 * 通貨フォーマットユーティリティモジュール
 *
 * 【概要】
 * ユーザーの地域・言語設定に基づいて通貨を適切にフォーマット。
 * 国コードから通貨を自動判定し、Intl.NumberFormatで表示。
 *
 * 【通貨決定の優先順位】
 * 1. デバイスのロケール設定（expo-localization）
 * 2. アプリの言語設定
 * 3. ジオロケーション（IP位置情報）
 * 4. デフォルト: USD
 *
 * 【Goユーザー向け補足】
 * - Intl.NumberFormat: Go/golangでは golang.org/x/text/currency に相当
 * - useMemo: 計算結果のキャッシュ。Goではsync.Onceに類似
 * - Record<string, string>: Goのmap[string]stringに相当
 *
 * @see https://github.com/zoontek/react-native-localize
 */
import React from 'react'

import {deviceLocales} from '#/locale/deviceLocales'
import {useGeolocationStatus} from '#/state/geolocation'
import {useLanguagePrefs} from '#/state/preferences'

/**
 * 国コード（ISO 3166-1 alpha-2）から通貨コード（ISO 4217）へのマッピング
 *
 * From react-native-localize
 *
 * MIT License
 * Copyright (c) 2017-present, Mathieu Acthernoene
 *
 * @see https://github.com/zoontek/react-native-localize/blob/master/LICENSE
 * @see https://github.com/zoontek/react-native-localize/blob/ee5bf25e0bb8f3b8e4f3fd055f67ad46269c81ea/src/constants.ts
 */
export const countryCodeToCurrency: Record<string, string> = {
  ad: 'eur',
  ae: 'aed',
  af: 'afn',
  ag: 'xcd',
  ai: 'xcd',
  al: 'all',
  am: 'amd',
  an: 'ang',
  ao: 'aoa',
  ar: 'ars',
  as: 'usd',
  at: 'eur',
  au: 'aud',
  aw: 'awg',
  ax: 'eur',
  az: 'azn',
  ba: 'bam',
  bb: 'bbd',
  bd: 'bdt',
  be: 'eur',
  bf: 'xof',
  bg: 'bgn',
  bh: 'bhd',
  bi: 'bif',
  bj: 'xof',
  bl: 'eur',
  bm: 'bmd',
  bn: 'bnd',
  bo: 'bob',
  bq: 'usd',
  br: 'brl',
  bs: 'bsd',
  bt: 'btn',
  bv: 'nok',
  bw: 'bwp',
  by: 'byn',
  bz: 'bzd',
  ca: 'cad',
  cc: 'aud',
  cd: 'cdf',
  cf: 'xaf',
  cg: 'xaf',
  ch: 'chf',
  ci: 'xof',
  ck: 'nzd',
  cl: 'clp',
  cm: 'xaf',
  cn: 'cny',
  co: 'cop',
  cr: 'crc',
  cu: 'cup',
  cv: 'cve',
  cw: 'ang',
  cx: 'aud',
  cy: 'eur',
  cz: 'czk',
  de: 'eur',
  dj: 'djf',
  dk: 'dkk',
  dm: 'xcd',
  do: 'dop',
  dz: 'dzd',
  ec: 'usd',
  ee: 'eur',
  eg: 'egp',
  eh: 'mad',
  er: 'ern',
  es: 'eur',
  et: 'etb',
  fi: 'eur',
  fj: 'fjd',
  fk: 'fkp',
  fm: 'usd',
  fo: 'dkk',
  fr: 'eur',
  ga: 'xaf',
  gb: 'gbp',
  gd: 'xcd',
  ge: 'gel',
  gf: 'eur',
  gg: 'gbp',
  gh: 'ghs',
  gi: 'gip',
  gl: 'dkk',
  gm: 'gmd',
  gn: 'gnf',
  gp: 'eur',
  gq: 'xaf',
  gr: 'eur',
  gs: 'gbp',
  gt: 'gtq',
  gu: 'usd',
  gw: 'xof',
  gy: 'gyd',
  hk: 'hkd',
  hm: 'aud',
  hn: 'hnl',
  hr: 'hrk',
  ht: 'htg',
  hu: 'huf',
  id: 'idr',
  ie: 'eur',
  il: 'ils',
  im: 'gbp',
  in: 'inr',
  io: 'usd',
  iq: 'iqd',
  ir: 'irr',
  is: 'isk',
  it: 'eur',
  je: 'gbp',
  jm: 'jmd',
  jo: 'jod',
  jp: 'jpy',
  ke: 'kes',
  kg: 'kgs',
  kh: 'khr',
  ki: 'aud',
  km: 'kmf',
  kn: 'xcd',
  kp: 'kpw',
  kr: 'krw',
  kw: 'kwd',
  ky: 'kyd',
  kz: 'kzt',
  la: 'lak',
  lb: 'lbp',
  lc: 'xcd',
  li: 'chf',
  lk: 'lkr',
  lr: 'lrd',
  ls: 'lsl',
  lt: 'eur',
  lu: 'eur',
  lv: 'eur',
  ly: 'lyd',
  ma: 'mad',
  mc: 'eur',
  md: 'mdl',
  me: 'eur',
  mf: 'eur',
  mg: 'mga',
  mh: 'usd',
  mk: 'mkd',
  ml: 'xof',
  mm: 'mmk',
  mn: 'mnt',
  mo: 'mop',
  mp: 'usd',
  mq: 'eur',
  mr: 'mro',
  ms: 'xcd',
  mt: 'eur',
  mu: 'mur',
  mv: 'mvr',
  mw: 'mwk',
  mx: 'mxn',
  my: 'myr',
  mz: 'mzn',
  na: 'nad',
  nc: 'xpf',
  ne: 'xof',
  nf: 'aud',
  ng: 'ngn',
  ni: 'nio',
  nl: 'eur',
  no: 'nok',
  np: 'npr',
  nr: 'aud',
  nu: 'nzd',
  nz: 'nzd',
  om: 'omr',
  pa: 'pab',
  pe: 'pen',
  pf: 'xpf',
  pg: 'pgk',
  ph: 'php',
  pk: 'pkr',
  pl: 'pln',
  pm: 'eur',
  pn: 'nzd',
  pr: 'usd',
  ps: 'ils',
  pt: 'eur',
  pw: 'usd',
  py: 'pyg',
  qa: 'qar',
  re: 'eur',
  ro: 'ron',
  rs: 'rsd',
  ru: 'rub',
  rw: 'rwf',
  sa: 'sar',
  sb: 'sbd',
  sc: 'scr',
  sd: 'sdg',
  se: 'sek',
  sg: 'sgd',
  sh: 'shp',
  si: 'eur',
  sj: 'nok',
  sk: 'eur',
  sl: 'sll',
  sm: 'eur',
  sn: 'xof',
  so: 'sos',
  sr: 'srd',
  ss: 'ssp',
  st: 'std',
  sv: 'svc',
  sx: 'ang',
  sy: 'syp',
  sz: 'szl',
  tc: 'usd',
  td: 'xaf',
  tf: 'eur',
  tg: 'xof',
  th: 'thb',
  tj: 'tjs',
  tk: 'nzd',
  tl: 'usd',
  tm: 'tmt',
  tn: 'tnd',
  to: 'top',
  tr: 'try',
  tt: 'ttd',
  tv: 'aud',
  tw: 'twd',
  tz: 'tzs',
  ua: 'uah',
  ug: 'ugx',
  um: 'usd',
  us: 'usd',
  uy: 'uyu',
  uz: 'uzs',
  va: 'eur',
  vc: 'xcd',
  ve: 'vef',
  vg: 'usd',
  vi: 'usd',
  vn: 'vnd',
  vu: 'vuv',
  wf: 'xpf',
  ws: 'wst',
  ye: 'yer',
  yt: 'eur',
  za: 'zar',
  zm: 'zmw',
  zw: 'zwl',
}

/**
 * 通貨フォーマット用のReactフック
 *
 * 【機能】
 * - ユーザーの地域に適した通貨を自動選択
 * - ロケールに応じたフォーマット（$1,000 / ¥1,000 / €1.000）
 * - カスタムオプションでフォーマットをカスタマイズ可能
 *
 * 【戻り値】
 * - format: 数値を通貨文字列に変換する関数
 * - currency: 使用される通貨コード（例: 'usd', 'jpy'）
 * - countryCode: 国コード（例: 'us', 'jp'）
 * - languageTag: 言語タグ（例: 'en-US', 'ja-JP'）
 *
 * 【使用例】
 * const { format, currency } = useFormatCurrency()
 * console.log(format(1000)) // "$1,000.00" (en-US) / "¥1,000" (ja-JP)
 *
 * @param options Intl.NumberFormatの追加オプション
 * @returns 通貨フォーマット関連の情報とフォーマット関数
 */
export function useFormatCurrency(
  options?: Parameters<typeof Intl.NumberFormat>[1],
) {
  // ジオロケーション情報を取得（IP位置情報から）
  const {location: geolocation} = useGeolocationStatus()
  // ユーザーが設定したアプリの言語
  const {appLanguage} = useLanguagePrefs()

  return React.useMemo(() => {
    // デバイスの最初のロケールを取得
    const locale = deviceLocales.at(0)
    // 言語タグの決定（優先順位: ロケール > アプリ設定 > デフォルト）
    const languageTag = locale?.languageTag || appLanguage || 'en-US'
    // 国コードの決定（優先順位: ロケール > ジオロケーション > デフォルト）
    const countryCode = (
      locale?.regionCode ||
      geolocation?.countryCode ||
      'us'
    ).toLowerCase()
    // 国コードから通貨を決定
    const currency = countryCodeToCurrency[countryCode] || 'usd'

    // Intl.NumberFormatでフォーマッターを作成
    const format = new Intl.NumberFormat(languageTag, {
      ...(options || {}),
      style: 'currency',
      currency: currency,
    }).format

    return {
      format,
      currency,
      countryCode,
      languageTag,
    }
  }, [geolocation, appLanguage, options])
}
