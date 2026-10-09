'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Slider, Select } from 'antd'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  DeleteOutlined,
  UndoOutlined,
  RedoOutlined,
} from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import styles from './midiroll.module.scss'

interface MidiNote {
  id: string
  pitch: number
  start: number
  duration: number
  velocity: number
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

const midiToNoteName = (midi: number): string => {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

const COLORS = ['#1456f0', '#22c55e', '#f59e0b', '#ea5ec1', '#8b5cf6', '#06b6d4', '#eab308', '#ef4444']

// 预设旋律
const PRESETS: { name: string; notes: { pitch: number; start: number; duration: number }[] }[] = [
  {
    name: 'C大调音阶',
    notes: [60, 62, 64, 65, 67, 69, 71, 72].map((p, i) => ({ pitch: p, start: i, duration: 1 })),
  },
  {
    name: '小星星',
    notes: [
      { pitch: 60, start: 0, duration: 1 }, { pitch: 60, start: 1, duration: 1 },
      { pitch: 67, start: 2, duration: 1 }, { pitch: 67, start: 3, duration: 1 },
      { pitch: 69, start: 4, duration: 1 }, { pitch: 69, start: 5, duration: 1 },
      { pitch: 67, start: 6, duration: 2 },
      { pitch: 65, start: 8, duration: 1 }, { pitch: 65, start: 9, duration: 1 },
      { pitch: 64, start: 10, duration: 1 }, { pitch: 64, start: 11, duration: 1 },
      { pitch: 62, start: 12, duration: 1 }, { pitch: 62, start: 13, duration: 1 },
      { pitch: 60, start: 14, duration: 2 },
    ],
  },
  {
    name: '欢乐颂片段',
    notes: [
      { pitch: 64, start: 0, duration: 1 }, { pitch: 64, start: 1, duration: 1 },
      { pitch: 65, start: 2, duration: 1 }, { pitch: 67, start: 3, duration: 1 },
      { pitch: 67, start: 4, duration: 1 }, { pitch: 65, start: 5, duration: 1 },
      { pitch: 64, start: 6, duration: 1 }, { pitch: 62, start: 7, duration: 1 },
      { pitch: 60, start: 8, duration: 1 }, { pitch: 60, start: 9, duration: 1 },
      { pitch: 62, start: 10, duration: 1 }, { pitch: 64, start: 11, duration: 1 },
      { pitch: 64, start: 12, duration: 1.5 }, { pitch: 62, start: 13.5, duration: 0.5 },
      { pitch: 62, start: 14, duration: 2 },
    ],
  },
]

export default function MidiRollEditor() {
  const [notes, setNotes] = useState<MidiNote[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [tempo, setTempo] = useState(120)
  const [steps, setSteps] = useState(16)
  const [octaveStart, setOctaveStart] = useState(3)
  const [octaveCount] = useState(3)
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ pitch: number; step: number } | null>(null)
  const [dragCurrent, setDragCurrent] = useState<{ pitch: number; step: number } | null>(null)
  const [history, setHistory] = useState<MidiNote[][]>([[]])
  const [historyIndex, setHistoryIndex] = useState(0)
  const [selectedTool, setSelectedTool] = useState<'draw' | 'erase'>('draw')

  const containerRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<number | null>(null)

  const startNote = octaveStart * 12 + 12
  const endNote = startNote + octaveCount * 12
  const visibleNotes = octaveCount * 12

  // 保存到历史
  const saveHistory = useCallback((newNotes: MidiNote[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newNotes)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])

  const undo = () => {
    if (historyIndex > 0) {
      const idx = historyIndex - 1
      setHistoryIndex(idx)
      setNotes(JSON.parse(JSON.stringify(history[idx])))
    }
  }

  const redo = () => {
    if (historyIndex < history.length - 1) {
      const idx = historyIndex + 1
      setHistoryIndex(idx)
      setNotes(JSON.parse(JSON.stringify(history[idx])))
    }
  }

  const addNote = useCallback((pitch: number, start: number, duration: number = 1) => {
    let newNotes: MidiNote[]
    const existing = notes.find(n => n.pitch === pitch && n.start === start)
    if (existing) {
      newNotes = notes.filter(n => n.id !== existing.id)
      if (selectedTool === 'erase') {
        setNotes(newNotes)
        saveHistory(newNotes)
        return
      }
    } else {
      newNotes = [...notes]
    }

    if (selectedTool === 'draw') {
      newNotes = newNotes.filter(n => !(n.pitch === pitch && n.start === start))
      newNotes.push({
        id: `n-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        pitch, start, duration, velocity: 100,
      })
    }

    setNotes(newNotes)
    saveHistory(newNotes)
  }, [notes, selectedTool, saveHistory])

  const clearAll = () => {
    stopPlaying()
    setNotes([])
    saveHistory([])
  }

  const playNote = useCallback((pitch: number, duration: number = 0.4) => {
    moaTone.playNote(midiToNoteName(pitch), duration)
    setActiveKeys(prev => new Set(prev).add(pitch))
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev)
        next.delete(pitch)
        return next
      })
    }, duration * 1000)
  }, [])

  const startPlaying = () => {
    if (notes.length === 0) return
    setIsPlaying(true)
    const stepDuration = (60 / tempo) * 1000 / 2 // 每步 = 八分音符

    const sortedNotes = [...notes].sort((a, b) => a.start - b.start)
    let noteIdx = 0
    let step = 0
    const maxStep = Math.max(...notes.map(n => n.start + n.duration), steps)

    setCurrentStep(0)

    playIntervalRef.current = window.setInterval(() => {
      setCurrentStep(step)

      while (noteIdx < sortedNotes.length && sortedNotes[noteIdx].start === step) {
        const n = sortedNotes[noteIdx]
        playNote(n.pitch, (n.duration * stepDuration) / 1000)
        noteIdx++
      }

      step++
      if (step >= maxStep) {
        stopPlaying()
      }
    }, stepDuration)
  }

  const stopPlaying = () => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentStep(-1)
    setActiveKeys(new Set())
  }

  const loadPreset = (preset: typeof PRESETS[0]) => {
    stopPlaying()
    const newNotes: MidiNote[] = preset.notes.map((n, i) => ({
      id: `preset-${i}`,
      ...n,
      velocity: 100,
    }))
    setNotes(newNotes)
    saveHistory(newNotes)
    setSteps(Math.max(16, Math.max(...newNotes.map(n => n.start + n.duration)) + 2))
  }

  const handleCellMouseDown = (pitch: number, step: number, e: React.MouseEvent) => {
    if (isPlaying) return
    e.preventDefault()

    if (selectedTool === 'erase') {
      const existing = notes.find(n => n.pitch === pitch && n.start === step)
      if (existing) {
        const newNotes = notes.filter(n => n.id !== existing.id)
        setNotes(newNotes)
        saveHistory(newNotes)
      }
      return
    }

    setIsDragging(true)
    setDragStart({ pitch, step })
    setDragCurrent({ pitch, step })
    playNote(pitch, 0.2)
  }

  const handleCellMouseEnter = (pitch: number, step: number) => {
    if (!isDragging || !dragStart) return
    if (pitch !== dragStart.pitch) return
    setDragCurrent({ pitch, step })
  }

  const handleCellMouseUp = (pitch: number, step: number) => {
    if (!isDragging || !dragStart) return
    const start = Math.min(dragStart.step, step)
    const end = Math.max(dragStart.step, step)
    addNote(dragStart.pitch, start, end - start + 1)
    setIsDragging(false)
    setDragStart(null)
    setDragCurrent(null)
  }

  // 全局 mouseup
  useEffect(() => {
    const handler = () => {
      if (isDragging && dragStart) {
        addNote(dragStart.pitch, dragStart.step, 1)
      }
      setIsDragging(false)
      setDragStart(null)
      setDragCurrent(null)
    }
    window.addEventListener('mouseup', handler)
    return () => window.removeEventListener('mouseup', handler)
  }, [isDragging, dragStart, addNote])

  // 键盘快捷键
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return
      if ((e.ctrlKey || e.metaKey) && e.key === 'z') {
        e.preventDefault()
        e.shiftKey ? redo() : undo()
      }
      if (e.key === ' ' && !e.repeat) {
        e.preventDefault()
        isPlaying ? stopPlaying() : startPlaying()
      }
    }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [isPlaying, notes, tempo, steps])

  // 清理
  useEffect(() => {
    return () => { if (playIntervalRef.current) clearInterval(playIntervalRef.current) }
  }, [])

  const ROW_H = 22
  const HEADER_H = 28
  const KEYBOARD_W = 50

  const dragPreview = isDragging && dragStart && dragCurrent
    ? {
        pitch: dragStart.pitch,
        start: Math.min(dragStart.step, dragCurrent.step),
        duration: Math.abs(dragCurrent.step - dragStart.step) + 1,
      }
    : null

  return (
    <div className={styles.page}>
      <div className={styles.head}>
        <h2 className={styles.title}>🎹 MIDI 钢琴卷帘</h2>
        <p className={styles.subtitle}>拖拽绘制音符，空格键播放，点击钢琴键试听</p>
      </div>

      {/* 控制栏 */}
      <div className={styles.card}>
        <div className={styles.controls}>
          <button
            className={styles.btnPrimary}
            onClick={isPlaying ? stopPlaying : startPlaying}
            type="button"
          >
            {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
            {isPlaying ? '停止' : '播放'}
          </button>
          <button className={styles.btnGhost} onClick={undo} disabled={historyIndex <= 0} type="button">
            <UndoOutlined /> 撤销
          </button>
          <button className={styles.btnGhost} onClick={redo} disabled={historyIndex >= history.length - 1} type="button">
            <RedoOutlined /> 重做
          </button>
          <button className={styles.btnDanger} onClick={clearAll} type="button">
            <DeleteOutlined /> 清空
          </button>

          <div className={styles.toolGroup}>
            <button
              className={`${styles.toolItem} ${selectedTool === 'draw' ? styles.toolItemActive : ''}`}
              onClick={() => setSelectedTool('draw')}
              type="button"
            >
              ✏️ 绘制
            </button>
            <button
              className={`${styles.toolItem} ${selectedTool === 'erase' ? styles.toolItemActive : ''}`}
              onClick={() => setSelectedTool('erase')}
              type="button"
            >
              🧹 擦除
            </button>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>速度</span>
            <Slider min={40} max={240} value={tempo} onChange={setTempo} style={{ width: 100 }} />
            <span className={styles.label}>{tempo} BPM</span>
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>长度</span>
            <Select
              size="small"
              value={steps}
              onChange={setSteps}
              options={[8, 16, 32, 48, 64].map(v => ({ value: v, label: `${v} 步` }))}
              style={{ width: 84 }}
            />
          </div>

          <div className={styles.controlGroup}>
            <span className={styles.label}>起始八度</span>
            <Select
              size="small"
              value={octaveStart}
              onChange={setOctaveStart}
              options={[1, 2, 3, 4, 5].map(v => ({ value: v, label: `C${v}` }))}
              style={{ width: 68 }}
            />
          </div>
        </div>

        {/* 预设 */}
        <div className={styles.presetRow}>
          <span className={styles.label}>预设</span>
          {PRESETS.map((p, i) => (
            <button key={i} className={styles.presetBtn} onClick={() => loadPreset(p)} type="button">
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* 卷帘区域 */}
      <div className={`${styles.card} ${styles.cardFlush}`}>
        <div className={styles.rollScroll}>
          <div className={styles.rollInner} style={{ height: visibleNotes * ROW_H + HEADER_H + 4 }}>
            {/* 时间轴 */}
            <div className={styles.timeline} style={{ height: HEADER_H, marginLeft: KEYBOARD_W }}>
              {Array.from({ length: steps }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.timelineCell} ${i % 4 === 0 ? styles.timelineCellBeat : ''} ${currentStep === i ? styles.timelineCellActive : ''}`}
                >
                  {i % 4 === 0 ? i / 4 + 1 : ''}
                </div>
              ))}
            </div>

            {/* 网格 + 键盘 */}
            <div className={styles.rollBody}>
              {/* 钢琴键盘 */}
              <div className={styles.keyColumn} style={{ width: KEYBOARD_W }}>
                {Array.from({ length: visibleNotes }).map((_, i) => {
                  const noteNum = endNote - i - 1
                  const isBlack = NOTE_NAMES[noteNum % 12].includes('#')
                  const isActive = activeKeys.has(noteNum)
                  const cls = [
                    styles.keyRow,
                    isBlack ? styles.keyRowBlack : '',
                    isActive ? styles.keyRowActive : '',
                  ].join(' ')
                  return (
                    <button
                      key={noteNum}
                      onMouseDown={(e) => { e.preventDefault(); playNote(noteNum, 0.5) }}
                      className={cls}
                      style={{ height: ROW_H }}
                      type="button"
                    >
                      {NOTE_NAMES[noteNum % 12]}
                    </button>
                  )
                })}
              </div>

              {/* 网格区域 */}
              <div
                className={styles.gridArea}
                ref={containerRef}
                onMouseLeave={() => { setIsDragging(false); setDragStart(null); setDragCurrent(null) }}
              >
                {/* 背景网格 */}
                {Array.from({ length: visibleNotes }).map((_, rowIdx) => {
                  const noteNum = endNote - rowIdx - 1
                  const isBlack = NOTE_NAMES[noteNum % 12].includes('#')
                  return (
                    <div key={noteNum} className={styles.gridRow} style={{ height: ROW_H }}>
                      {Array.from({ length: steps }).map((_, step) => (
                        <div
                          key={step}
                          className={`${styles.gridCell} ${isBlack ? styles.gridCellBlack : ''} ${step % 4 === 0 ? styles.gridCellBeat : ''} ${currentStep === step ? styles.gridCellActive : ''}`}
                          onMouseDown={(e) => handleCellMouseDown(noteNum, step, e)}
                          onMouseEnter={() => handleCellMouseEnter(noteNum, step)}
                          onMouseUp={() => handleCellMouseUp(noteNum, step)}
                        />
                      ))}
                    </div>
                  )
                })}

                {/* 音符层 */}
                {notes.map(note => {
                  const rowIdx = endNote - note.pitch - 1
                  if (rowIdx < 0 || rowIdx >= visibleNotes) return null
                  const color = COLORS[(note.pitch - startNote + COLORS.length) % COLORS.length]

                  return (
                    <div
                      key={note.id}
                      className={`${styles.noteBlock} ${activeKeys.has(note.pitch) ? styles.noteBlockActive : ''}`}
                      style={{
                        left: `${(note.start / steps) * 100}%`,
                        top: rowIdx * ROW_H + 1,
                        width: `${(note.duration / steps) * 100}%`,
                        height: ROW_H - 2,
                        backgroundColor: color,
                        minWidth: 4,
                      }}
                      onClick={(e) => {
                        e.stopPropagation()
                        if (selectedTool === 'erase') {
                          const newNotes = notes.filter(n => n.id !== note.id)
                          setNotes(newNotes)
                          saveHistory(newNotes)
                        } else {
                          playNote(note.pitch, 0.3)
                        }
                      }}
                    >
                      {note.duration >= steps * 0.04 && (
                        <span className={styles.noteBlockLabel} style={{ lineHeight: `${ROW_H - 2}px` }}>
                          {midiToNoteName(note.pitch)}
                        </span>
                      )}
                    </div>
                  )
                })}

                {/* 拖拽预览 */}
                {dragPreview && (
                  <div
                    className={styles.dragPreview}
                    style={{
                      left: `${(dragPreview.start / steps) * 100}%`,
                      top: (endNote - dragPreview.pitch - 1) * ROW_H + 1,
                      width: `${(dragPreview.duration / steps) * 100}%`,
                      height: ROW_H - 2,
                    }}
                  />
                )}

                {/* 播放线 */}
                {currentStep >= 0 && (
                  <div
                    className={styles.playhead}
                    style={{ left: `${((currentStep + 0.5) / steps) * 100}%` }}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* 底部信息 */}
      <div className={styles.infoBar}>
        <span>音符数: <strong>{notes.length}</strong></span>
        <span>总步数: <strong>{steps}</strong> ({(steps / 4).toFixed(1)} 拍)</span>
        <span>八度: <strong>C{octaveStart} - B{octaveStart + octaveCount - 1}</strong></span>
        <span>BPM: <strong>{tempo}</strong></span>
      </div>

      {/* 快捷键提示 */}
      <div className={styles.shortcutPanel}>
        <span className={styles.shortcutPanelTitle}>💡 快捷键</span>
        <div className={styles.shortcutGrid}>
          <span>空格键 — 播放/停止</span>
          <span>Ctrl+Z — 撤销</span>
          <span>Ctrl+Shift+Z — 重做</span>
          <span>拖拽 — 绘制音符</span>
          <span>点击已有音符 — 试听</span>
          <span>切换擦除工具 — 点击删除</span>
          <span>点击左侧钢琴 — 试听</span>
          <span>选择预设 — 快速加载</span>
        </div>
      </div>
    </div>
  )
}
