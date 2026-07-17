/**
 * 主题状态管理
 * 使用 Valtio 管理亮色/暗色主题
 */

import { proxy } from 'valtio'

export type ThemeMode = 'light' | 'dark'

export interface ThemeState {
  mode: ThemeMode
}

// 从 localStorage 加载
const loadTheme = (): ThemeMode => {
  if (typeof window === 'undefined') return 'light'
  const stored = localStorage.getItem('minimusic-theme')
  if (stored === 'dark' || stored === 'light') return stored
  // 跟随系统偏好
  if (window.matchMedia?.('(prefers-color-scheme: dark)').matches) return 'dark'
  return 'light'
}

const saveTheme = (mode: ThemeMode) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('minimusic-theme', mode)
  }
}

// 创建状态
export const themeState = proxy<ThemeState>({
  mode: loadTheme(),
})

/**
 * 切换主题模式
 */
export function toggleTheme() {
  themeState.mode = themeState.mode === 'light' ? 'dark' : 'light'
  saveTheme(themeState.mode)
}

/**
 * 设置主题模式
 */
export function setTheme(mode: ThemeMode) {
  themeState.mode = mode
  saveTheme(mode)
}
