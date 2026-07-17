'use client'

import React, { useState, useEffect, useCallback, useRef } from 'react'
import { Card, Button, Progress, message, Space, Typography, Segmented, Switch, Tag } from 'antd'
import { ReloadOutlined, SoundOutlined, FireOutlined, ClockCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { getAllIntervals, getIntervalName, getNoteByInterval, IntervalType } from '@/utils/interval'
import { addPracticeRecord } from '@/stores/progress'

const { Title, Text } = Typography

type Difficulty = 'easy' | 'medium' | 'hard'

const DIFFICULTY_INTERVALS: Record<Difficulty, number[]> = {
  easy: [2, 3, 4, 5, 7, 12],        // 大二度~纯五度 + 八度
  medium: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], // 全部12个
  hard: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16], // 含复音程
}

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
    const baseNote = `${notes[Math.floor(Math.random() * notes.length)]}${octaves[Math.floor(Math.random() * octaves.length)]}`
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

  const handleAnswer = useCallback((semitones: number) => {
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
  }, [selectedAnswer, interval, combo, generateQuestion, playFeedbackSound])

  // 倒计时
  useEffect(() => {
    if (timerOn && !selectedAnswer && timeLeft > 0) {
      timerRef.current = setTimeout(() => setTimeLeft(t => t - 1), 1000)
    } else if (timeLeft === 0 && !selectedAnswer) {
      handleAnswer(-1) // 超时强制判错，但需要特殊处理
      // 超时：记录为错误
      setSelectedAnswer('超时')
      setFeedback('wrong')
      setCombo(0)
      setAll(a => a + 1)
      playFeedbackSound(false)
      message.error(`时间到！正确答案是：${getIntervalName(interval)}`)
      addPracticeRecord('interval', 0, 1)
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current) }
  }, [timerOn, timeLeft, selectedAnswer, interval, handleAnswer, playFeedbackSound])

  // 键盘快捷键
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if (e.code === 'Space') { e.preventDefault(); playQuestion() }
      if (e.code === 'ArrowRight') { e.preventDefault(); generateQuestion() }
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

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <Card className={feedback === 'correct' ? 'ring-2 ring-green-400' : feedback === 'wrong' ? 'ring-2 ring-red-400' : ''}
        style={{ transition: 'box-shadow 0.3s' }}>
        {/* 标题区 */}
        <div className="text-center mb-4">
          <Title level={2} className="!mb-1">音程辨认练习</Title>
          <Text type="secondary">听两个音，判断它们之间的音程关系</Text>
        </div>

        {/* 控制区：难度 + 倒计时 */}
        <div className="flex flex-wrap justify-center items-center gap-3 mb-4">
          <Segmented
            value={difficulty}
            onChange={(v) => { setDifficulty(v as Difficulty); setTimeout(generateQuestion, 0) }}
            options={[
              { label: '初级', value: 'easy' },
              { label: '中级', value: 'medium' },
              { label: '高级', value: 'hard' },
            ]}
          />
          <Space>
            <ClockCircleOutlined />
            <Switch checked={timerOn} onChange={setTimerOn} size="small" />
            <Text type="secondary" className="text-xs">倒计时</Text>
          </Space>
          {timerOn && !selectedAnswer && (
            <Tag color={timeLeft <= 3 ? 'red' : 'blue'}>{timeLeft}s</Tag>
          )}
        </div>

        {/* 统计区 */}
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

        {/* 播放区 */}
        <div className="text-center mb-5">
          <Button type="primary" size="large" icon={<SoundOutlined />}
            onClick={playQuestion} loading={isPlaying}>
            播放题目 <Tag className="ml-2" color="default">Space</Tag>
          </Button>
          <Button size="large" icon={<ReloadOutlined />} onClick={generateQuestion} className="ml-3">
            下一题 <Tag className="ml-1" color="default">→</Tag>
          </Button>
        </div>

        {/* 答案区 */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2 md:gap-3">
          {optionIntervals.map((intv, idx) => {
            const isSelected = selectedAnswer === intv.name
            const isCorrectAnswer = intv.semitones === interval
            let btnType: 'default' | 'primary' | 'dashed' = 'default'
            let btnDanger = false
            if (isSelected && isCorrectAnswer) btnType = 'primary'
            else if (isSelected && !isCorrectAnswer) btnDanger = true
            else if (selectedAnswer && isCorrectAnswer) btnType = 'primary'

            return (
              <Button key={intv.semitones} size="large"
                onClick={() => handleAnswer(intv.semitones)}
                disabled={!!selectedAnswer}
                type={btnType} danger={btnDanger}
                className="text-sm">
                <span className="font-medium mr-1 text-gray-400">{idx + 1}</span>
                {intv.name} <Text type="secondary" className="text-xs ml-1">({intv.shortName})</Text>
              </Button>
            )
          })}
        </div>

        {/* 反馈区 */}
        {selectedAnswer && (
          <div className={`mt-5 text-center p-3 rounded-lg ${feedback === 'correct' ? 'bg-green-50' : 'bg-red-50'}`}>
            <Text type={feedback === 'correct' ? 'success' : 'danger'} strong>
              {feedback === 'correct' ? '✓ 回答正确！' : `✗ 回答错误！正确答案：${getIntervalName(interval)}`}
            </Text>
          </div>
        )}

        {/* 快捷键提示 */}
        <div className="mt-5 text-center">
          <Text type="secondary" className="text-xs">
            快捷键：<Tag color="default" className="text-xs">Space</Tag> 播放
            <Tag color="default" className="text-xs ml-1">1-{optionIntervals.length}</Tag> 选答案
            <Tag color="default" className="text-xs ml-1">→</Tag> 下一题
          </Text>
        </div>
      </Card>
    </div>
  )
}
