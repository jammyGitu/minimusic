/**
 * 音频引擎类 - 使用原生Web Audio API实现
 * 提供音符播放、和弦播放等核心音频能力
 */

export class MoaTone {
  private audioContext: AudioContext | null = null
  private isInitialized: boolean = false
  private bpm: number = 120

  /**
   * 检查是否在浏览器环境中
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined'
  }

  /**
   * 获取或创建AudioContext
   */
  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)()
    }
    return this.audioContext
  }

  /**
   * 初始化音频上下文
   * 必须在用户交互后调用
   */
  async init() {
    if (!this.isBrowser()) return
    if (this.isInitialized) return
    
    const ctx = this.getAudioContext()
    if (ctx.state === 'suspended') {
      await ctx.resume()
    }
    this.isInitialized = true
  }

  /**
   * 将音符名称转换为频率
   * @param note 音符名称，如 "C4", "D#5"
   */
  private noteToFrequency(note: string): number {
    const NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']
    const match = note.match(/^([A-G]#?)(\d+)$/)
    
    if (!match) return 440
    
    const noteName = match[1]
    const octave = parseInt(match[2])
    
    // 验证八度范围
    if (isNaN(octave) || octave < 0 || octave > 10) return 440
    
    const semitone = NOTE_NAMES.indexOf(noteName)
    
    if (semitone === -1) return 440
    
    // A4 = 440 Hz (MIDI note 69)
    const midiNote = semitone + octave * 12 + 12 // C0 is MIDI note 12
    
    // 计算频率并确保在有效范围内
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12)
    
    // 验证频率是否有效
    if (isNaN(frequency) || !isFinite(frequency) || frequency <= 0) {
      return 440
    }
    
    return frequency
  }

  /**
   * 播放单个音符
   * @param note 音符名称，如 "C4", "D#5"
   * @param duration 持续时间（秒），默认0.5秒
   */
  async playNote(note: string, duration: number = 0.5) {
    if (!this.isBrowser()) return
    await this.init()
    
    // 验证持续时间
    if (isNaN(duration) || !isFinite(duration) || duration <= 0) {
      duration = 0.5
    }
    
    const ctx = this.getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = 'triangle'
    
    const frequency = this.noteToFrequency(note)
    // 验证频率
    if (isFinite(frequency) && frequency > 0) {
      oscillator.frequency.setValueAtTime(frequency, ctx.currentTime)
    } else {
      oscillator.frequency.setValueAtTime(440, ctx.currentTime)
    }
    
    // 音量包络 - 使用线性淡出避免指数衰减的问题
    const currentTime = ctx.currentTime
    const endTime = currentTime + duration
    
    gainNode.gain.setValueAtTime(0.1, currentTime)
    
    // 使用 linearRampToValueAtTime 替代 exponentialRampToValueAtTime
    // 避免指数衰减时目标值过小导致的问题
    gainNode.gain.linearRampToValueAtTime(0.01, endTime)
    
    oscillator.start(currentTime)
    oscillator.stop(endTime)
  }

  /**
   * 播放多个音符（和弦）
   * @param notes 音符数组
   * @param duration 持续时间（秒）
   */
  async playNotes(notes: string[], duration: number = 0.8) {
    if (!this.isBrowser()) return
    await this.init()
    
    notes.forEach(note => {
      this.playNote(note, duration)
    })
  }

  /**
   * 播放音符序列
   * @param notes 音符数组
   * @param interval 每个音符之间的间隔时间（秒）
   */
  async playSequence(notes: string[], interval: number = 0.5) {
    if (!this.isBrowser()) return
    await this.init()
    
    notes.forEach((note, index) => {
      setTimeout(() => {
        this.playNote(note, interval * 0.8)
      }, index * interval * 1000)
    })
  }

  /**
   * 设置BPM
   * @param bpm 每分钟节拍数
   */
  setBPM(bpm: number) {
    this.bpm = bpm
  }

  /**
   * 获取当前BPM
   */
  getBPM(): number {
    return this.bpm
  }

  /**
   * 播放节拍器滴答声
   */
  async playMetronome() {
    if (!this.isBrowser()) return
    await this.init()
    
    const ctx = this.getAudioContext()
    const oscillator = ctx.createOscillator()
    const gainNode = ctx.createGain()
    
    oscillator.connect(gainNode)
    gainNode.connect(ctx.destination)
    
    oscillator.type = 'sine'
    oscillator.frequency.setValueAtTime(880, ctx.currentTime)
    
    gainNode.gain.setValueAtTime(0.3, ctx.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.1)
    
    oscillator.start(ctx.currentTime)
    oscillator.stop(ctx.currentTime + 0.1)
  }

  /**
   * 停止所有声音
   */
  stopAll() {
    if (!this.isBrowser()) return
    if (this.audioContext) {
      // 无法直接停止，但可以创建静音增益节点
      this.audioContext.close()
      this.audioContext = null
      this.isInitialized = false
    }
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopAll()
  }
}

// 导出单例实例
export const moaTone = new MoaTone()
