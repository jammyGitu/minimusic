'use client'

import React, { useEffect, useRef, useState } from 'react'
import { Card, Button, Input, Space } from 'antd'
import { PlayCircleOutlined, SyncOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'

/**
 * 五线谱渲染组件
 */
export default function StaffNotation() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [abcInput, setAbcInput] = useState(`T:示例乐谱
C:Minimusic
M:4/4
L:1/4
K:C
C D E F G A B c | B A G F E D C |`)
  const [abcjsLoaded, setAbcjsLoaded] = useState(false)
  const [ABCJS, setABCJS] = useState<any>(null)
  
  // 动态加载 ABCJS
  useEffect(() => {
    import('abcjs').then((module) => {
      setABCJS(module.default || module)
      setAbcjsLoaded(true)
    })
  }, [])
  
  // 渲染五线谱
  const renderSheet = () => {
    if (!sheetRef.current || !ABCJS) return
    
    // 清空容器
    sheetRef.current.innerHTML = ''
    
    // 使用ABCJS渲染五线谱
    ABCJS.renderAbc(sheetRef.current, abcInput, {
      responsive: 'resize',
      viewportHorizontal: true,
    })
  }
  
  // 播放乐谱
  const playSheet = async () => {
    const notes = parseABC(abcInput)
    if (notes.length > 0) {
      await moaTone.playSequence(notes, 0.5)
    }
  }
  
  // 简单的ABC解析器
  const parseABC = (abc: string): string[] => {
    const notes: string[] = []
    const lines = abc.split('\n')
    
    for (const line of lines) {
      if (line.startsWith('T:') || line.startsWith('C:') || line.startsWith('M:') || 
          line.startsWith('L:') || line.startsWith('K:') || line.trim() === '') {
        continue
      }
      
      const notePattern = /([A-Ga-g][#^]?)(\d)?/g
      let match
      while ((match = notePattern.exec(line)) !== null) {
        let note = match[1].toUpperCase()
        const octave = match[2] ? parseInt(match[2]) : 4
        
        let finalOctave = octave
        if (match[1] === match[1].toLowerCase()) {
          finalOctave = octave + 1
        }
        
        notes.push(`${note}${finalOctave}`)
      }
    }
    
    return notes
  }
  
  useEffect(() => {
    if (abcjsLoaded) {
      renderSheet()
    }
  }, [abcInput, abcjsLoaded])
  
  return (
    <div className="max-w-4xl mx-auto p-6">
      <Card>
        <div className="text-center mb-6">
          <h2 className="text-xl font-bold">📖 五线谱渲染</h2>
          <p className="text-gray-500 mt-2">输入ABC记谱法，查看五线谱并播放</p>
        </div>
        
        {/* ABC输入区域 */}
        <div className="mb-6">
          <label className="block text-sm font-medium mb-2">ABC记谱</label>
          <Input.TextArea
            value={abcInput}
            onChange={(e) => setAbcInput(e.target.value)}
            rows={4}
            placeholder="输入ABC记谱法..."
            className="font-mono"
          />
        </div>
        
        {/* 操作按钮 */}
        <div className="flex justify-center gap-4 mb-6">
          <Button
            type="primary"
            icon={<PlayCircleOutlined />}
            onClick={playSheet}
          >
            播放乐谱
          </Button>
          <Button
            icon={<SyncOutlined />}
            onClick={renderSheet}
            disabled={!abcjsLoaded}
          >
            重新渲染
          </Button>
        </div>
        
        {/* 五线谱显示区域 */}
        <div 
          ref={sheetRef} 
          className="border border-gray-200 rounded-lg p-4 min-h-[200px] bg-white"
        />
        
        {/* 示例说明 */}
        <div className="mt-6 p-4 bg-blue-50 rounded-lg">
          <h4 className="font-medium mb-2">🎵 ABC记谱法示例：</h4>
          <ul className="text-sm text-gray-600 space-y-1">
            <li><code>T:</code> - 标题</li>
            <li><code>C:</code> - 作曲家</li>
            <li><code>M:</code> - 拍号 (如 4/4)</li>
            <li><code>L:</code> - 默认音符长度</li>
            <li><code>K:</code> - 调性 (如 C, G, F)</li>
            <li><code>C D E F</code> - 音符 (大写为低音谱，小写为高音谱)</li>
          </ul>
        </div>
      </Card>
    </div>
  )
}
