'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_CHORDS: Record<Difficulty, string[]> = {
  easy: ['maj', 'min'],
  medium: ['maj', 'min', 'aug', 'dim', 'maj7', 'min7', 'dom7'],
  hard: ['maj', 'min', 'aug', 'dim', 'maj7', 'min7', 'dom7', 'dim7', 'halfDim7', 'sus2', 'sus4'],
}

export default function HarmonyPractice() {
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [root, setRoot] = useState('C4')
  const [chordType, setChordType] = useState<ChordType>(CHORD_TYPES.maj)
  const [notes, setNotes] = useState<string[]>([])
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  const chordKeys = DIFFICULTY_CHORDS[difficulty]
  const chordOptions = chordKeys.map(k => CHORD_TYPES[k]).filter(Boolean)

  const generateQuestion = useCallback(() => {
    const noteNames = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const octaves = [3, 4]
    const r = `${noteNames[Math.floor(Math.random() * noteNames.length)]}${octaves[Math.floor(Math.random() * octaves.length)]}`
    const typeKey = chordKeys[Math.floor(Math.random() * chordKeys.length)]
    const ct = CHORD_TYPES[typeKey]
    const chordNotes = buildChord(r, ct)

    setRoot(r)
    setChordType(ct)
    setNotes(chordNotes)
    setSelectedAnswer('')
    setFeedback(null)
    setTimeLeft(10)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [chordKeys])

  const playQuestion = useCallback(async () => {
    setIsPlaying(true)
    await moaTone.init()
    moaTone.playNotes(notes, 0.8)
    setTimeout(() => setIsPlaying(false), 1000)
  }, [notes])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5', 'C6'], 0.12)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const handleAnswer = useCallback((ct: ChordType) => {
    if (selectedAnswer) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedAnswer(ct.name)
    const isCorrect = ct.name === chordType.name
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
      setTimeout(generateQuestion, 800)
    } else {
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`回答错误，正确答案是：${chordType.name}`)
    }

    addPracticeRecord('harmony', isCorrect ? 1 : 0, 1)
  }, [selectedAnswer, chordType, combo, generateQuestion, playFeedbackSound])

  useEffect(() => {
    if (timerOn && !selectedAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !selectedAnswer) {
      setSelectedAnswer('超时')
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`时间到！正确答案是：${chordType.name}`)
      addPracticeRecord('harmony', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, selectedAnswer, chordType, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playQuestion() }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
      const num = parseInt(e.key)
      if (num >= 1 && num <= Math.min(9, chordOptions.length)) {
        e.preventDefault()
        handleAnswer(chordOptions[num - 1])
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playQuestion, generateQuestion, handleAnswer, chordOptions])

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
          <Title level={2} className="!mb-1">和弦辨认练习</Title>
          <Text type="secondary">听和弦，判断和弦类型</Text>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <Segmented value={difficulty} onChange={(v) => { setDifficulty(v as Difficulty); setTimeout(generateQuestion, 0) }}
            options={[{ label: '初级', value: 'easy' }, { label: '中级', value: 'medium' }, { label: '高级', value: 'hard' }]} />
          <Space>
            <ClockCircleOutlined />
            <Switch checked={timerOn} onChange={setTimerOn} size="small" />
            <Text type="secondary" className="text-xs">倒计时</Text>
          </Space>
          {timerOn && !selectedAnswer && <Tag color={timeLeft <= 3 ? 'red' : 'blue'}>{timeLeft}s</Tag>}
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
            onClick={playQuestion} loading={isPlaying}>
            播放和弦 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={generateQuestion} className="ml-3">
            下一题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {chordOptions.map((ct, idx) => {
            const isSelected = selectedAnswer === ct.name
            const isCorrectAnswer = ct.name === chordType.name
            let btnType: 'default' | 'primary' = 'default'
            let btnDanger = false
            if (isSelected && isCorrectAnswer) btnType = 'primary'
            else if (isSelected && !isCorrectAnswer) btnDanger = true
            else if (selectedAnswer && isCorrectAnswer) btnType = 'primary'

            return (
              <Button key={ct.name} size="large"
                onClick={() => handleAnswer(ct)} disabled={!!selectedAnswer}
                type={btnType} danger={btnDanger} className="text-sm">
                <span className="font-medium mr-1 text-gray-400">{idx + 1}</span>
                {ct.name}
                {ct.symbol && <Text type="secondary" className="text-xs ml-1">({ct.symbol})</Text>}
              </Button>
            )
          })}
        </div>

        {selectedAnswer && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 回答正确！' : `✗ 回答错误！正确答案：${chordType.name}`}
            </Text>
          </div>
        )}

        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放
            <Tag color="default" className="text-xs ml-1">1-{chordOptions.length}</Tag> 选答案
            <Tag color="default" className="text-xs ml-1">→</Tag> 下一题
          </Text>
        </div>
      </Card>
    </div>
  )
}
