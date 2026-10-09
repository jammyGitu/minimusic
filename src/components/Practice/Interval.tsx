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
import { getAllIntervals, getIntervalName, getNoteByInterval } from '@/utils/interval'
import { addPracticeRecord } from '@/stores/progress'
import styles from './practice.module.scss'

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_INTERVALS: Record<Difficulty, number[]> = {
  easy: [2, 3, 4, 5, 7, 12], // 大二度~纯五度 + 八度
  medium: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 全部12个
  hard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // 含复音程
}

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

export default function IntervalPractice() {
  const [pass, setPass] = useState(0)
  const [all, setAll] = useState(0)
  const [combo, setCombo] = useState(0)
  const [base, setBase] = useState('C4')
  const [interval, setInterval] = useState(4)
  const [answer, setAnswer] = useState('')
  const [selectedAnswer, setSelectedAnswer] = useState('')
  const [isPlaying, setIsPlaying] = useState(false)
  const [difficulty, setDifficulty] = useState<Difficulty>('easy')
  const [timerOn, setTimerOn] = useState(false)
  const [timeLeft, setTimeLeft] = useState(10)
  const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null)

  const timerRef = useRef<NodeJS.Timeout | null>(null)
  const initRef = useRef(false)

  const intervals = getAllIntervals()
  const allowedSemitones = DIFFICULTY_INTERVALS[difficulty]

  const generateQuestion = useCallback(() => {
    const notes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const octaves = [3, 4]
    const baseNote = `${notes[Math.floor(Math.random() * notes.length)]}${
      octaves[Math.floor(Math.random() * octaves.length)]
    }`
    const semitones = allowedSemitones[Math.floor(Math.random() * allowedSemitones.length)]
    const targetNote = getNoteByInterval(baseNote, semitones)

    setBase(baseNote)
    setInterval(semitones)
    setAnswer(targetNote)
    setSelectedAnswer('')
    setFeedback(null)
    setTimeLeft(10)

    if (timerRef.current) clearInterval(timerRef.current)
  }, [allowedSemitones])

  const playQuestion = useCallback(async () => {
    setIsPlaying(true)
    await moaTone.init()
    await moaTone.playSequence([base, answer], 0.5)
    setTimeout(() => setIsPlaying(false), 1200)
  }, [base, answer])

  const playFeedbackSound = useCallback(async (correct: boolean) => {
    await moaTone.init()
    if (correct) {
      await moaTone.playSequence(['C5', 'E5', 'G5'], 0.15)
    } else {
      moaTone.playNote('C3', 0.3)
    }
  }, [])

  const handleAnswer = useCallback(
    (semitones: number) => {
      if (selectedAnswer) return
      if (timerRef.current) clearInterval(timerRef.current)

      const intervalName = getIntervalName(semitones)
      setSelectedAnswer(intervalName)

      const isCorrect = semitones === interval
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
        message.error(`回答错误，正确答案是：${getIntervalName(interval)}`)
      }

      addPracticeRecord('interval', isCorrect ? 1 : 0, 1)
    },
    [selectedAnswer, interval, combo, generateQuestion, playFeedbackSound]
  )

  // 倒计时
  useEffect(() => {
    if (timerOn && !selectedAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !selectedAnswer) {
      setSelectedAnswer('超时')
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`时间到！正确答案是：${getIntervalName(interval)}`)
      addPracticeRecord('interval', 0, 1)
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current)
    }
  }, [timerOn, timeLeft, selectedAnswer, interval, playFeedbackSound])

  // 键盘快捷键
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
      const options = intervals.filter(i => allowedSemitones.includes(i.semitones))
      const num = parseInt(e.key)
      if (num >= 1 && num <= Math.min(9, options.length)) {
        e.preventDefault()
        handleAnswer(options[num - 1].semitones)
      }
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [playQuestion, generateQuestion, handleAnswer, intervals, allowedSemitones])

  // 初始化
  useEffect(() => {
    if (!initRef.current) {
      initRef.current = true
      generateQuestion()
    }
  }, [generateQuestion])

  const accuracy = all > 0 ? Math.round((pass / all) * 100) : 0
  const optionIntervals = intervals.filter(i => allowedSemitones.includes(i.semitones))
  const gridCols = optionIntervals.length > 6 ? styles.optionsGrid3 : styles.optionsGrid2

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
          {/* 标题区 */}
          <div className={styles.head}>
            <h2 className={styles.title}>音程辨认练习</h2>
            <p className={styles.subtitle}>听两个音，判断它们之间的音程关系</p>
          </div>

          {/* 控制区：难度 + 倒计时 */}
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

          {/* 统计区 */}
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

          {/* 播放区 */}
          <div className={styles.playBar}>
            <button className={styles.btnPrimary} onClick={playQuestion} disabled={isPlaying}>
              <SoundOutlined /> 播放题目 <span className={styles.kbd}>Space</span>
            </button>
            <button className={styles.btnSecondary} onClick={generateQuestion}>
              <ReloadOutlined /> 下一题 <span className={styles.kbd}>→</span>
            </button>
          </div>

          {/* 答案区 */}
          <div className={`${styles.optionsGrid} ${gridCols}`}>
            {optionIntervals.map((intv, idx) => {
              const isSelected = selectedAnswer === intv.name
              const isCorrectAnswer = intv.semitones === interval
              let cls = styles.option
              if (isSelected && isCorrectAnswer) cls += ` ${styles.optionCorrect}`
              else if (isSelected && !isCorrectAnswer) cls += ` ${styles.optionWrong}`
              else if (selectedAnswer && isCorrectAnswer) cls += ` ${styles.optionCorrect}`

              return (
                <button
                  key={intv.semitones}
                  className={cls}
                  onClick={() => handleAnswer(intv.semitones)}
                  disabled={!!selectedAnswer}
                >
                  <span className={styles.optionIndex}>{idx + 1}</span>
                  <span>{intv.name}</span>
                  <span className={styles.optionSub}>({intv.shortName})</span>
                </button>
              )
            })}
          </div>

          {/* 反馈区 */}
          {selectedAnswer && (
            <div
              className={`${styles.feedback} ${
                feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong
              }`}
            >
              {feedback === 'correct'
                ? '✓ 回答正确！'
                : `✗ 回答错误！正确答案：${getIntervalName(interval)}`}
            </div>
          )}

          {/* 快捷键提示 */}
          <div className={styles.shortcuts}>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>Space</span> 播放
            </span>
            <span className={styles.shortcutGroup}>
              <span className={styles.kbd}>1-{optionIntervals.length}</span> 选答案
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
