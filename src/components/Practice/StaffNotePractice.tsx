'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography } from 'antd'
import { PlayCircleOutlined, SyncOutlined } from '@ant-design/icons'
import ABCJS from 'abcjs'
import { moaTone } from '@/utils/MoaTone'

const { Title, Text } = Typography

// 练习用的乐谱数据
const practiceScores = [
  {
    abc: `T:小星星
M:4/4
L:1/4
K:C
C C G G A A G | F F E E D D C |`,
    notes: ['C5', 'C5', 'G5', 'G5', 'A5', 'A5', 'G5', 'F5', 'F5', 'E5', 'E5', 'D5', 'D5', 'C5']
  },
  {
    abc: `T:欢乐颂
M:4/4
L:1/4
K:C
C C D E | E D C B | A A B C | C B B |`,
    notes: ['C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'C4', 'B3', 'A3', 'A3', 'B3', 'C4', 'C4', 'B3', 'B3']
  },
  {
    abc: `T:生日歌
M:4/4
L:1/8
K:C
C C D C F E | C C D C G F |`,
    notes: ['C4', 'C4', 'D4', 'C4', 'F4', 'E4', 'C4', 'C4', 'D4', 'C4', 'G4', 'F4']
  },
  {
    abc: `T:划船歌
M:4/4
L:1/4
K:C
C G A G | C G A G | A F E D | C C C |`,
    notes: ['C4', 'G4', 'A4', 'G4', 'C4', 'G4', 'A4', 'G4', 'A4', 'F4', 'E4', 'D4', 'C4', 'C4', 'C4']
  }
]

interface PracticeState {
  pass: number
  all: number
  currentScore: typeof practiceScores[0]
  currentNoteIndex: number
  userInput: string[]
  isPlaying: boolean
  showAnswer: boolean
}

/**
 * 五线谱视奏练习组件
 */
export default function StaffNotePractice() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [state, setState] = useState<PracticeState>({
    pass: 0,
    all: 0,
    currentScore: practiceScores[0],
    currentNoteIndex: 0,
    userInput: [],
    isPlaying: false,
    showAnswer: false,
  })
  
  // 渲染五线谱
  const renderSheet = () => {
    if (!sheetRef.current) return
    sheetRef.current.innerHTML = ''
    
    ABCJS.renderAbc(sheetRef.current, state.currentScore.abc, {
      responsive: 'resize',
      viewportHorizontal: true,
    })
  }
  
  // 生成新题目
  const generateQuestion = () => {
    const randomIndex = Math.floor(Math.random() * practiceScores.length)
    setState(prev => ({
      ...prev,
      currentScore: practiceScores[randomIndex],
      currentNoteIndex: 0,
      userInput: [],
      showAnswer: false,
    }))
  }
  
  // 播放当前乐谱
  const playScore = async () => {
    setState(prev => ({ ...prev, isPlaying: true }))
    
    for (const note of state.currentScore.notes) {
      await moaTone.playNote(note, 0.4)
      await new Promise(resolve => setTimeout(resolve, 300))
    }
    
    setState(prev => ({ ...prev, isPlaying: false }))
  }
  
  // 播放单个音符
  const playNote = async (note: string) => {
    await moaTone.playNote(note, 0.5)
  }
  
  // 用户输入音符
  const handleNoteInput = (note: string) => {
    if (state.showAnswer) return
    
    const newInput = [...state.userInput, note]
    const correctNote = state.currentScore.notes[state.userInput.length]
    
    setState(prev => ({ ...prev, userInput: newInput }))
    
    // 检查是否完成
    if (newInput.length === state.currentScore.notes.length) {
      const isCorrect = newInput.every((input, index) => 
        input === state.currentScore.notes[index]
      )
      
      setState(prev => ({
        ...prev,
        pass: isCorrect ? prev.pass + 1 : prev.pass,
        all: prev.all + 1,
        showAnswer: true,
      }))
      
      if (isCorrect) {
        message.success('演奏正确！')
      } else {
        message.error('有错误，请查看答案')
      }
    }
  }
  
  // 初始化
  useEffect(() => {
    renderSheet()
  }, [state.currentScore])
  
  const accuracy = state.all > 0 ? Math.round((state.pass / state.all) * 100) : 0
  
  // 虚拟钢琴键盘音符
  const pianoNotes = [
    { note: 'C4', isBlack: false },
    { note: 'C#4', isBlack: true },
    { note: 'D4', isBlack: false },
    { note: 'D#4', isBlack: true },
    { note: 'E4', isBlack: false },
    { note: 'F4', isBlack: false },
    { note: 'F#4', isBlack: true },
    { note: 'G4', isBlack: false },
    { note: 'G#4', isBlack: true },
    { note: 'A4', isBlack: false },
    { note: 'A#4', isBlack: true },
    { note: 'B4', isBlack: false },
    { note: 'C5', isBlack: false },
    { note: 'C#5', isBlack: true },
    { note: 'D5', isBlack: false },
    { note: 'D#5', isBlack: true },
    { note: 'E5', isBlack: false },
    { note: 'F5', isBlack: false },
    { note: 'F#5', isBlack: true },
    { note: 'G5', isBlack: false },
    { note: 'G#5', isBlack: true },
    { note: 'A5', isBlack: false },
  ]
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>🎹 五线谱视奏练习</Title>
          <Text type="secondary">观看五线谱，使用虚拟钢琴演奏正确的音符</Text>
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
        
        {/* 当前进度 */}
        <div className="text-center mb-4">
          <Text>当前进度: {state.userInput.length} / {state.currentScore.notes.length}</Text>
        </div>
        
        {/* 五线谱显示 */}
        <div 
          ref={sheetRef} 
          className="border border-gray-200 rounded-lg p-4 min-h-[150px] bg-white mb-6"
        />
        
        {/* 播放按钮 */}
        <div className="text-center mb-6">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={playScore}
            loading={state.isPlaying}
          >
            播放示范
          </Button>
          <Button
            size="large"
            icon={<SyncOutlined />}
            onClick={generateQuestion}
            className="ml-4"
          >
            下一题
          </Button>
        </div>
        
        {/* 用户输入显示 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {state.currentScore.notes.map((note, index) => (
            <div
              key={index}
              className={`px-3 py-1 rounded-lg text-sm font-medium ${
                index < state.userInput.length
                  ? state.userInput[index] === note
                    ? 'bg-green-100 text-green-700 border border-green-300'
                    : 'bg-red-100 text-red-700 border border-red-300'
                  : state.showAnswer
                    ? 'bg-blue-100 text-blue-700 border border-blue-300'
                    : 'bg-gray-100 text-gray-500 border border-gray-300'
              }`}
            >
              {index < state.userInput.length ? state.userInput[index] : (state.showAnswer ? note : '?')}
            </div>
          ))}
        </div>
        
        {/* 虚拟钢琴键盘 */}
        <div className="flex justify-center">
          <div className="relative">
            {/* 白键 */}
            <div className="flex">
              {pianoNotes.filter(n => !n.isBlack).map((item) => (
                <button
                  key={item.note}
                  onClick={() => {
                    handleNoteInput(item.note)
                    playNote(item.note)
                  }}
                  disabled={state.showAnswer}
                  className={`w-12 h-32 border border-gray-300 rounded-b-lg flex flex-col items-center justify-end pb-2 ${
                    state.showAnswer && state.currentScore.notes.includes(item.note)
                      ? 'bg-blue-100'
                      : 'bg-white hover:bg-gray-100'
                  } ${state.showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                >
                  <span className="text-xs text-gray-600">{item.note.replace('4', '').replace('5', '')}</span>
                </button>
              ))}
            </div>
            
            {/* 黑键 */}
            <div className="absolute top-0">
              {pianoNotes.map((item, index) => {
                if (!item.isBlack) return null
                const prevWhiteCount = pianoNotes.slice(0, index).filter(n => !n.isBlack).length
                return (
                  <button
                    key={item.note}
                    onClick={() => {
                      handleNoteInput(item.note)
                      playNote(item.note)
                    }}
                    disabled={state.showAnswer}
                    className={`absolute w-8 h-20 bg-gray-800 rounded-b-lg flex flex-col items-center justify-end pb-2 ${
                      state.showAnswer && state.currentScore.notes.includes(item.note)
                        ? 'bg-blue-600'
                        : 'hover:bg-gray-700'
                    } ${state.showAnswer ? 'cursor-default' : 'cursor-pointer'}`}
                    style={{ left: `${prevWhiteCount * 48 + 20}px` }}
                  >
                    <span className="text-xs text-white">{item.note.replace('4', '').replace('5', '')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      </Card>
    </div>
  )
}
