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
import { NOTE_NAMES } from '@/utils/note'
import { addPracticeRecord } from '@/stores/progress'
import styles from './practice.module.scss'

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

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

const NOTE_TO_SOLFEGE: Record<string, string> = {
  C: '1',
  'C#': '#1',
  D: '2',
  'D#': '#2',
  E: '3',
  F: '4',
  'F#': '#4',
  G: '5',
  'G#': '#5',
  A: '6',
  'A#': '#6',
  B: '7',
}

function noteToSolfege(note: string): string {
  const match = note.match(/^([A-G]#?)/)
  return match ? NOTE_TO_SOLFEGE[match[1]] || note : note
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
    for (let i = allOpts.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1))
      ;[allOpts[i], allOpts[j]] = [allOpts[j], allOpts[i]]
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

  const handleAnswer = useCallback(
    (index: number) => {
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
    },
    [selectedAnswer, correctIndex, combo, generateQuestion, playFeedbackSound]
  )

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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerOn, timeLeft, selectedAnswer, correctIndex, playFeedbackSound])

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        playMelody()
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        generateQuestion()
      }
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
            <h2 className={styles.title}>旋律辨认练习</h2>
            <p className={styles.subtitle}>听一段旋律，选择正确的音符序列</p>
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
            {timerOn && selectedAnswer === null && (
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
            <button className={styles.btnPrimary} onClick={playMelody} disabled={isPlaying}>
              <SoundOutlined /> 播放旋律 <span className={styles.kbd}>Space</span>
            </button>
            <button className={styles.btnSecondary} onClick={generateQuestion}>
              <ReloadOutlined /> 下一题 <span className={styles.kbd}>→</span>
            </button>
          </div>

          <div className={styles.optionsStack}>
            {answerOptions.map((option, index) => {
              const isSelected = selectedAnswer === index
              const isCorrectOpt = index === correctIndex
              let cls = styles.option
              if (isSelected && isCorrectOpt) cls += ` ${styles.optionCorrect}`
              else if (isSelected && !isCorrectOpt) cls += ` ${styles.optionWrong}`
              else if (selectedAnswer !== null && isCorrectOpt) cls += ` ${styles.optionCorrect}`

              return (
                <button
                  key={index}
                  className={cls}
                  onClick={() => handleAnswer(index)}
                  disabled={selectedAnswer !== null}
                >
                  <span className={styles.optionIndex}>{index + 1}.</span>
                  <span style={{ display: 'inline-flex', alignItems: 'center', flexWrap: 'wrap' }}>
                    {option.map((note, i) => (
                      <React.Fragment key={i}>
                        <span className={styles.notePill}>{note}</span>
                        <span className={styles.noteSolfege}>({noteToSolfege(note)})</span>
                        {i < option.length - 1 && <span className={styles.noteArrow}>→</span>}
                      </React.Fragment>
                    ))}
                  </span>
                </button>
              )
            })}
          </div>

          {selectedAnswer !== null && (
            <div
              className={`${styles.feedback} ${
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong
              }`}
            >
              {feedback === 'correct'
                ? '✓ 回答正确！'
                : `✗ 回答错误！正确答案是第 ${correctIndex + 1} 个`}
            </div>
          )}

          <div className={styles.shortcuts}>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Space</span> 播放
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>1-{answerOptions.length}</span> 选答案
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
