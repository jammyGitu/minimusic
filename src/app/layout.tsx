'use client'

import React from 'react'
import type { Metadata } from 'next'
import { ConfigProvider, theme as antdTheme, App } from 'antd'
import zhCN from 'antd/locale/zh_CN'
import { AntdRegistry } from '@ant-design/nextjs-registry'
import { useSnapshot } from 'valtio'
import { themeState } from '@/stores/theme'
import AppLayout from '@/components/Layout/AppLayout'
import './globals.css'

// 注意：metadata 在 'use client' 组件中不可用，但 Next.js 14 会从 layout 中提取
// 这里通过客户端组件包装的方式处理
export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN" data-theme="light">
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
 */
function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { mode } = useSnapshot(themeState)

  // 同步 data-theme 属性
  React.useEffect(() => {
    document.documentElement.setAttribute('data-theme', mode)
  }, [mode])

  return (
    <ConfigProvider
      locale={zhCN}
      theme={{
        algorithm:
          mode === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#b8944f',
          borderRadius: 8,
          fontFamily:
            "'Georgia', 'Times New Roman', 'Noto Serif SC', 'PingFang SC', 'Microsoft YaHei', sans-serif",
        },
        components: {
          Menu: {
            itemBorderRadius: 8,
            itemMarginInline: 8,
          },
          Layout: {
            bodyBg: mode === 'dark' ? '#141414' : '#ffffff',
            headerBg: mode === 'dark' ? '#141414' : '#ffffff',
            siderBg: mode === 'dark' ? '#141414' : '#ffffff',
          },
        },
      }}
    >
      <App>{children}</App>
    </ConfigProvider>
  )
}
