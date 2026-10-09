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
import { CHORD_TYPES, buildChord } from '@/utils/chord'
import { addPracticeRecord } from '@/stores/progress'
import styles from './practice.module.scss'

type Difficulty = 'easy' | 'medium' | 'hard'

interface ProgressionDef {
  name: string
  degrees: string[]
  chordTypes: string[]
}

const NOTE_NAMES_LIST = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const DEGREE_OFFSETS: Record<string, number> = {
  I: 0,
  ii: 2,
  iii: 4,
  IV: 5,
  V: 7,
  vi: 9,
  'vii°': 11,
  viio: 11,
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
  {
    name: 'I-IV-viio-iii-vi-ii-V-I',
    degrees: ['I', 'IV', 'vii°', 'iii', 'vi', 'ii', 'V', 'I'],
    chordTypes: ['maj', 'maj', 'dim', 'min', 'min', 'min', 'maj', 'maj'],
  },
  {
    name: 'I-V-vi-iii-IV-I-IV-V',
    degrees: ['I', 'V', 'vi', 'iii', 'IV', 'I', 'IV', 'V'],
    chordTypes: ['maj', 'maj', 'min', 'min', 'maj', 'maj', 'maj', 'maj'],
  },
]

const DIFFICULTY_MAP: Record<Difficulty, ProgressionDef[]> = {
  easy: PROGRESSIONS_EASY,
  medium: PROGRESSIONS_MEDIUM,
  hard: PROGRESSIONS_HARD,
}

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

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

  const handleAnswer = useCallback(
    (name: string) => {
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
    },
    [selectedAnswer, progression, combo, generateQuestion, playFeedbackSound]
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
      message.error(`时间到！正确答案是：${progression?.name}`)
      addPracticeRecord('chord-progression', 0, 1)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerOn, timeLeft, selectedAnswer, progression, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        playProgression()
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        generateQuestion()
      }
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
            <h2 className={styles.title}>和弦进行练习</h2>
            <p className={styles.subtitle}>听和弦进行，选择正确的和声进行模式</p>
            <div className={styles.keyTag}>当前调性：{root} 大调</div>
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
              <span className={`${styles.timerPill} ${timeLeft <= 5 ? styles.timerPillDanger : ''}`}>
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
            <button className={styles.btnPrimary} onClick={playProgression} disabled={isPlaying}>
              <SoundOutlined /> 播放和弦进行 <span className={styles.kbd}>Space</span>
            </button>
            <button className={styles.btnSecondary} onClick={generateQuestion}>
              <ReloadOutlined /> 下一题 <span className={styles.kbd}>→</span>
            </button>
          </div>

          {/* 度数预览 */}
          {progression && (
            <div className={styles.degreeRow}>
              {progression.degrees.map((deg, idx) => (
                <span key={idx} className={styles.degreePill}>
                  {deg}
                  <span className={styles.degreePillSub}>({progression.chordTypes[idx]})</span>
                </span>
              ))}
            </div>
          )}

          <div className={styles.optionsStack}>
            {progList.map((prog, idx) => {
              const isSelected = selectedAnswer === prog.name
              const isCorrectAns = prog.name === progression?.name
              let cls = styles.option
              if (isSelected && isCorrectAns) cls += ` ${styles.optionCorrect}`
              else if (isSelected && !isCorrectAns) cls += ` ${styles.optionWrong}`
              else if (selectedAnswer && isCorrectAns) cls += ` ${styles.optionCorrect}`

              return (
                <button
                  key={prog.name}
                  className={cls}
                  onClick={() => handleAnswer(prog.name)}
                  disabled={!!selectedAnswer}
                >
                  <span className={styles.optionIndex}>{idx + 1}.</span>
                  <span style={{ fontWeight: 500 }}>{prog.name}</span>
                  <span className={styles.optionSub}>({prog.degrees.join('-')})</span>
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
                : `✗ 回答错误！正确答案：${progression?.name}`}
            </div>
          )}

          <div className={styles.shortcuts}>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Space</span> 播放
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>1-{progList.length}</span> 选答案
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
