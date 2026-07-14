'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, message, Space, Typography, Checkbox } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'

const { Title, Text } = Typography

interface RhythmPattern {
  name: string
  pattern: boolean[] // true = 有拍, false = 空拍
}

/**
 * 节奏练习组件
 */
export default function BeatPractice() {
  const [state, setState] = useState({
    pass: 0,
    all: 0,
    currentPattern: [] as boolean[],
    userPattern: [] as boolean[],
    isPlaying: false,
  })
  
  // 预设节奏型
  const rhythmPatterns: RhythmPattern[] = [
    { name: '八分音符', pattern: [true, true, true, true] },
    { name: '四分音符', pattern: [true, false, true, false] },
    { name: '切分', pattern: [false, true, true, false] },
    { name: '前八后十六', pattern: [true, true, true, false] },
    { name: '后十六前八', pattern: [true, false, true, true] },
    { name: '三连音感觉', pattern: [true, true, false, true] },
  ]
  
  // 生成随机节奏
  const generateRandomPattern = (): boolean[] => {
    const length = 4 + Math.floor(Math.random() * 4) // 4-7拍
    return Array(length).fill(false).map(() => Math.random() > 0.3)
  }
  
  // 生成新的练习题
  const generateQuestion = () => {
    // 随机选择预设节奏或生成新节奏
    const usePreset = Math.random() > 0.5
    const pattern = usePreset 
      ? rhythmPatterns[Math.floor(Math.random() * rhythmPatterns.length)].pattern
      : generateRandomPattern()
    
    setState(prev => ({
      ...prev,
      currentPattern: pattern,
      userPattern: Array(pattern.length).fill(false),
    }))
  }
  
  // 播放节奏
  const playRhythm = async () => {
    setState(prev => ({ ...prev, isPlaying: true }))
    
    const interval = 400 // 每拍间隔(ms)
    
    for (let i = 0; i < state.currentPattern.length; i++) {
      if (state.currentPattern[i]) {
        await moaTone.playNote('C5', 0.15)
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    setState(prev => ({ ...prev, isPlaying: false }))
  }
  
  // 播放用户的答案
  const playUserAnswer = async () => {
    setState(prev => ({ ...prev, isPlaying: true }))
    
    const interval = 400
    
    for (let i = 0; i < state.userPattern.length; i++) {
      if (state.userPattern[i]) {
        await moaTone.playNote('G4', 0.15)
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    
    setState(prev => ({ ...prev, isPlaying: false }))
  }
  
  // 切换某一拍
  const toggleBeat = (index: number) => {
    if (state.isPlaying) return
    
    const newPattern = [...state.userPattern]
    newPattern[index] = !newPattern[index]
    setState(prev => ({ ...prev, userPattern: newPattern }))
  }
  
  // 提交答案
  const submitAnswer = () => {
    const isCorrect = JSON.stringify(state.currentPattern) === JSON.stringify(state.userPattern)
    
    setState(prev => ({
      ...prev,
      pass: isCorrect ? prev.pass + 1 : prev.pass,
      all: prev.all + 1,
    }))
    
    if (isCorrect) {
      message.success('回答正确！')
      setTimeout(generateQuestion, 1000)
    } else {
      message.error('回答错误，请再试一次！')
    }
  }
  
  // 重置答案
  const resetAnswer = () => {
    setState(prev => ({
      ...prev,
      userPattern: Array(prev.currentPattern.length).fill(false),
    }))
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
          <Title level={2}>节奏练习</Title>
          <Text type="secondary">听节奏，点击下方格子选择正确的节拍位置</Text>
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
            onClick={playRhythm}
            loading={state.isPlaying}
          >
            播放题目
          </Button>
          <Button
            size="large"
            icon={<SoundOutlined />}
            onClick={playUserAnswer}
            loading={state.isPlaying}
            className="ml-4"
          >
            播放我的答案
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
        
        {/* 节奏网格 */}
        <div className="flex justify-center gap-2 mb-6">
          {state.currentPattern.map((_, index) => (
            <button
              key={index}
              onClick={() => toggleBeat(index)}
              disabled={state.isPlaying}
              className={`
                w-16 h-16 rounded-lg border-2 transition-all duration-200
                ${state.userPattern[index] 
                  ? 'bg-blue-500 border-blue-600 text-white' 
                  : 'bg-gray-100 border-gray-300 hover:bg-gray-200'}
                ${state.isPlaying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}
              `}
            >
              <span className="text-2xl font-bold">{index + 1}</span>
            </button>
          ))}
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-center gap-4">
          <Button onClick={resetAnswer}>重置答案</Button>
          <Button type="primary" onClick={submitAnswer}>提交答案</Button>
        </div>
      </Card>
    </div>
  )
}
