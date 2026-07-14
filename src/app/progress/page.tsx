'use client'

import { Card, Typography, Statistic, Row, Col, Button, Progress } from 'antd'
import { FireOutlined, TrophyOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { useSnapshot } from 'valtio'
import { progressState, getOverallAccuracy, clearProgress } from '@/stores/progress'

const { Title, Text } = Typography

export default function ProgressPage() {
  const snapshot = useSnapshot(progressState)
  const overallAccuracy = getOverallAccuracy()
  
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Title level={2}>📊 学习进度</Title>
          <Text type="secondary">查看你的学习统计和成就</Text>
        </div>
        
        <Row gutter={[16, 16]}>
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="总练习次数"
                value={snapshot.totalPractice}
                prefix={<ClockCircleOutlined />}
              />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="正确率"
                value={overallAccuracy}
                suffix="%"
                prefix={<TrophyOutlined />}
              />
              <Progress percent={overallAccuracy} showInfo={false} className="mt-2" />
            </Card>
          </Col>
          
          <Col xs={24} sm={12} md={8}>
            <Card>
              <Statistic
                title="连续练习"
                value={snapshot.streak}
                suffix="天"
                prefix={<FireOutlined />}
              />
            </Card>
          </Col>
        </Row>
        
        <Card className="mt-6">
          <div className="flex justify-between items-center mb-4">
            <Title level={4}>练习历史</Title>
            <Button danger onClick={clearProgress}>
              清除记录
            </Button>
          </div>
          
          {snapshot.records.length === 0 ? (
            <Text type="secondary">还没有练习记录，开始练习吧！</Text>
          ) : (
            <div className="space-y-2">
              {snapshot.records.slice(-10).reverse().map((record, index) => (
                <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                  <Text>
                    {record.type === 'interval' && '音程辨认'}
                    {record.type === 'harmony' && '和弦辨认'}
                    {record.type === 'melody' && '旋律辨认'}
                    {record.type === 'rhythm' && '节奏练习'}
                  </Text>
                  <Text>
                    {record.correct}/{record.total} ({record.accuracy}%)
                  </Text>
                  <Text type="secondary">
                    {new Date(record.timestamp).toLocaleString()}
                  </Text>
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </div>
  )
}
