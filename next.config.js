const NextWithLess = require('next-with-less');
// const NextTranspileModule = require('next-transpile-modules');
// const config = require('./src/configs/app.config');
// const merged = require('merge-deep');
// const { format, formatWithOptions } = require('util');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mars/common'],
  reactStrictMode: true,
  swcMinify: true,
  cleanDistDir: true,

  poweredByHeader: false,

  lessLoaderOptions: {
    lessOptions: {
      javascriptEnabled: true,
    },
  },

  typescript: {
    ignoreBuildErrors: true
  },

  webpack(config, context) {
    return config;
  }
}

// const TranspilesTarget = NextTranspileModule([
//   "@mars/common"
// ]);
module.exports = NextWithLess(nextConfig);