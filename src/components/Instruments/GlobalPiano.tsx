'use client'

import React, { useState, useEffect, useCallback, useRef, useMemo } from 'react'
import { Select, Slider, Tooltip } from 'antd'
import {
  SoundOutlined,
  LeftOutlined,
  RightOutlined,
} from '@ant-design/icons'
import { moaTone, SynthType } from '@/utils/MoaTone'
import styles from './instruments.module.scss'

// ───────────────────────────── 类型 ─────────────────────────────
interface PianoKey {
  note: string
  isBlack: boolean
  midi: number
  label: string        // 白键上显示的音名+八度
  shortcut: string     // 键盘快捷键提示
}

// ───────────────────────────── 常量 ─────────────────────────────
const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
const WHITE_INDICES = [0, 2, 4, 5, 7, 9, 11] // 白键在八度中的半音位置
const BLACK_INDICES = [1, 3, 6, 8, 10]        // 黑键在八度中的半音位置

// 键盘映射：物理按键 → [半音偏移（相对 C4）]
const KEY_MAP: Record<string, number> = {
  // 下排 - 白键 (C4 起)
  'z': 0,   // C4
  'x': 2,   // D4
  'c': 4,   // E4
  'v': 5,   // F4
  'b': 7,   // G4
  'n': 9,   // A4
  'm': 11,  // B4
  ',': 12,  // C5
  '.': 14,  // D5
  '/': 16,  // E5
  // 上排 - 黑键 (C#4 起)
  's': 1,   // C#4
  'd': 3,   // D#4
  'g': 6,   // F#4
  'h': 8,   // G#4
  'j': 10,  // A#4
  'l': 13,  // C#5
  ';': 15,  // D#5
  // 上行（数字排）- 额外白键
  'q': 0,   // C4（备用）
  'w': 1,   // C#4（备用）
  'e': 4,   // E4（备用）
  'r': 5,   // F4（备用）
  't': 7,   // G4（备用）
  'y': 9,   // A4（备用）
  'u': 11,  // B4（备用）
  'i': 12,  // C5（备用）
  'o': 14,  // D5（备用）
  'p': 16,  // E5（备用）
}

const SYNTH_OPTIONS: { value: SynthType; label: string }[] = [
  { value: 'piano', label: '🎹 钢琴' },
  { value: 'guitar', label: '🎸 吉他' },
  { value: 'organ', label: '🎛️ 风琴' },
  { value: 'strings', label: '🎻 弦乐' },
  { value: 'bass', label: '🎸 贝斯' },
]

const WHITE_KEY_WIDTH = 52
const WHITE_KEY_HEIGHT = 180
const BLACK_KEY_WIDTH = 32
const BLACK_KEY_HEIGHT = 105

