'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Card, Button, Select, Tag, Typography, Row, Col, Space, Tooltip } from 'antd'
import { PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'

const { Title, Text } = Typography

const ROOTS = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 标准吉他调弦 (EADGBE)
const STRINGS = [
  { name: 'E', octave: 2, label: '6弦 (低E)' },
  { name: 'A', octave: 2, label: '5弦 (A)' },
  { name: 'D', octave: 3, label: '4弦 (D)' },
  { name: 'G', octave: 3, label: '3弦 (G)' },
  { name: 'B', octave: 3, label: '2弦 (B)' },
  { name: 'E', octave: 4, label: '1弦 (高E)' },
]

const FRETS = 15

// 品位标记位置
const FRET_MARKERS = [3, 5, 7, 9, 12, 15]

// 计算某弦某品的音符
const getNoteAtFret = (openNote: string, openOctave: number, fret: number): { name: string; full: string } => {
  const noteIndex = NOTE_NAMES.indexOf(openNote)
  const newIndex = (noteIndex + fret) % 12
  const newOctave = openOctave + Math.floor((noteIndex + fret) / 12)
  return {
    name: NOTE_NAMES[newIndex],
    full: `${NOTE_NAMES[newIndex]}${newOctave}`,
  }
}

export default function GuitarEditor() {
  const [root, setRoot] = useState('C')
  const [chordType, setChordType] = useState<ChordType>(CHORD_TYPES.maj)
  const [selectedFret, setSelectedFret] = useState<{ string: number; fret: number } | null>(null)
  const [activeNotes, setActiveNotes] = useState<Set<string>>(new Set())
  const [viewMode, setViewMode] = useState<'chord' | 'free'>('chord')

  // 构建和弦音符集合
  const chordNotes = useMemo(() => {
    return buildChord(`${root}4`, chordType).map(n => {
      const match = n.match(/^([A-G]#?)(\d+)$/)
      return match ? match[1] : n
    })
  }, [root, chordType])

  // 计算最佳和弦指法
  const chordFingering = useMemo(() => {
    const fingerings: { string: number; fret: number; note: string }[] = []

    STRINGS.forEach((string, stringIndex) => {
      for (let fret = 0; fret <= FRETS; fret++) {
        const note = getNoteAtFret(string.name, string.octave, fret)
        if (chordNotes.includes(note.name)) {
          fingerings.push({
            string: stringIndex,
            fret,
            note: note.full,
          })
          break
        }
      }
    })

    return fingerings
  }, [chordNotes])

  // 播放音符
  const playNote = useCallback(async (stringIndex: number, fret: number) => {
    const string = STRINGS[stringIndex]
    const note = getNoteAtFret(string.name, string.octave, fret)

    setActiveNotes(prev => new Set(prev).add(note.full))
    await moaTone.playNote(note.full, 0.5)
    setTimeout(() => {
      setActiveNotes(prev => {
        const next = new Set(prev)
        next.delete(note.full)
        return next
      })
    }, 500)
  }, [])

  // 播放和弦
  const playChord = useCallback(async () => {
    const notes = chordFingering.map(f => f.note)
    await moaTone.playNotes(notes, 1.2)
  }, [chordFingering])

  // 点击指板
  const handleFretClick = (stringIndex: number, fret: number) => {
    setSelectedFret({ string: stringIndex, fret })
    playNote(stringIndex, fret)
  }

  // 和弦分组
  const chordGroups = [
    { label: '三和弦', types: ['maj', 'min', 'aug', 'dim'] },
    { label: '七和弦', types: ['maj7', 'min7', 'dom7', 'dim7', 'halfDim7'] },
    { label: '挂留和弦', types: ['sus2', 'sus4'] },
  ]

  return (
    <div className="max-w-4xl mx-auto p-4 md:p-6">
      <div className="text-center mb-6">
        <Title level={2} style={{ marginBottom: 4 }}>🎸 吉他指板</Title>
        <Text type="secondary">交互式吉他指板，学习和弦指法，点击试听</Text>
      </div>

      {/* 选择器 */}
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
          <Col xs={24} sm={10}>
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
          <Col xs={24} sm={8}>
            <Text strong className="block mb-1">模式</Text>
            <Select value={viewMode} onChange={setViewMode} style={{ width: '100%' }} size="large">
              <Select.Option value="chord">和弦指法模式</Select.Option>
              <Select.Option value="free">自由探索模式</Select.Option>
            </Select>
          </Col>
        </Row>

        {/* 和弦名称 */}
        <div className="text-center mt-4">
          <Tag color="orange" className="text-2xl px-8 py-2 font-bold">
            {root}{chordType.symbol || ''}
          </Tag>
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={playChord}
            className="ml-4"
          >
            播放和弦
          </Button>
        </div>
      </Card>

      {/* 吉他指板 */}
      <Card title="指板视图" size="small">
        <div className="overflow-x-auto pb-4">
          <div className="min-w-[700px]">
            {/* 品位标记行 */}
            <div className="flex mb-1">
              <div className="w-16 shrink-0" />
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`flex-1 text-center text-xs ${FRET_MARKERS.includes(i) ? 'font-bold text-gray-700' : 'text-gray-400'}`}
                >
                  {FRET_MARKERS.includes(i) ? i : ''}
                </div>
              ))}
            </div>

            {/* 品位标记点 */}
            <div className="flex mb-1">
              <div className="w-16 shrink-0" />
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <div key={i} className="flex-1 flex justify-center">
                  {[3, 5, 7, 9, 15].includes(i) && (
                    <div className="w-2 h-2 rounded-full bg-gray-400" />
                  )}
                  {i === 12 && (
                    <>
                      <div className="w-2 h-2 rounded-full bg-gray-400" />
                      <div className="w-2 h-2 rounded-full bg-gray-400 ml-1" />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 琴弦 */}
            {STRINGS.map((string, stringIndex) => {
              const stringThickness = 1 + (5 - stringIndex) * 0.5

              return (
                <div key={stringIndex} className="flex items-center">
                  {/* 空弦标签 */}
                  <div className="w-16 shrink-0 text-right pr-3">
                    <Text strong className="text-sm">{string.name}{string.octave}</Text>
                    <br />
                    <Text type="secondary" className="text-xs">{string.label}</Text>
                  </div>

                  {/* 品位格子 */}
                  {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => {
                    const isFingering = viewMode === 'chord' && chordFingering.some(
                      f => f.string === stringIndex && f.fret === fretIndex
                    )
                    const isSelected = selectedFret?.string === stringIndex && selectedFret?.fret === fretIndex
                    const note = getNoteAtFret(string.name, string.octave, fretIndex)
                    const isActive = activeNotes.has(note.full)

                    return (
                      <Tooltip key={fretIndex} title={note.full} placement="top">
                        <button
                          onClick={() => handleFretClick(stringIndex, fretIndex)}
                          className={`
                            flex-1 h-12 border transition-all duration-150
                            flex items-center justify-center
                            ${fretIndex === 0 ? 'border-l-4 border-l-gray-500' : 'border-l border-l-gray-300'}
                            ${stringIndex < STRINGS.length - 1 ? 'border-b border-b-gray-200' : ''}
                            ${isFingering ? 'bg-green-200 hover:bg-green-300' :
                              isSelected ? 'bg-blue-200 ring-2 ring-blue-400 z-10' :
                              isActive ? 'bg-yellow-100' :
                              'bg-amber-50 hover:bg-amber-100'}
                            cursor-pointer text-xs
                          `}
                        >
                          {isFingering && (
                            <div className={`
                              w-5 h-5 rounded-full flex items-center justify-center text-white font-bold text-xs
                              ${isActive ? 'bg-blue-500' : 'bg-green-600'}
                            `}>
                              {note.name}
                            </div>
                          )}
                          {!isFingering && isSelected && (
                            <div className="w-5 h-5 rounded-full bg-blue-400 flex items-center justify-center text-white font-bold text-xs">
                              {note.name}
                            </div>
                          )}
                        </button>
                      </Tooltip>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </Card>

      {/* 指法详情 */}
      <Card title="指法详情" size="small" className="mt-4">
        <Row gutter={[8, 8]}>
          {chordFingering.map((f, index) => (
            <Col xs={12} sm={8} md={4} key={index}>
              <Button
                block
                icon={<SoundOutlined />}
                onClick={() => playNote(f.string, f.fret)}
                type={activeNotes.has(f.note) ? 'primary' : 'default'}
              >
                <span className="text-xs">
                  {STRINGS[f.string].name}弦
                  {f.fret > 0 ? `${f.fret}品` : '空弦'}
                  {' → '}{f.note}
                </span>
              </Button>
            </Col>
          ))}
        </Row>

        <div className="mt-4 p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
          <Text strong>🎸 指法文字描述：</Text>
          <div className="mt-1 text-sm text-gray-600 dark:text-gray-400">
            {chordFingering.map((f, i) => (
              <Tag key={i} color="green" className="mb-1">
                {i + 1}指: {STRINGS[f.string].name}弦 {f.fret === 0 ? '空弦' : `${f.fret}品`} ({f.note})
              </Tag>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
