'use client'

import React, { useState, useEffect } from 'react'
import { Card, Button, Progress, message, Space, Typography } from 'antd'
import { ReloadOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { NOTE_NAMES } from '@/utils/note'

const { Title, Text } = Typography

interface PracticeState {
  pass: number
  all: number
  current: {
    notes: string[]
    answerOptions: string[][]
    correctIndex: number
  }
}

/**
 * 旋律辨认练习组件
 */
export default function MelodyPractice() {
  const [state, setState] = useState<PracticeState>({
    pass: 0,
    all: 0,
    current: {
      notes: [],
      answerOptions: [],
      correctIndex: 0,
    },
  })
  
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  
  // 生成随机旋律
  const generateMelody = (length: number = 4): string[] => {
    const melody: string[] = []
    let currentNote = `C${4 + Math.floor(Math.random() * 2)}` // 从C4或C5开始
    
    for (let i = 0; i < length; i++) {
      melody.push(currentNote)
      
      // 生成下一个音符（限制在一个八度内）
      const match = currentNote.match(/^([A-G]#?)(\d+)$/)
      if (match) {
        const noteName = match[1]
        const octave = parseInt(match[2])
        const currentIndex = NOTE_NAMES.indexOf(noteName)
        
        // 随机移动：-3到+3个半音
        const offset = Math.floor(Math.random() * 7) - 3
        let newIndex = currentIndex + offset
        
        // 确保在有效范围内
        if (newIndex < 0) {
          newIndex = 0
        } else if (newIndex >= NOTE_NAMES.length) {
          newIndex = NOTE_NAMES.length - 1
        }
        
        // 检查八度是否需要变化
        let newOctave = octave
        if (currentIndex === 11 && offset > 0) {
          newOctave++
        } else if (currentIndex === 0 && offset < 0) {
          newOctave--
        }
        
        // 确保八度在合理范围内
        newOctave = Math.max(3, Math.min(5, newOctave))
        
        currentNote = `${NOTE_NAMES[newIndex]}${newOctave}`
      }
    }
    
    return melody
  }
  
  // 生成错误选项
  const generateWrongOptions = (correctNotes: string[], count: number = 3): string[][] => {
    const options: string[][] = []
    
    for (let i = 0; i < count; i++) {
      const wrongMelody = correctNotes.map(note => {
        const match = note.match(/^([A-G]#?)(\d+)$/)
        if (!match) return note
        
        const noteName = match[1]
        const octave = parseInt(match[2])
        const currentIndex = NOTE_NAMES.indexOf(noteName)
        
        // 随机变化一个音符
        if (Math.random() > 0.6) {
          let newIndex = (currentIndex + Math.floor(Math.random() * 3) + 1) % NOTE_NAMES.length
          return `${NOTE_NAMES[newIndex]}${octave}`
        }
        
        return note
      })
      
      // 确保不是完全相同的
      const isSame = JSON.stringify(wrongMelody) === JSON.stringify(correctNotes)
      if (!isSame) {
        options.push(wrongMelody)
      } else {
        i--
      }
    }
    
    return options
  }
  
  // 生成新的练习题
  const generateQuestion = () => {
    const correctNotes = generateMelody(4)
    const wrongOptions = generateWrongOptions(correctNotes, 3)
    
    // 随机打乱选项顺序
    const allOptions = [...wrongOptions, correctNotes]
    for (let i = allOptions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOptions[i], allOptions[j]] = [allOptions[j], allOptions[i]]
    }
    
    const correctIndex = allOptions.findIndex(opt => 
      JSON.stringify(opt) === JSON.stringify(correctNotes)
    )
    
    setState(prev => ({
      ...prev,
      current: {
        notes: correctNotes,
        answerOptions: allOptions,
        correctIndex,
      },
    }))
    setSelectedAnswer(null)
  }
  
  // 播放当前旋律
  const playMelody = async () => {
    setIsPlaying(true)
    await moaTone.playSequence(state.current.notes, 0.6)
    setTimeout(() => setIsPlaying(false), 2500)
  }
  
  // 选择答案
  const handleAnswer = (index: number) => {
    setSelectedAnswer(index)
    
    const isCorrect = index === state.current.correctIndex
    setState(prev => ({
      ...prev,
      pass: isCorrect ? prev.pass + 1 : prev.pass,
      all: prev.all + 1,
    }))
    
    if (isCorrect) {
      message.success('回答正确！')
      setTimeout(generateQuestion, 1500)
    } else {
      message.error(`回答错误，正确答案是第 ${state.current.correctIndex + 1} 个选项`)
    }
  }
  
  // 初始化
  useEffect(() => {
    generateQuestion()
  }, [])
  
  const accuracy = state.all > 0 ? Math.round((state.pass / state.all) * 100) : 0
  
  // 将音符转换为唱名显示
  const noteToSolfege = (note: string): string => {
    const NOTE_TO_SOLFEGE: Record<string, string> = {
      'C': '1', 'C#': '#1', 'D': '2', 'D#': '#2', 'E': '3',
      'F': '4', 'F#': '#4', 'G': '5', 'G#': '#5', 'A': '6', 'A#': '#6', 'B': '7'
    }
    const match = note.match(/^([A-G]#?)/)
    return match ? NOTE_TO_SOLFEGE[match[1]] || note : note
  }
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <Title level={2}>旋律辨认练习</Title>
          <Text type="secondary">听一段旋律，选择正确的音符序列</Text>
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
            onClick={playMelody}
            loading={isPlaying}
          >
            播放旋律
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
        <div className="space-y-3">
          {state.current.answerOptions.map((option, index) => (
            <Button
              key={index}
              size="large"
              block
              onClick={() => handleAnswer(index)}
              disabled={selectedAnswer !== null}
              type={selectedAnswer === index && index === state.current.correctIndex ? 'primary' : 'default'}
              danger={selectedAnswer === index && index !== state.current.correctIndex}
              className="text-left"
            >
              <span className="font-weight-bold mr-4">{index + 1}.</span>
              {option.map((note, i) => (
                <span key={i} className="mx-2">
                  {note} ({noteToSolfege(note)})
                  {i < option.length - 1 && <span className="mx-1">→</span>}
                </span>
              ))}
            </Button>
          ))}
        </div>
      </Card>
    </div>
  )
}
