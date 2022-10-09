const NextWithLess = require('next-with-less');
const NextTranspileModule = require('next-transpile-modules');
const config = require('./configs/app.config');
const merged = require('merge-deep');
const { format, formatWithOptions } = require('util');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  output: 'standalone',

  poweredByHeader: false,
  publicRuntimeConfig: merged({}, config.general, config.browser),
  serverRuntimeConfig: Object.assign({}, config.general, config.server),

  lessLoaderOptions: {
    lessOptions: {
      javascriptEnabled: true,
    },
  },

  webpack(config, context) {
    console.log(formatWithOptions({ depth: 5 }, config))
    return config;
  }
}

const TranspilesTarget = NextTranspileModule([
  "@mars/common"
]);
module.exports = TranspilesTarget(NextWithLess(nextConfig));