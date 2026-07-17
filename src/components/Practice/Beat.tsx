'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_CONFIG: Record<Difficulty, { beats: number; usePreset: boolean }> = {
  easy: { beats: 4, usePreset: true },
  medium: { beats: 6, usePreset: false },
  hard: { beats: 8, usePreset: false },
}

const PRESET_PATTERNS = [
  { name: '八分音符', pattern: [true, true, true, true] },
  { name: '四分音符', pattern: [true, false, true, false] },
  { name: '切分', pattern: [false, true, true, false] },
  { name: '前八后十六', pattern: [true, true, true, false] },
  { name: '后十六前八', pattern: [true, false, true, true] },
  { name: '三连音感觉', pattern: [true, true, false, true] },
]

export default function BeatPractice() {
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [currentPattern, setCurrentPattern] = useState<boolean[]>([])
  const [userPattern, setUserPattern] = useState<boolean[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [submitted, setSubmitted] = useState(false)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  const config = DIFFICULTY_CONFIG[difficulty]

  const generateQuestion = useCallback(() => {
    let pattern: boolean[]
    if (config.usePreset) {
      pattern = [...PRESET_PATTERNS[Math.floor(Math.random() * PRESET_PATTERNS.length)].pattern]
    } else {
      pattern = Array(config.beats).fill(false).map(() => Math.random() > 0.35)
      // Ensure at least one beat
      if (pattern.every(b => !b)) pattern[0] = true
    }

    setCurrentPattern(pattern)
    setUserPattern(Array(pattern.length).fill(false))
    setSubmitted(false)
    setFeedback(null)
    setTimeLeft(20)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [config])

  const playRhythm = useCallback(async (pattern: boolean[], noteName: string = 'C5') => {
    setIsPlaying(true)
    await moaTone.init()
    const interval = 350
    for (let i = 0; i < pattern.length; i++) {
      if (pattern[i]) {
        moaTone.playNote(noteName, 0.12)
      }
      await new Promise(resolve => setTimeout(resolve, interval))
    }
    setIsPlaying(false)
  }, [])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5'], 0.15)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const toggleBeat = useCallback((index: number) => {
    if (isPlaying || submitted) return
    setUserPattern(prev => {
      const next = [...prev]
      next[index] = !next[index]
      return next
    })
  }, [isPlaying, submitted])

  const submitAnswer = useCallback(() => {
    if (submitted) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSubmitted(true)
    const isCorrect = JSON.stringify(currentPattern) === JSON.stringify(userPattern)
    setFeedback(isCorrect ? 'correct' : 'wrong')

    if (isCorrect) {
      const newCombo = combo + 1
      setCombo(newCombo)
      setPass(p => p + 1)
      setAll(a => a + 1)
      playFeedbackSound(true)
      if (newCombo >= 5 && newCombo % 5 === 0) {
        message.success(`🔥 ${newCombo}连击！太棒了！`)
      } else {
        message.success('回答正确！')
      }
      setTimeout(generateQuestion, 1000)
    } else {
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error('回答错误，请对比正确答案')
    }

    addPracticeRecord('rhythm', isCorrect ? 1 : 0, 1)
  }, [submitted, currentPattern, userPattern, combo, generateQuestion, playFeedbackSound])

  const resetAnswer = useCallback(() => {
    if (isPlaying || submitted) return
    setUserPattern(Array(currentPattern.length).fill(false))
  }, [isPlaying, submitted, currentPattern.length])

  // Timer
  useEffect(() => {
    if (timerOn && !submitted && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !submitted) {
      setSubmitted(true)
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error('时间到！')
      addPracticeRecord('rhythm', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, submitted, playFeedbackSound])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playRhythm(currentPattern) }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
      if (e.code === 'Enter') { e.preventDefault(); submitAnswer() }
      if (e.code === 'KeyR') { e.preventDefault(); resetAnswer() }
      if (e.code === 'KeyU') { e.preventDefault(); playRhythm(userPattern, 'G4') }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playRhythm, generateQuestion, submitAnswer, resetAnswer, currentPattern, userPattern])

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      generateQuestion()
    }
  }, [generateQuestion])

  const accuracy = all > 0 ? Math.round((pass / all) * 100) : 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card className={feedback === 'correct' ? 'ring-2 ring-green-400' : feedback === 'wrong' ? 'ring-2 ring-red-400' : ''}
        style={{ transition: 'box-shadow 0.3s' }}>
        <div className="text-center mb-4">
          <Title level={2} className="!mb-1">节奏练习</Title>
          <Text type="secondary">听节奏，点击格子标记节拍位置</Text>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <Segmented value={difficulty} onChange={(v) => { setDifficulty(v as Difficulty); setTimeout(generateQuestion, 0) }}
            options={[{ label: '初级', value: 'easy' }, { label: '中级', value: 'medium' }, { label: '高级', value: 'hard' }]} />
          <Space>
            <ClockCircleOutlined />
            <Switch checked={timerOn} onChange={setTimerOn} size="small" />
            <Text type="secondary" className="text-xs">倒计时</Text>
          </Space>
          {timerOn && !submitted && <Tag color={timeLeft <= 5 ? 'red' : 'blue'}>{timeLeft}s</Tag>}
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Tag color="green">✓ {pass}</Tag>
            <Tag color="default">共 {all}</Tag>
            <Tag color="blue">{accuracy}%</Tag>
            {combo >= 2 && <Tag color="orange" icon={<FireOutlined />}>{combo}连击</Tag>}
          </div>
          <Progress percent={accuracy} showInfo={false} className="mt-2" size="small"
            strokeColor={{ '0%': '#1677ff', '100%': '#52c41a' }} />
        </div>

        <div className="text-center mb-5">
          <Button type="primary" size="large" icon={<SoundOutlined />}
            onClick={() => playRhythm(currentPattern)} loading={isPlaying}>
            播放题目 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<SoundOutlined />}
            onClick={() => playRhythm(userPattern, 'G4')} loading={isPlaying} className="ml-3">
            播放答案 <Tag className="ml-1" color="default">U</Tag>
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={generateQuestion} className="ml-3">
            下一题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        {/* 正确答案显示行（提交后） */}
        {submitted && (
          <div className="flex justify-center gap-2 mb-3">
            <Text type="secondary" className="text-xs mr-2">题目：</Text>
            {currentPattern.map((beat, i) => (
              <div key={i} className={`w-8 h-8 rounded flex items-center justify-center text-xs font-bold
                ${beat ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-400'}`}>
                {i + 1}
              </div>
            ))}
          </div>
        )}

        {/* 用户节奏网格 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {currentPattern.map((_, index) => (
            <button key={index} onClick={() => toggleBeat(index)}
              disabled={isPlaying || submitted}
              className={`w-14 h-14 md:w-16 md:h-16 rounded-lg border-2 transition-all duration-150 text-xl font-bold
                ${userPattern[index]
                  ? 'bg-blue-500 border-blue-600 text-white shadow-md scale-105'
                  : 'bg-gray-50 border-gray-300 hover:bg-gray-100 text-gray-500'}
                ${(isPlaying || submitted) ? 'cursor-not-allowed opacity-70' : 'cursor-pointer active:scale-95'}`}>
              {index + 1}
            </button>
          ))}
        </div>

        <div className="flex justify-center gap-3">
          <Button onClick={resetAnswer} disabled={isPlaying || submitted}>
            重置 <Tag className="ml-1" color="default">R</Tag>
          </Button>
          <Button type="primary" onClick={submitAnswer} disabled={submitted}>
            提交 <Tag className="ml-1" color="default">Enter</Tag>
          </Button>
        </div>

        {submitted && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 回答正确！' : '✗ 回答错误！上方蓝色为正确答案'}
            </Text>
          </div>
        )}

        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放题目
            <Tag color="default" className="text-xs ml-1">U</Tag> 播放答案
            <Tag color="default" className="text-xs ml-1">R</Tag> 重置
            <Tag color="default" className="text-xs ml-1">Enter</Tag> 提交
            <Tag color="default" className="text-xs ml-1">→</Tag> 下一题
          </Text>
        </div>
      </Card>
    </div>
  )
}
