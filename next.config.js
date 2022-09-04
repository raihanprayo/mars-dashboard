const NextWithLess = require('next-with-less');
const config = require('./configs/app.config');
const merged = require('merge-deep')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,

  poweredByHeader: false,
  publicRuntimeConfig: merged({}, config.general, config.browser),
  serverRuntimeConfig: Object.assign({}, config.general, config.server),

  lessLoaderOptions: {
    lessOptions: {
      javascriptEnabled: true,
    },
  },
}

module.exports = NextWithLess(nextConfig);