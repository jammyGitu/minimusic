'use client'

import React, { useEffect, useRef, useState, useCallback } from 'react'
import {
  PlayCircleOutlined,
  PauseCircleOutlined,
  SyncOutlined,
  SoundOutlined,
} from '@ant-design/icons'
import { moaTone } from '@/utils/MoaTone'
import styles from './staff.module.scss'

interface PresetScore {
  title: string
  composer: string
  abc: string
  tags: string[]
}

const PRESET_SCORES: PresetScore[] = [
  {
    title: '小星星',
    composer: '法国民谣',
    tags: ['入门', 'C大调'],
    abc: `X:1
T:小星星
C:法国民谣
M:4/4
L:1/4
K:C
C C G G | A A G2 | F F E E | D D C2 |
G G F F | E E D2 | G G F F | E E D2 |
C C G G | A A G2 | F F E E | D D C2 |`,
  },
  {
    title: '欢乐颂',
    composer: '贝多芬',
    tags: ['经典', 'C大调'],
    abc: `X:1
T:欢乐颂
C:贝多芬
M:4/4
L:1/4
K:C
E E F G | G F E D | C C D E | E D D2 |
E E F G | G F E D | C C D E | D C C2 |`,
  },
  {
    title: '卡农片段',
    composer: '帕赫贝尔',
    tags: ['经典', 'D大调'],
    abc: `X:1
T:卡农片段
C:帕赫贝尔
M:4/4
L:1/8
K:D
D F# A d | c# A F# D | G B d g | f# d B G |
A c# e a | g e c# A | D F# A d | c# A F# D |`,
  },
  {
    title: 'C大调音阶',
    composer: '练习',
    tags: ['练习', 'C大调'],
    abc: `X:1
T:C大调音阶
C:练习
M:4/4
L:1/4
K:C
C D E F | G A B c | c B A G | F E D C |`,
  },
  {
    title: '玛丽有只小羊羔',
    composer: '童谣',
    tags: ['入门', 'C大调'],
    abc: `X:1
T:玛丽有只小羊羔
C:童谣
M:4/4
L:1/4
K:C
E D C D | E E E2 | D D D2 | E G G2 |
E D C D | E E E E | D D E D | C C C2 |`,
  },
  {
    title: '致爱丽丝片段',
    composer: '贝多芬',
    tags: ['经典', 'A小调'],
    abc: `X:1
T:致爱丽丝片段
C:贝多芬
M:3/8
L:1/8
K:Am
E D# E D# | E B D C | A c e a | b e ^g b |
c e a b | c' d' e' c' | b a g# f | e f e d |`,
  },
]

// ABC 记谱法快速参考
const ABC_REF = [
  { code: 'X:1', desc: '曲目编号' },
  { code: 'T:标题', desc: '乐曲标题' },
  { code: 'M:4/4', desc: '拍号' },
  { code: 'L:1/4', desc: '默认音符长度' },
  { code: 'K:C', desc: '调性' },
  { code: 'C D E F', desc: '音符（大写=中音区）' },
  { code: 'c d e f', desc: '音符（小写=高音区）' },
  { code: '^C _D', desc: '升号 / 降号' },
  { code: 'C2 D4', desc: '数字 = 音符时值' },
  { code: '|', desc: '小节线' },
]

