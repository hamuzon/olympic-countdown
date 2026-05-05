// @ts-nocheck
// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2026-05-05',
  ssr: true, // Enabled for OGP pre-rendering on GitHub Pages
  app: {
    baseURL: process.env.GITHUB_REPOSITORY ? `/${process.env.GITHUB_REPOSITORY.split('/')[1]}/` : '/',
    head: {
      htmlAttrs: {
        lang: 'ja'
      },
      title: 'Olympic Countdown',
      meta: [
        { charset: 'utf-8' },
        { name: 'viewport', content: 'width=device-width, initial-scale=1' },
        { key: 'description', name: 'description', content: '夏季・冬季オリンピックの開催まで、開催期間中、終了後の経過時間をリアルタイムで表示するカウントダウンタイマーです。' },
        { name: 'keywords', content: 'オリンピック, カウントダウン, 五輪, Olympic, Countdown, 2026, 2028, 夏季, 冬季' },
        { name: 'author', content: 'hamuzon' },
        { key: 'og:description', property: 'og:description', content: '夏季・冬季オリンピックの開催まで、開催期間中、終了後の経過時間をリアルタイムで表示するカウントダウンタイマーです。' },
        { property: 'og:type', content: 'website' },
        { key: 'og:locale', property: 'og:locale', content: 'ja_JP' },
        { name: 'twitter:card', content: 'summary' },
        { key: 'twitter:description', name: 'twitter:description', content: '夏季・冬季オリンピックの開催まで、開催期間中、終了後の経過時間をリアルタイムで表示するカウントダウンタイマーです。' },
      ],
      link: [
        { rel: 'icon', type: 'image/svg+xml', href: '/icon.svg' },
        { rel: 'icon', sizes: 'any', href: '/favicon.ico' }
      ]
    }
  },
  nitro: {
    prerender: {
      routes: [
        '/',
        '/2020/ja', '/2020/en',
        '/2022/ja', '/2022/en',
        '/2024/ja', '/2024/en',
        '/2026/ja', '/2026/en',
        '/2028/ja', '/2028/en',
        '/2030/ja', '/2030/en',
        '/2032/ja', '/2032/en',
        '/2034/ja', '/2034/en'
      ]
    }
  },
  css: [
    '~/assets/base.css'
  ],
  devtools: { enabled: true }
})
