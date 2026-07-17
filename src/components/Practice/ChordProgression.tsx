'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord } from '@/utils/chord'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

// 和弦进行定义：名称、度数、和弦类型
interface ProgressionDef {
  name: string
  degrees: string[]
  chordTypes: string[]
}

const NOTE_NAMES_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const DEGREE_OFFSETS: Record<string, number> = {
  'I': 0, 'ii': 2, 'iii': 4, 'IV': 5, 'V': 7, 'vi': 9, 'vii°': 11, 'viio': 11,
}

const PROGRESSIONS_EASY: ProgressionDef[] = [
  { name: 'I-IV-V-I', degrees: ['I', 'IV', 'V', 'I'], chordTypes: ['maj', 'maj', 'maj', 'maj'] },
  { name: 'I-V-vi-IV', degrees: ['I', 'V', 'vi', 'IV'], chordTypes: ['maj', 'maj', 'min', 'maj'] },
]

const PROGRESSIONS_MEDIUM: ProgressionDef[] = [
  ...PROGRESSIONS_EASY,
  { name: 'I-vi-IV-V', degrees: ['I', 'vi', 'IV', 'V'], chordTypes: ['maj', 'min', 'maj', 'maj'] },
  { name: 'ii-V-I', degrees: ['ii', 'V', 'I'], chordTypes: ['min7', 'dom7', 'maj7'] },
  { name: 'I-vi-ii-V', degrees: ['I', 'vi', 'ii', 'V'], chordTypes: ['maj', 'min', 'min', 'maj'] },
]

