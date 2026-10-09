'use client'

import React from 'react'
import { ConfigProvider, theme as antdTheme, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { useSnapshot } from 'valtio'
import { themeState } from '@/stores/theme'
import AppLayout from '@/components/Layout/AppLayout'
import { dmSans, outfit, poppins, roboto } from '@/app/fonts'
import './globals.css'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html
      lang="zh-CN"
      data-theme="light"
      className={`${dmSans.variable} ${outfit.variable} ${poppins.variable} ${roboto.variable}`}
    >
      <head>
        <title>Minimusic - 音乐学习平台</title>
        <meta name="description" content="集视唱练耳、乐理学习、音乐创作与记谱于一体的专业工具箱" />
        <ThemeScript />
      </head>
      <body>
        <ThemeProvider>
          <AntdRegistry>
            <AppLayout>{children}</AppLayout>
          </AntdRegistry>
        </ThemeProvider>
      </body>
    </html>
  )
}

/**
 * 注入脚本，在页面加载前应用主题，避免闪烁
 * 内容为硬编码常量，不涉及用户输入
 */
function ThemeScript() {
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: `
          (function() {
            try {
              var theme = localStorage.getItem('minimusic-theme');
              if (theme === 'dark') {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else if (!theme && window.matchMedia('(prefers-color-scheme: dark)').matches) {
                document.documentElement.setAttribute('data-theme', 'dark');
              } else {
                document.documentElement.setAttribute('data-theme', 'light');
              }
            } catch(e) {}
          })();
        `,
      }}
    />
  )
}

/**
 * 主题提供者，包裹 Ant Design ConfigProvider
 * 使用 MiniMax 设计 token 映射到 Ant Design
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useSnapshot(themeState)
  const isDark = mode === 'dark'

  // 同步 data-theme 属性
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  const fontStack =
    "var(--font-dm-sans), 'Helvetica Neue', Helvetica, Arial, 'Noto Sans SC', 'PingFang SC', 'Microsoft YaHei', sans-serif"

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm: isDark ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          // 品牌蓝
          colorPrimary: isDark ? '#3b82f6' : '#1456f0',
          colorInfo: isDark ? '#3b82f6' : '#1456f0',
          colorSuccess: isDark ? '#4ade80' : '#22c55e',
          colorError: isDark ? '#f87171' : '#ef4444',
          colorWarning: isDark ? '#fbbf24' : '#f59e0b',

          // 圆角
          borderRadius: 8,
          borderRadiusLG: 20,
          borderRadiusSM: 6,

          // 字体
          fontFamily: fontStack,
          fontSize: 16,

          // 背景
          colorBgBase: isDark ? '#0f1115' : '#ffffff',
          colorBgContainer: isDark ? '#1a1d23' : '#ffffff',
          colorBgElevated: isDark ? '#22262e' : '#ffffff',
          colorBgLayout: isDark ? '#0f1115' : '#ffffff',

          // 文本
          colorText: isDark ? '#ededed' : '#222222',
          colorTextSecondary: isDark ? '#a1a1aa' : '#45515e',
          colorTextTertiary: isDark ? '#71717a' : '#8e8e93',

          // 边框
          colorBorder: isDark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
          colorBorderSecondary: isDark ? 'rgba(255,255,255,0.08)' : '#f2f3f5',

          // 阴影
          boxShadow: isDark
            ? 'rgba(0,0,0,0.4) 0px 4px 6px'
            : 'rgba(0, 0, 0, 0.08) 0px 4px 6px',
          boxShadowSecondary: isDark
            ? 'rgba(0,0,0,0.5) 0px 12px 16px -4px'
            : 'rgba(36, 36, 36, 0.08) 0px 12px 16px -4px',
        },
        components: {
          Card: {
            borderRadiusLG: 20,
          },
          Menu: {
            itemBorderRadius: 9999,
            itemMarginInline: 8,
            itemHeight: 40,
          },
          Button: {
            fontWeight: 500,
          },
          Layout: {
            bodyBg: isDark ? '#0f1115' : '#ffffff',
            headerBg: isDark ? '#1a1d23' : '#ffffff',
            siderBg: isDark ? '#1a1d23' : '#ffffff',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
