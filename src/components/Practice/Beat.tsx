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
import { addPracticeRecord } from '@/stores/progress'
import styles from './practice.module.scss'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_CONFIG: Record<Difficulty, { beats: number; usePreset: boolean }> = {
  easy: { beats: 4, usePreset: true },
  medium: { beats: 6, usePreset: false },
  hard: { beats: 8, usePreset: false },
}

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

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
      pattern = Array(config.beats)
        .fill(false)
        .map(() => Math.random() > 0.35)
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

  const toggleBeat = useCallback(
    (index: number) => {
      if (isPlaying || submitted) return
      setUserPattern(prev => {
        const next = [...prev]
        next[index] = !next[index]
        return next
      })
    },
    [isPlaying, submitted]
  )

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
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerOn, timeLeft, submitted, playFeedbackSound])

  // Keyboard
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') {
        e.preventDefault()
        playRhythm(currentPattern)
      }
      if (e.code === 'ArrowRight') {
        e.preventDefault()
        generateQuestion()
      }
      if (e.code === 'Enter') {
        e.preventDefault()
        submitAnswer()
      }
      if (e.code === 'KeyR') {
        e.preventDefault()
        resetAnswer()
      }
      if (e.code === 'KeyU') {
        e.preventDefault()
        playRhythm(userPattern, 'G4')
      }
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
            <h2 className={styles.title}>节奏练习</h2>
            <p className={styles.subtitle}>听节奏，点击格子标记节拍位置</p>
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
            {timerOn && !submitted && (
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
            <button
              className={styles.btnPrimary}
              onClick={() => playRhythm(currentPattern)}
              disabled={isPlaying}
            >
              <SoundOutlined /> 播放题目 <span className={styles.kbd}>Space</span>
            </button>
            <button
              className={styles.btnSecondary}
              onClick={() => playRhythm(userPattern, 'G4')}
              disabled={isPlaying}
            >
              <SoundOutlined /> 播放答案 <span className={styles.kbd}>U</span>
            </button>
            <button className={styles.btnSecondary} onClick={generateQuestion}>
              <ReloadOutlined /> 下一题 <span className={styles.kbd}>→</span>
            </button>
          </div>

          {/* 正确答案显示行（提交后） */}
          {submitted && (
            <div className={styles.beatPreview}>
              <span className={styles.beatPreviewLabel}>题目：</span>
              {currentPattern.map((beat, i) => (
                <div
                  key={i}
                  className={`${styles.beatPreviewCell} ${
                    beat ? styles.beatPreviewCellOn : ''
                  }`}
                >
                  {i + 1}
                </div>
              ))}
            </div>
          )}

          {/* 用户节奏网格 */}
          <div className={styles.beatGrid}>
            {currentPattern.map((_, index) => (
              <button
                key={index}
                className={`${styles.beatCell} ${
                  userPattern[index] ? styles.beatCellActive : ''
                }`}
                onClick={() => toggleBeat(index)}
                disabled={isPlaying || submitted}
              >
                {index + 1}
              </button>
            ))}
          </div>

          {/* 操作按钮 */}
          <div className={styles.playBar}>
            <button
              className={styles.btnSecondary}
              onClick={resetAnswer}
              disabled={isPlaying || submitted}
            >
              重置 <span className={styles.kbd}>R</span>
            </button>
            <button className={styles.btnPrimary} onClick={submitAnswer} disabled={submitted}>
              提交 <span className={styles.kbd}>Enter</span>
            </button>
          </div>

          {submitted && (
            <div
              className={`${styles.feedback} ${
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong
              }`}
            >
              {feedback === 'correct' ? '✓ 回答正确！' : '✗ 回答错误！上方蓝色为正确答案'}
            </div>
          )}

          <div className={styles.shortcuts}>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Space</span> 播放题目
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>U</span> 播放答案
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>R</span> 重置
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Enter</span> 提交
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
