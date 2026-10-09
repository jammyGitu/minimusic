'use client'

import { useMemo, useState, useEffect } from 'react'
import { Row, Col, Button, Table, Empty, Popconfirm } from 'antd'
import {
  FireOutlined,
  TrophyOutlined,
  ClockCircleOutlined,
  CheckCircleOutlined,
  DeleteOutlined,
  BarChartOutlined,
} from '@ant-design/icons'
import { useSnapshot } from 'valtio'
import {
  progressState,
  getOverallAccuracy,
  clearProgress,
  type PracticeRecord,
} from '@/stores/progress'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Legend,
} from 'recharts'
import styles from './progress.module.scss'

const TYPE_LABELS: Record<PracticeRecord['type'], string> = {
  interval: '音程辨认',
  harmony: '和弦辨认',
  melody: '旋律辨认',
  rhythm: '节奏练习',
  'chord-progression': '和弦进行',
  'staff-note': '五线谱视奏',
}

// MiniMax 色系（recharts 为 SVG 渲染，需具体色值；此处用品牌蓝阶 + 点缀粉）
const TYPE_COLORS: Record<PracticeRecord['type'], string> = {
  interval: '#1456f0',        // 品牌蓝
  harmony: '#3b82f6',         // primary-500
  melody: '#60a5fa',          // primary-light
  rhythm: '#8b5cf6',          // 紫
  'chord-progression': '#ea5ec1', // 品牌粉
  'staff-note': '#3daeff',    // 天蓝
}

/**
 * 主题相关的图表色（recharts 无法可靠读取 CSS 变量，改为按主题切换具体值）
 */
function useChartColors() {
  const [dark, setDark] = useState(false)
  useEffect(() => {
    const update = () =>
      setDark(document.documentElement.getAttribute('data-theme') === 'dark')
    update()
    const observer = new MutationObserver(update)
    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['data-theme'],
    })
    return () => observer.disconnect()
  }, [])

  return {
    grid: dark ? 'rgba(255,255,255,0.08)' : '#f2f3f5',
    axis: dark ? '#71717a' : '#8e8e93',
    axisLine: dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
    primary: '#1456f0',
    green: dark ? '#4ade80' : '#22c55e',
    tooltipBg: dark ? '#22262e' : '#ffffff',
    tooltipBorder: dark ? 'rgba(255,255,255,0.12)' : '#e5e7eb',
    tooltipText: dark ? '#ededed' : '#222222',
  }
}

