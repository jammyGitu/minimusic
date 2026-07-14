/**
 * 和弦相关工具函数和数据
 */

/**
 * 和弦类型定义
 */
export interface ChordType {
  name: string          // 和弦名称，如 "maj", "min"
  intervals: number[]   // 音程间隔（半音数），如 [0, 4, 7]
  symbol?: string       // 和弦符号，如 "", "m"
  canOmit?: number[]    // 可省略的音（索引）
}

/**
 * 常用和弦类型定义
 */
export const CHORD_TYPES: Record<string, ChordType> = {
  // 三和弦
  maj: {
    name: '大三和弦',
    intervals: [0, 4, 7],
    symbol: '',
  },
  min: {
    name: '小三和弦',
    intervals: [0, 3, 7],
    symbol: 'm',
  },
  aug: {
    name: '增三和弦',
    intervals: [0, 4, 8],
    symbol: 'aug',
  },
  dim: {
    name: '减三和弦',
    intervals: [0, 3, 6],
    symbol: 'dim',
  },
  
  // 七和弦
  maj7: {
    name: '大七和弦',
    intervals: [0, 4, 7, 11],
    symbol: 'maj7',
  },
  min7: {
    name: '小七和弦',
    intervals: [0, 3, 7, 10],
    symbol: 'm7',
  },
  dom7: {
    name: '属七和弦',
    intervals: [0, 4, 7, 10],
    symbol: '7',
  },
  dim7: {
    name: '减七和弦',
    intervals: [0, 3, 6, 9],
    symbol: 'dim7',
  },
  halfDim7: {
    name: '半减七和弦',
    intervals: [0, 3, 6, 10],
    symbol: 'm7b5',
  },
  
  // 挂留和弦
  sus2: {
    name: '挂二和弦',
    intervals: [0, 2, 7],
    symbol: 'sus2',
  },
  sus4: {
    name: '挂四和弦',
    intervals: [0, 5, 7],
    symbol: 'sus4',
  },
}

/**
 * 构建和弦音符
 * @param root 根音，如 "C4"
 * @param chordType 和弦类型
 * @returns 和弦音符数组
 */
export function buildChord(root: string, chordType: ChordType): string[] {
  const rootMatch = root.match(/^([A-G]#?)(\d+)$/)
  if (!rootMatch) throw new Error(`Invalid root note: ${root}`)
  
  const noteName = rootMatch[1]
  const octave = parseInt(rootMatch[2])
  
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  const rootIndex = NOTE_NAMES.indexOf(noteName)
  
  return chordType.intervals.map(interval => {
    const semitone = (rootIndex + interval) % 12
    const octaveOffset = Math.floor((rootIndex + interval) / 12)
    return `${NOTE_NAMES[semitone]}${octave + octaveOffset}`
  })
}

/**
 * 获取所有和弦类型列表
 */
export function getAllChordTypes(): ChordType[] {
  return Object.values(CHORD_TYPES)
}

/**
 * 根据符号获取和弦类型
 * @param symbol 和弦符号
 */
export function getChordTypeBySymbol(symbol: string): ChordType | undefined {
  return Object.values(CHORD_TYPES).find(chord => chord.symbol === symbol)
}
