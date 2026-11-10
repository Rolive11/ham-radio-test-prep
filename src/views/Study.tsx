import { useState } from 'react'
import type { Progress, Question } from '../types'
import { pool, questionsByGroup, shuffle } from '../data'
import { QuestionRunner } from '../components/QuestionRunner'

interface Props {
  progress: Progress
  onAnswer: (id: string, correct: boolean) => void
  onToggleFlag: (id: string) => void
  onGoToSettings: () => void
}

export function Study({ progress, onAnswer, onToggleFlag, onGoToSettings }: Props) {
  const [session, setSession] = useState<{ title: string; questions: Question[] } | null>(null)
  const [shuffled, setShuffled] = useState(false)
  const [open, setOpen] = useState<string | null>(null)

  const start = (title: string, qs: Question[]) => setSession({ title, questions: shuffled ? shuffle(qs) : qs })

  if (session) {
    return (
      <QuestionRunner
        {...session}
        progress={progress}
        onAnswer={onAnswer}
        onToggleFlag={onToggleFlag}
        onGoToSettings={onGoToSettings}
        onExit={() => setSession(null)}
      />
    )
  }

  const stat = (qs: Question[]) => {
    const seen = qs.filter((q) => progress.q[q.id]?.attempts).length
    const known = qs.filter((q) => progress.q[q.id]?.lastCorrect).length
    return { seen, known, total: qs.length }
  }

  return (
    <div>
      <h1>Study by topic</h1>
      <p className="muted">
        Pick a subelement or a single group. Each answer shows an explanation right away, and you can ask the AI tutor follow-up questions.
      </p>
      <label className="toggle">
        <input type="checkbox" checked={shuffled} onChange={(e) => setShuffled(e.target.checked)} /> Shuffle question order
      </label>

      <div className="topics">
        {pool.subelements.map((s) => {
          const qs = pool.questions.filter((q) => q.subelement === s.id)
          const st = stat(qs)
          return (
            <div key={s.id} className="card topic">
              <div className="topic-head">
                <button className="topic-title" onClick={() => setOpen(open === s.id ? null : s.id)}>
                  <span className="badge">{s.id}</span> {s.title}
                  <span className="muted"> · {s.examQuestions} exam questions · {qs.length} in pool</span>
                </button>
                <button onClick={() => start(`${s.id} ${s.title}`, qs)}>Study all</button>
              </div>
              <Meter known={st.known} seen={st.seen} total={st.total} />
              {open === s.id && (
                <ul className="groups">
                  {s.groups.map((g) => {
                    const gq = questionsByGroup[g]
                    const gs = stat(gq)
                    return (
                      <li key={g}>
                        <div>
                          <span className="badge">{g}</span> {pool.groups[g].title}
                          <div className="muted small">{gs.known}/{gs.total} answered correctly last time</div>
                        </div>
                        <button className="secondary" onClick={() => start(`${g}`, gq)}>Study</button>
                      </li>
                    )
                  })}
                </ul>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function Meter({ known, seen, total }: { known: number; seen: number; total: number }) {
  return (
    <div className="meter" title={`${known} correct on last attempt, ${seen} seen, ${total} total`}>
      <div className="meter-seen" style={{ width: `${(seen / total) * 100}%` }} />
      <div className="meter-known" style={{ width: `${(known / total) * 100}%` }} />
    </div>
  )
}
