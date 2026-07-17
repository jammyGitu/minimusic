/**
 * 音频引擎类 - 基于 Tone.js 封装
 * 提供音符播放、和弦播放、节拍器等核心音频能力
 */

// Tone.js 在 Next.js 环境下使用动态 import 方式加载
let Tone: any = null

async function loadTone(): Promise<any> {
  if (Tone) return Tone
  if (typeof window === 'undefined') return null
  
  try {
    // 在客户端环境中，使用动态导入
    const toneModule = await import('tone')
    
    // Tone.js 14.x 版本的导出结构可能需要特殊处理
    // 检查模块是否具有我们需要的构造函数
    if (toneModule.default) {
      Tone = toneModule.default
    } else {
      Tone = toneModule
    }
    
    // 验证 Tone.js 是否正确加载
    if (!Tone.Volume || !Tone.PolySynth || !Tone.MonoSynth || !Tone.Reverb || !Tone.Transport) {
      console.warn('Tone.js may not be loaded correctly, checking alternative structures...')
      // 尝试其他可能的结构
      if (typeof window !== 'undefined' && (window as any).Tone) {
        Tone = (window as any).Tone
      } else {
        // 如果还是不行，尝试直接使用模块
        Tone = toneModule
      }
    }
    
    return Tone
  } catch (error) {
    console.error('Failed to load Tone.js:', error)
    return null
  }
}

function getTone(): any {
  return Tone
}

export type SynthType = 'piano' | 'guitar' | 'organ' | 'strings' | 'bass'

export interface MoaToneOptions {
  volume?: number
  synthType?: SynthType
  bpm?: number
}

export class MoaTone {
  private synth: any = null
  private reverb: any = null
  private volumeNode: any = null
  private metronomeSynth: any = null
  private _bpm: number = 120
  private isInitialized: boolean = false
  private _synthType: SynthType = 'piano'

  private static readonly NOTE_NAMES = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B']

  private isBrowser(): boolean {
    return typeof window !== 'undefined' && typeof window.document !== 'undefined'
  }

  async init(options?: MoaToneOptions) {
    if (!this.isBrowser()) return
    if (this.isInitialized) {
      if (options) this.applyOptions(options)
      return
    }

    const T = await loadTone()
    if (!T) {
      console.error('Could not load Tone.js')
      return
    }

    // 再次验证 Tone.js 是否正确加载
    if (!T.Volume || !T.PolySynth || !T.MonoSynth || !T.Reverb || !T.Transport) {
      console.error('Tone.js is not loaded correctly:', {
        hasVolume: !!T.Volume,
        hasPolySynth: !!T.PolySynth,
        hasMonoSynth: !!T.MonoSynth,
        hasReverb: !!T.Reverb,
        hasTransport: !!T.Transport,
      })
      return
    }

    try {
      // 确保 Tone.js 已经准备好
      if (typeof T.start === 'function') {
        await T.start()
      }

      this.volumeNode = new T.Volume(this.toDecibels(options?.volume ?? 0.5)).toDestination()

      this.reverb = new T.Reverb({ decay: 1.5, wet: 0.3 }).connect(this.volumeNode)

      this.synth = new T.PolySynth({
        oscillator: { type: 'triangle' },
        envelope: {
          attack: 0.02,
          decay: 0.1,
          sustain: 0.3,
          release: 0.8,
        },
      }).connect(this.reverb)
      this.synth.maxPolyphony = 8

      this.metronomeSynth = new T.MonoSynth({
        oscillator: { type: 'sine' },
        envelope: { attack: 0.001, decay: 0.1, sustain: 0, release: 0 },
      }).connect(this.volumeNode)

      T.Transport.bpm.value = options?.bpm ?? this._bpm

      this._synthType = options?.synthType ?? 'piano'
      this.isInitialized = true
      
      console.log('Audio engine initialized successfully')
    } catch (error) {
      console.error('Error initializing audio engine:', error)
    }
  }

