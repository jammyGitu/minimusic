/** @type {import('next').NextConfig} */
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

const nextConfig = {
  reactStrictMode: false,  // 禁用 React Strict Mode 避免双重渲染
  swcMinify: true,         // 使用 SWC 压缩提升构建速度
  transpilePackages: [
    'rc-util',
    'rc-picker',
    '@ant-design/icons-svg',
  ],
  // 实验性优化
  experimental: {
    optimizePackageImports: ['antd', '@ant-design/icons', 'lodash'],
  },
};

module.exports = withBundleAnalyzer(nextConfig);
