const NextWithLess = require('next-with-less');
// const NextTranspileModule = require('next-transpile-modules');
const config = require('./configs/app.config');
const merged = require('merge-deep');
// const { format, formatWithOptions } = require('util');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages:['@mars/common'],
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

  webpack(config, context) {
    return config;
  }
}

// const TranspilesTarget = NextTranspileModule([
//   "@mars/common"
// ]);
module.exports = NextWithLess(nextConfig)