'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { NOTE_NAMES } from '@/utils/note'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

interface DifficultyConfig {
  noteCount: number
  optionCount: number
}

const DIFFICULTY_CONFIG: Record<Difficulty, DifficultyConfig> = {
  easy: { noteCount: 3, optionCount: 3 },
  medium: { noteCount: 4, optionCount: 4 },
  hard: { noteCount: 5, optionCount: 4 },
}

const NOTE_TO_SOLFEGE: Record<string, string> = {
  'C': '1', 'C#': '#1', 'D': '2', 'D#': '#2', 'E': '3',
  'F': '4', 'F#': '#4', 'G': '5', 'G#': '#5', 'A': '6', 'A#': '#6', 'B': '7',
}

function noteToSolfege(note: string): string {
  const match = note.match(/^([A-G]#?)/)
  return match ? (NOTE_TO_SOLFEGE[match[1]] || note) : note
}

function generateMelody(length: number): string[] {
  const melody: string[] = []
  let currentNote = `C${4 + Math.floor(Math.random() * 2)}`

  for (let i = 0; i < length; i++) {
    melody.push(currentNote)
    const match = currentNote.match(/^([A-G]#?)(\d+)$/)
    if (!match) continue

    const noteName = match[1]
    const octave = parseInt(match[2])
    const currentIndex = NOTE_NAMES.indexOf(noteName)

    const offset = Math.floor(Math.random() * 7) - 3
    let newIndex = Math.max(0, Math.min(NOTE_NAMES.length - 1, currentIndex + offset))
    let newOctave = octave
    if (currentIndex === 11 && offset > 0) newOctave++
    else if (currentIndex === 0 && offset < 0) newOctave--
    newOctave = Math.max(3, Math.min(5, newOctave))
    currentNote = `${NOTE_NAMES[newIndex]}${newOctave}`
  }

  return melody
}

function generateWrongOptions(correctNotes: string[], count: number): string[][] {
  const options: string[][] = []
  let attempts = 0

  while (options.length < count && attempts < 50) {
    attempts++
    const wrong = correctNotes.map(note => {
      if (Math.random() > 0.55) {
        const match = note.match(/^([A-G]#?)(\d+)$/)
        if (!match) return note
        const noteName = match[1]
        const octave = parseInt(match[2])
        const idx = NOTE_NAMES.indexOf(noteName)
        const newIdx = (idx + Math.floor(Math.random() * 3) + 1) % NOTE_NAMES.length
        return `${NOTE_NAMES[newIdx]}${octave}`
      }
      return note
    })

    const isDuplicate = options.some(o => JSON.stringify(o) === JSON.stringify(wrong))
    const isSame = JSON.stringify(wrong) === JSON.stringify(correctNotes)
    if (!isDuplicate && !isSame) options.push(wrong)
  }

  return options
}

export default function MelodyPractice() {
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [correctNotes, setCorrectNotes] = useState<string[]>([])
  const [answerOptions, setAnswerOptions] = useState<string[][]>([])
  const [correctIndex, setCorrectIndex] = useState(0)
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(15)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  const config = DIFFICULTY_CONFIG[difficulty]

  const generateQuestion = useCallback(() => {
    const correct = generateMelody(config.noteCount)
    const wrongOpts = generateWrongOptions(correct, config.optionCount - 1)
    const allOpts = [...wrongOpts, correct]
    // Shuffle
    for (let i = allOpts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [allOpts[i], allOpts[j]] = [allOpts[j], allOpts[i]]
    }
    const cIdx = allOpts.findIndex(o => JSON.stringify(o) === JSON.stringify(correct))

    setCorrectNotes(correct)
    setAnswerOptions(allOpts)
    setCorrectIndex(cIdx)
    setSelectedAnswer(null)
    setFeedback(null)
    setTimeLeft(15)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [config])

  const playMelody = useCallback(async () => {
    setIsPlaying(true)
    await moaTone.init()
    await moaTone.playSequence(correctNotes, 0.6)
    setIsPlaying(false)
  }, [correctNotes])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5', 'C6'], 0.12)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const handleAnswer = useCallback((index: number) => {
    if (selectedAnswer !== null) return
    if (timerRef.current) clearInterval(timerRef.current)

    setSelectedAnswer(index)
    const isCorrect = index === correctIndex
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
      message.error(`回答错误，正确答案是第 ${correctIndex + 1} 个`)
    }

    addPracticeRecord('melody', isCorrect ? 1 : 0, 1)
  }, [selectedAnswer, correctIndex, combo, generateQuestion, playFeedbackSound])

  useEffect(() => {
    if (timerOn && selectedAnswer === null && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && selectedAnswer === null) {
      setSelectedAnswer(-1)
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`时间到！正确答案是第 ${correctIndex + 1} 个`)
      addPracticeRecord('melody', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, selectedAnswer, correctIndex, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playMelody() }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
      const num = parseInt(e.key)
      if (num >= 1 && num <= answerOptions.length && selectedAnswer === null) {
        e.preventDefault()
        handleAnswer(num - 1)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playMelody, generateQuestion, handleAnswer, answerOptions.length, selectedAnswer])

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
          <Title level={2} className="!mb-1">旋律辨认练习</Title>
          <Text type="secondary">听一段旋律，选择正确的音符序列</Text>
        </div>

        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <Segmented value={difficulty} onChange={(v) => { setDifficulty(v as Difficulty); setTimeout(generateQuestion, 0) }}
            options={[{ label: '初级', value: 'easy' }, { label: '中级', value: 'medium' }, { label: '高级', value: 'hard' }]} />
          <Space>
            <ClockCircleOutlined />
            <Switch checked={timerOn} onChange={setTimerOn} size="small" />
            <Text type="secondary" className="text-xs">倒计时</Text>
          </Space>
          {timerOn && selectedAnswer === null && <Tag color={timeLeft <= 5 ? 'red' : 'blue'}>{timeLeft}s</Tag>}
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
            onClick={playMelody} loading={isPlaying}>
            播放旋律 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={generateQuestion} className="ml-3">
            下一题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        <div className="space-y-2">
          {answerOptions.map((option, index) => {
            const isSelected = selectedAnswer === index
            const isCorrectOpt = index === correctIndex
            let btnType: 'default' | 'primary' = 'default'
            let btnDanger = false
            if (isSelected && isCorrectOpt) btnType = 'primary'
            else if (isSelected && !isCorrectOpt) btnDanger = true
            else if (selectedAnswer !== null && isCorrectOpt) btnType = 'primary'

            return (
              <Button key={index} size="large" block
                onClick={() => handleAnswer(index)}
                disabled={selectedAnswer !== null}
                type={btnType} danger={btnDanger} className="text-left h-auto py-3">
                <span className="font-bold mr-3 text-gray-400">{index + 1}.</span>
                {option.map((note, i) => (
                  <span key={i} className="mx-1">
                    <Tag color="blue" className="text-xs">{note}</Tag>
                    <Text type="secondary" className="text-xs">({noteToSolfege(note)})</Text>
                    {i < option.length - 1 && <span className="mx-1 text-gray-300">→</span>}
                  </span>
                ))}
              </Button>
            )
          })}
        </div>

        {selectedAnswer !== null && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 回答正确！' : `✗ 回答错误！正确答案是第 ${correctIndex + 1} 个`}
            </Text>
          </div>
        )}

        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放
            <Tag color="default" className="text-xs ml-1">1-{answerOptions.length}</Tag> 选答案
            <Tag color="default" className="text-xs ml-1">→</Tag> 下一题
          </Text>
        </div>
      </Card>
    </div>
  )
}
