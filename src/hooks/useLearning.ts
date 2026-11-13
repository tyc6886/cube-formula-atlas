import { useCallback, useEffect, useState } from 'react'
import { algorithmLocationMap } from '@/data/catalog'
import type { LearningStatus } from '@/types'

const STORAGE_KEY = 'cube-formula-learning-v1'
const STORAGE_ERROR = '浏览器存储不可用，本次记录可能无法保留'

interface LearningData {
  favorites: string[]
  statuses: Record<string, LearningStatus>
}

const emptyData: LearningData = { favorites: [], statuses: {} }

function readData(): LearningData {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null')
    if (!parsed || typeof parsed !== 'object') return emptyData
    const candidate = parsed as { favorites?: unknown; statuses?: unknown }
    const favorites = Array.isArray(candidate.favorites)
      ? [...new Set(candidate.favorites.filter((id): id is string => typeof id === 'string' && algorithmLocationMap.has(id)))]
      : []
    const statuses: Record<string, LearningStatus> = {}
    if (candidate.statuses && typeof candidate.statuses === 'object' && !Array.isArray(candidate.statuses)) {
      for (const [id, status] of Object.entries(candidate.statuses)) {
        if (algorithmLocationMap.has(id) && (status === 'learning' || status === 'mastered')) statuses[id] = status
      }
    }
    return { favorites, statuses }
  } catch {
    return emptyData
  }
}

function writeData(data: LearningData): boolean {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(data)); return true }
  catch { return false }
}

export function useLearning() {
  const [data, setData] = useState<LearningData>(readData)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const toggleFavorite = useCallback((id: string) => {
    const exists = data.favorites.includes(id)
    const next = { ...data, favorites: exists ? data.favorites.filter((item) => item !== id) : [...data.favorites, id] }
    setData(next)
    setToast(writeData(next) ? exists ? '已取消收藏' : '已加入收藏' : STORAGE_ERROR)
  }, [data])

  const setStatus = useCallback((id: string, status: LearningStatus) => {
    const statuses = { ...data.statuses }
    if (status === 'unlearned') delete statuses[id]
    else statuses[id] = status
    const next = { ...data, statuses }
    setData(next)
    const message = status === 'mastered' ? '已标记为掌握' : status === 'learning' ? '已加入学习中' : '已重置学习状态'
    setToast(writeData(next) ? message : STORAGE_ERROR)
  }, [data])

  const resetProgress = useCallback(() => {
    setData(emptyData)
    setToast(writeData(emptyData) ? '学习记录已清空' : STORAGE_ERROR)
  }, [])

  return { data, toast, setToast, toggleFavorite, setStatus, resetProgress }
}

export type LearningController = ReturnType<typeof useLearning>
