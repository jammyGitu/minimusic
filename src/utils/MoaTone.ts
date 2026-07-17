/**
 * 音频引擎类 - 基于 Tone.js 封装
 * 提供音符播放、和弦播放、节拍器、录音等核心音频能力
 */
import * as Tone from 'tone'

export type SynthType = 'piano' | 'guitar' | 'organ' | 'strings' | 'bass'

export interface MoaToneOptions {
  volume?: number      // 0-1
  synthType?: SynthType
  bpm?: number
}

/**
 * 音频引擎单例类
 */
export class MoaTone {
  private synth!: Tone.PolySynth | Tone.Synth
  private reverb!: Tone.Reverb
  private volumeNode!: Tone.Volume
  private metronomeSynth!: Tone.Synth
  private _bpm: number = 120
  private isInitialized: boolean = false
  private _synthType: SynthType = 'piano'

  // 音符频率映射
  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  /**
   * 检查是否在浏览器环境中
   */
  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined'
  }

  /**
   * 初始化音频引擎
   * 必须在用户交互后调用
   */
  async init(options?: MoaToneOptions) {
    if (!this.isBrowser()) return
    if (this.isInitialized) {
      if (options) this.applyOptions(options)
      return
    }

    await Tone.start()

    // 音量控制
    this.volumeNode = new Tone.Volume(this.toDecibels(options?.volume ?? 0.5)).toDestination()

    // 混响
    this.reverb = new Tone.Reverb({ decay: 1.5, wet: 0.3 }).connect(this.volumeNode)

    // 主合成器 - 使用 PolySynth 支持多音
    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: 'triangle' },
      envelope: {
        attack: 0.02,
        decay: 0.1,
        sustain: 0.3,
        release: 0.8,
      },
    } as any).connect(this.reverb)

    // 节拍器合成器
    this.metronomeSynth = new Tone.Synth({
      oscillator: { type: 'sine' },
      envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0 },
    }).connect(this.volumeNode)

    // 设置 BPM
    Tone.getTransport().bpm.value = options?.bpm ?? this._bpm

    this._synthType = options?.synthType ?? 'piano'
    this.isInitialized = true
  }

  private applyOptions(options: MoaToneOptions) {
    if (options.volume !== undefined) {
      this.volumeNode.volume.value = this.toDecibels(options.volume)
    }
    if (options.bpm !== undefined) {
      this.setBPM(options.bpm)
    }
    if (options.synthType !== undefined) {
      this.setSynthType(options.synthType)
    }
  }

  private toDecibels(volume: number): number {
    return volume <= 0 ? -60 : 20 * Math.log10(volume)
  }

  /**
   * 切换音色
   */
  setSynthType(type: SynthType) {
    this._synthType = type
    if (!this.isInitialized) return

    this.synth.dispose()

    const oscMap: Record<SynthType, OscillatorType> = {
      piano: 'triangle',
      guitar: 'triangle',
      organ: 'sawtooth',
      strings: 'sawtooth',
      bass: 'triangle',
    }

    const envMap: Record<SynthType, any> = {
      piano: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 1.2 },
      guitar: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.8 },
      organ: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
      strings: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 1.5 },
      bass: { attack: 0.01, decay: 0.1, sustain: 0.3, release: 0.5 },
    }

    this.synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: oscMap[type] },
      envelope: envMap[type],
    } as any).connect(this.reverb)
  }

  /**
   * 获取当前音色
   */
  getSynthType(): SynthType {
    return this._synthType
  }

  /**
   * 将音符名称转换为频率
   */
  noteToFrequency(note: string): number {
    const match = note.match(/^([A-G]#?)(\d+)$/)
    if (!match) return 440
    const noteName = match[1]
    const octave = parseInt(match[2])
    const semitone = MoaTone.NOTE_NAMES.indexOf(noteName)
    if (semitone === -1) return 440
    const midiNote = semitone + octave * 12 + 12
    const frequency = 440 * Math.pow(2, (midiNote - 69) / 12)
    return isNaN(frequency) || !isFinite(frequency) || frequency <= 0 ? 440 : frequency
  }

  /**
   * 播放单个音符
   * @param note 音符名称，如 "C4", "D#5"
   * @param duration 持续时间（秒），默认0.5
   * @param time 可选，在指定时间播放（用于调度）
   */
  playNote(note: string, duration: number = 0.5, time?: number) {
    if (!this.isInitialized) return
    const freq = this.noteToFrequency(note)
    const now = time ?? Tone.now()
    ;(this.synth as Tone.PolySynth).triggerAttackRelease(freq, duration, now)
  }

  /**
   * 播放多个音符（和弦）
   * @param notes 音符数组
   * @param duration 持续时间（秒）
   */
  playNotes(notes: string[], duration: number = 0.8) {
    if (!this.isInitialized) return
    const freqs = notes.map(n => this.noteToFrequency(n))
    const now = Tone.now()
    ;(this.synth as Tone.PolySynth).triggerAttackRelease(freqs, duration, now)
  }

  /**
   * 播放音符序列
   * @param notes 音符数组
   * @param interval 每个音符之间的间隔时间（秒）
   */
  async playSequence(notes: string[], interval: number = 0.5): Promise<void> {
    if (!this.isInitialized) return
    const now = Tone.now()
    notes.forEach((note, index) => {
      this.playNote(note, interval * 0.8, now + index * interval)
    })
    // 返回一个在序列完成后 resolve 的 Promise
    return new Promise(resolve => {
      setTimeout(resolve, notes.length * interval * 1000 + 200)
    })
  }

  /**
   * 设置音量
   * @param volume 0-1
   */
  setVolume(volume: number) {
    if (!this.isInitialized) return
    this.volumeNode.volume.value = this.toDecibels(Math.max(0, Math.min(1, volume)))
  }

  /**
   * 设置 BPM
   */
  setBPM(bpm: number) {
    this._bpm = bpm
    if (this.isInitialized) {
      Tone.getTransport().bpm.value = bpm
    }
  }

  /**
   * 获取当前 BPM
   */
  getBPM(): number {
    return this._bpm
  }

  /**
   * 播放节拍器
   * @param beats 节拍数，0 表示持续播放
   */
  startMetronome(beats: number = 0) {
    if (!this.isInitialized) return
    const bpm = this._bpm
    const beatInterval = 60 / bpm

    let count = 0
    const loop = new Tone.Loop((time) => {
      const isDownbeat = count % 4 === 0
      this.metronomeSynth.triggerAttackRelease(
        isDownbeat ? 880 : 660,
        isDownbeat ? 0.08 : 0.05,
        time,
        isDownbeat ? 0.6 : 0.3
      )
      count++
      if (beats > 0 && count >= beats) {
        loop.stop()
      }
    }, beatInterval)

    loop.start(0)
    Tone.getTransport().start()
    return loop
  }

  /**
   * 停止节拍器
   */
  stopMetronome() {
    Tone.getTransport().cancel()
    Tone.getTransport().stop()
  }

  /**
   * 停止所有声音
   */
  stopAll() {
    if (!this.isInitialized) return
    ;(this.synth as Tone.PolySynth).releaseAll()
  }

  /**
   * 清理资源
   */
  dispose() {
    this.stopAll()
    this.stopMetronome()
    if (this.isInitialized) {
      this.synth.dispose()
      this.reverb.dispose()
      this.volumeNode.dispose()
      this.metronomeSynth.dispose()
      this.isInitialized = false
    }
  }
}

// 导出单例实例
export const moaTone = new MoaTone()
