'use client'

import { useMemo } from 'react'
import { Card, Typography, Statistic, Row, Col, Button, Table, Empty, Popconfirm, Tag, Space } from 'antd'
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

const { Title, Text } = Typography

const TYPE_LABELS: Record<PracticeRecord['type'], string> = {
  interval: '音程辨认',
  harmony: '和弦辨认',
  melody: '旋律辨认',
  rhythm: '节奏练习',
  'chord-progression': '和弦进行',
  'staff-note': '五线谱视奏',
}

const TYPE_COLORS: Record<PracticeRecord['type'], string> = {
  interval: '#1677ff',
  harmony: '#52c41a',
  melody: '#fa8c16',
  rhythm: '#eb2f96',
  'chord-progression': '#722ed1',
  'staff-note': '#13c2c2',
}

export default function ProgressPage() {
  const snapshot = useSnapshot(progressState)
  const overallAccuracy = getOverallAccuracy()

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
        <Tag color={TYPE_COLORS[type]}>{TYPE_LABELS[type]}</Tag>
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
        <Text style={{ color: acc >= 80 ? '#52c41a' : acc >= 60 ? '#faad14' : '#ff4d4f' }}>
          {acc}%
        </Text>
      ),
      sorter: (a: PracticeRecord, b: PracticeRecord) => a.accuracy - b.accuracy,
    },
  ]

  const isEmpty = snapshot.records.length === 0

  return (
    <div className="max-w-6xl mx-auto p-4 md:p-6">
      {/* 标题 */}
      <div className="text-center mb-6">
        <Title level={2} style={{ marginBottom: 4 }}>
          <BarChartOutlined className="mr-2" />
          学习进度
        </Title>
        <Text type="secondary">查看你的练习统计与成就，追踪学习效果</Text>
      </div>

      {/* 统计卡片 */}
      <Row gutter={[16, 16]} className="mb-6">
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="总练习次数"
              value={snapshot.totalPractice}
              prefix={<ClockCircleOutlined />}
              valueStyle={{ color: '#1677ff' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="总正确数"
              value={snapshot.totalCorrect}
              prefix={<CheckCircleOutlined />}
              valueStyle={{ color: '#52c41a' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="整体正确率"
              value={overallAccuracy}
              suffix="%"
              prefix={<TrophyOutlined />}
              valueStyle={{ color: overallAccuracy >= 70 ? '#52c41a' : '#fa8c16' }}
            />
          </Card>
        </Col>
        <Col xs={12} sm={6}>
          <Card hoverable>
            <Statistic
              title="连续练习"
              value={snapshot.streak}
              suffix="天"
              prefix={<FireOutlined />}
              valueStyle={{ color: snapshot.streak >= 7 ? '#eb2f96' : '#fa8c16' }}
            />
          </Card>
        </Col>
      </Row>

      {isEmpty ? (
        <Card>
          <Empty
            description={
              <div>
                <Text type="secondary">还没有练习记录</Text>
                <br />
                <Text type="secondary">去练习模块开始你的音乐之旅吧！🎵</Text>
              </div>
            }
          />
        </Card>
      ) : (
        <>
          {/* 图表区 */}
          <Row gutter={[16, 16]} className="mb-6">
            {/* 每日趋势折线图 */}
            <Col xs={24} lg={14}>
              <Card title="每日练习趋势" className="h-full">
                {dailyData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={dailyData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" fontSize={12} />
                      <YAxis fontSize={12} />
                      <Tooltip />
                      <Legend />
                      <Line
                        type="monotone"
                        dataKey="正确数"
                        stroke="#52c41a"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                      <Line
                        type="monotone"
                        dataKey="总数"
                        stroke="#1677ff"
                        strokeWidth={2}
                        dot={{ r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="数据不足" />
                )}
              </Card>
            </Col>

            {/* 各模块正确率雷达图 */}
            <Col xs={24} lg={10}>
              <Card title="各模块正确率" className="h-full">
                {radarData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <RadarChart data={radarData}>
                      <PolarGrid />
                      <PolarAngleAxis dataKey="type" fontSize={11} />
                      <PolarRadiusAxis domain={[0, 100]} fontSize={10} />
                      <Radar
                        name="正确率"
                        dataKey="正确率"
                        stroke="#1677ff"
                        fill="#1677ff"
                        fillOpacity={0.3}
                      />
                    </RadarChart>
                  </ResponsiveContainer>
                ) : (
                  <Empty description="数据不足" />
                )}
              </Card>
            </Col>
          </Row>

          {/* 最近练习记录表格 */}
          <Card
            title="最近练习记录"
            extra={
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
            }
          >
            <Table
              dataSource={recentRecords}
              columns={columns}
              rowKey={(record) => `${record.timestamp}-${record.type}`}
              pagination={{ pageSize: 10, showSizeChanger: false }}
              size="small"
              scroll={{ x: 500 }}
            />
          </Card>
        </>
      )}
    </div>
  )
}
