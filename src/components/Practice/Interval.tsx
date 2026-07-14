'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, message, Space, Typography } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { getAllIntervals, getIntervalName, getNoteByInterval } from '@/utils/interval'
import { semitoneToNote } from '@/utils/note'

const { Title, Text } = Typography

interface PracticeState {
  pass: number
  all: number
  current: {
    base: string
    interval: number
    answer: string
  }
}

/**
 * 音程辨认练习组件
 */
export default function IntervalPractice() {
  const [state, setState] = useState<PracticeState>({
    pass: 0,
    all: 0,
    current: {
      base: 'C4',
      interval: 0,
      answer: '',
    },
  })
  
  const [selectedAnswer, setSelectedAnswer] = useState<string>('')
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 生成新的练习题
  const generateQuestion = () => {
    // 随机选择根音（C3到C5）
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const octaves = [3, 4]
    const randomNote = notes[Math.floor(Math.random() * notes.length)]
    const randomOctave = octaves[Math.floor(Math.random() * octaves.length)]
    const base = `${randomNote}${randomOctave}`
    
    // 随机选择音程（1-12半音）
    const interval = Math.floor(Math.random() * 12) + 1
    
    // 计算答案音符
    const answer = getNoteByInterval(base, interval)
    
    setState(prev => ({
      ...prev,
      current: { base, interval, answer },
    }))
    setSelectedAnswer('')
  }
  
  // 播放当前题目
  const playQuestion = async () => {
    setIsPlaying(true)
    await moaTone.playSequence([state.current.base, state.current.answer], 0.5)
    setTimeout(() => setIsPlaying(false), 1000)
  }
  
  // 选择答案
  const handleAnswer = (semitones: number) => {
    const intervalName = getIntervalName(semitones)
    setSelectedAnswer(intervalName)
    
    const isCorrect = semitones === state.current.interval
    setState(prev => ({
      ...prev,
      pass: isCorrect ? prev.pass + 1 : prev.pass,
      all: prev.all + 1,
    }))
    
    if (isCorrect) {
      message.success('回答正确！')
      setTimeout(generateQuestion, 1000)
    } else {
      message.error(`回答错误，正确答案是：${getIntervalName(state.current.interval)}`)
    }
  }
  
  // 初始化
  useEffect(() => {
    generateQuestion()
  }, [])
  
  const intervals = getAllIntervals().filter(i => i.semitones > 0)
  const accuracy = state.all > 0 ? Math.round((state.pass / state.all) * 100) : 0
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>音程辨认练习</Title>
          <Text type="secondary">听两个音，判断它们之间的音程关系</Text>
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
            播放题目
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
        <div className="grid grid-cols-3 gap-3">
          {intervals.map(interval => (
            <Button
              key={interval.semitones}
              size="large"
              onClick={() => handleAnswer(interval.semitones)}
              disabled={!!selectedAnswer}
              type={selectedAnswer === interval.name ? 'primary' : 'default'}
            >
              {interval.name}
            </Button>
          ))}
        </div>
        
        {/* 当前答案提示 */}
        {selectedAnswer && (
          <div className="mt-6 text-center">
            <Text type="secondary">
              你的答案: {selectedAnswer} | 正确答案: {getIntervalName(state.current.interval)}
            </Text>
          </div>
        )}
      </Card>
    </div>
  )
}
