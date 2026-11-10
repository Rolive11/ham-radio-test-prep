import { useState } from 'react'
import type { Question } from '../types'
import { figureUrl } from '../data'
import { TutorPanel } from './TutorPanel'

interface Props {
  question: Question
  /** Choice the user already picked (controlled), or null if unanswered. */
  selected: number | null
  onSelect: (choice: number) => void
  /** When true, show right/wrong and the explanation once answered. */
  reveal: boolean
  flagged?: boolean
  onToggleFlag?: () => void
  onGoToSettings?: () => void
}

export function QuestionCard({ question: q, selected, onSelect, reveal, flagged, onToggleFlag, onGoToSettings }: Props) {
  const [showTutor, setShowTutor] = useState(false)
  const [zoom, setZoom] = useState(false)
  const answered = selected !== null
  const showResult = reveal && answered

  return (
    <div className="card question">
      <div className="q-meta">
        <span className="badge">{q.id}</span>
        {q.refs && <span className="muted">FCC Part 97 § {q.refs}</span>}
      </div>
      <h2 className="q-text">{q.question}</h2>

      {q.figure && (
        <button className="figure" onClick={() => setZoom(true)} title="Click to enlarge">
          <img src={figureUrl(q.figure)} alt={`Figure ${q.figure}`} />
          <span className="muted">Figure {q.figure.replace('T', 'T-')} (click to enlarge)</span>
        </button>
      )}
      {zoom && q.figure && (
        <div className="lightbox" onClick={() => setZoom(false)}>
          <img src={figureUrl(q.figure)} alt={`Figure ${q.figure}`} />
        </div>
      )}

      <div className="choices">
        {q.choices.map((c, i) => {
          let cls = 'choice'
          if (showResult) {
            if (i === q.answer) cls += ' correct'
            else if (i === selected) cls += ' wrong'
          } else if (i === selected) cls += ' selected'
          return (
            <button key={i} className={cls} onClick={() => !showResult && onSelect(i)} disabled={showResult}>
              <span className="letter">{'ABCD'[i]}</span>
              <span>{c}</span>
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className={`explanation ${selected === q.answer ? 'ok' : 'bad'}`}>
          <div className="verdict">
            {selected === q.answer ? 'Correct!' : `Not quite. The correct answer is ${'ABCD'[q.answer]}.`}
          </div>
          <p>{q.explanation}</p>
          <div className="row">
            {onGoToSettings && (
              <button className="secondary" onClick={() => setShowTutor((v) => !v)}>
                {showTutor ? 'Hide tutor' : 'Ask the AI tutor'}
              </button>
            )}
            {onToggleFlag && (
              <button className="ghost" onClick={onToggleFlag} title="Mark this explanation for review">
                {flagged ? '★ Flagged' : '☆ Flag explanation'}
              </button>
            )}
          </div>
          {showTutor && onGoToSettings && <TutorPanel question={q} onGoToSettings={onGoToSettings} />}
        </div>
      )}
    </div>
  )
}
