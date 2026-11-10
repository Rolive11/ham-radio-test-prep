import { useState } from 'react'
import type { ExamRecord, Progress, Question } from '../types'
import { buildExam, pool } from '../data'
import { QuestionCard } from '../components/QuestionCard'

interface Props {
  progress: Progress
  onAnswer: (id: string, correct: boolean) => void
  onFinish: (rec: ExamRecord) => void
  onToggleFlag: (id: string) => void
  onGoToSettings: () => void
}

type Phase = 'intro' | 'taking' | 'results'

export function Exam({ progress, onAnswer, onFinish, onToggleFlag, onGoToSettings }: Props) {
  const [phase, setPhase] = useState<Phase>('intro')
  const [questions, setQuestions] = useState<Question[]>([])
  const [answers, setAnswers] = useState<Record<string, number>>({})
  const [idx, setIdx] = useState(0)
  const [reviewIdx, setReviewIdx] = useState<number | null>(null)

  const start = () => {
    setQuestions(buildExam())
    setAnswers({})
    setIdx(0)
    setReviewIdx(null)
    setPhase('taking')
  }

  const submit = () => {
    const missed = questions.filter((q) => answers[q.id] !== q.answer).map((q) => q.id)
    const score = questions.length - missed.length
    questions.forEach((q) => onAnswer(q.id, answers[q.id] === q.answer))
    onFinish({ date: Date.now(), score, total: questions.length, passed: score >= pool.passScore, missed })
    setPhase('results')
  }

  if (phase === 'intro') {
    const last = progress.exams.slice(-5).reverse()
    return (
      <div>
        <h1>Practice exam</h1>
        <div className="card">
          <p>
            This exam is built the same way as the real Element 2 exam: <strong>{pool.examSize} questions</strong>, one drawn at
            random from each of the {Object.keys(pool.groups).length} question groups. You need{' '}
            <strong>{pool.passScore} correct</strong> (74%) to pass.
          </p>
          <p className="muted">You won't see answers or explanations until you submit, just like the real exam. There is no time limit.</p>
          <button onClick={start}>Start practice exam</button>
        </div>
        {last.length > 0 && (
          <div className="card">
            <h3>Recent exams</h3>
            <ul className="plain">
              {last.map((e) => (
                <li key={e.date}>
                  <span className={e.passed ? 'pass' : 'fail'}>{e.passed ? 'PASS' : 'FAIL'}</span> {e.score}/{e.total} ·{' '}
                  <span className="muted">{new Date(e.date).toLocaleString()}</span>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    )
  }

  if (phase === 'taking') {
    const q = questions[idx]
    const answeredCount = Object.keys(answers).length
    return (
      <div>
        <div className="runner-head">
          <div>
            <strong>Practice exam</strong>
            <div className="muted">Question {idx + 1} of {questions.length} · {answeredCount} answered</div>
          </div>
        </div>
        <div className="dots">
          {questions.map((x, i) => (
            <button
              key={x.id}
              className={`dot ${answers[x.id] !== undefined ? 'done' : ''} ${i === idx ? 'cur' : ''}`}
              onClick={() => setIdx(i)}
              title={`Question ${i + 1}`}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <QuestionCard
          key={q.id}
          question={q}
          selected={answers[q.id] ?? null}
          onSelect={(c) => setAnswers((a) => ({ ...a, [q.id]: c }))}
          reveal={false}
        />
        <div className="row nav">
          <button className="secondary" disabled={idx === 0} onClick={() => setIdx(idx - 1)}>Previous</button>
          {idx < questions.length - 1 ? (
            <button onClick={() => setIdx(idx + 1)}>Next</button>
          ) : (
            <button
              onClick={() => {
                if (answeredCount < questions.length) {
                  const first = questions.findIndex((x) => answers[x.id] === undefined)
                  setIdx(first)
                } else submit()
              }}
            >
              {answeredCount < questions.length ? `Go to first unanswered (${questions.length - answeredCount} left)` : 'Submit exam'}
            </button>
          )}
        </div>
        {answeredCount === questions.length && idx < questions.length - 1 && (
          <div className="row nav"><button onClick={submit}>Submit exam</button></div>
        )}
      </div>
    )
  }

  // Results
  const score = questions.filter((q) => answers[q.id] === q.answer).length
  const passed = score >= pool.passScore
  const bySub = pool.subelements.map((s) => {
    const qs = questions.filter((q) => q.subelement === s.id)
    return { s, right: qs.filter((q) => answers[q.id] === q.answer).length, total: qs.length }
  })

  if (reviewIdx !== null) {
    const q = questions[reviewIdx]
    return (
      <div>
        <div className="runner-head">
          <button className="ghost" onClick={() => setReviewIdx(null)}>← Results</button>
          <div className="muted">Reviewing question {reviewIdx + 1} of {questions.length}</div>
        </div>
        <QuestionCard
          key={q.id}
          question={q}
          selected={answers[q.id] ?? null}
          onSelect={() => {}}
          reveal
          flagged={progress.q[q.id]?.flagged}
          onToggleFlag={() => onToggleFlag(q.id)}
          onGoToSettings={onGoToSettings}
        />
        <div className="row nav">
          <button className="secondary" disabled={reviewIdx === 0} onClick={() => setReviewIdx(reviewIdx - 1)}>Previous</button>
          <button disabled={reviewIdx === questions.length - 1} onClick={() => setReviewIdx(reviewIdx + 1)}>Next</button>
        </div>
      </div>
    )
  }

  return (
    <div>
      <h1>Exam results</h1>
      <div className={`card result ${passed ? 'ok' : 'bad'}`}>
        <div className="big">{score} / {questions.length}</div>
        <div className="verdict">{passed ? 'PASS' : 'Not yet'} · needed {pool.passScore}</div>
      </div>
      <div className="card">
        <h3>By subelement</h3>
        <table className="table">
          <tbody>
            {bySub.map(({ s, right, total }) => (
              <tr key={s.id}>
                <td><span className="badge">{s.id}</span> {s.title}</td>
                <td className={right === total ? 'pass' : right === 0 ? 'fail' : ''}>{right}/{total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="card">
        <h3>Review your answers</h3>
        <div className="dots">
          {questions.map((q, i) => (
            <button
              key={q.id}
              className={`dot ${answers[q.id] === q.answer ? 'right' : 'miss'}`}
              onClick={() => setReviewIdx(i)}
              title={q.id}
            >
              {i + 1}
            </button>
          ))}
        </div>
        <p className="muted small">Green is correct and red is missed. Click any number to see the explanation. Missed questions also go into Smart Review.</p>
      </div>
      <div className="row">
        <button onClick={start}>Take another exam</button>
        <button className="secondary" onClick={() => setPhase('intro')}>Done</button>
      </div>
    </div>
  )
}
