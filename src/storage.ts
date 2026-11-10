import { useCallback, useEffect, useState } from 'react'
import type { ExamRecord, Progress, QStat } from './types'

const PROGRESS_KEY = 'hamprep.tech2026.progress'
const API_KEY_KEY = 'hamprep.anthropicApiKey'

const DAY = 24 * 60 * 60 * 1000
/** Days until a question in each Leitner box is due again. */
export const BOX_INTERVAL_DAYS = [0, 1, 3, 7, 14, 30]
export const MAX_BOX = BOX_INTERVAL_DAYS.length - 1

// Browser storage can be unavailable (private windows, blocked site data), so every access is guarded.
function read<T>(key: string, fallback: T): T {
  try {
    const v = localStorage.getItem(key)
    return v ? (JSON.parse(v) as T) : fallback
  } catch {
    return fallback
  }
}
function write(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage unavailable; progress lives only for this session */
  }
}

export const emptyProgress = (): Progress => ({ q: {}, exams: [] })

export function isDue(s: QStat | undefined, now = Date.now()): boolean {
  if (!s) return false
  return s.lastSeen + BOX_INTERVAL_DAYS[s.box] * DAY <= now
}

export function useProgress() {
  const [progress, setProgress] = useState<Progress>(() => read(PROGRESS_KEY, emptyProgress()))

  useEffect(() => write(PROGRESS_KEY, progress), [progress])

  const recordAnswer = useCallback((id: string, correct: boolean) => {
    setProgress((p) => {
      const prev = p.q[id] ?? { attempts: 0, correct: 0, box: 0, lastSeen: 0, lastCorrect: false }
      const next: QStat = {
        ...prev,
        attempts: prev.attempts + 1,
        correct: prev.correct + (correct ? 1 : 0),
        box: correct ? Math.min(prev.box + 1, MAX_BOX) : 0,
        lastSeen: Date.now(),
        lastCorrect: correct,
      }
      return { ...p, q: { ...p.q, [id]: next } }
    })
  }, [])

  const recordExam = useCallback((rec: ExamRecord) => {
    setProgress((p) => ({ ...p, exams: [...p.exams, rec] }))
  }, [])

  const toggleFlag = useCallback((id: string) => {
    setProgress((p) => {
      const prev = p.q[id] ?? { attempts: 0, correct: 0, box: 0, lastSeen: 0, lastCorrect: false }
      return { ...p, q: { ...p.q, [id]: { ...prev, flagged: !prev.flagged } } }
    })
  }, [])

  const replace = useCallback((p: Progress) => setProgress(p), [])

  return { progress, recordAnswer, recordExam, toggleFlag, replace }
}

export const getApiKey = () => read<string>(API_KEY_KEY, '')
export const setApiKey = (k: string) => write(API_KEY_KEY, k)