export default function ProgressPage() {
  const snapshot = useSnapshot(progressState)
  const overallAccuracy = getOverallAccuracy()
  const c = useChartColors()

  // 每日趋势数据
  const dailyData = useMemo(() => {
    const dayMap = new Map<string, { correct: number; total: number }>()
    snapshot.records.forEach((r) => {
      const date = new Date(r.timestamp).toLocaleDateString('zh-CN')
      const existing = dayMap.get(date) || { correct: 0, total: 0 }
      existing.correct += r.correct
      existing.total += r.total
      dayMap.set(date, existing)
    })
    return Array.from(dayMap.entries())
      .sort((a, b) => a[0].localeCompare(b[0]))
      .slice(-30)
      .map(([date, data]) => ({
        date,
        正确数: data.correct,
        总数: data.total,
      }))
  }, [snapshot.records])

  // 各模块正确率（雷达图）
  const radarData = useMemo(() => {
    const typeMap = new Map<string, { correct: number; total: number }>()
    snapshot.records.forEach((r) => {
      const existing = typeMap.get(r.type) || { correct: 0, total: 0 }
      existing.correct += r.correct
      existing.total += r.total
      typeMap.set(r.type, existing)
    })
    return Array.from(typeMap.entries()).map(([type, data]) => ({
      type: TYPE_LABELS[type as PracticeRecord['type']] || type,
      fullMark: 100,
      正确率: data.total > 0 ? Math.round((data.correct / data.total) * 100) : 0,
    }))
  }, [snapshot.records])

  // 最近记录（表格数据）
  const recentRecords = useMemo(() => {
    return [...snapshot.records].reverse().slice(0, 20)
  }, [snapshot.records])

  // 表格列
  const columns = [
    {
      title: '练习类型',
      dataIndex: 'type',
      key: 'type',
      render: (type: PracticeRecord['type']) => (
        <span
          className={styles.typePill}
          style={{
            background: `color-mix(in srgb, ${TYPE_COLORS[type]} 14%, transparent)`,
            color: TYPE_COLORS[type],
          }}
        >
          {TYPE_LABELS[type]}
        </span>
      ),
    },
    {
      title: '时间',
      dataIndex: 'timestamp',
      key: 'timestamp',
      render: (ts: number) => new Date(ts).toLocaleString('zh-CN'),
      sorter: (a: PracticeRecord, b: PracticeRecord) => a.timestamp - b.timestamp,
    },
    {
      title: '正确数',
      dataIndex: 'correct',
      key: 'correct',
    },
    {
      title: '总数',
      dataIndex: 'total',
      key: 'total',
    },
    {
      title: '正确率',
      dataIndex: 'accuracy',
      key: 'accuracy',
      render: (acc: number) => (
        <span className={acc >= 80 ? styles.accGood : acc >= 60 ? styles.accMid : styles.accBad}>
          {acc}%
        </span>
      ),
      sorter: (a: PracticeRecord, b: PracticeRecord) => a.accuracy - b.accuracy,
    },
  ]

  const isEmpty = snapshot.records.length === 0

  return (
    <div className={styles.page}>
      {/* 统计卡片 */}
      <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
        <Col xs={12} sm={6}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#1456f0' }}>
              <ClockCircleOutlined />
            </div>
            <div className={styles.statLabel}>总练习次数</div>
            <div className={styles.statValue}>{snapshot.totalPractice}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#22c55e' }}>
              <CheckCircleOutlined />
            </div>
            <div className={styles.statLabel}>总正确数</div>
            <div className={styles.statValue}>{snapshot.totalCorrect}</div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#8b5cf6' }}>
              <TrophyOutlined />
            </div>
            <div className={styles.statLabel}>整体正确率</div>
            <div className={styles.statValue}>
              {overallAccuracy}
              <span className={styles.statSuffix}>%</span>
            </div>
          </div>
        </Col>
        <Col xs={12} sm={6}>
          <div className={styles.statCard}>
            <div className={styles.statIcon} style={{ color: '#ea5ec1' }}>
              <FireOutlined />
            </div>
            <div className={styles.statLabel}>连续练习</div>
            <div className={styles.statValue}>
              {snapshot.streak}
              <span className={styles.statSuffix}>天</span>
            </div>
          </div>
        </Col>
      </Row>

      {isEmpty ? (
        <div className={styles.emptyCard}>
          <Empty
            description={
              <div className={styles.emptyText}>
                还没有练习记录
                <br />
                去练习模块开始你的音乐之旅吧！🎵
              </div>
            }
          />
        </div>
      ) : (
        <>
          {/* 图表区 */}
          <Row gutter={[16, 16]} style={{ marginBottom: 24 }}>
            {/* 每日趋势折线图 */}
            <Col xs={24} lg={14}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>每日练习趋势</h3>
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" stroke={c.grid} />
                      <XAxis
                        dataKey="date"
                        fontSize={12}
                        stroke={c.axis}
                        tickLine={false}
                        axisLine={{ stroke: c.axisLine }}
                      />
                      <YAxis
                        fontSize={12}
                        stroke={c.axis}
                        tickLine={false}
                        axisLine={{ stroke: c.axisLine }}
                      />
                      <Tooltip
                        contentStyle={{
                          background: c.tooltipBg,
                          border: `1px solid ${c.tooltipBorder}`,
                          borderRadius: 12,
                          color: c.tooltipText,
                          fontFamily: 'var(--font-ui)',
                          fontSize: 13,
                        }}
                      />
                      <Legend wrapperStyle={{ fontFamily: 'var(--font-ui)', fontSize: 13 }} />
                      <Line
                        type="monotone"
                        dataKey="正确数"
                        stroke={c.green}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: c.green }}
                        activeDot={{ r: 5 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="总数"
                        stroke={c.primary}
                        strokeWidth={2.5}
                        dot={{ r: 3, fill: c.primary }}
                        activeDot={{ r: 5 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="数据不足" />
                )}
              </div>
            </Col>

            {/* 各模块正确率雷达图 */}
            <Col xs={24} lg={10}>
              <div className={styles.chartCard}>
                <h3 className={styles.chartTitle}>各模块正确率</h3>
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke={c.grid} />
                      <PolarAngleAxis
                        dataKey="type"
                        fontSize={11}
                        tick={{ fill: c.axis, fontFamily: 'var(--font-ui)' }}
                      />
                      <PolarRadiusAxis
                        domain={[0, 100]}
                        fontSize={10}
                        tick={{ fill: c.axis }}
                        axisLine={false}
                      />
                      <Radar
                        name="正确率"
                        dataKey="正确率"
                        stroke={c.primary}
                        fill={c.primary}
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="数据不足" />
                )}
              </div>
            </Col>
          </Row>

          {/* 最近练习记录表格 */}
          <div className={styles.tableCard}>
            <div className={styles.tableHead}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <BarChartOutlined style={{ color: 'var(--brand-blue)', fontSize: 18 }} />
                <h3 className={styles.tableTitle}>最近练习记录</h3>
              </div>
              <Popconfirm
                title="确定要清除所有练习记录吗？"
                description="此操作不可撤销"
                onConfirm={clearProgress}
                okText="确定"
                cancelText="取消"
              >
                <Button danger size="small" icon={<DeleteOutlined />}>
                  清除记录
                </Button>
              </Popconfirm>
            </div>
            <div className={`${styles.tableBody} ${styles.tableMiniMax}`}>
              <Table
                dataSource={recentRecords}
                columns={columns}
                rowKey={(record) => `${record.timestamp}-${record.type}`}
                pagination={{ pageSize: 10, showSizeChanger: false }}
                size="small"
                scroll={{ x: 500 }}
              />
            </div>
          </div>
        </>
      )}
    </div>
  )
}
