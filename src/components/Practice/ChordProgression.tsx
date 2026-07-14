'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, message, Space, Typography, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord } from '@/utils/chord'

const { Title, Text } = Typography

// 常见和弦进行
const chordProgressions = [
  { name: 'I-IV-V', progression: ['maj', 'maj', 'maj'], degrees: ['I', 'IV', 'V'] },
  { name: 'I-vi-IV-V', progression: ['maj', 'min', 'maj', 'maj'], degrees: ['I', 'vi', 'IV', 'V'] },
  { name: 'ii-V-I', progression: ['min7', 'dom7', 'maj7'], degrees: ['ii', 'V', 'I'] },
  { name: 'I-V-vi-IV', progression: ['maj', 'maj', 'min', 'maj'], degrees: ['I', 'V', 'vi', 'IV'] },
  { name: 'I-IV-viio-V', progression: ['maj', 'maj', 'dim', 'maj'], degrees: ['I', 'IV', 'viio', 'V'] },
]

interface PracticeState {
  pass: number
  all: number
  current: {
    root: string
    progression: string[]
    degrees: string[]
    chordNotes: string[][]
  }
  selectedAnswer: string | null
}

/**
 * 和弦进行练习组件
 */
export default function ChordProgressionPractice() {
  const [state, setState] = useState<PracticeState>({
    pass: 0,
    all: 0,
    current: {
      root: 'C',
      progression: [],
      degrees: [],
      chordNotes: [],
    },
    selectedAnswer: null,
  })
  
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 生成新的练习题
  const generateQuestion = () => {
    // 随机选择一个和弦进行
    const progression = chordProgressions[Math.floor(Math.random() * chordProgressions.length)]
    
    // 随机选择根音
    const roots = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const root = roots[Math.floor(Math.random() * roots.length)]
    
    // 构建所有和弦音符
    const chordNotes = progression.progression.map((type, index) => {
      const chordType = CHORD_TYPES[type]
      if (!chordType) return []
      const chordRoot = getChordRoot(root, index, progression)
      return buildChord(`${chordRoot}4`, chordType)
    })
    
    setState(prev => ({
      ...prev,
      current: {
        root,
        progression: progression.progression,
        degrees: progression.degrees,
        chordNotes,
      },
      selectedAnswer: null,
    }))
  }
  
  // 根据度数获取和弦根音
  const getChordRoot = (root: string, index: number, progression: typeof chordProgressions[0]): string => {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const degreeOffsets: Record<string, number> = {
      'I': 0, 'ii': 2, 'iii': 4, 'IV': 5, 'V': 7, 'vi': 9, 'vii': 11, 'viio': 11,
    }
    
    const degree = progression.degrees[index]
    const offset = degreeOffsets[degree] || 0
    const rootIndex = NOTE_NAMES.indexOf(root)
    const newIndex = (rootIndex + offset) % 12
    
    return NOTE_NAMES[newIndex]
  }
  
  // 播放和弦进行
  const playProgression = async () => {
    setIsPlaying(true)
    
    for (let i = 0; i < state.current.chordNotes.length; i++) {
      if (state.current.chordNotes[i].length > 0) {
        await moaTone.playNotes(state.current.chordNotes[i], 0.8)
      }
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    setIsPlaying(false)
  }
  
  // 选择答案
  const handleAnswer = (name: string) => {
    setState(prev => ({ ...prev, selectedAnswer: name }))
    
    // 找到匹配的和弦进行
    const matchedProgression = chordProgressions.find(p => p.name === name)
    
    if (matchedProgression) {
      const isCorrect = JSON.stringify(matchedProgression.progression) === JSON.stringify(state.current.progression)
      
      setState(prev => ({
        ...prev,
        pass: isCorrect ? prev.pass + 1 : prev.pass,
        all: prev.all + 1,
      }))
      
      if (isCorrect) {
        message.success('回答正确！')
        setTimeout(generateQuestion, 1500)
      } else {
        const correctName = chordProgressions.find(
          p => JSON.stringify(p.progression) === JSON.stringify(state.current.progression)
        )?.name
        message.error(`回答错误，正确答案是: ${correctName}`)
      }
    }
  }
  
  // 初始化
  useEffect(() => {
    generateQuestion()
  }, [])
  
  const accuracy = state.all > 0 ? Math.round((state.pass / state.all) * 100) : 0
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>和弦进行练习</Title>
          <Text type="secondary">听和弦进行，选择正确的和弦进行名称</Text>
          <div className="mt-2">
            <Tag color="blue">当前调性: {state.current.root}大调</Tag>
          </div>
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
            onClick={playProgression}
            loading={isPlaying}
          >
            播放和弦进行
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
        
        {/* 当前和弦进行预览 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {state.current.degrees.map((degree, index) => (
            <Tag key={index} color="green" className="text-lg px-4 py-2">
              {degree}
            </Tag>
          ))}
        </div>
        
        {/* 答案选项 */}
        <div className="grid grid-cols-2 gap-3">
          {chordProgressions.map(prog => (
            <Button
              key={prog.name}
              size="large"
              onClick={() => handleAnswer(prog.name)}
              disabled={state.selectedAnswer !== null}
              type={state.selectedAnswer === prog.name ? 'primary' : 'default'}
            >
              {prog.name}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
