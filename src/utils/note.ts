/**
 * 音符相关工具函数
 */

// 音符名称映射
export const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

// 唱名映射
export const SOLFEGE_NAMES = ['1', '#1', '2', '#2', '3', '4', '#4', '5', '#5', '6', '#6', '7']

/**
 * 将半音数转换为音符名称
 * @param semitone 半音数 (0-11)
 * @param octave 八度 (默认4)
 * @returns 音符名称，如 "C4"
 */
export function semitoneToNote(semitone: number, octave: number = 4): string {
  const noteName = NOTE_NAMES[semitone % 12]
  return `${noteName}${octave}`
}

/**
 * 将音符名称转换为半音数
 * @param note 音符名称，如 "C4"
 * @returns 半音数 (0-11)
 */
export function noteToSemitone(note: string): number {
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) throw new Error(`Invalid note: ${note}`)
  
  const noteName = match[1]
  const index = NOTE_NAMES.indexOf(noteName)
  if (index === -1) throw new Error(`Invalid note name: ${noteName}`)
  
  return index
}

/**
 * 获取音符的完整MIDI编号
 * @param note 音符名称，如 "C4"
 * @returns MIDI编号 (0-127)
 */
export function noteToMidi(note: string): number {
  const match = note.match(/^([A-G]#?)(\d+)$/)
  if (!match) throw new Error(`Invalid note: ${note}`)
  
  const noteName = match[1]
  const octave = parseInt(match[2])
  const semitone = NOTE_NAMES.indexOf(noteName)
  
  return semitone + (octave + 1) * 12
}

/**
 * 将MIDI编号转换为音符名称
 * @param midi MIDI编号
 * @returns 音符名称
 */
export function midiToNote(midi: number): string {
  const octave = Math.floor(midi / 12) - 1
  const semitone = midi % 12
  return `${NOTE_NAMES[semitone]}${octave}`
}

/**
 * 音符接口
 */
export interface Note {
  value: string    // 唱名 "1", "#1", "b2"...
  offset: number   // 八度偏移
}

/**
 * 解析唱名到半音数
 * @param solfege 唱名，如 "1", "#1", "b2"
 * @returns 半音数 (0-11)
 */
export function parseSolfege(solfege: string): number {
  const index = SOLFEGE_NAMES.indexOf(solfege)
  if (index !== -1) return index
  
  // 处理降号
  if (solfege.startsWith('b')) {
    const sharp = '#' + solfege.substring(1)
    const sharpIndex = SOLFEGE_NAMES.indexOf(sharp)
    if (sharpIndex !== -1) return (sharpIndex - 1 + 12) % 12
  }
  
  throw new Error(`Invalid solfege: ${solfege}`)
}
