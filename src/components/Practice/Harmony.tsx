'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, message, Space, Typography } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'
import { semitoneToNote } from '@/utils/note'

const { Title, Text } = Typography

interface PracticeState {
  pass: number
  all: number
  current: {
    root: string
    chordType: ChordType
    notes: string[]
  }
}

/**
 * 和弦辨认练习组件
 */
export default function HarmonyPractice() {
  const [state, setState] = useState<PracticeState>({
    pass: 0,
    all: 0,
    current: {
      root: 'C4',
      chordType: CHORD_TYPES.maj,
      notes: [],
    },
  })
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 生成新的练习题
  const generateQuestion = () => {
    // 随机选择根音
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const octaves = [3, 4]
    const randomNote = notes[Math.floor(Math.random() * notes.length)]
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)]
    const root = `${randomNote}${randomOctave}`
    
    // 随机选择和弦类型（只选择常用的三和弦和七和弦）
    const chordTypes = ['maj', 'min', 'aug', 'dim', 'maj7', 'min7', 'dom7']
    const randomType = chordTypes[Math.floor(Math.random() * chordTypes.length)]
    const chordType = CHORD_TYPES[randomType]
    
    // 构建和弦音符
    const chordNotes = buildChord(root, chordType)
    
    setState(prev => ({
      ...prev,
      current: { root, chordType, notes: chordNotes },
    }))
    setSelectedAnswer('')
  }
  
  // 播放当前题目
  const playQuestion = async () => {
    setIsPlaying(true)
    await moaTone.playNotes(state.current.notes, 0.8)
    setTimeout(() => setIsPlaying(false), 1000)
  }
  
  // 选择答案
  const handleAnswer = (chordType: ChordType) => {
    setSelectedAnswer(chordType.name)
    
    const isCorrect = chordType.name === state.current.chordType.name
    setState(prev => ({
      ...prev,
      pass: isCorrect ? prev.pass + 1 : prev.pass,
      all: prev.all + 1,
    }))
    
    if (isCorrect) {
      message.success('回答正确！')
      setTimeout(generateQuestion, 1000)
    } else {
      message.error(`回答错误，正确答案是：${state.current.chordType.name}`)
    }
  }
  
  // 初始化
  useEffect(() => {
    generateQuestion()
  }, [])
  
  // 常用和弦类型
  const chordOptions = [
    CHORD_TYPES.maj,
    CHORD_TYPES.min,
    CHORD_TYPES.aug,
    CHORD_TYPES.dim,
    CHORD_TYPES.maj7,
    CHORD_TYPES.min7,
    CHORD_TYPES.dom7,
  ]
  
  const accuracy = state.all > 0 ? Math.round((state.pass / state.all) * 100) : 0
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>和弦辨认练习</Title>
          <Text type="secondary">听和弦，判断和弦类型</Text>
        </div>
        
        {/* 统计信息 */}
        <div className="mb-6">
          <Space size="large">
            <Text>正确: {state.pass}</Text>
            <Text>总数: {state.all}</Text>
            <Text>正确率: {accuracy}%</Text>
          </Space>
          <Progress percent={accuracy} showInfo={false} className="mt-2" />
        </div>
        
        {/* 播放按钮 */}
        <div className="text-center mb-6">
          <Button
            type="primary"
            size="large"
            icon={<SoundOutlined />}
            onClick={playQuestion}
            loading={isPlaying}
          >
            播放和弦
          </Button>
          <Button
            size="large"
            icon={<ReloadOutlined />}
            onClick={generateQuestion}
            className="ml-4"
          >
            下一题
          </Button>
        </div>
        
        {/* 答案选项 */}
        <div className="grid grid-cols-2 gap-3">
          {chordOptions.map(chordType => (
            <Button
              key={chordType.name}
              size="large"
              onClick={() => handleAnswer(chordType)}
              disabled={!!selectedAnswer}
              type={selectedAnswer === chordType.name ? 'primary' : 'default'}
            >
              {chordType.name}
            </Button>
          ))}
        </div>
        
        {/* 当前答案提示 */}
        {selectedAnswer && (
          <div className="mt-6 text-center">
            <Text type="secondary">
              你的答案: {selectedAnswer} | 正确答案: {state.current.chordType.name}
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
