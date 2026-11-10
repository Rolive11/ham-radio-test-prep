import type { Progress } from '../types'
import { pool } from '../data'
import { isDue } from '../storage'
import { Meter } from './Study'

interface Props {
  progress: Progress
  go: (view: 'study' | 'exam' | 'review' | 'guide') => void
}

/**
 * Expected exam score: for each subelement, the share of its questions answered correctly
 * on the latest attempt (unseen questions count as a 25% guess), times the number of exam
 * questions drawn from it.
 */
function expectedScore(progress: Progress): number {
  let total = 0
  for (const s of pool.subelements) {
    const qs = pool.questions.filter((q) => q.subelement === s.id)
    const p = qs.reduce((acc, q) => {
      const st = progress.q[q.id]
      return acc + (!st?.attempts ? 0.25 : st.lastCorrect ? 1 : 0)
    }, 0) / qs.length
    total += p * s.examQuestions
  }
  return total
}

export function Dashboard({ progress, go }: Props) {
  const all = pool.questions
  const seen = all.filter((q) => progress.q[q.id]?.attempts).length
  const known = all.filter((q) => progress.q[q.id]?.lastCorrect).length
  const attempts = Object.values(progress.q).reduce((a, s) => a + s.attempts, 0)
  const correct = Object.values(progress.q).reduce((a, s) => a + s.correct, 0)
  const due = all.filter((q) => isDue(progress.q[q.id])).length
  const expected = expectedScore(progress)
  const last3 = progress.exams.slice(-3)
  const ready = last3.length === 3 && last3.every((e) => e.score >= 30) && expected >= 30

  let status: { label: string; cls: string; tip: string }
  if (ready) status = { label: 'Ready to test', cls: 'ok', tip: "Your last three practice exams were all 30+ and your coverage is strong. Time to book an exam session!" }
  else if (expected >= pool.passScore && progress.exams.length > 0)
    status = { label: 'Close', cls: 'warn', tip: 'You are around passing level. Aim for three practice exams in a row scoring 30 or more to have a safety margin.' }
  else status = { label: 'Keep studying', cls: 'bad', tip: 'Work through each subelement in Study, then use Smart Review to lock in what you missed.' }

  return (
    <div>
      <h1>Technician (Element 2) dashboard</h1>
      <p className="muted">
        {pool.poolYears} question pool · valid {pool.validFrom} to {pool.validTo} · {all.length} questions
      </p>

      <div className="stats">
        <div className="card stat">
          <div className="label">Readiness</div>
          <div className={`value ${status.cls}`}>{status.label}</div>
          <div className="muted small">{status.tip}</div>
        </div>
        <div className="card stat">
          <div className="label">Estimated exam score</div>
          <div className="value">{expected.toFixed(1)} <span className="muted">/ 35</span></div>
          <div className="muted small">Pass is 26. Unseen questions count as a guess.</div>
        </div>
        <div className="card stat">
          <div className="label">Pool coverage</div>
          <div className="value">{seen} <span className="muted">/ {all.length}</span></div>
          <div className="muted small">{known} correct on last try · {attempts ? Math.round((correct / attempts) * 100) : 0}% overall accuracy</div>
        </div>
        <div className="card stat">
          <div className="label">Due for review</div>
          <div className="value">{due}</div>
          <button className="secondary" disabled={!due} onClick={() => go('review')}>Review now</button>
        </div>
      </div>

      <div className="card">
        <h3>Mastery by subelement</h3>
        <p className="muted small">Light bar = seen, dark bar = answered correctly on the latest attempt.</p>
        <table className="table">
          <tbody>
            {pool.subelements.map((s) => {
              const qs = all.filter((q) => q.subelement === s.id)
              const sSeen = qs.filter((q) => progress.q[q.id]?.attempts).length
              const sKnown = qs.filter((q) => progress.q[q.id]?.lastCorrect).length
              return (
                <tr key={s.id}>
                  <td className="nowrap"><span className="badge">{s.id}</span></td>
                  <td>{s.title} <span className="muted small">({s.examQuestions} on exam)</span></td>
                  <td className="meter-cell"><Meter known={sKnown} seen={sSeen} total={qs.length} /></td>
                  <td className="nowrap muted small">{sKnown}/{qs.length}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <div className="card">
        <h3>Practice exams</h3>
        {progress.exams.length === 0 ? (
          <p className="muted">No practice exams yet.</p>
        ) : (
          <div className="history">
            {progress.exams.slice(-20).map((e) => (
              <div key={e.date} className={`bar ${e.passed ? 'pass-bg' : 'fail-bg'}`} style={{ height: `${(e.score / e.total) * 100}%` }} title={`${e.score}/${e.total} on ${new Date(e.date).toLocaleDateString()}`} />
            ))}
            <div className="passline" style={{ bottom: `${(pool.passScore / pool.examSize) * 100}%` }} />
          </div>
        )}
        <div className="row">
          <button onClick={() => go('exam')}>Take a practice exam</button>
          <button className="secondary" onClick={() => go('study')}>Study by topic</button>
          <button className="ghost" onClick={() => go('guide')}>License requirements</button>
        </div>
      </div>
    </div>
  )
}
