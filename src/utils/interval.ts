/**
 * 音程相关工具函数和数据
 */

/**
 * 音程类型定义
 */
export interface IntervalType {
  name: string        // 音程名称，如 "大三度"
  semitones: number   // 半音数
  shortName: string   // 简称，如 "M3"
}

/**
 * 音程定义（从0到12个半音）
 */
export const INTERVALS: Record<number, IntervalType> = {
  0: { name: '纯一度', semitones: 0, shortName: 'P1' },
  1: { name: '小二度', semitones: 1, shortName: 'm2' },
  2: { name: '大二度', semitones: 2, shortName: 'M2' },
  3: { name: '小三度', semitones: 3, shortName: 'm3' },
  4: { name: '大三度', semitones: 4, shortName: 'M3' },
  5: { name: '纯四度', semitones: 5, shortName: 'P4' },
  6: { name: '增四度/减五度', semitones: 6, shortName: 'A4/d5' },
  7: { name: '纯五度', semitones: 7, shortName: 'P5' },
  8: { name: '小六度', semitones: 8, shortName: 'm6' },
  9: { name: '大六度', semitones: 9, shortName: 'M6' },
  10: { name: '小七度', semitones: 10, shortName: 'm7' },
  11: { name: '大七度', semitones: 11, shortName: 'M7' },
  12: { name: '纯八度', semitones: 12, shortName: 'P8' },
}

/**
 * 计算两个音符之间的音程
 * @param note1 第一个音符
 * @param note2 第二个音符
 * @returns 音程半音数
 */
export function calculateInterval(note1: string, note2: string): number {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const parseNote = (note: string) => {
    const match = note.match(/^([A-G]#?)(\d+)$/)
    if (!match) throw new Error(`Invalid note: ${note}`)
    const noteName = match[1]
    const octave = parseInt(match[2])
    const semitone = NOTE_NAMES.indexOf(noteName)
    return semitone + octave * 12
  }
  
  const midi1 = parseNote(note1)
  const midi2 = parseNote(note2)
  
  return Math.abs(midi2 - midi1)
}

/**
 * 根据半音数获取音程名称
 * @param semitones 半音数
 * @returns 音程名称
 */
export function getIntervalName(semitones: number): string {
  const normalized = semitones % 12
  return INTERVALS[normalized]?.name || '未知音程'
}

/**
 * 根据根音和音程生成目标音符
 * @param root 根音
 * @param semitones 音程半音数
 * @returns 目标音符
 */
export function getNoteByInterval(root: string, semitones: number): string {
  const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
  
  const match = root.match(/^([A-G]#?)(\d+)$/)
  if (!match) throw new Error(`Invalid root note: ${root}`)
  
  const noteName = match[1]
  const octave = parseInt(match[2])
  const rootIndex = NOTE_NAMES.indexOf(noteName)
  
  const targetSemitone = (rootIndex + semitones) % 12
  const octaveOffset = Math.floor((rootIndex + semitones) / 12)
  
  return `${NOTE_NAMES[targetSemitone]}${octave + octaveOffset}`
}

/**
 * 获取所有音程类型列表
 */
export function getAllIntervals(): IntervalType[] {
  return Object.values(INTERVALS)
}
