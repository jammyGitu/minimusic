'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Progress, message, Switch } from 'antd'
import {
  ReloadOutlined,
  SoundOutlined,
  FireOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'
import { addPracticeRecord } from '@/stores/progress'
import styles from './practice.module.scss'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_CHORDS: Record<Difficulty, string[]> = {
  easy: ['maj', 'min'],
  medium: ['maj', 'min', 'aug', 'dim', 'maj7', 'min7', 'dom7'],
  hard: [
    'maj',
    'min',
    'aug',
    'dim',
    'maj7',
    'min7',
    'dom7',
    'dim7',
    'halfDim7',
    'sus2',
    'sus4',
  ],
}

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

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
    const r = `${noteNames[Math.floor(Math.random() * noteNames.length)]}${
      octaves[Math.floor(Math.random() * octaves.length)]
    }`
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

  const handleAnswer = useCallback(
    (ct: ChordType) => {
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
    },
    [selectedAnswer, chordType, combo, generateQuestion, playFeedbackSound]
  )

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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerOn, timeLeft, selectedAnswer, chordType, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        playQuestion()
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        generateQuestion()
      }
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
  const gridCols = chordOptions.length > 6 ? styles.optionsGrid3 : styles.optionsGrid2

  return (
    <div className={styles.page}>
      <div
        className={`${styles.card} ${
          feedback === 'correct'
            ? styles.cardCorrect
            : feedback === 'wrong'
            ? styles.cardWrong
            : ''
        }`}
      >
        <div className={styles.cardInner}>
          <div className={styles.head}>
            <h2 className={styles.title}>和弦辨认练习</h2>
            <p className={styles.subtitle}>听和弦，判断和弦类型</p>
          </div>

          <div className={styles.controls}>
            <div className={styles.difficulty}>
              {DIFFICULTY_LABELS.map(item => (
                <button
                  key={item.value}
                  className={`${styles.difficultyItem} ${
                    difficulty === item.value ? styles.difficultyActive : ''
                  }`}
                  onClick={() => {
                    setDifficulty(item.value)
                    setTimeout(generateQuestion, 0)
                  }}
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className={styles.timerToggle}>
              <ClockCircleOutlined />
              <Switch checked={timerOn} onChange={setTimerOn} size="small" />
              <span>倒计时</span>
            </div>
            {timerOn && !selectedAnswer && (
              <span className={`${styles.timerPill} ${timeLeft <= 3 ? styles.timerPillDanger : ''}`}>
                {timeLeft}s
              </span>
            )}
          </div>

          <div className={styles.stats}>
            <span className={`${styles.statPill} ${styles.statPillCorrect}`}>✓ {pass}</span>
            <span className={styles.statPill}>共 {all}</span>
            <span className={`${styles.statPill} ${styles.statPillAccent}`}>{accuracy}%</span>
            {combo >= 2 && (
              <span className={`${styles.statPill} ${styles.statPillCombo}`}>
                <FireOutlined /> {combo}连击
              </span>
            )}
          </div>
          <div className={styles.progressWrap}>
            <Progress
              percent={accuracy}
              showInfo={false}
              size="small"
              strokeColor={{ '0%': '#1456f0', '100%': '#3b82f6' }}
              trailColor="var(--border-light)"
            />
          </div>

          <div className={styles.playBar}>
            <button className={styles.btnPrimary} onClick={playQuestion} disabled={isPlaying}>
              <SoundOutlined /> 播放和弦 <span className={styles.kbd}>Space</span>
            </button>
            <button className={styles.btnSecondary} onClick={generateQuestion}>
              <ReloadOutlined /> 下一题 <span className={styles.kbd}>→</span>
            </button>
          </div>

          <div className={`${styles.optionsGrid} ${gridCols}`}>
            {chordOptions.map((ct, idx) => {
              const isSelected = selectedAnswer === ct.name
              const isCorrectAnswer = ct.name === chordType.name
              let cls = styles.option
              if (isSelected && isCorrectAnswer) cls += ` ${styles.optionCorrect}`
              else if (isSelected && !isCorrectAnswer) cls += ` ${styles.optionWrong}`
              else if (selectedAnswer && isCorrectAnswer) cls += ` ${styles.optionCorrect}`

              return (
                <button
                  key={ct.name}
                  className={cls}
                  onClick={() => handleAnswer(ct)}
                  disabled={!!selectedAnswer}
                >
                  <span className={styles.optionIndex}>{idx + 1}</span>
                  <span>{ct.name}</span>
                  {ct.symbol && <span className={styles.optionSub}>({ct.symbol})</span>}
                </button>
              )
            })}
          </div>

          {selectedAnswer && (
            <div
              className={`${styles.feedback} ${
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong
              }`}
            >
              {feedback === 'correct'
                ? '✓ 回答正确！'
                : `✗ 回答错误！正确答案：${chordType.name}`}
            </div>
          )}

          <div className={styles.shortcuts}>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Space</span> 播放
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>1-{chordOptions.length}</span> 选答案
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>→</span> 下一题
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}
