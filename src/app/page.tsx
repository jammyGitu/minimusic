'use client'

import Link from 'next/link'
import {
  SoundOutlined,
  DashboardOutlined,
  BarChartOutlined,
  AudioOutlined,
  LayoutOutlined,
  TableOutlined,
  FileTextOutlined,
  ArrowRightOutlined,
  CustomerServiceOutlined,
  PlaySquareOutlined,
} from '@ant-design/icons'
import styles from './home.module.scss'

interface NavItem {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
}

const features: NavItem[] = [
  {
    href: '/practice/interval',
    icon: <SoundOutlined />,
    title: '音程辨认',
    desc: '听两个音判断音程关系，训练你的相对音感',
  },
  {
    href: '/practice/harmony',
    icon: <CustomerServiceOutlined />,
    title: '和弦辨认',
    desc: '听和弦选择正确的和弦类型，提升和声听觉',
  },
  {
    href: '/practice/melody',
    icon: <AudioOutlined />,
    title: '旋律辨认',
    desc: '听旋律片段判断音符序列，培养音乐记忆力',
  },
  {
    href: '/practice/beat',
    icon: <PlaySquareOutlined />,
    title: '节奏练习',
    desc: '学习节奏型，提升节奏感和打击乐能力',
  },
  {
    href: '/practice/chord-progression',
    icon: <TableOutlined />,
    title: '和弦进行',
    desc: '听和弦进行，识别常见的和声进行模式',
  },
  {
    href: '/piano',
    icon: <DashboardOutlined />,
    title: '虚拟钢琴',
    desc: '交互式钢琴键盘，实时发声体验',
  },
  {
    href: '/chord-editor',
    icon: <TableOutlined />,
    title: '和弦编辑器',
    desc: '可视化和弦构建，支持钢琴与吉他视图',
  },
  {
    href: '/guitar',
    icon: <DashboardOutlined />,
    title: '吉他指板',
    desc: '吉他和弦指法可视化，学习吉他和弦',
  },
  {
    href: '/staff',
    icon: <AudioOutlined />,
    title: '五线谱',
    desc: 'ABC 记谱法渲染，乐谱播放同步',
  },
  {
    href: '/progress',
    icon: <BarChartOutlined />,
    title: '学习进度',
    desc: '查看练习统计与成就，追踪学习效果',
  },
  {
    href: '/midi-roll',
    icon: <LayoutOutlined />,
    title: 'MIDI 钢琴卷帘',
    desc: '可视化音符编辑，创作音乐序列',
  },
  {
    href: '/practice/staff-note',
    icon: <AudioOutlined />,
    title: '五线谱视奏',
    desc: '观看五线谱，使用虚拟钢琴演奏',
  },
  {
    href: '/editor',
    icon: <FileTextOutlined />,
    title: '富文本编辑器',
    desc: 'Slate.js 专业编辑器，支持音符与钢琴卷帘',
  },
]

export default function Home() {
  return (
    <div className={styles.container}>
      <div className={styles.inner}>
        {/* Hero */}
        <section className={styles.hero}>
          <div className={styles.heroKey}>♫</div>
          <h1 className={styles.heroTitle}>
            Minimusic
            <span className={styles.heroAccent}>音乐学习平台</span>
          </h1>
          <p className={styles.heroSubtitle}>
            集视唱练耳、乐理学习、音乐创作与记谱于一体的专业工具箱
          </p>
        </section>

        {/* Divider */}
        <div className={styles.divider}>
          <span>探索工具</span>
        </div>

        {/* Feature Grid */}
        <div className={styles.grid}>
          {features.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={styles.card}
              prefetch={item.href === '/editor' ? true : undefined}
            >
              <div className={styles.cardIcon}>{item.icon}</div>
              <div className={styles.cardTitle}>{item.title}</div>
              <div className={styles.cardDesc}>{item.desc}</div>
              <div className={styles.cardArrow}>
                进入 <ArrowRightOutlined style={{ fontSize: 10 }} />
              </div>
            </Link>
          ))}
        </div>

        {/* Footer */}
        <footer className={styles.footer}>
          <p className={styles.footerText}>
            MINIMUSIC — 开启你的音乐之旅
          </p>
        </footer>
      </div>
    </div>
  )
}
