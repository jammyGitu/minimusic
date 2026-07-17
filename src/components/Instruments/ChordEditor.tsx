'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Card, Button, Select, Tag, Space, Typography, Divider, Row, Col, Slider } from 'antd'
import { PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'

const { Title, Text } = Typography

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 钢琴键盘范围
const PIANO_START = 48 // C4 = MIDI 60, 但我们从 C3 开始
const PIANO_END = 84   // C7

const midiToNote = (midi: number): string => {
  const octave = Math.floor(midi / 12) - 1
  const noteIndex = midi % 12
  return `${NOTE_NAMES[noteIndex]}${octave}`
}

const noteToMidi = (note: string): number => {
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) return 60
  const noteIndex = NOTE_NAMES.indexOf(match[1])
  return (parseInt(match[2]) + 1) * 12 + noteIndex
}

export default function ChordEditor() {
  const [root, setRoot] = useState('C')
  const [octave, setOctave] = useState(4)
  const [chordType, setChordType] = useState<ChordType>(CHORD_TYPES.maj)
  const [chordNotes, setChordNotes] = useState<string[]>([])
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const [volume, setVolume] = useState(0.5)

  // 更新和弦
  useEffect(() => {
    const notes = buildChord(`${root}${octave}`, chordType)
    setChordNotes(notes)
  }, [root, octave, chordType])

  // 播放和弦
  const playChord = useCallback(async () => {
    moaTone.setVolume(volume)
    await moaTone.playNotes(chordNotes, 1)
  }, [chordNotes, volume])

  // 播放单个音符
  const playSingleNote = useCallback(async (note: string) => {
    moaTone.setVolume(volume)
    setActiveKeys(prev => new Set(prev).add(note))
    await moaTone.playNote(note, 0.5)
    setTimeout(() => {
      setActiveKeys(prev => {
        const next = new Set(prev)
        next.delete(note)
        return next
      })
    }, 500)
  }, [volume])

  // 构建迷你钢琴键盘视图
  const pianoKeys: { note: string; isBlack: boolean; midi: number }[] = []
  for (let midi = PIANO_START; midi <= PIANO_END; midi++) {
    const note = midiToNote(midi)
    const noteName = NOTE_NAMES[midi % 12]
    pianoKeys.push({
      note,
      isBlack: noteName.includes('#'),
      midi,
    })
  }

  const whiteKeys = pianoKeys.filter(k => !k.isBlack)
  const blackKeys = pianoKeys.filter(k => k.isBlack)

  // 判断音符是否属于当前和弦
  const isChordNote = (note: string) => chordNotes.includes(note)

  // 和弦分组选项
  const chordGroups = [
    { label: '三和弦', types: ['maj', 'min', 'aug', 'dim'] },
    { label: '七和弦', types: ['maj7', 'min7', 'dom7', 'dim7', 'halfDim7'] },
    { label: '挂留和弦', types: ['sus2', 'sus4'] },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="text-center mb-6">
        <Title level={2} style={{ marginBottom: 4 }}>🎹 和弦编辑器</Title>
        <Text type="secondary">选择根音与和弦类型，可视化和弦构成并播放</Text>
      </div>

      {/* 选择器区域 */}
      <Card className="mb-4">
        <Row gutter={[16, 16]} align="middle">
          <Col xs={24} sm={6}>
            <Text strong className="block mb-1">根音</Text>
            <Select value={root} onChange={setRoot} style={{ width: '100%' }} size="large">
              {ROOTS.map(r => (
                <Select.Option key={r} value={r}>{r}</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={6}>
            <Text strong className="block mb-1">八度</Text>
            <Select value={octave} onChange={setOctave} style={{ width: '100%' }} size="large">
              {[2, 3, 4, 5].map(o => (
                <Select.Option key={o} value={o}>第 {o} 八度</Select.Option>
              ))}
            </Select>
          </Col>
          <Col xs={24} sm={12}>
            <Text strong className="block mb-1">和弦类型</Text>
            <Select
              value={chordType.name}
              onChange={(value) => {
                const type = Object.values(CHORD_TYPES).find(t => t.name === value)
                if (type) setChordType(type)
              }}
              style={{ width: '100%' }}
              size="large"
            >
              {chordGroups.map(group => (
                <Select.OptGroup key={group.label} label={group.label}>
                  {group.types.map(t => {
                    const ct = CHORD_TYPES[t]
                    return (
                      <Select.Option key={ct.name} value={ct.name}>
                        {ct.name} {ct.symbol ? `(${root}${ct.symbol})` : ''}
                      </Select.Option>
                    )
                  })}
                </Select.OptGroup>
              ))}
            </Select>
          </Col>
        </Row>

        {/* 和弦名称展示 */}
        <div className="text-center mt-4">
          <Tag color="purple" className="text-2xl px-8 py-2 font-bold">
            {root}{chordType.symbol || ''}
          </Tag>
        </div>

        {/* 和弦音符 */}
        <div className="flex justify-center gap-2 mt-4 flex-wrap">
          {chordNotes.map((note, index) => (
            <Button
              key={index}
              size="large"
              type={index === 0 ? 'primary' : 'default'}
              icon={<SoundOutlined />}
              onClick={() => playSingleNote(note)}
              className="min-w-[80px]"
            >
              {note}
            </Button>
          ))}
        </div>

        {/* 播放 + 音量 */}
        <div className="flex justify-center items-center gap-4 mt-4">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={playChord}
          >
            播放和弦
          </Button>
          <div className="flex items-center gap-2">
            <SoundOutlined />
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={setVolume}
              style={{ width: 100 }}
            />
          </div>
        </div>
      </Card>

      {/* 和弦音程信息 */}
      <Card title="和弦构成" size="small" className="mb-4">
        <div className="flex flex-wrap gap-2">
          {chordType.intervals.map((interval, index) => (
            <Tag key={index} color="blue" className="text-sm px-3 py-1">
              {index > 0 && '+ '}{interval} 半音
            </Tag>
          ))}
        </div>
        <Text type="secondary" className="block mt-2">
          音程结构：根音
          {chordType.intervals.slice(1).map((i, idx) => (
            <span key={idx}> → +{i}半音</span>
          ))}
        </Text>
      </Card>

      {/* 迷你钢琴键盘可视化 */}
      <Card title="键盘视图" size="small">
        <div className="relative overflow-x-auto pb-2">
          <div className="inline-block min-w-[600px]">
            {/* 白键 */}
            <div className="flex">
              {whiteKeys.map((key) => (
                <button
                  key={key.note}
                  onClick={() => playSingleNote(key.note)}
                  className={`
                    w-10 h-32 border border-gray-300 rounded-b-md cursor-pointer
                    transition-all duration-150 text-xs
                    flex flex-col justify-end items-center pb-2
                    ${activeKeys.has(key.note) ? 'bg-blue-400 text-white scale-y-[0.98]' :
                      isChordNote(key.note) ? 'bg-purple-100 hover:bg-purple-200' :
                      'bg-white hover:bg-gray-100'}
                  `}
                >
                  {key.note}
                </button>
              ))}
            </div>

            {/* 黑键覆盖层 */}
            <div className="absolute top-0 left-0 flex" style={{ pointerEvents: 'none' }}>
              {whiteKeys.map((whiteKey, wIdx) => {
                const blackKey = blackKeys.find(bk => {
                  const bkNote = NOTE_NAMES[bk.midi % 12]
                  const wkNote = NOTE_NAMES[whiteKey.midi % 12]
                  const sameOctave = Math.floor(bk.midi / 12) === Math.floor(whiteKey.midi / 12)
                  return sameOctave && (
                    (bkNote === 'C#' && wkNote === 'C') ||
                    (bkNote === 'D#' && wkNote === 'D') ||
                    (bkNote === 'F#' && wkNote === 'F') ||
                    (bkNote === 'G#' && wkNote === 'G') ||
                    (bkNote === 'A#' && wkNote === 'A')
                  )
                })

                if (!blackKey) return null

                return (
                  <button
                    key={blackKey.note}
                    onClick={() => playSingleNote(blackKey.note)}
                    style={{
                      position: 'absolute',
                      left: `${wIdx * 40 + 28}px`,
                      top: 0,
                      pointerEvents: 'auto',
                    }}
                    className={`
                      w-6 h-20 rounded-b-md cursor-pointer z-10
                      transition-all duration-150
                      ${activeKeys.has(blackKey.note) ? 'bg-blue-500 scale-y-[0.98]' :
                        isChordNote(blackKey.note) ? 'bg-purple-700' :
                        'bg-gray-800 hover:bg-gray-700'}
                    `}
                    title={blackKey.note}
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className="flex gap-4 mt-4 text-sm">
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-purple-100 border border-purple-300 rounded inline-block" /> 和弦音
          </span>
          <span className="flex items-center gap-1">
            <span className="w-4 h-4 bg-blue-400 rounded inline-block" /> 正在播放
          </span>
        </div>
      </Card>
    </div>
  )
}
