/**
 * 学习进度状态管理
 * 使用Valtio进行状态管理
 */

import { proxy } from 'valtio'

/**
 * 练习记录接口
 */
export interface PracticeRecord {
  type: 'interval' | 'harmony' | 'melody' | 'rhythm' | 'chord-progression' | 'staff-note'
  timestamp: number
  correct: number
  total: number
  accuracy: number
}

/**
 * 学习进度状态
 */
export interface ProgressState {
  records: PracticeRecord[]
  totalPractice: number
  totalCorrect: number
  streak: number  // 连续练习天数
  lastPracticeDate: string | null
}

// 从localStorage加载数据
const loadFromStorage = (): ProgressState => {
  if (typeof window === 'undefined') {
    return {
      records: [],
      totalPractice: 0,
      totalCorrect: 0,
      streak: 0,
      lastPracticeDate: null,
    }
  }
  
  const stored = localStorage.getItem('minimusic-progress')
  if (stored) {
    try {
      return JSON.parse(stored)
    } catch {
      return {
        records: [],
        totalPractice: 0,
        totalCorrect: 0,
        streak: 0,
        lastPracticeDate: null,
      }
    }
  }
  
  return {
    records: [],
    totalPractice: 0,
    totalCorrect: 0,
    streak: 0,
    lastPracticeDate: null,
  }
}

// 创建状态
export const progressState = proxy<ProgressState>(loadFromStorage())

/**
 * 保存到localStorage
 */
const saveToStorage = () => {
  if (typeof window !== 'undefined') {
    localStorage.setItem('minimusic-progress', JSON.stringify(progressState))
  }
}

/**
 * 添加练习记录
 */
export function addPracticeRecord(
  type: PracticeRecord['type'],
  correct: number,
  total: number
) {
  const accuracy = total > 0 ? Math.round((correct / total) * 100) : 0
  const record: PracticeRecord = {
    type,
    timestamp: Date.now(),
    correct,
    total,
    accuracy,
  }
  
  progressState.records.push(record)
  progressState.totalPractice += total
  progressState.totalCorrect += correct
  
  // 更新连续练习天数
  const today = new Date().toDateString()
  if (progressState.lastPracticeDate !== today) {
    const yesterday = new Date()
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (progressState.lastPracticeDate === yesterday.toDateString()) {
      progressState.streak += 1
    } else {
      progressState.streak = 1
    }
    
    progressState.lastPracticeDate = today
  }
  
  saveToStorage()
}

/**
 * 获取总体正确率
 */
export function getOverallAccuracy(): number {
  if (progressState.totalPractice === 0) return 0
  return Math.round((progressState.totalCorrect / progressState.totalPractice) * 100)
}

/**
 * 获取特定类型的练习记录
 */
export function getRecordsByType(type: PracticeRecord['type']): PracticeRecord[] {
  return progressState.records.filter(record => record.type === type)
}

/**
 * 清除所有记录
 */
export function clearProgress() {
  progressState.records = []
  progressState.totalPractice = 0
  progressState.totalCorrect = 0
  progressState.streak = 0
  progressState.lastPracticeDate = null
  saveToStorage()
}
