'use client'

import { Typography, Card } from 'antd'
import GlobalPiano from '@/components/Instruments/GlobalPiano'

const { Title, Paragraph } = Typography

export default function PianoPage() {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-8">
          <Title level={2}>🎹 虚拟钢琴</Title>
          <Paragraph type="secondary">
            点击琴键播放音符，体验真实的钢琴音色
          </Paragraph>
        </div>
        
        <Card className="flex justify-center items-center overflow-x-auto">
          <GlobalPiano />
        </Card>
        
        <div className="mt-8 text-center text-gray-500">
          <Paragraph>
            提示：点击琴键即可发声，支持从C3到C6的音域
          </Paragraph>
        </div>
      </div>
    </div>
  )
}