export default function StaffNotation() {
  const sheetRef = useRef<HTMLDivElement>(null)
  const [abcInput, setAbcInput] = useState(PRESET_SCORES[0].abc)
  const [abcjsLoaded, setAbcjsLoaded] = useState(false)
  const [ABCJS, setABCJS] = useState<any>(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentPreset, setCurrentPreset] = useState(0)
  const synthControllerRef = useRef<any>(null)
  const visualObjRef = useRef<any>(null)

  // 动态加载 ABCJS
  useEffect(() => {
    import('abcjs').then((module) => {
      const abcjsLib = module.default || module
      setABCJS(abcjsLib)
      setAbcjsLoaded(true)
    })
  }, [])

  // 渲染五线谱
  const renderSheet = useCallback(() => {
    if (!sheetRef.current || !ABCJS) return

    sheetRef.current.innerHTML = ''

    const visualObj = ABCJS.renderAbc(sheetRef.current, abcInput, {
      responsive: 'resize',
      viewportHorizontal: true,
      staffwidth: 720,
      paddingtop: 20,
      paddingbottom: 20,
      paddingright: 20,
      paddingleft: 20,
    })

    visualObjRef.current = visualObj
  }, [abcInput, ABCJS])

  // 播放乐谱（使用 abcjs 内置合成器 + 光标高亮）
  const playSheet = () => {
    if (!ABCJS || !sheetRef.current) return

    if (isPlaying) {
      // 停止播放
      if (synthControllerRef.current) {
        synthControllerRef.current.stop()
        synthControllerRef.current = null
      }
      if (visualObjRef.current) {
        // 重置高亮
        const allNotes = sheetRef.current.querySelectorAll('.abcjs-note')
        allNotes.forEach((n: Element) => {
          ;(n as HTMLElement).style.fill = ''
          ;(n as HTMLElement).style.color = ''
        })
      }
      setIsPlaying(false)
      return
    }

    try {
      const synthController = new ABCJS.synth.CreateSynth()
      synthControllerRef.current = synthController

      synthController
        .init({
          visualObj: visualObjRef.current?.[0],
          audioContext: undefined,
          millisecondsPerMeasure: undefined,
          options: {
            pan: [0, 0, 0],
          },
        })
        .then(() => {
          return synthController.prime()
        })
        .then(() => {
          return synthController.start()
        })
        .then(() => {
          setIsPlaying(true)
          // 播放完成后的回调
          const checkPlaying = setInterval(() => {
            if (!synthControllerRef.current?.isPlaying) {
              clearInterval(checkPlaying)
              setIsPlaying(false)
            }
          }, 500)
        })
        .catch((err: any) => {
          console.error('ABCJS 播放失败:', err)
          setIsPlaying(false)
        })
    } catch (err) {
      console.error('ABCJS 播放初始化失败:', err)
    }
  }

  // 使用 Tone.js 播放（备用方案，解析 ABC 后用 MoaTone 播放）
  const playWithTone = async () => {
    if (isPlaying) return
    const notes = parseABCNotes(abcInput)
    if (notes.length > 0) {
      await moaTone.playSequence(notes, 0.4)
    }
  }

  // ABC 音符解析
  const parseABCNotes = (abc: string): string[] => {
    const notes: string[] = []
    const lines = abc.split('\n')
    let currentOctave = 4

    for (const line of lines) {
      // 跳过元数据行
      if (
        /^[A-Za-z]:/.test(line.trim()) ||
        line.trim() === '' ||
        line.trim().startsWith('%')
      ) {
        continue
      }

      // 清理行内容
      const cleanLine = line.replace(/\|/g, ' ').trim()

      // 匹配 ABC 音符：可能带升降号、八度标记、长度数字
      // 格式：^C = C#, _D = Db, =C = C natural, C' = 高八度, C, = 低八度
      const notePattern = /(\^|=|_)?([A-Ga-g])([']*)(,?)(\d*)/g
      let match

      while ((match = notePattern.exec(cleanLine)) !== null) {
        const accidental = match[1] || ''
        const noteLetter = match[2]
        const apostrophes = match[3] || ''
        const commas = match[4] || ''

        // 构建音符名
        let noteName = noteLetter.toUpperCase()
        if (accidental === '^') noteName += '#'
        else if (accidental === '_') noteName += 'b'

        // 计算八度
        let octave = currentOctave
        // 大写字母 = 当前八度, 小写 = 高八度
        if (noteLetter === noteLetter.toLowerCase()) {
          octave += 1
        }
        // ' 表示升八度
        octave += apostrophes.length
        // , 表示降八度
        octave -= commas.length

        // 限制范围
        octave = Math.max(2, Math.min(6, octave))

        notes.push(`${noteName}${octave}`)
      }
    }

    return notes
  }

  // 选择预设乐谱
  const selectPreset = (index: number) => {
    setCurrentPreset(index)
    setAbcInput(PRESET_SCORES[index].abc)
    // 停止当前播放
    if (synthControllerRef.current) {
      synthControllerRef.current.stop()
      synthControllerRef.current = null
    }
    setIsPlaying(false)
  }

  // 输入变化时重新渲染
  useEffect(() => {
    if (abcjsLoaded) {
      const timer = setTimeout(() => renderSheet(), 300)
      return () => clearTimeout(timer)
    }
  }, [abcInput, abcjsLoaded, renderSheet])

  // 清理
  useEffect(() => {
    return () => {
      if (synthControllerRef.current) {
        synthControllerRef.current.stop()
      }
    }
  }, [])

  return (
    <div className={styles.page}>
      {/* 标题 */}
      <div className={styles.head}>
        <h2 className={styles.title}>📖 五线谱</h2>
        <p className={styles.subtitle}>ABC 记谱法渲染与播放，支持乐谱交互</p>
      </div>

      {/* 预设乐谱选择 */}
      <div className={styles.card}>
        <span className={styles.presetLabel}>预设乐谱</span>
        <div className={styles.presetRow}>
          {PRESET_SCORES.map((score, index) => (
            <button
              key={index}
              className={`${styles.presetBtn} ${currentPreset === index ? styles.presetBtnActive : ''}`}
              onClick={() => selectPreset(index)}
              type="button"
            >
              {score.title}
            </button>
          ))}
        </div>
      </div>

      {/* 五线谱渲染区 */}
      <div className={styles.card}>
        <div ref={sheetRef} className={styles.sheetBox} />
      </div>

      {/* 播放控制 */}
      <div className={styles.playBar}>
        <button
          className={styles.btnPrimary}
          onClick={playSheet}
          disabled={!abcjsLoaded}
          type="button"
        >
          {isPlaying ? <PauseCircleOutlined /> : <PlayCircleOutlined />}
          {isPlaying ? '停止播放' : 'ABCJS 播放'}
        </button>
        <button
          className={styles.btnSecondary}
          onClick={playWithTone}
          disabled={isPlaying}
          type="button"
        >
          <SoundOutlined /> Tone.js 播放
        </button>
        <button
          className={styles.btnSecondary}
          onClick={renderSheet}
          disabled={!abcjsLoaded}
          type="button"
        >
          <SyncOutlined /> 重新渲染
        </button>
      </div>

      {/* ABC 输入区 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>ABC 记谱法输入</h3>
        <textarea
          value={abcInput}
          onChange={(e) => {
            setAbcInput(e.target.value)
            setCurrentPreset(-1)
          }}
          rows={8}
          placeholder="输入 ABC 记谱法..."
          className={styles.textarea}
        />
      </div>

      {/* 说明卡片 */}
      <div className={styles.card}>
        <h3 className={styles.cardTitle}>🎵 ABC 记谱法快速参考</h3>
        <div className={styles.refGrid}>
          {ABC_REF.map((item) => (
            <div key={item.code}>
              <span className={styles.refCode}>{item.code}</span>
              <div className={styles.refDesc}>{item.desc}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
