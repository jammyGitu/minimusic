'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Layout, Menu, Button, Drawer } from 'antd'
import {
  SoundOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled,
  AudioOutlined,
  TableOutlined,
  PlaySquareOutlined,
  HomeOutlined,
  CloseOutlined,
} from '@ant-design/icons'
import { useSnapshot } from 'valtio'
import { themeState, toggleTheme } from '@/stores/theme'
import styles from './AppLayout.module.scss'

const { Content } = Layout

interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  children?: MenuItem[]
}

// 主导航（顶部横向 pill 导航）
const topNav = [
  { key: '/', label: '首页' },
  { key: '/practice/interval', label: '视唱练耳' },
  { key: '/piano', label: '虚拟乐器' },
  { key: '/staff', label: '工具' },
  { key: '/progress', label: '学习进度' },
]

// 完整侧边导航（二级）
const menuItems: MenuItem[] = [
  { key: '/', label: '首页', icon: <HomeOutlined /> },
  {
    key: 'ear-training',
    label: '视唱练耳',
    icon: <CustomerServiceOutlined />,
    children: [
      { key: '/practice/interval', label: '音程辨认', icon: <SoundOutlined /> },
      { key: '/practice/harmony', label: '和弦辨认', icon: <SoundOutlined /> },
      { key: '/practice/melody', label: '旋律辨认', icon: <AudioOutlined /> },
      { key: '/practice/beat', label: '节奏练习', icon: <PlaySquareOutlined /> },
      { key: '/practice/chord-progression', label: '和弦进行', icon: <TableOutlined /> },
      { key: '/practice/staff-note', label: '五线谱视奏', icon: <AudioOutlined /> },
    ],
  },
  {
    key: 'instruments',
    label: '虚拟乐器',
    icon: <DashboardOutlined />,
    children: [
      { key: '/piano', label: '虚拟钢琴', icon: <DashboardOutlined /> },
      { key: '/chord-editor', label: '和弦编辑器', icon: <TableOutlined /> },
      { key: '/guitar', label: '吉他指板', icon: <DashboardOutlined /> },
    ],
  },
  {
    key: 'tools',
    label: '工具',
    icon: <FileTextOutlined />,
    children: [
      { key: '/staff', label: '五线谱', icon: <AudioOutlined /> },
      { key: '/midi-roll', label: 'MIDI 卷帘', icon: <DashboardOutlined /> },
      { key: '/editor', label: '富文本编辑器', icon: <FileTextOutlined /> },
    ],
  },
  { key: '/progress', label: '学习进度', icon: <BarChartOutlined /> },
]

function getPageTitle(pathname: string): string {
  const flatMap: Record<string, string> = {
    '/': '首页',
    '/practice/interval': '音程辨认',
    '/practice/harmony': '和弦辨认',
    '/practice/melody': '旋律辨认',
    '/practice/beat': '节奏练习',
    '/practice/chord-progression': '和弦进行',
    '/practice/staff-note': '五线谱视奏',
    '/piano': '虚拟钢琴',
    '/chord-editor': '和弦编辑器',
    '/guitar': '吉他指板',
    '/staff': '五线谱',
    '/midi-roll': 'MIDI 卷帘',
    '/editor': '富文本编辑器',
    '/progress': '学习进度',
  }
  return flatMap[pathname] || 'Minimusic'
}

