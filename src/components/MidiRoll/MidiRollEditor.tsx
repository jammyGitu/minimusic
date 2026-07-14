'use client'

import React, { useState, useRef, useEffect, useCallback } from 'react'
import { Card, Button, Slider, Space, Select, Tooltip } from 'antd'
import { PlayCircleOutlined, PauseCircleOutlined, DeleteOutlined, UndoOutlined, RedoOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'

interface Note {
  id: string
  pitch: number // MIDI音符编号 (0-127)
  start: number // 起始时间（步数）
  duration: number // 持续时间（步数）
  velocity: number // 力度 0-127
}

const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 将MIDI音符转换为显示名称
const midiToNoteName = (midi: number): string => {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

// 将音符名称转换为MIDI编号
const noteNameToMidi = (name: string): number => {
  const match = name.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 60
  const [, note, octave] = match
  const noteIndex = NOTE_NAMES.indexOf(note)
  if (noteIndex === -1) return 60
  return (parseInt(octave) + 1) * 12 + noteIndex
}

/**
 * MIDI钢琴卷帘编辑器组件
 * 参考 twomoons 的 MoaRoll 实现
 */
export default function MidiRollEditor() {
  // 状态
  const [notes, setNotes] = useState<Note[]>([])
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentStep, setCurrentStep] = useState(-1)
  const [tempo, setTempo] = useState(120)
  const [timeLength, setTimeLength] = useState(16) // 总步数
  const [octaveStart, setOctaveStart] = useState(3) // 起始八度
  const [octaveCount, setOctaveCount] = useState(4) // 显示八度数
  const [activeKeys, setActiveKeys] = useState<Set<number>>(new Set())
  const [isDragging, setIsDragging] = useState(false)
  const [dragStart, setDragStart] = useState<{ pitch: number; step: number } | null>(null)
  const [history, setHistory] = useState<Note[][]>([])
  const [historyIndex, setHistoryIndex] = useState(-1)
  
  const containerRef = useRef<HTMLDivElement>(null)
  const playIntervalRef = useRef<number | null>(null)
  
  // 计算可见音符范围
  const startNote = octaveStart * 12 + 12 // C{octaveStart}
  const endNote = startNote + octaveCount * 12
  const visibleNotes = octaveCount * 12
  
  // 保存到历史记录
  const saveToHistory = useCallback((newNotes: Note[]) => {
    const newHistory = history.slice(0, historyIndex + 1)
    newHistory.push(JSON.parse(JSON.stringify(newNotes)))
    setHistory(newHistory)
    setHistoryIndex(newHistory.length - 1)
  }, [history, historyIndex])
  
  // 撤销
  const undo = useCallback(() => {
    if (historyIndex > 0) {
      setHistoryIndex(historyIndex - 1)
      setNotes(JSON.parse(JSON.stringify(history[historyIndex - 1])))
    }
  }, [history, historyIndex])
  
  // 重做
  const redo = useCallback(() => {
    if (historyIndex < history.length - 1) {
      setHistoryIndex(historyIndex + 1)
      setNotes(JSON.parse(JSON.stringify(history[historyIndex + 1])))
    }
  }, [history, historyIndex])
  
  // 添加或更新音符
  const addNote = useCallback((pitch: number, start: number, duration: number = 1) => {
    // 检查是否已存在相同位置的音符
    const existing = notes.find(n => n.pitch === pitch && n.start === start)
    if (existing) {
      // 更新持续时间
      const newNotes = notes.map(n => 
        n.id === existing.id ? { ...n, duration } : n
      )
      setNotes(newNotes)
      saveToHistory(newNotes)
    } else {
      const newNote: Note = {
        id: `note-${Date.now()}-${Math.random()}`,
        pitch,
        start,
        duration,
        velocity: 100,
      }
      const newNotes = [...notes, newNote]
      setNotes(newNotes)
      saveToHistory(newNotes)
    }
  }, [notes, saveToHistory])
  
  // 删除音符
  const deleteNote = useCallback((id: string) => {
    const newNotes = notes.filter(n => n.id !== id)
    setNotes(newNotes)
    saveToHistory(newNotes)
  }, [notes, saveToHistory])
  
  // 清空所有音符
  const clearAllNotes = useCallback(() => {
    stopPlaying()
    setNotes([])
    saveToHistory([])
  }, [saveToHistory])
  
  // 播放单个音符
  const playNote = useCallback((pitch: number, duration: number = 0.5) => {
    const noteName = midiToNoteName(pitch)
    moaTone.playNote(noteName, duration)
    setActiveKeys(prev => new Set(prev).add(pitch))
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev)
        next.delete(pitch)
        return next
      })
    }, duration * 1000)
  }, [])
  
  // 播放序列
  const playSequence = useCallback(() => {
    if (notes.length === 0) return
    
    setIsPlaying(true)
    const stepDuration = (60 / tempo) * 1000 / 4 // 每步的毫秒数（假设4步=1拍）
    
    // 按时间排序
    const sortedNotes = [...notes].sort((a, b) => a.start - b.start)
    let noteIndex = 0
    let step = 0
    const maxStep = Math.max(...notes.map(n => n.start + n.duration), timeLength)
    
    playIntervalRef.current = window.setInterval(() => {
      setCurrentStep(step)
      
      // 播放当前步的所有音符
      while (noteIndex < sortedNotes.length && sortedNotes[noteIndex].start === step) {
        const note = sortedNotes[noteIndex]
        playNote(note.pitch, (note.duration * stepDuration) / 1000)
        noteIndex++
      }
      
      step++
      
      // 检查是否播放完毕
      if (step >= maxStep) {
        stopPlaying()
      }
    }, stepDuration)
  }, [notes, tempo, timeLength, playNote])
  
  // 停止播放
  const stopPlaying = useCallback(() => {
    if (playIntervalRef.current) {
      clearInterval(playIntervalRef.current)
      playIntervalRef.current = null
    }
    setIsPlaying(false)
    setCurrentStep(-1)
    setActiveKeys(new Set())
  }, [])
  
  // 处理鼠标按下（开始拖拽）
  const handleMouseDown = (pitch: number, step: number, e: React.MouseEvent) => {
    if (isPlaying) return
    e.preventDefault()
    
    // 检查是否点击了已有音符
    const clickedNote = notes.find(n => 
      n.pitch === pitch && n.start <= step && step < n.start + n.duration
    )
    
    if (clickedNote) {
      // 删除音符
      deleteNote(clickedNote.id)
    } else {
      // 开始拖拽创建新音符
      setIsDragging(true)
      setDragStart({ pitch, step })
      playNote(pitch, 0.2)
    }
  }
  
  // 处理鼠标移动
  const handleMouseMove = (pitch: number, step: number) => {
    if (!isDragging || !dragStart) return
    if (pitch !== dragStart.pitch) return
    
    // 实时预览音符长度
    const duration = Math.max(1, step - dragStart.step + 1)
    // 这里可以添加预览效果
  }
  
  // 处理鼠标释放（结束拖拽）
  const handleMouseUp = (pitch: number, step: number) => {
    if (!isDragging || !dragStart) return
    
    const duration = Math.max(1, step - dragStart.step + 1)
    addNote(dragStart.pitch, dragStart.step, duration)
    
    setIsDragging(false)
    setDragStart(null)
  }
  
  // 键盘事件
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        if (e.key === 'z') {
          e.preventDefault()
          if (e.shiftKey) {
            redo()
          } else {
            undo()
          }
        }
      }
    }
    
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [undo, redo])
  
  // 清理
  useEffect(() => {
    return () => {
      if (playIntervalRef.current) {
        clearInterval(playIntervalRef.current)
      }
    }
  }, [])
  
  return (
    <div className="max-w-7xl mx-auto p-4">
      <Card>
        <div className="text-center mb-4">
          <h2 className="text-2xl font-bold">🎹 MIDI 钢琴卷帘编辑器</h2>
          <p className="text-gray-500 mt-1">拖拽创建音符，点击删除音符</p>
        </div>
        
        {/* 控制栏 */}
        <div className="flex flex-wrap justify-between items-center mb-4 p-3 bg-gray-50 rounded-lg gap-2">
          <Space wrap>
            <Button
              type="primary"
              size="large"
              icon={isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
              onClick={isPlaying ? stopPlaying : playSequence}
            >
              {isPlaying ? '停止' : '播放'}
            </Button>
            <Button
              icon={<UndoOutlined />}
              onClick={undo}
              disabled={historyIndex <= 0}
            >
              撤销
            </Button>
            <Button
              icon={<RedoOutlined />}
              onClick={redo}
              disabled={historyIndex >= history.length - 1}
            >
              重做
            </Button>
            <Button
              icon={<DeleteOutlined />}
              onClick={clearAllNotes}
              danger
            >
              清空
            </Button>
          </Space>
          
          <Space wrap>
            <span className="text-sm">速度:</span>
            <Slider
              min={40}
              max={240}
              value={tempo}
              onChange={setTempo}
              style={{ width: 120 }}
            />
            <span className="text-sm">{tempo} BPM</span>
            
            <div className="w-px h-6 bg-gray-300 mx-2" />
            
            <span className="text-sm">长度:</span>
            <Select
              value={timeLength}
              onChange={setTimeLength}
              options={[8, 16, 32, 64].map(v => ({ value: v, label: `${v} 步` }))}
              style={{ width: 80 }}
            />
            
            <span className="text-sm">八度:</span>
            <Select
              value={octaveStart}
              onChange={setOctaveStart}
              options={[1, 2, 3, 4, 5].map(v => ({ value: v, label: `C${v}` }))}
              style={{ width: 60 }}
            />
          </Space>
        </div>
        
        {/* 钢琴卷帘区域 */}
        <div 
          ref={containerRef}
          className="relative border border-gray-300 rounded-lg overflow-hidden select-none"
          style={{ height: visibleNotes * 20 + 30 }}
          onMouseUp={() => {
            setIsDragging(false)
            setDragStart(null)
          }}
          onMouseLeave={() => {
            setIsDragging(false)
            setDragStart(null)
          }}
        >
          {/* 左侧钢琴键盘 */}
          <div className="absolute left-0 top-[30px] bottom-0 w-14 bg-gray-100 border-r border-gray-300 z-10">
            {Array.from({ length: visibleNotes }).map((_, i) => {
              const noteNum = endNote - i - 1
              const noteName = NOTE_NAMES[noteNum % 12]
              const isBlack = noteName.includes('#')
              const isActive = activeKeys.has(noteNum)
              
              return (
                <div
                  key={noteNum}
                  className={`h-5 flex items-center justify-end pr-1 text-xs cursor-pointer transition-colors ${
                    isBlack ? 'bg-gray-800 text-white' : 'bg-white border-b border-gray-200'
                  } ${isActive ? 'bg-blue-500 text-white' : ''}`}
                  onMouseDown={() => playNote(noteNum, 0.5)}
                >
                  {noteName}
                </div>
              )
            })}
          </div>
          
          {/* 时间轴 */}
          <div className="absolute left-14 right-0 top-0 h-[30px] bg-gray-50 border-b border-gray-300 flex z-10">
            {Array.from({ length: timeLength }).map((_, i) => (
              <div
                key={i}
                className={`flex-1 flex items-center justify-center text-xs border-r border-gray-200 ${
                  currentStep === i ? 'bg-blue-200' : ''
                } ${i % 4 === 0 ? 'font-bold' : ''}`}
              >
                {i % 4 === 0 ? Math.floor(i / 4) + 1 : ''}
              </div>
            ))}
          </div>
          
          {/* 网格区域 */}
          <div className="absolute left-14 right-0 top-[30px] bottom-0">
            {Array.from({ length: visibleNotes }).map((_, rowIndex) => {
              const noteNum = endNote - rowIndex - 1
              const noteName = NOTE_NAMES[noteNum % 12]
              const isBlack = noteName.includes('#')
              
              return (
                <div
                  key={noteNum}
                  className={`flex h-5 ${isBlack ? 'bg-gray-100' : 'bg-white'}`}
                >
                  {Array.from({ length: timeLength }).map((_, step) => (
                    <div
                      key={step}
                      className={`flex-1 border-r border-b border-gray-100 cursor-crosshair transition-colors ${
                        currentStep === step ? 'bg-blue-100' : ''
                      } ${step % 4 === 0 ? 'border-l-2 border-l-gray-300' : ''}`}
                      onMouseDown={(e) => handleMouseDown(noteNum, step, e)}
                      onMouseMove={() => handleMouseMove(noteNum, step)}
                      onMouseUp={() => handleMouseUp(noteNum, step)}
                    />
                  ))}
                </div>
              )
            })}
            
            {/* 音符显示层 */}
            <div className="absolute inset-0 pointer-events-none">
              {notes.map(note => {
                const rowIndex = endNote - note.pitch - 1
                if (rowIndex < 0 || rowIndex >= visibleNotes) return null
                
                const stepWidth = 100 / timeLength
                const rowHeight = 20
                
                return (
                  <div
                    key={note.id}
                    className={`absolute rounded-sm transition-all ${
                      activeKeys.has(note.pitch) ? 'bg-blue-600' : 'bg-blue-500'
                    }`}
                    style={{
                      left: `${note.start * stepWidth}%`,
                      top: `${rowIndex * rowHeight}px`,
                      width: `${note.duration * stepWidth}%`,
                      height: `${rowHeight - 2}px`,
                    }}
                  >
                    <div className="h-full flex items-center justify-center text-white text-xs overflow-hidden">
                      {note.duration >= 2 ? midiToNoteName(note.pitch) : ''}
                    </div>
                  </div>
                )
              })}
              
              {/* 拖拽预览 */}
              {isDragging && dragStart && (
                <div
                  className="absolute rounded-sm bg-blue-400 opacity-50"
                  style={{
                    left: `${dragStart.step * (100 / timeLength)}%`,
                    top: `${(endNote - dragStart.pitch - 1) * 20}px`,
                    width: `${1 * (100 / timeLength)}%`,
                    height: '18px',
                  }}
                />
              )}
            </div>
            
            {/* 播放指示线 */}
            {currentStep >= 0 && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-500 z-20 pointer-events-none"
                style={{ left: `${(currentStep + 0.5) * (100 / timeLength)}%` }}
              />
            )}
          </div>
        </div>
        
        {/* 统计信息 */}
        <div className="mt-4 p-3 bg-gray-50 rounded-lg flex justify-between items-center">
          <div className="text-sm text-gray-600">
            音符数量: <span className="font-medium">{notes.length}</span>
          </div>
          <div className="text-sm text-gray-600">
            总时长: <span className="font-medium">{Math.ceil(timeLength / 4)} 拍</span>
          </div>
          <div className="text-sm text-gray-600">
            八度范围: <span className="font-medium">C{octaveStart} - B{octaveStart + octaveCount - 1}</span>
          </div>
        </div>
        
        {/* 操作提示 */}
        <div className="mt-4 p-3 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">💡 使用提示</h4>
          <div className="grid grid-cols-2 gap-2 text-sm text-gray-600">
            <div>• 拖拽网格创建音符</div>
            <div>• 点击音符删除</div>
            <div>• 点击左侧键盘试听</div>
            <div>• Ctrl+Z 撤销 / Ctrl+Shift+Z 重做</div>
          </div>
        </div>
      </Card>
    </div>
  )
}
