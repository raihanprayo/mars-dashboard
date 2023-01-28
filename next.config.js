const NextWithLess = require('next-with-less');

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@mars/common'],
  reactStrictMode: true,
  swcMinify: true,
  cleanDistDir: true,

  poweredByHeader: false,

  output: 'standalone',
  lessLoaderOptions: {
    lessOptions: {
      javascriptEnabled: true,
    },
  },

  typescript: {
    ignoreBuildErrors: true,
  },

  // webpack(config, context) {
  //   return config;
  // }
}

module.exports = NextWithLess(nextConfig);