import { useState } from 'react'
import type { Progress, Question } from '../types'
import { pool, shuffle } from '../data'
import { BOX_INTERVAL_DAYS, isDue } from '../storage'
import { QuestionRunner } from '../components/QuestionRunner'

interface Props {
  progress: Progress
  onAnswer: (id: string, correct: boolean) => void
  onToggleFlag: (id: string) => void
  onGoToSettings: () => void
}

export function Review({ progress, onAnswer, onToggleFlag, onGoToSettings }: Props) {
  const [session, setSession] = useState<{ title: string; questions: Question[] } | null>(null)

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

  const now = Date.now()
  const due = pool.questions.filter((q) => isDue(progress.q[q.id], now))
  const missed = pool.questions.filter((q) => progress.q[q.id] && !progress.q[q.id].lastCorrect && progress.q[q.id].attempts > 0)
  const unseen = pool.questions.filter((q) => !progress.q[q.id]?.attempts)
  const flagged = pool.questions.filter((q) => progress.q[q.id]?.flagged)

  // Weakest first: lowest box, then most recently missed.
  const dueSorted = [...due].sort((a, b) => progress.q[a.id].box - progress.q[b.id].box)

  const decks = [
    {
      title: 'Due for review',
      desc: 'Spaced repetition: questions come back sooner after you miss them and less often as you get them right.',
      qs: dueSorted.slice(0, 25),
      count: due.length,
    },
    { title: 'Missed last time', desc: 'Every question you got wrong on your most recent attempt.', qs: shuffle(missed).slice(0, 25), count: missed.length },
    { title: 'Never seen', desc: "Questions you haven't answered yet, in random order.", qs: shuffle(unseen).slice(0, 25), count: unseen.length },
    { title: 'Flagged explanations', desc: 'Questions whose explanation you flagged to double-check.', qs: flagged, count: flagged.length },
  ]

  return (
    <div>
      <h1>Smart review</h1>
      <p className="muted">
        Review intervals by box: {BOX_INTERVAL_DAYS.map((d, i) => `box ${i}: ${d === 0 ? 'now' : `${d}d`}`).join(' · ')}. A wrong answer sends a question back to box 0.
      </p>
      <div className="decks">
        {decks.map((d) => (
          <div key={d.title} className="card deck">
            <h3>{d.title} <span className="count">{d.count}</span></h3>
            <p className="muted">{d.desc}</p>
            <button disabled={d.qs.length === 0} onClick={() => setSession({ title: d.title, questions: d.qs })}>
              {d.qs.length === 0 ? 'Nothing here' : `Start (${d.qs.length})`}
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