// ───────────────────────────── 组件 ─────────────────────────────
export default function GlobalPiano() {
  const [activeKeys, setActiveKeys] = useState<Set<string>>(new Set())
  const [octaveOffset, setOctaveOffset] = useState(0)   // 相对 C3 的偏移
  const [synthType, setSynthType] = useState<SynthType>('piano')
  const [volume, setVolume] = useState(0.6)
  const [initialized, setInitialized] = useState(false)
  const activeKeysRef = useRef<Set<string>>(new Set())
  const volRef = useRef(volume)

  // 同步 ref
  useEffect(() => { volRef.current = volume }, [volume])

  // 初始化音频
  const initAudio = useCallback(async () => {
    if (initialized) return
    await moaTone.init({ synthType, volume })
    setInitialized(true)
  }, [initialized, synthType, volume])

  // 切换音色
  useEffect(() => {
    if (initialized) moaTone.setSynthType(synthType)
  }, [synthType, initialized])

  // 切换音量
  useEffect(() => {
    if (initialized) moaTone.setVolume(volume)
  }, [volume, initialized])

  // ── 生成琴键 ──
  const keys = useMemo(() => {
    const result: PianoKey[] = []
    const startOctave = 3 + octaveOffset
    const endOctave = 5 + octaveOffset

    for (let oct = startOctave; oct <= endOctave; oct++) {
      for (const wi of WHITE_INDICES) {
        const midi = wi + (oct + 1) * 12
        const note = `${NOTE_NAMES[wi]}${oct}`
        const shortcut = getShortcutForMidi(midi)
        result.push({ note, isBlack: false, midi, label: `${NOTE_NAMES[wi]}${oct}`, shortcut })
      }
      for (const bi of BLACK_INDICES) {
        const midi = bi + (oct + 1) * 12
        const note = `${NOTE_NAMES[bi]}${oct}`
        const shortcut = getShortcutForMidi(midi)
        result.push({ note, isBlack: true, midi, label: '', shortcut })
      }
    }
    // 最后一个白键 C
    const lastOct = endOctave + 1
    const lastMidi = 0 + (lastOct + 1) * 12
    result.push({ note: `C${lastOct}`, isBlack: false, midi: lastMidi, label: `C${lastOct}`, shortcut: getShortcutForMidi(lastMidi) })

    return result
  }, [octaveOffset])

  const whiteKeys = useMemo(() => keys.filter(k => !k.isBlack), [keys])
  const blackKeys = useMemo(() => keys.filter(k => k.isBlack), [keys])

  // ── 播放音符 ──
  const triggerNote = useCallback(async (note: string, velocity: number = 0.6) => {
    await initAudio()
    moaTone.setVolume(volRef.current * velocity)
    moaTone.playNote(note, 0.4)
    // 恢复音量
    setTimeout(() => { if (initialized) moaTone.setVolume(volRef.current) }, 50)
  }, [initAudio, initialized])

  const pressKey = useCallback((note: string) => {
    setActiveKeys(prev => {
      const next = new Set(prev)
      next.add(note)
      activeKeysRef.current = next
      return next
    })
  }, [])

  const releaseKey = useCallback((note: string) => {
    setActiveKeys(prev => {
      const next = new Set(prev)
      next.delete(note)
      activeKeysRef.current = next
      return next
    })
  }, [])

  const handleKeyDown = useCallback((note: string, e: React.MouseEvent | React.TouchEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    const clientY = 'touches' in e ? (e as React.TouchEvent).touches[0]?.clientY ?? rect.bottom : (e as React.MouseEvent).clientY
    const relY = (clientY - rect.top) / rect.height
    const velocity = 0.3 + Math.min(relY, 1) * 0.5
    pressKey(note)
    triggerNote(note, velocity)
  }, [pressKey, triggerNote])

  const handleKeyUp = useCallback((note: string) => {
    releaseKey(note)
  }, [releaseKey])

  // ── 全局键盘事件 ──
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // 忽略输入框内的按键
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement || (e.target as HTMLElement)?.isContentEditable) return
      if (e.repeat) return

      const key = e.key.toLowerCase()
      const offset = KEY_MAP[key]
      if (offset === undefined) return

      const midi = offset + 60 // C4 = MIDI 60
      const note = midiToNoteStr(midi + octaveOffset * 12)
      const velocity = 0.6
      pressKey(note)
      triggerNote(note, velocity)
    }

    const onKeyUp = (e: KeyboardEvent) => {
      const key = e.key.toLowerCase()
      const offset = KEY_MAP[key]
      if (offset === undefined) return
      const midi = offset + 60
      const note = midiToNoteStr(midi + octaveOffset * 12)
      releaseKey(note)
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [octaveOffset, pressKey, releaseKey, triggerNote])

  // ── 黑键定位 ──
  const getBlackKeyLeft = (blackKey: PianoKey): number => {
    // 找到这个黑键对应的白键索引（黑键C#对应白键C，D#对应D...）
    const blackSemitone = NOTE_NAMES.indexOf(blackKey.note.replace(/\d/, ''))
    // 在黑键之前的白键数量
    const prevWhiteCount = WHITE_INDICES.filter(wi => wi < blackSemitone).length
    // 同八度内
    const octave = parseInt(blackKey.note.match(/\d+/)![0])
    const startOctave = 3 + octaveOffset
    const octaveWhiteOffset = (octave - startOctave) * 7
    const totalPrevWhite = octaveWhiteOffset + prevWhiteCount
    return totalPrevWhite * WHITE_KEY_WIDTH + WHITE_KEY_WIDTH - BLACK_KEY_WIDTH / 2
  }

  const totalWidth = whiteKeys.length * WHITE_KEY_WIDTH

  return (
    <div className={styles.pianoWrap} style={{ minWidth: totalWidth + 32 }}>
      {/* ── 控制栏 ── */}
      <div className={styles.pianoControls}>
        {/* 八度切换 */}
        <div className={styles.octaveGroup}>
          <Tooltip title="降低八度">
            <button
              className={styles.octaveBtn}
              disabled={octaveOffset <= -2}
              onClick={() => setOctaveOffset(o => o - 1)}
              aria-label="降低八度"
            >
              <LeftOutlined />
            </button>
          </Tooltip>
          <span className={styles.octaveLabel}>
            C{3 + octaveOffset} - C{6 + octaveOffset}
          </span>
          <Tooltip title="升高八度">
            <button
              className={styles.octaveBtn}
              disabled={octaveOffset >= 2}
              onClick={() => setOctaveOffset(o => o + 1)}
              aria-label="升高八度"
            >
              <RightOutlined />
            </button>
          </Tooltip>
        </div>

        {/* 音色选择 */}
        <Select
          size="small"
          value={synthType}
          onChange={(v: SynthType) => setSynthType(v)}
          options={SYNTH_OPTIONS}
          style={{ width: 130 }}
          popupMatchSelectWidth={false}
        />

        {/* 音量 */}
        <div className={styles.volumeWrap} style={{ width: 140 }}>
          <SoundOutlined />
          <Slider
            min={0}
            max={1}
            step={0.01}
            value={volume}
            onChange={(v) => setVolume(v)}
            tooltip={{ formatter: (v) => `${Math.round((v ?? 0.5) * 100)}%` }}
            style={{ margin: 0, flex: 1 }}
          />
        </div>
      </div>

      {/* ── 键盘提示 ── */}
      <p className={styles.keyboardHint}>
        键盘: Z~M 白键 | S D G H J 黑键 | 按住拖拽滑音
      </p>

      {/* ── 钢琴键盘 ── */}
      <div className={styles.pianoScroll}>
        <div className={styles.pianoKeys} style={{ width: totalWidth, height: WHITE_KEY_HEIGHT + 4 }}>
          {/* 白键 */}
          {whiteKeys.map((key, index) => (
            <div
              key={key.note}
              data-note={key.note}
              className={`${styles.whiteKey} ${activeKeys.has(key.note) ? styles.whiteKeyActive : ''}`}
              style={{
                left: index * WHITE_KEY_WIDTH,
                width: WHITE_KEY_WIDTH - 1,
                height: WHITE_KEY_HEIGHT,
              }}
              onMouseDown={(e) => handleKeyDown(key.note, e)}
              onMouseUp={() => handleKeyUp(key.note)}
              onMouseLeave={() => handleKeyUp(key.note)}
              onTouchStart={(e) => { e.preventDefault(); handleKeyDown(key.note, e) }}
              onTouchEnd={(e) => { e.preventDefault(); handleKeyUp(key.note) }}
            >
              {/* 音符标签 */}
              <div className={styles.keyLabelWrap}>
                <span className={styles.keyLabel}>{key.label}</span>
                {key.shortcut && (
                  <span className={styles.keyShortcut}>{key.shortcut.toUpperCase()}</span>
                )}
              </div>
            </div>
          ))}

          {/* 黑键 */}
          {blackKeys.map((key) => {
            const left = getBlackKeyLeft(key)
            return (
              <div
                key={key.note}
                data-note={key.note}
                className={`${styles.blackKey} ${activeKeys.has(key.note) ? styles.blackKeyActive : ''}`}
                style={{
                  left,
                  width: BLACK_KEY_WIDTH,
                  height: BLACK_KEY_HEIGHT,
                }}
                onMouseDown={(e) => { e.stopPropagation(); handleKeyDown(key.note, e) }}
                onMouseUp={(e) => { e.stopPropagation(); handleKeyUp(key.note) }}
                onMouseLeave={(e) => { e.stopPropagation(); handleKeyUp(key.note) }}
                onTouchStart={(e) => { e.preventDefault(); e.stopPropagation(); handleKeyDown(key.note, e) }}
                onTouchEnd={(e) => { e.preventDefault(); e.stopPropagation(); handleKeyUp(key.note) }}
              >
                {/* 黑键快捷键 */}
                {key.shortcut && (
                  <div style={{ position: 'absolute', bottom: 4, left: 0, right: 0, textAlign: 'center' }}>
                    <span className={styles.blackKeyShortcut}>{key.shortcut.toUpperCase()}</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>

      {!initialized && (
        <button className={styles.btnPrimary} onClick={initAudio} type="button">
          <SoundOutlined /> 点击初始化音频
        </button>
      )}
    </div>
  )
}

// ───────────────────────────── 工具函数 ─────────────────────────────
function midiToNoteStr(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const semitone = midi % 12
  return `${NOTE_NAMES[semitone]}${octave}`
}

function getShortcutForMidi(midi: number): string {
  const base = midi - 60 // 相对 C4
  for (const [key, offset] of Object.entries(KEY_MAP)) {
    if (offset === base) return key
  }
  return ''
}
