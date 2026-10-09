'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Progress, message, Switch } from 'antd'
import { PlayCircleOutlined, SyncOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import ABCJS from 'abcjs'
import { moaTone } from '@/utils/MoaTone'
import { addPracticeRecord } from '@/stores/progress'
import styles from '../StaffNotation/staff.module.scss'

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

const DIFFICULTY_LABELS: { label: string; value: Difficulty }[] = [
  { label: '初级', value: 'easy' },
  { label: '中级', value: 'medium' },
  { label: '高级', value: 'hard' },
]

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
    <div className={`${styles.page} ${styles.pageNarrow}`}>
      <div
        className={`${styles.card} ${
          feedback === 'correct' ? styles.cardCorrect : feedback === 'wrong' ? styles.cardWrong : ''
        }`}
      >
        {/* 标题 */}
        <div className={styles.head}>
          <h2 className={styles.title}>🎹 五线谱视奏练习</h2>
          <p className={styles.subtitle}>观看五线谱，使用下方虚拟钢琴演奏正确的音符</p>
          <div style={{ marginTop: 8 }}>
            <span className={styles.statPillAccent + ' ' + styles.statPill}>{currentScore.title}</span>
          </div>
        </div>

        {/* 控制区 */}
        <div className={styles.controls}>
          <div className={styles.difficulty}>
            {DIFFICULTY_LABELS.map(item => (
              <button
                key={item.value}
                className={`${styles.difficultyItem} ${difficulty === item.value ? styles.difficultyActive : ''}`}
                onClick={() => {
                  setDifficulty(item.value)
                  setTimeout(generateQuestion, 0)
                }}
                type="button"
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
          {timerOn && !showAnswer && (
            <span className={`${styles.timerPill} ${timeLeft <= 10 ? styles.timerPillDanger : ''}`}>
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
          <span className={`${styles.statPill} ${styles.statPillPurple}`}>
            {userInput.length}/{currentScore.notes.length}
          </span>
        </div>
        <div style={{ marginBottom: 20 }}>
          <Progress
            percent={progressPercent}
            showInfo={false}
            size="small"
            strokeColor={{ '0%': '#1456f0', '100%': '#3b82f6' }}
            trailColor="var(--border-light)"
          />
        </div>

        {/* 五线谱 */}
        <div className={`${styles.sheetBox} ${styles.sheetBoxShort}`} ref={sheetRef} />

        {/* 播放按钮 */}
        <div className={styles.playBar}>
          <button className={styles.btnPrimary} onClick={playScore} disabled={isPlaying} type="button">
            <PlayCircleOutlined /> 播放示范 <span className={styles.kbd}>Space</span>
          </button>
          <button className={styles.btnSecondary} onClick={generateQuestion} type="button">
            <SyncOutlined /> 换题 <span className={styles.kbd}>→</span>
          </button>
        </div>

        {/* 用户输入音符显示 */}
        <div className={styles.noteStrip}>
          {currentScore.notes.map((note, idx) => {
            let cls = styles.noteCell
            if (idx < userInput.length) {
              cls = `${styles.noteCell} ${userInput[idx] === note ? styles.noteCellCorrect : styles.noteCellWrong}`
            } else if (showAnswer) {
              cls = `${styles.noteCell} ${styles.noteCellAnswer}`
            }
            return (
              <div key={idx} className={cls}>
                {idx < userInput.length ? userInput[idx] : (showAnswer ? note : '?')}
              </div>
            )
          })}
        </div>

        {/* 虚拟钢琴键盘 */}
        <div className={styles.pianoScroll}>
          <div className={styles.pianoInner}>
            {/* 白键 */}
            <div className={styles.whiteRow}>
              {PIANO_WHITE_NOTES.map((note) => {
                const isActive = activeKey === note
                const isAnswerHint = showAnswer && currentScore.notes.includes(note)
                const cls = [
                  styles.whiteKey,
                  showAnswer ? styles.whiteKeyDisabled : '',
                  isActive ? styles.whiteKeyActive : '',
                  !isActive && isAnswerHint ? styles.whiteKeyHint : '',
                ].join(' ')
                return (
                  <button
                    key={note}
                    onClick={() => handleNoteInput(note)}
                    disabled={showAnswer}
                    className={cls}
                    type="button"
                  >
                    <span className={`${styles.keyText} ${isActive ? styles.keyTextOnActive : ''}`}>
                      {note.replace(/\d/, '')}
                    </span>
                  </button>
                )
              })}
            </div>
            {/* 黑键 */}
            <div className={styles.blackLayer}>
              {PIANO_WHITE_NOTES.map((whiteNote, whiteIdx) => {
                const whiteBase = whiteNote.replace(/\d/, '')
                const octave = whiteNote.match(/\d/)?.[0] || '4'
                const blackNote = `${whiteBase}#${octave}`
                if (!PIANO_BLACK_NOTES.includes(blackNote)) return null
                // E->F 和 B->C 之间没有黑键
                if (whiteBase === 'E' || whiteBase === 'B') return null

                const leftPos = (whiteIdx + 1) * 48 - 16
                const isActive = activeKey === blackNote
                const isAnswerHint = showAnswer && currentScore.notes.includes(blackNote)
                const cls = [
                  styles.blackKey,
                  isActive ? styles.blackKeyActive : '',
                  !isActive && isAnswerHint ? styles.blackKeyHint : '',
                ].join(' ')

                return (
                  <button
                    key={blackNote}
                    onClick={() => handleNoteInput(blackNote)}
                    disabled={showAnswer}
                    style={{ left: `${leftPos}px` }}
                    className={cls}
                    type="button"
                  >
                    <span className={styles.blackKeyText}>
                      {blackNote.replace(/\d/, '').replace('#', '♯')}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>

        {showAnswer && (
          <div className={`${styles.feedback} ${feedback === 'correct' ? styles.feedbackCorrect : styles.feedbackWrong}`}>
            {feedback === 'correct' ? '✓ 演奏正确！' : '✗ 有错误！绿色=正确，红色=错误，蓝色=正确答案'}
          </div>
        )}

        <div className={styles.shortcuts}>
          <span>快捷键：</span>
          <span className={styles.kbd}>Space</span>
          <span>播放示范</span>
          <span className={styles.kbd}>→</span>
          <span>换题</span>
          <span className={styles.kbd}>点击琴键</span>
          <span>输入音符</span>
        </div>
      </div>
    </div>
  )
}
