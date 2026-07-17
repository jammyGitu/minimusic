'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { PlayCircleOutlined, SyncOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ABCJS from 'abcjs'
import { moaTone } from '@/utils/MoaTone'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

// 练习乐谱
const SCORES = [
  {
    title: '小星星',
    abc: `X:1\nT:小星星\nM:4/4\nL:1/4\nK:C\nC C G G | A A G2 | F F E E | D D C2 |`,
    notes: ['C4', 'C4', 'G4', 'G4', 'A4', 'A4', 'G4', 'F4', 'F4', 'E4', 'E4', 'D4', 'D4', 'C4'],
  },
  {
    title: '欢乐颂',
    abc: `X:1\nT:欢乐颂\nM:4/4\nL:1/4\nK:C\nE E F G | G F E D | C C D E | E D D2 |`,
    notes: ['E4', 'E4', 'F4', 'G4', 'G4', 'F4', 'E4', 'D4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'D4'],
  },
  {
    title: '生日歌',
    abc: `X:1\nT:生日歌\nM:3/4\nL:1/4\nK:C\nG G A G | c B2 | G G A G | d c2 |`,
    notes: ['G4', 'G4', 'A4', 'G4', 'C5', 'B4', 'B4', 'G4', 'G4', 'A4', 'G4', 'D5', 'C5', 'C5'],
  },
  {
    title: '划船歌',
    abc: `X:1\nT:划船歌\nM:4/4\nL:1/4\nK:C\nC C C D E | E D E F G | C C C G G | E E C C |`,
    notes: ['C4', 'C4', 'C4', 'D4', 'E4', 'E4', 'D4', 'E4', 'F4', 'G4', 'C4', 'C4', 'C4', 'G4', 'G4', 'E4', 'E4', 'C4', 'C4'],
  },
  {
    title: '小蜜蜂',
    abc: `X:1\nT:小蜜蜂\nM:4/4\nL:1/4\nK:C\nG E E2 | F D D2 | C D E F | G G G2 |`,
    notes: ['G4', 'E4', 'E4', 'F4', 'D4', 'D4', 'C4', 'D4', 'E4', 'F4', 'G4', 'G4', 'G4'],
  },
]

const PIANO_WHITE_NOTES = ['C4', 'D4', 'E4', 'F4', 'G4', 'A4', 'B4', 'C5', 'D5', 'E5', 'F5', 'G5', 'A5', 'B5']
const PIANO_BLACK_NOTES = ['C#4', 'D#4', 'F#4', 'G#4', 'A#4', 'C#5', 'D#5', 'F#5', 'G#5', 'A#5']
const ALL_PIANO_NOTES = [...PIANO_WHITE_NOTES, ...PIANO_BLACK_NOTES]

export default function StaffNotePractice() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [currentScore, setCurrentScore] = useState(SCORES[0])
  const [userInput, setUserInput] = useState<string[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [showAnswer, setShowAnswer] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(30)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)
  const [activeKey, setActiveKey] = useState<string | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  // Filter scores by difficulty
  const getFilteredScores = useCallback(() => {
    switch (difficulty) {
      case 'easy': return SCORES.filter(s => s.notes.length <= 15)
      case 'medium': return SCORES
      case 'hard': return SCORES.filter(s => s.notes.length >= 14)
    }
  }, [difficulty])

  const renderSheet = useCallback(() => {
    if (!sheetRef.current) return
    sheetRef.current.innerHTML = ''
    ABCJS.renderAbc(sheetRef.current, currentScore.abc, {
      responsive: 'resize',
      staffwidth: 700,
      paddingtop: 10,
      paddingbottom: 10,
    })
  }, [currentScore])

  const generateQuestion = useCallback(() => {
    const filtered = getFilteredScores()
    const score = filtered[Math.floor(Math.random() * filtered.length)]
    setCurrentScore(score)
    setUserInput([])
    setShowAnswer(false)
    setFeedback(null)
    setTimeLeft(30)
    if (timerRef.current) clearInterval(timerRef.current)
  }, [getFilteredScores])

  const playScore = useCallback(async () => {
    setIsPlaying(true)
    await moaTone.init()
    await moaTone.playSequence(currentScore.notes, 0.35)
    setIsPlaying(false)
  }, [currentScore])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5', 'C6'], 0.12)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const handleNoteInput = useCallback((note: string) => {
    if (showAnswer) return
    moaTone.playNote(note, 0.3)
    setActiveKey(note)
    setTimeout(() => setActiveKey(null), 200)

    const nextIdx = userInput.length
    const newInput = [...userInput, note]
    setUserInput(newInput)

    // Check if complete
    if (newInput.length === currentScore.notes.length) {
      if (timerRef.current) clearInterval(timerRef.current)
      setShowAnswer(true)

      const isCorrect = newInput.every((input, i) => input === currentScore.notes[i])
      setFeedback(isCorrect ? 'correct' : 'wrong')

      if (isCorrect) {
        const newCombo = combo + 1
        setCombo(newCombo)
        setPass(p => p + 1)
        setAll(a => a + 1)
        playFeedbackSound(true)
        if (newCombo >= 3 && newCombo % 3 === 0) {
          message.success(`🔥 ${newCombo}连击！太棒了！`)
        } else {
          message.success('演奏正确！')
        }
      } else {
        setCombo(0)
        setAll(a => a + 1)
        playFeedbackSound(false)
        message.error('有错误，请查看答案')
      }

      addPracticeRecord('staff-note', isCorrect ? 1 : 0, 1)
    }
  }, [showAnswer, userInput, currentScore, combo, playFeedbackSound])

  // Timer
  useEffect(() => {
    if (timerOn && !showAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !showAnswer) {
      setShowAnswer(true)
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error('时间到！')
      addPracticeRecord('staff-note', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, showAnswer, playFeedbackSound])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playScore() }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playScore, generateQuestion])

  useEffect(() => {
    renderSheet()
  }, [renderSheet])

  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      generateQuestion()
    }
  }, [generateQuestion])

  const accuracy = all > 0 ? Math.round((pass / all) * 100) : 0
  const progressPercent = currentScore.notes.length > 0
    ? Math.round((userInput.length / currentScore.notes.length) * 100)
    : 0

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card className={feedback === 'correct' ? 'ring-2 ring-green-400' : feedback === 'wrong' ? 'ring-2 ring-red-400' : ''}
        style={{ transition: 'box-shadow 0.3s' }}>
        <div className="text-center mb-4">
          <Title level={2} className="!mb-1">🎹 五线谱视奏练习</Title>
          <Text type="secondary">观看五线谱，使用下方虚拟钢琴演奏正确的音符</Text>
          <div className="mt-1">
            <Tag color="blue">{currentScore.title}</Tag>
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
          {timerOn && !showAnswer && <Tag color={timeLeft <= 10 ? 'red' : 'blue'}>{timeLeft}s</Tag>}
        </div>

        <div className="mb-4">
          <div className="flex flex-wrap justify-center items-center gap-3">
            <Tag color="green">✓ {pass}</Tag>
            <Tag color="default">共 {all}</Tag>
            <Tag color="blue">{accuracy}%</Tag>
            {combo >= 2 && <Tag color="orange" icon={<FireOutlined />}>{combo}连击</Tag>}
            <Tag color="purple">{userInput.length}/{currentScore.notes.length}</Tag>
          </div>
          <Progress percent={progressPercent} showInfo={false} className="mt-2" size="small" />
        </div>

        {/* 五线谱 */}
        <div className="border border-gray-200 rounded-lg p-4 min-h-[120px] bg-white mb-5 overflow-x-auto"
          ref={sheetRef} />

        {/* 播放按钮 */}
        <div className="text-center mb-5">
          <Button type="primary" size="large" icon={<PlayCircleOutlined />}
            onClick={playScore} loading={isPlaying}>
            播放示范 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<SyncOutlined />} onClick={generateQuestion} className="ml-3">
            换题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        {/* 用户输入音符显示 */}
        <div className="flex justify-center gap-1 mb-5 flex-wrap">
          {currentScore.notes.map((note, idx) => {
            let bg = 'bg-gray-100 text-gray-500 border-gray-300'
            if (idx < userInput.length) {
              bg = userInput[idx] === note
                ? 'bg-green-100 text-green-700 border-green-400'
                : 'bg-red-100 text-red-700 border-red-400'
            } else if (showAnswer) {
              bg = 'bg-blue-50 text-blue-600 border-blue-300'
            }
            return (
              <div key={idx} className={`px-2 py-1 rounded text-xs font-medium border ${bg} min-w-[36px] text-center`}>
                {idx < userInput.length ? userInput[idx] : (showAnswer ? note : '?')}
              </div>
            )
          })}
        </div>

        {/* 虚拟钢琴键盘 */}
        <div className="flex justify-center overflow-x-auto pb-2">
          <div className="relative inline-block" style={{ minWidth: '700px' }}>
            {/* 白键 */}
            <div className="flex">
              {PIANO_WHITE_NOTES.map((note) => (
                <button key={note}
                  onClick={() => handleNoteInput(note)}
                  disabled={showAnswer}
                  className={`w-12 h-28 md:h-32 border border-gray-300 rounded-b-lg flex flex-col items-center justify-end pb-2
                    transition-colors duration-100
                    ${activeKey === note ? 'bg-blue-200' : 'bg-white hover:bg-gray-100'}
                    ${showAnswer && currentScore.notes.includes(note) ? 'bg-blue-50' : ''}
                    ${showAnswer ? 'cursor-default' : 'cursor-pointer active:bg-blue-200'}`}>
                  <span className="text-xs text-gray-500 mb-1">{note.replace(/\d/, '')}</span>
                </button>
              ))}
            </div>
            {/* 黑键 */}
            <div className="absolute top-0 left-0">
              {PIANO_WHITE_NOTES.map((whiteNote, whiteIdx) => {
                const whiteBase = whiteNote.replace(/\d/, '')
                const octave = whiteNote.match(/\d/)?.[0] || '4'
                const blackNote = `${whiteBase}#${octave}`
                if (!PIANO_BLACK_NOTES.includes(blackNote)) return null
                // E->F 和 B->C 之间没有黑键
                if (whiteBase === 'E' || whiteBase === 'B') return null

                const leftPos = (whiteIdx + 1) * 48 - 16

                return (
                  <button key={blackNote}
                    onClick={() => handleNoteInput(blackNote)}
                    disabled={showAnswer}
                    style={{ left: `${leftPos}px` }}
                    className={`absolute w-8 h-18 md:h-20 bg-gray-800 rounded-b-lg flex flex-col items-center justify-end pb-1
                      transition-colors duration-100 z-10
                      ${activeKey === blackNote ? 'bg-blue-500' : 'hover:bg-gray-700'}
                      ${showAnswer && currentScore.notes.includes(blackNote) ? 'bg-blue-600' : ''}
                      ${showAnswer ? 'cursor-default' : 'cursor-pointer active:bg-blue-500'}`}>
                    <span className="text-xs text-gray-300 mb-1">{blackNote.replace(/\d/, '').replace('#', '♯')}</span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {showAnswer && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 演奏正确！' : '✗ 有错误！绿色=正确，红色=错误，蓝色=正确答案'}
            </Text>
          </div>
        )}

        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放示范
            <Tag color="default" className="text-xs ml-1">→</Tag> 换题
            <Tag color="default" className="text-xs ml-1">点击琴键</Tag> 输入音符
          </Text>
        </div>
      </Card>
    </div>
  )
}
