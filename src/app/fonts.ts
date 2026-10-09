import { DM_Sans, Outfit, Poppins, Roboto } from 'next/font/google'

/**
 * MiniMax 设计系统字体
 * DM Sans  — UI 主力字体（正文、导航、按钮）
 * Outfit   — 几何展示字体（大标题、产品名）
 * Poppins  — 友好中间层字体（次级标题、功能名）
 * Roboto   — 数据/技术语境字体
 */

export const dmSans = DM_Sans({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-dm-sans',
  display: 'swap',
})

export const outfit = Outfit({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-outfit',
  display: 'swap',
})

export const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-poppins',
  display: 'swap',
})

export const roboto = Roboto({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-roboto',
  display: 'swap',
})