  private applyOptions(options: MoaToneOptions) {
    if (options.volume !== undefined && this.volumeNode) {
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

  setSynthType(type: SynthType) {
    this._synthType = type
    if (!this.isInitialized) return

    const T = getTone()
    if (!T) return

    try {
      this.synth?.dispose()

      const oscMap: Record<SynthType, string> = {
        piano: 'triangle',
        guitar: 'triangle',
        organ: 'sawtooth',
        strings: 'sawtooth',
        bass: 'triangle',
      }

      const envMap: Record<SynthType, Record<string, number>> = {
        piano: { attack: 0.005, decay: 0.2, sustain: 0.2, release: 1.2 },
        guitar: { attack: 0.002, decay: 0.3, sustain: 0.1, release: 0.8 },
        organ: { attack: 0.01, decay: 0.1, sustain: 0.7, release: 0.3 },
        strings: { attack: 0.1, decay: 0.2, sustain: 0.6, release: 1.5 },
        bass: { attack: 0.01, decay: 0.01, sustain: 0.3, release: 0.5 },
      }

      this.synth = new T.PolySynth({
        oscillator: { type: oscMap[type] },
        envelope: envMap[type],
      }).connect(this.reverb)
      this.synth.maxPolyphony = 8
    } catch (error) {
      console.error('Error setting synth type:', error)
    }
  }

  getSynthType(): SynthType {
    return this._synthType
  }

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

  playNote(note: string, duration: number = 0.5, time?: number) {
    if (!this.isInitialized) return
    const T = getTone()
    if (!T) return
    try {
      const freq = this.noteToFrequency(note)
      const t = time ?? T.now()
      this.synth.triggerAttackRelease(freq, duration, t)
    } catch (error) {
      console.error('Error playing note:', error)
    }
  }

  playNotes(notes: string[], duration: number = 0.8) {
    if (!this.isInitialized) return
    const T = getTone()
    if (!T) return
    try {
      const freqs = notes.map(n => this.noteToFrequency(n))
      const t = T.now()
      this.synth.triggerAttackRelease(freqs, duration, t)
    } catch (error) {
      console.error('Error playing notes:', error)
    }
  }

  async playSequence(notes: string[], interval: number = 0.5): Promise<void> {
    if (!this.isInitialized) return
    const T = getTone()
    if (!T) return
    try {
      const t = T.now()
      notes.forEach((note, index) => {
        this.playNote(note, interval * 0.8, t + index * interval)
      })
      return new Promise(resolve => {
        setTimeout(resolve, notes.length * interval * 1000 + 200)
      })
    } catch (error) {
      console.error('Error playing sequence:', error)
    }
  }

  setVolume(volume: number) {
    if (!this.isInitialized) return
    if (this.volumeNode) {
      this.volumeNode.volume.value = this.toDecibels(Math.max(0, Math.min(1, volume)))
    }
  }

  setBPM(bpm: number) {
    this._bpm = bpm
    if (!this.isInitialized) return
    const T = getTone()
    if (T) {
      try {
        T.Transport.bpm.value = bpm
      } catch (error) {
        console.error('Error setting BPM:', error)
      }
    }
  }

  getBPM(): number {
    return this._bpm
  }

  startMetronome(beats: number = 0) {
    if (!this.isInitialized) return
    const T = getTone()
    if (!T) return
    try {
      const bpm = this._bpm
      const beatInterval = 60 / bpm

      let count = 0
      const loop = new T.Loop((time: number) => {
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
      T.Transport.start()
      return loop
    } catch (error) {
      console.error('Error starting metronome:', error)
    }
  }

  stopMetronome() {
    const T = getTone()
    if (!T) return
    try {
      T.Transport.cancel()
      T.Transport.stop()
    } catch (error) {
      console.error('Error stopping metronome:', error)
    }
  }

  stopAll() {
    if (!this.isInitialized) return
    try {
      this.synth.releaseAll()
    } catch (error) {
      console.error('Error stopping all sounds:', error)
    }
  }

  dispose() {
    this.stopAll()
    this.stopMetronome()
    if (this.isInitialized) {
      try {
        this.synth?.dispose()
        this.reverb?.dispose()
        this.volumeNode?.dispose()
        this.metronomeSynth?.dispose()
        this.isInitialized = false
      } catch (error) {
        console.error('Error disposing audio engine:', error)
      }
    }
  }
}

export const moaTone = new MoaTone()