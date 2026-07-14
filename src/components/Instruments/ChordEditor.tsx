'use client'

import React, { useState } from 'react'
import { Card, Button, Select, Tag, Space } from 'antd'
import { PlayCircleOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'

const { Option } = Select

/**
 * 和弦编辑器组件
 */
export default function ChordEditor() {
  const [root, setRoot] = useState('C')
  const [chordType, setChordType] = useState<ChordType>(CHORD_TYPES.maj)
  const [chordNotes, setChordNotes] = useState<string[]>([])
  
  // 更新和弦
  const updateChord = () => {
    const notes = buildChord(`${root}4`, chordType)
    setChordNotes(notes)
  }
  
  // 播放和弦
  const playChord = async () => {
    await moaTone.playNotes(chordNotes, 1)
  }
  
  // 根音列表
  const roots = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  // 初始化
  React.useEffect(() => {
    updateChord()
  }, [root, chordType])
  
  return (
    <div className="max-w-2xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">🎹 和弦编辑器</h2>
          <p className="text-gray-500 mt-2">选择根音和和弦类型，查看和弦构成并播放</p>
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
          <Tag color="purple" className="text-xl px-6 py-2">
            {root}{chordType.symbol || ''}
          </Tag>
        </div>
        
        {/* 和弦构成 */}
        <div className="flex justify-center gap-2 mb-6 flex-wrap">
          {chordNotes.map((note, index) => (
            <Tag key={index} color="blue" className="text-lg px-3 py-1">
              {note}
            </Tag>
          ))}
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
        
        {/* 和弦音程信息 */}
        <div className="mt-6 p-4 bg-gray-50 rounded-lg">
          <h4 className="font-medium mb-2">和弦构成（半音数）：</h4>
          <div className="flex gap-2 flex-wrap">
            {chordType.intervals.map((interval, index) => (
              <span key={index} className="text-gray-600">
                {index > 0 && ' + '}
                {interval}半音
              </span>
            ))}
          </div>
        </div>
      </Card>
    </div>
  )
}