// 判断顶部导航项是否激活
function isTopNavActive(navKey: string, pathname: string): boolean {
  if (navKey === '/') return pathname === '/'
  if (navKey === '/practice/interval') return pathname.startsWith('/practice')
  if (navKey === '/piano')
    return ['/piano', '/chord-editor', '/guitar'].some(p => pathname.startsWith(p))
  if (navKey === '/staff')
    return ['/staff', '/midi-roll', '/editor'].some(p => pathname.startsWith(p))
  if (navKey === '/progress') return pathname.startsWith('/progress')
  return false
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const [scrolled, setScrolled] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { mode } = useSnapshot(themeState)

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 1024)
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  const defaultOpenKeys = useMemo(() => {
    if (pathname.startsWith('/practice')) return ['ear-training']
    if (['/piano', '/chord-editor', '/guitar'].includes(pathname)) return ['instruments']
    if (['/staff', '/midi-roll', '/editor'].includes(pathname)) return ['tools']
    return []
  }, [pathname])

  const handleMenuClick = (info: { key: string }) => {
    router.push(info.key)
    if (isMobile) setMobileMenuOpen(false)
  }

  const pageTitle = getPageTitle(pathname)
  const isHome = pathname === '/'

  // 侧边栏导航内容（移动端抽屉）
  const drawerContent = (
    <div className={styles.drawerInner}>
      <div className={styles.drawerHeader}>
        <div className={styles.logo} onClick={() => { router.push('/'); setMobileMenuOpen(false) }}>
          <span className={styles.logoMark}>♫</span>
          <span className={styles.logoText}>Minimusic</span>
        </div>
        <Button type="text" icon={<CloseOutlined />} onClick={() => setMobileMenuOpen(false)} />
      </div>
      <Menu
        mode="inline"
        selectedKeys={[pathname]}
        defaultOpenKeys={defaultOpenKeys}
        onClick={handleMenuClick}
        className={styles.drawerMenu}
        items={menuItems.map(item => ({
          key: item.key,
          icon: item.icon,
          label: item.label,
          children: item.children?.map(child => ({
            key: child.key,
            icon: child.icon,
            label: child.label,
          })),
        }))}
      />
      <div className={styles.drawerFooter}>
        <Button
          type="text"
          icon={mode === 'dark' ? <BulbFilled style={{ color: '#fbbf24' }} /> : <BulbOutlined />}
          onClick={toggleTheme}
          block
        >
          {mode === 'dark' ? '切换到亮色模式' : '切换到暗色模式'}
        </Button>
      </div>
    </div>
  )

  // 移动端底部 TabBar
  const mobileTabBar = (
    <div className={styles.mobileTabBar}>
      {[
        { key: '/', label: '首页', icon: <HomeOutlined /> },
        { key: '/practice/interval', label: '练习', icon: <CustomerServiceOutlined /> },
        { key: '/piano', label: '乐器', icon: <DashboardOutlined /> },
        { key: '/progress', label: '进度', icon: <BarChartOutlined /> },
      ].map(tab => {
        const active =
          pathname === tab.key ||
          (tab.key === '/practice/interval' && pathname.startsWith('/practice')) ||
          (tab.key === '/piano' && ['/piano', '/chord-editor', '/guitar'].includes(pathname))
        return (
          <div
            key={tab.key}
            className={`${styles.tabItem} ${active ? styles.tabActive : ''}`}
            onClick={() => router.push(tab.key)}
          >
            <span className={styles.tabIcon}>{tab.icon}</span>
            <span className={styles.tabLabel}>{tab.label}</span>
          </div>
        )
      })}
    </div>
  )

  return (
    <Layout className={styles.layout} data-theme={mode}>
      {/* 顶部导航栏（MiniMax 风格：白底 + pill 激活态） */}
      <header className={`${styles.topNav} ${scrolled ? styles.topNavScrolled : ''}`}>
        <div className={styles.topNavInner}>
          {/* Logo */}
          <div className={styles.logo} onClick={() => router.push('/')}>
            <span className={styles.logoMark}>♫</span>
            <span className={styles.logoText}>Minimusic</span>
          </div>

          {/* 桌面端横向导航 */}
          {!isMobile && (
            <nav className={styles.navLinks}>
              {topNav.map(item => (
                <button
                  key={item.key}
                  className={`${styles.navLink} ${isTopNavActive(item.key, pathname) ? styles.navLinkActive : ''}`}
                  onClick={() => router.push(item.key)}
                >
                  {item.label}
                </button>
              ))}
            </nav>
          )}

          {/* 右侧操作 */}
          <div className={styles.topNavRight}>
            <Button
              type="text"
              shape="circle"
              icon={mode === 'dark' ? <BulbFilled style={{ color: '#fbbf24' }} /> : <BulbOutlined />}
              onClick={toggleTheme}
              aria-label="切换主题"
            />
            {!isMobile && (
              <Button
                type="primary"
                className={styles.ctaBtn}
                onClick={() => router.push('/practice/interval')}
              >
                开始练习
              </Button>
            )}
            {isMobile && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                aria-label="打开菜单"
              />
            )}
          </div>
        </div>
      </header>

      {/* 移动端抽屉 */}
      {isMobile && (
        <Drawer
          placement="left"
          open={mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          width={280}
          className={styles.mobileDrawer}
          closable={false}
          styles={{ body: { padding: 0 } }}
        >
          {drawerContent}
        </Drawer>
      )}

      {/* 页面内容 */}
      <Content className={`${styles.content} ${isHome ? styles.contentHome : ''}`}>
        {/* 非首页显示页面标题条 */}
        {!isHome && (
          <div className={styles.pageHeader}>
            <div className={styles.pageHeaderInner}>
              <h1 className={styles.pageTitle}>{pageTitle}</h1>
            </div>
          </div>
        )}
        <div className={styles.pageBody}>{children}</div>
      </Content>

      {/* 移动端底部导航 */}
      {isMobile && mobileTabBar}
    </Layout>
  )
}
