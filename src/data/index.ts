import raw from './technician_pool.json'
import type { Pool, Question } from '../types'

// Explanations live in one JSON file per subelement, keyed by question id.
const explanationFiles = import.meta.glob<Record<string, string>>('./explanations/*.json', {
  eager: true,
  import: 'default',
})
const explanations: Record<string, string> = Object.assign({}, ...Object.values(explanationFiles))

const base = raw as Omit<Pool, 'questions'> & { questions: Omit<Question, 'explanation'>[] }

export const pool: Pool = {
  ...base,
  questions: base.questions.map((q) => ({ ...q, explanation: explanations[q.id] ?? '' })),
}

export const questionById: Record<string, Question> = Object.fromEntries(pool.questions.map((q) => [q.id, q]))

export const questionsByGroup: Record<string, Question[]> = {}
for (const q of pool.questions) (questionsByGroup[q.group] ??= []).push(q)

export const figureUrl = (fig: string) => `${import.meta.env.BASE_URL}figures/${fig}.jpg`

/** Build a practice exam the way VEs do: one random question from each group. */
export function buildExam(): Question[] {
  return Object.keys(pool.groups).map((g) => {
    const qs = questionsByGroup[g]
    return qs[Math.floor(Math.random() * qs.length)]
  })
}

export function shuffle<T>(arr: T[]): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}