const PROGRESSIONS_HARD: ProgressionDef[] = [
  ...PROGRESSIONS_MEDIUM,
  { name: 'I-IV-viio-iii-vi-ii-V-I', degrees: ['I', 'IV', 'vii°', 'iii', 'vi', 'ii', 'V', 'I'], chordTypes: ['maj', 'maj', 'dim', 'min', 'min', 'min', 'maj', 'maj'] },
  { name: 'I-V-vi-iii-IV-I-IV-V', degrees: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'], chordTypes: ['maj', 'maj', 'min', 'min', 'maj', 'maj', 'maj', 'maj'] },
]

const DIFFICULTY_MAP: Record<Difficulty, ProgressionDef[]> = {
  easy: PROGRESSIONS_EASY,
  medium: PROGRESSIONS_MEDIUM,
  hard: PROGRESSIONS_HARD,
}

export default function ChordProgressionPractice() {
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [root, setRoot] = useState('C')
  const [progression, setProgression] = useState<ProgressionDef | null>(null)
  const [chordNotes, setChordNotes] = useState<string[][]>([])
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(20)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  const progList = DIFFICULTY_MAP[difficulty]

  const getChordRoot = useCallback((rt: string, degree: string): string => {
    const offset = DEGREE_OFFSETS[degree] ?? 0
    const rootIdx = NOTE_NAMES_LIST.indexOf(rt)
    return NOTE_NAMES_LIST[(rootIdx + offset) % 12]
  }, [])

  const generateQuestion = useCallback(() => {
    const prog = progList[Math.floor(Math.random() * progList.length)]
    const noteRoots = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const rt = noteRoots[Math.floor(Math.random() * noteRoots.length)]

    const notes = prog.degrees.map((deg, i) => {
      const chordType = CHORD_TYPES[prog.chordTypes[i]]
      if (!chordType) return []
      const chordRoot = getChordRoot(rt, deg)
      return buildChord(`${chordRoot}4`, chordType)
    })

    setRoot(rt)
    setProgression(prog)
    setChordNotes(notes)
    setSelectedAnswer(null)
    setFeedback(null)
    setTimeLeft(20)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [progList, getChordRoot])

  const playProgression = useCallback(async () => {
    setIsPlaying(true)
    await moaTone.init()
    for (const notes of chordNotes) {
      if (notes.length > 0) {
        moaTone.playNotes(notes, 0.7)
      }
      await new Promise(resolve => setTimeout(resolve, 900))
    }
    setIsPlaying(false)
  }, [chordNotes])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5', 'C6'], 0.12)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const handleAnswer = useCallback((name: string) => {
    if (selectedAnswer) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedAnswer(name)
    const isCorrect = name === progression?.name
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
      setTimeout(generateQuestion, 1200)
    } else {
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`回答错误，正确答案是：${progression?.name}`)
    }

    addPracticeRecord('chord-progression', isCorrect ? 1 : 0, 1)
  }, [selectedAnswer, progression, combo, generateQuestion, playFeedbackSound])

  useEffect(() => {
    if (timerOn && !selectedAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !selectedAnswer) {
      setSelectedAnswer('超时')
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`时间到！正确答案是：${progression?.name}`)
      addPracticeRecord('chord-progression', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, selectedAnswer, progression, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playProgression() }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
      const num = parseInt(e.key)
      if (num >= 1 && num <= Math.min(9, progList.length) && !selectedAnswer) {
        e.preventDefault()
        handleAnswer(progList[num - 1].name)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playProgression, generateQuestion, handleAnswer, progList, selectedAnswer])

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
          <Title level={2} className="!mb-1">和弦进行练习</Title>
          <Text type="secondary">听和弦进行，选择正确的和声进行模式</Text>
          <div className="mt-2">
            <Tag color="blue">当前调性：{root}大调</Tag>
          </div>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <Segmented value={difficulty} onChange={(v) => { setDifficulty(v as Difficulty); setTimeout(generateQuestion, 0) }}
            options={[{ label: '初级', value: 'easy' }, { label: '中级', value: 'medium' }, { label: '高级', value: 'hard' }]} />
          <Space>
            <ClockCircleOutlined />
            <Switch checked={timerOn} onChange={setTimerOn} size="small" />
            <Text type="secondary" className="text-xs">倒计时</Text>
          </Space>
          {timerOn && !selectedAnswer && <Tag color={timeLeft <= 5 ? 'red' : 'blue'}>{timeLeft}s</Tag>}
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
            onClick={playProgression} loading={isPlaying}>
            播放和弦进行 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={generateQuestion} className="ml-3">
            下一题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        {/* 度数预览 */}
        {progression && (
          <div className="flex justify-center gap-2 mb-5 flex-wrap">
            {progression.degrees.map((deg, idx) => (
              <Tag key={idx} color="purple" className="text-base px-3 py-1">
                {deg}
                <Text type="secondary" className="text-xs ml-1">
                  ({progression.chordTypes[idx]})
                </Text>
              </Tag>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-2 md:gap-3">
          {progList.map((prog, idx) => {
            const isSelected = selectedAnswer === prog.name
            const isCorrectAns = prog.name === progression?.name
            let btnType: 'default' | 'primary' = 'default'
            let btnDanger = false
            if (isSelected && isCorrectAns) btnType = 'primary'
            else if (isSelected && !isCorrectAns) btnDanger = true
            else if (selectedAnswer && isCorrectAns) btnType = 'primary'

            return (
              <Button key={prog.name} size="large"
                onClick={() => handleAnswer(prog.name)} disabled={!!selectedAnswer}
                type={btnType} danger={btnDanger} className="text-left h-auto py-3">
                <span className="font-bold mr-2 text-gray-400">{idx + 1}.</span>
                <span className="font-medium">{prog.name}</span>
                <Text type="secondary" className="text-xs ml-2">
                  ({prog.degrees.join('-')})
                </Text>
              </Button>
            )
          })}
        </div>

        {selectedAnswer && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 回答正确！' : `✗ 回答错误！正确答案：${progression?.name}`}
            </Text>
          </div>
        )}

        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放
            <Tag color="default" className="text-xs ml-1">1-{progList.length}</Tag> 选答案
            <Tag color="default" className="text-xs ml-1">→</Tag> 下一题
          </Text>
        </div>
      </Card>
    </div>
  )
}
