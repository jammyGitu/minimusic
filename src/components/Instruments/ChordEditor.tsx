'use client'

import React, { useState, useEffect, useCallback } from 'react'
import { Select, Slider } from 'antd'
import { PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'
import styles from './instruments.module.scss'

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
    <div className={styles.page}>
      <div className={styles.head}>
        <h2 className={styles.title}>🎹 和弦编辑器</h2>
        <p className={styles.subtitle}>选择根音与和弦类型，可视化和弦构成并播放</p>
      </div>

      {/* 选择器 + 播放 */}
      <div className={styles.card}>
        <div className={styles.fieldGrid}>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>根音</label>
            <Select value={root} onChange={setRoot} style={{ width: '100%' }} size="large">
              {ROOTS.map(r => (
                <Select.Option key={r} value={r}>{r}</Select.Option>
              ))}
            </Select>
          </div>
          <div className={styles.field}>
            <label className={styles.fieldLabel}>八度</label>
            <Select value={octave} onChange={setOctave} style={{ width: '100%' }} size="large">
              {[2, 3, 4, 5].map(o => (
                <Select.Option key={o} value={o}>第 {o} 八度</Select.Option>
              ))}
            </Select>
          </div>
          <div className={styles.field} style={{ gridColumn: 'span 2' }}>
            <label className={styles.fieldLabel}>和弦类型</label>
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
          </div>
        </div>

        {/* 和弦名称展示 */}
        <div className={styles.chordNameWrap}>
          <span className={styles.chordName}>
            {root}{chordType.symbol || ''}
          </span>
        </div>

        {/* 和弦音符 */}
        <div className={styles.noteRow}>
          {chordNotes.map((note, index) => (
            <button
              key={index}
              className={`${styles.noteChip} ${index === 0 ? styles.noteChipRoot : ''}`}
              onClick={() => playSingleNote(note)}
              type="button"
            >
              <SoundOutlined /> {note}
            </button>
          ))}
        </div>

        {/* 播放 + 音量 */}
        <div className={styles.playBar}>
          <button className={styles.btnPrimary} onClick={playChord} type="button">
            <PlayCircleOutlined /> 播放和弦
          </button>
          <div className={styles.volumeWrap}>
            <SoundOutlined />
            <Slider
              min={0}
              max={1}
              step={0.05}
              value={volume}
              onChange={setVolume}
              style={{ width: 110 }}
            />
          </div>
        </div>
      </div>

      {/* 和弦音程信息 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>和弦构成</h3>
        <div className={styles.tagRow}>
          {chordType.intervals.map((interval, index) => (
            <span key={index} className={styles.tag}>
              {index > 0 && '+ '}{interval} 半音
            </span>
          ))}
        </div>
        <p className={styles.hint}>
          音程结构：根音
          {chordType.intervals.slice(1).map((i, idx) => (
            <span key={idx}> → +{i}半音</span>
          ))}
        </p>
      </div>

      {/* 迷你钢琴键盘可视化 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>键盘视图</h3>
        <div className={styles.miniPianoScroll}>
          <div className={styles.miniPianoInner}>
            {/* 白键 */}
            <div className={styles.miniWhiteRow}>
              {whiteKeys.map((key) => {
                const active = activeKeys.has(key.note)
                const chord = isChordNote(key.note)
                const cls = [
                  styles.miniWhiteKey,
                  active ? styles.miniWhiteKeyActive : '',
                  !active && chord ? styles.miniWhiteKeyChord : '',
                ].join(' ')
                return (
                  <button
                    key={key.note}
                    onClick={() => playSingleNote(key.note)}
                    className={cls}
                    type="button"
                  >
                    {key.note}
                  </button>
                )
              })}
            </div>

            {/* 黑键覆盖层 */}
            <div className={styles.miniBlackLayer}>
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

                const active = activeKeys.has(blackKey.note)
                const chord = isChordNote(blackKey.note)
                const cls = [
                  styles.miniBlackKey,
                  active ? styles.miniBlackKeyActive : '',
                  !active && chord ? styles.miniBlackKeyChord : '',
                ].join(' ')

                return (
                  <button
                    key={blackKey.note}
                    onClick={() => playSingleNote(blackKey.note)}
                    style={{ left: `${wIdx * 40 + 28}px` }}
                    className={cls}
                    title={blackKey.note}
                    type="button"
                  />
                )
              })}
            </div>
          </div>
        </div>

        {/* 图例 */}
        <div className={styles.legend}>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendChord}`} /> 和弦音
          </span>
          <span className={styles.legendItem}>
            <span className={`${styles.legendSwatch} ${styles.legendActive}`} /> 正在播放
          </span>
        </div>
      </div>
    </div>
  )
}
