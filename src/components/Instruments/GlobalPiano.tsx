'use client'

import React, { useState } from 'react'
import { moaTone } from '@/utils/MoaTone'

interface PianoKey {
  note: string
  isBlack: boolean
}

/**
 * 虚拟钢琴组件
 */
export default function GlobalPiano() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  
  // 生成钢琴键（从C3到C6）
  const generateKeys = (): PianoKey[] => {
    const keys: PianoKey[] = []
    const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B']
    const blackNotes = ['C#', 'D#', null, 'F#', 'G#', 'A#', null]
    
    for (let octave = 3; octave <= 5; octave++) {
      for (let i = 0; i < 7; i++) {
        // 白键
        keys.push({
          note: `${whiteNotes[i]}${octave}`,
          isBlack: false,
        })
        
        // 黑键
        if (blackNotes[i]) {
          keys.push({
            note: `${blackNotes[i]}${octave}`,
            isBlack: true,
          })
        }
      }
    }
    
    // 添加最后的C6
    keys.push({ note: 'C6', isBlack: false })
    
    return keys
  }
  
  const keys = generateKeys()
  const whiteKeys = keys.filter(k => !k.isBlack)
  const blackKeys = keys.filter(k => k.isBlack)
  
  const handleMouseDown = async (note: string) => {
    setActiveKeys(prev => new Set(prev).add(note))
    await moaTone.playNote(note, 0.5)
  }
  
  const handleMouseUp = (note: string) => {
    setActiveKeys(prev => {
      const newSet = new Set(prev)
      newSet.delete(note)
      return newSet
    })
  }
  
  return (
    <div className="relative inline-block">
      {/* 白键 */}
      <div className="flex">
        {whiteKeys.map((key, index) => (
          <div
            key={key.note}
            className={`
              w-12 h-48 border border-gray-300 rounded-b-lg cursor-pointer
              transition-colors duration-100
              ${activeKeys.has(key.note) ? 'bg-yellow-200' : 'bg-white hover:bg-gray-100'}
            `}
            onMouseDown={() => handleMouseDown(key.note)}
            onMouseUp={() => handleMouseUp(key.note)}
            onMouseLeave={() => handleMouseUp(key.note)}
          >
            <div className="mt-auto p-2 text-center text-xs text-gray-600">
              {key.note}
            </div>
          </div>
        ))}
      </div>
      
      {/* 黑键 */}
      <div className="absolute top-0 left-0 flex">
        {whiteKeys.map((whiteKey, index) => {
          // 每个白键后面可能有黑键（除了E和B）
          const blackKey = blackKeys.find(k => {
            const whiteNote = whiteKey.note.replace(/\d/, '')
            const blackNote = k.note.replace(/\d/, '')
            const whiteOctave = parseInt(whiteKey.note.match(/\d/)?.[0] || '4')
            const blackOctave = parseInt(k.note.match(/\d/)?.[0] || '4')
            return blackOctave === whiteOctave && 
                   (blackNote === 'C#' && whiteNote === 'C' ||
                    blackNote === 'D#' && whiteNote === 'D' ||
                    blackNote === 'F#' && whiteNote === 'F' ||
                    blackNote === 'G#' && whiteNote === 'G' ||
                    blackNote === 'A#' && whiteNote === 'A')
          })
          
          if (!blackKey) return null
          
          return (
            <div
              key={blackKey.note}
              className={`
                absolute w-8 h-28 rounded-b-lg cursor-pointer z-10
                transition-colors duration-100
                ${activeKeys.has(blackKey.note) ? 'bg-yellow-400' : 'bg-gray-800 hover:bg-gray-700'}
              `}
              style={{ left: `${(index + 1) * 48 - 16}px` }}
              onMouseDown={() => handleMouseDown(blackKey.note)}
              onMouseUp={() => handleMouseUp(blackKey.note)}
              onMouseLeave={() => handleMouseUp(blackKey.note)}
            />
          )
        })}
      </div>
    </div>
  )
}
