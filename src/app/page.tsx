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
  RightOutlined,
  ThunderboltFilled,
} from '@ant-design/icons'
import styles from './home.module.scss'

interface ProductCard {
  href: string
  icon: React.ReactNode
  title: string
  desc: string
  gradient: string
  tag?: string
}

// 核心练习 —— 彩色渐变产品卡片
const practiceCards: ProductCard[] = [
  {
    href: '/practice/interval',
    icon: <SoundOutlined />,
    title: '音程辨认',
    desc: '听两个音判断音程关系，训练相对音感',
    gradient: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
    tag: '练耳',
  },
  {
    href: '/practice/harmony',
    icon: <SoundOutlined />,
    title: '和弦辨认',
    desc: '听和弦选择类型，提升和声听觉',
    gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)',
    tag: '练耳',
  },
  {
    href: '/practice/melody',
    icon: <AudioOutlined />,
    title: '旋律辨认',
    desc: '听旋律判断音符序列，培养音乐记忆力',
    gradient: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)',
    tag: '练耳',
  },
  {
    href: '/practice/chord-progression',
    icon: <TableOutlined />,
    title: '和弦进行',
    desc: '识别常见和声进行模式（I-IV-V 等）',
    gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)',
    tag: '练耳',
  },
]

// 乐器 —— 白色卡片矩阵
const instrumentCards: ProductCard[] = [
  {
    href: '/piano',
    icon: <DashboardOutlined />,
    title: '虚拟钢琴',
    desc: '交互式键盘，键盘快捷键 + 力度感应',
    gradient: '',
  },
  {
    href: '/chord-editor',
    icon: <TableOutlined />,
    title: '和弦编辑器',
    desc: '可视化和弦构建，钢琴与吉他视图',
    gradient: '',
  },
  {
    href: '/guitar',
    icon: <DashboardOutlined />,
    title: '吉他指板',
    desc: '和弦指法可视化，学习吉他按法',
    gradient: '',
  },
  {
    href: '/practice/beat',
    icon: <LayoutOutlined />,
    title: '节奏练习',
    desc: '学习节奏型，提升节奏感',
    gradient: '',
  },
]

// 工具 —— 白色卡片矩阵
const toolCards: ProductCard[] = [
  {
    href: '/staff',
    icon: <AudioOutlined />,
    title: '五线谱',
    desc: 'ABC 记谱法渲染，播放同步高亮',
    gradient: '',
  },
  {
    href: '/practice/staff-note',
    icon: <AudioOutlined />,
    title: '五线谱视奏',
    desc: '看谱演奏，用虚拟钢琴输入答案',
    gradient: '',
  },
  {
    href: '/midi-roll',
    icon: <DashboardOutlined />,
    title: 'MIDI 卷帘',
    desc: '可视化音符编辑，创作音乐序列',
    gradient: '',
  },
  {
    href: '/editor',
    icon: <FileTextOutlined />,
    title: '富文本编辑器',
    desc: '支持音符与钢琴卷帘的专业编辑器',
    gradient: '',
  },
]

