'use client'

import React, { useState, useCallback, useMemo } from 'react'
import { Select, Tooltip } from 'antd'
import { PlayCircleOutlined, SoundOutlined } from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import { CHORD_TYPES, buildChord, ChordType } from '@/utils/chord'
import styles from './instruments.module.scss'

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
    <div className={styles.page}>
      <div className={styles.head}>
        <h2 className={styles.title}>🎸 吉他指板</h2>
        <p className={styles.subtitle}>交互式吉他指板，学习和弦指法，点击试听</p>
      </div>

      {/* 选择器 */}
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
          <div className={styles.field}>
            <label className={styles.fieldLabel}>模式</label>
            <Select value={viewMode} onChange={setViewMode} style={{ width: '100%' }} size="large">
              <Select.Option value="chord">和弦指法模式</Select.Option>
              <Select.Option value="free">自由探索模式</Select.Option>
            </Select>
          </div>
        </div>

        {/* 和弦名称 + 播放 */}
        <div className={styles.chordNameWrap}>
          <span className={`${styles.chordName} ${styles.chordNameOrange}`}>
            {root}{chordType.symbol || ''}
          </span>
          <button className={styles.btnPrimary} onClick={playChord} type="button">
            <PlayCircleOutlined /> 播放和弦
          </button>
        </div>
      </div>

      {/* 吉他指板 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>指板视图</h3>
        <div className={styles.fretScroll}>
          <div className={styles.fretInner}>
            {/* 品位标记行 */}
            <div className={styles.fretNumberRow}>
              <div className={styles.fretNumberSpacer} />
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <div
                  key={i}
                  className={`${styles.fretNumber} ${FRET_MARKERS.includes(i) ? styles.fretNumberMark : ''}`}
                >
                  {FRET_MARKERS.includes(i) ? i : ''}
                </div>
              ))}
            </div>

            {/* 品位标记点 */}
            <div className={styles.fretDotRow}>
              <div className={styles.fretNumberSpacer} />
              {Array.from({ length: FRETS + 1 }).map((_, i) => (
                <div key={i} style={{ flex: 1, display: 'flex', justifyContent: 'center' }}>
                  {[3, 5, 7, 9, 15].includes(i) && (
                    <div className={styles.fretDot} />
                  )}
                  {i === 12 && (
                    <>
                      <div className={styles.fretDot} />
                      <div className={styles.fretDot} style={{ marginLeft: 4 }} />
                    </>
                  )}
                </div>
              ))}
            </div>

            {/* 琴弦 */}
            {STRINGS.map((string, stringIndex) => (
              <div key={stringIndex} className={styles.stringRow}>
                {/* 空弦标签 */}
                <div className={styles.stringLabel}>
                  <div className={styles.stringName}>{string.name}{string.octave}</div>
                  <div className={styles.stringDesc}>{string.label}</div>
                </div>

                {/* 品位格子 */}
                {Array.from({ length: FRETS + 1 }).map((_, fretIndex) => {
                  const isFingering = viewMode === 'chord' && chordFingering.some(
                    f => f.string === stringIndex && f.fret === fretIndex
                  )
                  const isSelected = selectedFret?.string === stringIndex && selectedFret?.fret === fretIndex
                  const note = getNoteAtFret(string.name, string.octave, fretIndex)
                  const isActive = activeNotes.has(note.full)

                  const cls = [
                    styles.fretCell,
                    fretIndex === 0 ? styles.fretCellNut : '',
                    stringIndex === STRINGS.length - 1 ? styles.fretCellLastRow : '',
                    isFingering ? styles.fretCellFingering : '',
                    isSelected ? styles.fretCellSelected : '',
                  ].join(' ')

                  return (
                    <Tooltip key={fretIndex} title={note.full} placement="top">
                      <button
                        onClick={() => handleFretClick(stringIndex, fretIndex)}
                        className={cls}
                        type="button"
                      >
                        {isFingering && (
                          <div className={`${styles.fretNoteDot} ${isActive ? styles.fretNoteDotActive : styles.fretNoteDotFingering}`}>
                            {note.name}
                          </div>
                        )}
                        {!isFingering && isSelected && (
                          <div className={`${styles.fretNoteDot} ${styles.fretNoteDotSelected}`}>
                            {note.name}
                          </div>
                        )}
                      </button>
                    </Tooltip>
                  )
                })}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* 指法详情 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>指法详情</h3>
        <div className={styles.fingeringGrid}>
          {chordFingering.map((f, index) => (
            <button
              key={index}
              className={`${styles.fingeringBtn} ${activeNotes.has(f.note) ? styles.fingeringBtnActive : ''}`}
              onClick={() => playNote(f.string, f.fret)}
              type="button"
            >
              <SoundOutlined />
              {STRINGS[f.string].name}弦{f.fret > 0 ? `${f.fret}品` : '空弦'} → {f.note}
            </button>
          ))}
        </div>

        <div className={styles.fingeringPanel}>
          <p className={styles.fingeringPanelTitle}>🎸 指法文字描述</p>
          <div className={styles.tagRow}>
            {chordFingering.map((f, i) => (
              <span key={i} className={`${styles.tag} ${styles.tagGreen}`}>
                {i + 1}指: {STRINGS[f.string].name}弦 {f.fret === 0 ? '空弦' : `${f.fret}品`} ({f.note})
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
