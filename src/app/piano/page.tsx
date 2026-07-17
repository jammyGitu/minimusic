'use client'

import { Typography, Card } from 'antd'
import GlobalPiano from '@/components/Instruments/GlobalPiano'

const { Title, Paragraph, Text } = Typography

export default function PianoPage() {
  return (
    <div className="flex flex-col items-center gap-4 py-4">
      <div className="text-center">
        <Title level={3} className="!mb-1">🎹 虚拟钢琴</Title>
        <Paragraph type="secondary" className="!mb-0 text-sm">
          点击琴键或使用键盘演奏，支持多种音色与八度切换
        </Paragraph>
      </div>

      <Card
        className="w-full flex justify-center overflow-x-auto"
        styles={{ body: { padding: '16px 12px' } }}
      >
        <GlobalPiano />
      </Card>

      <div className="text-center space-y-1">
        <Text type="secondary" className="text-xs block">
          💡 提示：鼠标点击琴键或使用键盘 Z~M（白键）、S/D/G/H/J（黑键）演奏
        </Text>
        <Text type="secondary" className="text-xs block">
          🎵 支持触屏拖拽滑音，点击位置越低力度越大
        </Text>
      </div>
    </div>
  )
}