export default function Home() {
  return (
    <div className={styles.page}>
      {/* ========== Hero ========== */}
      <section className={styles.hero}>
        <div className={styles.heroInner}>
          <div className={styles.heroBadge}>
            <ThunderboltFilled /> 专业音乐学习平台
          </div>
          <h1 className={styles.heroTitle}>
            让音乐学习
            <br />
            变得简单而专业
          </h1>
          <p className={styles.heroSubtitle}>
            集视唱练耳、乐理学习、音乐创作与记谱于一体的工具箱。
            从音程辨认到 MIDI 编曲，一站式提升你的音乐能力。
          </p>
          <div className={styles.heroActions}>
            <Link href="/practice/interval" className={styles.btnDark}>
              开始练习
            </Link>
            <Link href="/piano" className={styles.btnGhost}>
              探索乐器
            </Link>
          </div>
        </div>
      </section>

      {/* ========== 核心练习 · 彩色产品卡片 ========== */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>视唱练耳</h2>
            <p className={styles.sectionDesc}>用耳朵学音乐，从这四种核心训练开始</p>
          </div>
          <div className={styles.galleryGrid}>
            {practiceCards.map(card => (
              <Link key={card.href} href={card.href} className={styles.galleryCard}>
                <div className={styles.galleryCardBg} style={{ background: card.gradient }}>
                  <span className={styles.galleryTag}>{card.tag}</span>
                  <span className={styles.galleryIcon}>{card.icon}</span>
                </div>
                <div className={styles.galleryBody}>
                  <h3 className={styles.galleryTitle}>{card.title}</h3>
                  <p className={styles.galleryDesc}>{card.desc}</p>
                  <span className={styles.galleryArrow}>
                    进入 <RightOutlined />
                  </span>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 虚拟乐器 · 白色卡片矩阵 ========== */}
      <section className={styles.sectionAlt}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>虚拟乐器</h2>
            <p className={styles.sectionDesc}>在浏览器里弹奏、编排、理解音乐</p>
          </div>
          <div className={styles.matrixGrid}>
            {instrumentCards.map(card => (
              <Link key={card.href} href={card.href} className={styles.matrixCard}>
                <div className={styles.matrixIcon}>{card.icon}</div>
                <div className={styles.matrixBody}>
                  <h3 className={styles.matrixTitle}>{card.title}</h3>
                  <p className={styles.matrixDesc}>{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 工具 ========== */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <div className={styles.sectionHead}>
            <h2 className={styles.sectionTitle}>创作与记谱工具</h2>
            <p className={styles.sectionDesc}>从乐谱到 MIDI，完整的音乐创作工作流</p>
          </div>
          <div className={styles.matrixGrid}>
            {toolCards.map(card => (
              <Link key={card.href} href={card.href} className={styles.matrixCard}>
                <div className={styles.matrixIcon}>{card.icon}</div>
                <div className={styles.matrixBody}>
                  <h3 className={styles.matrixTitle}>{card.title}</h3>
                  <p className={styles.matrixDesc}>{card.desc}</p>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ========== 学习进度 CTA ========== */}
      <section className={styles.section}>
        <div className={styles.sectionInner}>
          <Link href="/progress" className={styles.ctaBanner}>
            <div className={styles.ctaBannerText}>
              <div className={styles.ctaBannerIcon}>
                <BarChartOutlined />
              </div>
              <div>
                <h3 className={styles.ctaBannerTitle}>追踪你的学习进度</h3>
                <p className={styles.ctaBannerDesc}>查看练习统计、正确率趋势与连续练习天数</p>
              </div>
            </div>
            <span className={styles.ctaBannerArrow}>
              <RightOutlined />
            </span>
          </Link>
        </div>
      </section>

      {/* ========== 暗色 Footer ========== */}
      <footer className={styles.footer}>
        <div className={styles.footerInner}>
          <div className={styles.footerTop}>
            <div className={styles.footerBrand}>
              <span className={styles.footerMark}>♫</span>
              <span className={styles.footerName}>Minimusic</span>
            </div>
            <p className={styles.footerTagline}>开启你的音乐之旅</p>
          </div>
          <div className={styles.footerLinks}>
            <div className={styles.footerCol}>
              <h4>视唱练耳</h4>
              <Link href="/practice/interval">音程辨认</Link>
              <Link href="/practice/harmony">和弦辨认</Link>
              <Link href="/practice/melody">旋律辨认</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>乐器</h4>
              <Link href="/piano">虚拟钢琴</Link>
              <Link href="/guitar">吉他指板</Link>
              <Link href="/chord-editor">和弦编辑器</Link>
            </div>
            <div className={styles.footerCol}>
              <h4>工具</h4>
              <Link href="/staff">五线谱</Link>
              <Link href="/midi-roll">MIDI 卷帘</Link>
              <Link href="/editor">编辑器</Link>
            </div>
          </div>
          <div className={styles.footerBottom}>
            <span>© 2026 Minimusic · 专业音乐学习平台</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
