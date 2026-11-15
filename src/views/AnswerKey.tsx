import { useEffect, useRef, useState } from 'react'
import type { Question } from '../types'
import { figureUrl, pool, questionsByGroup } from '../data'
import { speak, speechSupported, stopIfReading, stopSpeaking, useReading } from '../speech'

const LETTERS = 'ABCD'
const answerText = (q: Question) => q.choices[q.answer]

/** Topic picker, then a read-through list of every question with only its correct answer. */
export function AnswerKey() {
  const [list, setList] = useState<{ title: string; questions: Question[] } | null>(null)
  const [open, setOpen] = useState<string | null>(null)

  if (list) return <KeyList {...list} onExit={() => setList(null)} />

  return (
    <div>
      <h1>Answer key</h1>
      <p className="muted">
        Read through the questions with only the correct answer shown, with no wrong choices to remember by mistake. It's a good
        first pass on a topic before you test yourself in Study.
      </p>
      {pool.subelements.map((s) => {
        const qs = pool.questions.filter((q) => q.subelement === s.id)
        return (
          <div key={s.id} className="card topic">
            <div className="topic-head">
              <button className="topic-title" onClick={() => setOpen(open === s.id ? null : s.id)}>
                <span className="badge">{s.id}</span> {s.title}
                <span className="muted"> · {qs.length} questions</span>
              </button>
              <button onClick={() => setList({ title: `${s.id} ${s.title}`, questions: qs })}>View all</button>
            </div>
            {open === s.id && (
              <ul className="groups">
                {s.groups.map((g) => (
                  <li key={g}>
                    <div>
                      <span className="badge">{g}</span> {pool.groups[g].title}
                      <div className="muted small">{questionsByGroup[g].length} questions</div>
                    </div>
                    <button className="secondary" onClick={() => setList({ title: `${g} ${pool.groups[g].title}`, questions: questionsByGroup[g] })}>
                      View
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )
      })}
    </div>
  )
}

const ALL_ID = 'key:all'

function KeyList({ title, questions, onExit }: { title: string; questions: Question[]; onExit: () => void }) {
  const [showWhy, setShowWhy] = useState(false)
  const [zoom, setZoom] = useState<string | null>(null)
  const reading = useReading()
  const itemRefs = useRef<(HTMLLIElement | null)[]>([])

  // In "read all" mode each question has two parts (question, then answer).
  const readingAll = reading.id === ALL_ID
  const activeIndex = readingAll ? Math.floor(reading.part / 2) : -1

  useEffect(() => {
    if (activeIndex >= 0) itemRefs.current[activeIndex]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }, [activeIndex])

  useEffect(() => () => stopIfReading('key'), [])

  const readAll = () => speak(ALL_ID, questions.flatMap((q) => [q.question, `Answer: ${answerText(q)}`]))
  const readOne = (q: Question) =>
    speak(`key:${q.id}`, [q.question, `Answer: ${answerText(q)}`, ...(showWhy ? [q.explanation] : [])])

  return (
    <div>
      <div className="runner-head">
        <button className="ghost" onClick={onExit}>← Back</button>
        <div>
          <strong>{title}</strong>
          <div className="muted small">{questions.length} questions · answers only</div>
        </div>
      </div>
      <div className="row key-tools">
        {speechSupported && (
          <button onClick={readingAll ? stopSpeaking : readAll}>{readingAll ? '⏹ Stop reading' : '🔊 Read all'}</button>
        )}
        <label className="toggle">
          <input type="checkbox" checked={showWhy} onChange={(e) => setShowWhy(e.target.checked)} /> Show explanations
        </label>
      </div>

      <ol className="key-list">
        {questions.map((q, i) => {
          const oneId = `key:${q.id}`
          const active = activeIndex === i || reading.id === oneId
          const part = readingAll ? reading.part % 2 : reading.part
          return (
            <li key={q.id} ref={(el) => { itemRefs.current[i] = el }} className={`card key-item${active ? ' reading' : ''}`}>
              <div className="q-meta">
                <span className="badge">{q.id}</span>
                <span className="grow" />
                {speechSupported && (
                  <button className="ghost speak" onClick={() => (reading.id === oneId ? stopSpeaking() : readOne(q))}>
                    {reading.id === oneId ? '⏹ Stop' : '🔊 Read'}
                  </button>
                )}
              </div>
              <p className={`key-q${active && part === 0 ? ' speaking' : ''}`}>{q.question}</p>
              {q.figure && (
                <button className="figure small-figure" onClick={() => setZoom(q.figure)} title="Click to enlarge">
                  <img src={figureUrl(q.figure)} alt={`Figure ${q.figure}`} />
                </button>
              )}
              <div className={`key-a${active && part === 1 ? ' speaking' : ''}`}>
                <span className="key-letter">✓ {LETTERS[q.answer]}</span>
                <span>{answerText(q)}</span>
              </div>
              {showWhy && <p className={`key-why muted${active && part === 2 ? ' speaking' : ''}`}>{q.explanation}</p>}
            </li>
          )
        })}
      </ol>

      {zoom && (
        <div className="lightbox" onClick={() => setZoom(null)}>
          <img src={figureUrl(zoom)} alt={`Figure ${zoom}`} />
        </div>
      )}
      <div className="row">
        <button className="ghost" onClick={onExit}>← Back to topics</button>
      </div>
    </div>
  )
}
