export interface Question {
  id: string
  subelement: string
  group: string
  question: string
  choices: string[]
  answer: number
  refs: string
  figure: string | null
  explanation: string
}

export interface Subelement {
  id: string
  title: string
  examQuestions: number
  groups: string[]
}

export interface Group {
  id: string
  title: string
}

export interface Pool {
  element: number
  name: string
  poolYears: string
  validFrom: string
  validTo: string
  source: string
  examSize: number
  passScore: number
  subelements: Subelement[]
  groups: Record<string, Group>
  questions: Question[]
}

/** Per-question study history, used for spaced repetition and mastery stats. */
export interface QStat {
  attempts: number
  correct: number
  /** Leitner box 0-5; higher means better known and reviewed less often. */
  box: number
  lastSeen: number
  lastCorrect: boolean
  flagged?: boolean
}

export interface ExamRecord {
  date: number
  score: number
  total: number
  passed: boolean
  missed: string[]
}

export interface Progress {
  q: Record<string, QStat>
  exams: ExamRecord[]
}
