/**
 * デモフィードデータモジュール
 *
 * 【概要】
 * ログイン前の画面やマーケティング用にダミーの投稿データを提供。
 * リアルなBlueskyフィードの見た目を再現するためのモックデータ。
 *
 * 【使用場面】
 * - PWI（Public Web Interface）のログイン前画面
 * - スクリーンショット撮影
 * - UIデモンストレーション
 *
 * 【データ構造】
 * - AT Protocol準拠のフィード形式
 * - 3件のサンプル投稿（画像付き・テキストのみ）
 * - 認証済みユーザー情報を含む
 *
 * 【Goユーザー向け補足】
 * - satisfies: TypeScriptの型チェック演算子
 *   値が特定の型を満たすことを確認（型の絞り込みには使わない）
 * - subMinutes/subDays: date-fnsライブラリの日時計算
 *   Goのtime.Add(-duration)に相当
 */
import {type AppBskyFeedGetFeed} from '@atproto/api'
import {subDays, subMinutes} from 'date-fns'

/** Bluesky公式アカウントのDID */
const DID = `did:plc:z72i7hdynmk6r22z27h6tvur`

/** 現在時刻（デモデータの基準） */
const NOW = new Date()

/** 各投稿の作成日時（現在から数分前） */
const POST_1_DATE = subMinutes(NOW, 2).toISOString()
const POST_2_DATE = subMinutes(NOW, 4).toISOString()
const POST_3_DATE = subMinutes(NOW, 5).toISOString()

/**
 * デモ用フィードデータ
 *
 * 【投稿1】バンドのライブ告知（画像付き、認証済み）
 * 【投稿2】インテリアデザイン紹介（画像付き）
 * 【投稿3】木工作品の紹介（テキストのみ）
 */
export const DEMO_FEED = {
  feed: [
    {
      post: {
        uri: 'at://did:plc:pvooorihapc2lf2pijehgrdf/app.bsky.feed.post/3lniysofyll2d',
        cid: 'bafyreihwh3wxxme732ylbylhhdyz7ex6t4jtu6s3gjxxvnnh4feddhg3ku',
        author: {
          did: 'did:plc:pvooorihapc2lf2pijehgrdf',
          handle: 'forkedriverband.bsky.social',
          displayName: 'Forked River Band',
          avatar: 'https://bsky.social/about/adi/post_1_avi.jpg',
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post1`,
          },
          labels: [],
          createdAt: POST_1_DATE,
          verification: {
            verifications: [
              {
                issuer: DID,
                uri: `at://${DID}/app.bsky.graph.verification/post1`,
                isValid: true,
                createdAt: subDays(NOW, 11).toISOString(),
              },
            ],
            verifiedStatus: 'valid',
            trustedVerifierStatus: 'none',
          },
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_1_DATE,
          // embed: {
          //   $type: 'app.bsky.embed.images',
          //   images: [
          //     {
          //       alt: 'Fake flier for Sebastapol Bluegrass Fest',
          //       aspectRatio: {
          //         height: 1350,
          //         width: 900,
          //       },
          //       image: {
          //         $type: 'blob',
          //         ref: {
          //           $link:
          //             'bafkreig7gnirmz5guhhjutf3mqbjjzxzi3w4wvs5qy2gnxma5g3brbaidi',
          //         },
          //         mimeType: 'image/jpeg',
          //         size: 562871,
          //       },
          //     },
          //   ],
          // },
          langs: ['en'],
          text: 'Sonoma County folks: Come tip your hats our way and see us play new and old bluegrass tunes at Sebastopol Solstice Fest on June 20th.',
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://bsky.social/about/adi/post_1_image.jpg',
              fullsize: 'https://bsky.social/about/adi/post_1_image.jpg',
              alt: 'Fake flier for Sebastapol Bluegrass Fest',
              aspectRatio: {
                height: 1350,
                width: 900,
              },
            },
          ],
        },
        replyCount: 1,
        repostCount: 4,
        likeCount: 18,
        quoteCount: 0,
        indexedAt: POST_1_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:fhhqii56ppgyh5qcm2b3mokf/app.bsky.feed.post/3lnizc7fug52c',
        cid: 'bafyreienuabsr55rycirdf4ewue5tjcseg5lzqompcsh2brqzag6hvxllm',
        author: {
          did: 'did:plc:fhhqii56ppgyh5qcm2b3mokf',
          handle: 'dinh-designs.bsky.social',
          displayName: 'Rich Dinh Designs',
          avatar: 'https://bsky.social/about/adi/post_2_avi.jpg',
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post2`,
          },
          labels: [],
          createdAt: POST_2_DATE,
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_2_DATE,
          // embed: {
          //   $type: 'app.bsky.embed.images',
          //   images: [
          //     {
          //       alt: 'Placeholder image of interior design',
          //       aspectRatio: {
          //         height: 872,
          //         width: 598,
          //       },
          //       image: {
          //         $type: 'blob',
          //         ref: {
          //           $link:
          //             'bafkreidcjc6bjb4jjjejruin5cldhj5zovsuu4tydulenyprneziq5rfeu',
          //         },
          //         mimeType: 'image/jpeg',
          //         size: 296003,
          //       },
          //     },
          //   ],
          // },
          langs: ['en'],
          text: 'Details from our install at the Lucas residence in Joshua Tree. We populated the space with rich, earthy tones and locally-sourced materials to suit the landscape.',
        },
        embed: {
          $type: 'app.bsky.embed.images#view',
          images: [
            {
              thumb: 'https://bsky.social/about/adi/post_2_image.jpg',
              fullsize: 'https://bsky.social/about/adi/post_2_image.jpg',
              alt: 'Placeholder image of interior design',
              aspectRatio: {
                height: 872,
                width: 598,
              },
            },
          ],
        },
        replyCount: 3,
        repostCount: 1,
        likeCount: 4,
        quoteCount: 0,
        indexedAt: POST_2_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
    {
      post: {
        uri: 'at://did:plc:h7fwnfejmmifveeea5eyxgkc/app.bsky.feed.post/3lnizna3g4f2t',
        cid: 'bafyreiepn7obmlshliori4j34texpaukrqkyyu7cq6nmpzk4lkis7nqeae',
        author: {
          did: 'did:plc:h7fwnfejmmifveeea5eyxgkc',
          handle: 'rodyalbuerne.bsky.social',
          displayName: 'Rody Albuerne',
          avatar: 'https://bsky.social/about/adi/post_3_avi.jpg',
          viewer: {
            muted: false,
            blockedBy: false,
            following: `at://${DID}/app.bsky.graph.follow/post3`,
          },
          labels: [],
          createdAt: POST_3_DATE,
        },
        record: {
          $type: 'app.bsky.feed.post',
          createdAt: POST_3_DATE,
          langs: ['en'],
          text: 'Tinkering with the basics of traditional wooden joinery in my shop lately. Starting small with this ox, made using simple mortise and tenon joints.',
        },
        replyCount: 11,
        repostCount: 97,
        likeCount: 399,
        quoteCount: 0,
        indexedAt: POST_3_DATE,
        viewer: {
          threadMuted: false,
          embeddingDisabled: false,
        },
        labels: [],
      },
    },
  ],
} satisfies AppBskyFeedGetFeed.OutputSchema

/** ボトムバー用のデモユーザーアバター画像URL */
export const BOTTOM_BAR_AVI = 'https://bsky.social/about/adi/user_avi.jpg'
