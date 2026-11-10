import { useState } from 'react'
import type { Progress, Question } from '../types'
import { QuestionCard } from './QuestionCard'

interface Props {
  title: string
  questions: Question[]
  progress: Progress
  onAnswer: (id: string, correct: boolean) => void
  onToggleFlag: (id: string) => void
  onGoToSettings: () => void
  onExit: () => void
}

/** Steps through a set of questions with immediate feedback and explanations. */
export function QuestionRunner({ title, questions, progress, onAnswer, onToggleFlag, onGoToSettings, onExit }: Props) {
  const [idx, setIdx] = useState(0)
  const [answers, setAnswers] = useState<Record<string, number>>({})

  const q = questions[idx]
  const done = Object.keys(answers).length
  const right = questions.filter((x) => answers[x.id] === x.answer).length

  if (!q) {
    return (
      <div className="card">
        <p>No questions to show here.</p>
        <button onClick={onExit}>Back</button>
      </div>
    )
  }

  const select = (choice: number) => {
    if (answers[q.id] !== undefined) return
    setAnswers((a) => ({ ...a, [q.id]: choice }))
    onAnswer(q.id, choice === q.answer)
  }

  const finished = done === questions.length

  return (
    <div>
      <div className="runner-head">
        <button className="ghost" onClick={onExit}>← Back</button>
        <div>
          <strong>{title}</strong>
          <div className="muted">
            Question {idx + 1} of {questions.length} · {right}/{done} correct
          </div>
        </div>
      </div>
      <div className="progressbar"><div style={{ width: `${(done / questions.length) * 100}%` }} /></div>

      <QuestionCard
        key={q.id}
        question={q}
        selected={answers[q.id] ?? null}
        onSelect={select}
        reveal
        flagged={progress.q[q.id]?.flagged}
        onToggleFlag={() => onToggleFlag(q.id)}
        onGoToSettings={onGoToSettings}
      />

      <div className="row nav">
        <button className="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
        {idx < questions.length - 1 ? (
          <button onClick={() => setIdx(idx + 1)}>{answers[q.id] === undefined ? 'Skip' : 'Next'}</button>
        ) : (
          <button onClick={onExit}>Finish</button>
        )}
      </div>
      {finished && (
        <div className="card summary">
          Set complete: <strong>{right} of {questions.length}</strong> correct ({Math.round((right / questions.length) * 100)}%).
        </div>
      )}
    </div>
  )
}
