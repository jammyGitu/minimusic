'use client'

import React, { useState } from 'react'
import { Card, Button, Select, Tag, Space } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'

const { Option } = Select

// 吉他弦配置
const GUITAR_STRINGS = [
  { note: 'E', octave: 2 }, // 6弦 - 低音E
  { note: 'A', octave: 2 }, // 5弦
  { note: 'D', octave: 3 }, // 4弦
  { note: 'G', octave: 3 }, // 3弦
  { note: 'B', octave: 3 }, // 2弦
  { note: 'e', octave: 4 }, // 1弦 - 高音E
]

// 品位数量
const FRETS = 12

/**
 * 吉他指板组件
 */
export default function GuitarEditor() {
  const [root, setRoot] = useState('C')
  const [chordType, setChordType] = useState<ChordType>(CHORD_TYPES.maj)
  const [selectedFret, setSelectedFret] = useState<{string: number; fret: number} | null>(null)
  
  // 计算和弦指法
  const getChordFingering = (): {string: number; fret: number; note: string}[] => {
    const chordNotes = buildChord(`${root}4`, chordType).map(n => n.replace(/\d/, ''))
    const fingerings: {string: number; fret: number; note: string}[] = []
    
    GUITAR_STRINGS.forEach((string, stringIndex) => {
      const stringNote = string.note.toUpperCase()
      const stringOctave = string.note === 'e' ? string.octave : string.octave
      
      for (let fret = 0; fret <= FRETS; fret++) {
        const noteName = getNoteAtFret(stringNote, fret)
        if (chordNotes.includes(noteName)) {
          fingerings.push({
            string: stringIndex,
            fret,
            note: `${noteName}${stringOctave + Math.floor(fret / 12)}`,
          })
          break
        }
      }
    })
    
    return fingerings.slice(0, 4) // 最多显示4个指法
  }
  
  // 获取某品的音符
  const getNoteAtFret = (openNote: string, fret: number): string => {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const index = NOTE_NAMES.indexOf(openNote)
    return NOTE_NAMES[(index + fret) % 12]
  }
  
  // 播放选中的音符
  const playNote = async (stringIndex: number, fret: number) => {
    const string = GUITAR_STRINGS[stringIndex]
    const noteName = getNoteAtFret(string.note.toUpperCase(), fret)
    const octave = string.note === 'e' ? string.octave : string.octave
    const finalOctave = octave + Math.floor(fret / 12)
    
    await moaTone.playNote(`${noteName}${finalOctave}`, 0.5)
  }
  
  // 播放和弦
  const playChord = async () => {
    const fingerings = getChordFingering()
    const notes = fingerings.map(f => f.note)
    await moaTone.playNotes(notes, 1)
  }
  
  const fingerings = getChordFingering()
  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">🎸 吉他指板</h2>
          <p className="text-gray-500 mt-2">选择和弦，查看吉他指法</p>
        </div>
        
        {/* 选择器 */}
        <div className="flex justify-center gap-4 mb-6">
          <Space direction="vertical">
            <label className="text-sm font-medium">根音</label>
            <Select
              value={root}
              onChange={setRoot}
              style={{ width: 120 }}
              size="large"
            >
              {roots.map(r => (
                <Option key={r} value={r}>{r}</Option>
              ))}
            </Select>
          </Space>
          
          <Space direction="vertical">
            <label className="text-sm font-medium">和弦类型</label>
            <Select
              value={chordType.name}
              onChange={(value) => {
                const type = Object.values(CHORD_TYPES).find(t => t.name === value)
                if (type) setChordType(type)
              }}
              style={{ width: 150 }}
              size="large"
            >
              {Object.values(CHORD_TYPES).map(type => (
                <Option key={type.name} value={type.name}>{type.name}</Option>
              ))}
            </Select>
          </Space>
        </div>
        
        {/* 和弦名称 */}
        <div className="text-center mb-6">
          <Tag color="orange" className="text-xl px-6 py-2">
            {root}{chordType.symbol || ''}
          </Tag>
        </div>
        
        {/* 吉他指板 */}
        <div className="flex justify-center mb-6">
          <div className="relative">
            {/* 品位标记 */}
            <div className="absolute -top-6 left-0 right-0 flex justify-between px-2">
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <span key={i} className="text-xs text-gray-400 w-8 text-center">
                  {i}
                </span>
              ))}
            </div>
            
            {/* 琴弦 */}
            {GUITAR_STRINGS.map((string, stringIndex) => (
              <div key={stringIndex} className="flex border-b border-gray-300">
                {/* 空弦标记 */}
                <div className="w-8 text-center py-2 font-bold text-sm">
                  {string.note.toUpperCase()}
                </div>
                
                {/* 品位 */}
                {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => {
                  const isFingering = fingerings.some(
                    f => f.string === stringIndex && f.fret === fretIndex
                  )
                  const isSelected = selectedFret?.string === stringIndex && selectedFret?.fret === fretIndex
                  
                  return (
                    <button
                      key={fretIndex}
                      onClick={() => {
                        setSelectedFret({ string: stringIndex, fret: fretIndex })
                        playNote(stringIndex, fretIndex)
                      }}
                      className={`
                        w-8 h-10 border-r border-gray-200 last:border-r-0
                        ${isFingering ? 'bg-green-200' : 'bg-white hover:bg-gray-50'}
                        ${isSelected ? 'ring-2 ring-blue-500' : ''}
                        flex items-center justify-center
                      `}
                    >
                      {isFingering && (
                        <div className="w-4 h-4 rounded-full bg-green-500 text-white text-xs flex items-center justify-center">
                          {fingerings.find(f => f.string === stringIndex && f.fret === fretIndex)?.note.replace(/\d/, '')}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
        
        {/* 播放按钮 */}
        <div className="text-center">
          <Button
            type="primary"
            size="large"
            icon={<PlayCircleOutlined />}
            onClick={playChord}
          >
            播放和弦
          </Button>
        </div>
        
        {/* 指法说明 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">🎸 指法说明：</h4>
          <div className="flex gap-4 text-sm">
            {fingerings.map((f, index) => (
              <span key={index} className="text-gray-600">
                <strong>{index + 1}指:</strong> {GUITAR_STRINGS[f.string].note.toUpperCase()}弦 {f.fret}品
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
