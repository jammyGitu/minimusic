'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { Layout, Menu, Button, Typography, Drawer } from 'antd'
import {
  SoundOutlined,
  CustomerServiceOutlined,
  DashboardOutlined,
  BarChartOutlined,
  FileTextOutlined,
  MenuFoldOutlined,
  MenuUnfoldOutlined,
  BulbOutlined,
  BulbFilled,
  AudioOutlined,
  TableOutlined,
  PlaySquareOutlined,
  HomeOutlined,
} from '@ant-design/icons'
import { useSnapshot } from 'valtio'
import { themeState, toggleTheme } from '@/stores/theme'
import styles from './AppLayout.module.scss'

const { Sider, Content } = Layout
const { Text } = Typography

// 菜单项定义
interface MenuItem {
  key: string
  label: string
  icon: React.ReactNode
  children?: MenuItem[]
}

const menuItems: MenuItem[] = [
  {
    key: '/',
    label: '首页',
    icon: <HomeOutlined />,
  },
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
  {
    key: '/progress',
    label: '学习进度',
    icon: <BarChartOutlined />,
  },
]

// 根据路径获取页面标题
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

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const [collapsed, setCollapsed] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)
  const pathname = usePathname()
  const router = useRouter()
  const { mode } = useSnapshot(themeState)

  // 检测移动端
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768)
    }
    checkMobile()
    window.addEventListener('resize', checkMobile)
    return () => window.removeEventListener('resize', checkMobile)
  }, [])

  // 在移动端自动折叠侧边栏
  useEffect(() => {
    if (isMobile) {
      setCollapsed(true)
    }
  }, [isMobile])

  // 计算选中的菜单项和展开的子菜单
  const selectedKeys = useMemo(() => {
    // 检查是否是子路径
    const keys = [pathname]
    return keys
  }, [pathname])

  const defaultOpenKeys = useMemo(() => {
    if (pathname.startsWith('/practice')) return ['ear-training']
    if (pathname === '/piano' || pathname === '/chord-editor' || pathname === '/guitar') return ['instruments']
    if (pathname === '/staff' || pathname === '/midi-roll' || pathname === '/editor') return ['tools']
    return []
  }, [pathname])

  const handleMenuClick = (info: { key: string }) => {
    router.push(info.key)
    if (isMobile) setMobileMenuOpen(false)
  }

  const pageTitle = getPageTitle(pathname)

  // 侧边栏内容
  const sidebarContent = (
    <div className={styles.sidebarInner}>
      {/* Logo */}
      <div className={styles.logo} onClick={() => router.push('/')}>
        <span className={styles.logoIcon}>♫</span>
        {!collapsed && <span className={styles.logoText}>Minimusic</span>}
      </div>

      {/* 导航菜单 */}
      <Menu
        mode="inline"
        selectedKeys={selectedKeys}
        defaultOpenKeys={defaultOpenKeys}
        onClick={handleMenuClick}
        className={styles.menu}
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

      {/* 底部控制 */}
      <div className={styles.sidebarFooter}>
        {!isMobile && (
          <Button
            type="text"
            icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
            onClick={() => setCollapsed(!collapsed)}
            className={styles.collapseBtn}
            block
          />
        )}
        <Button
          type="text"
          icon={mode === 'dark' ? <BulbFilled style={{ color: '#fbbf24' }} /> : <BulbOutlined />}
          onClick={toggleTheme}
          className={styles.themeBtn}
          block
        >
          {!collapsed && (mode === 'dark' ? '暗色模式' : '亮色模式')}
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
        { key: '/piano', label: '钢琴', icon: <DashboardOutlined /> },
        { key: '/progress', label: '进度', icon: <BarChartOutlined /> },
      ].map(tab => (
        <div
          key={tab.key}
          className={`${styles.tabItem} ${pathname === tab.key || (tab.key === '/practice/interval' && pathname.startsWith('/practice')) ? styles.tabActive : ''}`}
          onClick={() => router.push(tab.key)}
        >
          <span className={styles.tabIcon}>{tab.icon}</span>
          <span className={styles.tabLabel}>{tab.label}</span>
        </div>
      ))}
    </div>
  )

  return (
    <Layout className={styles.layout} data-theme={mode}>
      {/* 桌面端侧边栏 */}
      {!isMobile && (
        <Sider
          collapsible
          collapsed={collapsed}
          onCollapse={setCollapsed}
          trigger={null}
          width={240}
          collapsedWidth={80}
          className={styles.sider}
        >
          {sidebarContent}
        </Sider>
      )}

      {/* 移动端抽屉菜单 */}
      {isMobile && (
        <>
          <Drawer
            placement="left"
            open={mobileMenuOpen}
            onClose={() => setMobileMenuOpen(false)}
            width={260}
            className={styles.mobileDrawer}
            styles={{ body: { padding: 0 } }}
          >
            {sidebarContent}
          </Drawer>
        </>
      )}

      {/* 主内容区 */}
      <Layout className={styles.mainLayout}>
        {/* 顶部栏 */}
        <div className={styles.topBar}>
          <div className={styles.topBarLeft}>
            {isMobile && (
              <Button
                type="text"
                icon={<MenuUnfoldOutlined />}
                onClick={() => setMobileMenuOpen(true)}
                className={styles.mobileMenuBtn}
              />
            )}
            <Text strong className={styles.pageTitle}>{pageTitle}</Text>
          </div>
          <div className={styles.topBarRight}>
            {isMobile && (
              <Button
                type="text"
                icon={mode === 'dark' ? <BulbFilled style={{ color: '#fbbf24' }} /> : <BulbOutlined />}
                onClick={toggleTheme}
              />
            )}
          </div>
        </div>

        {/* 页面内容 */}
        <Content className={styles.content}>
          {children}
        </Content>
      </Layout>

      {/* 移动端底部导航 */}
      {isMobile && mobileTabBar}
    </Layout>
  )
}
