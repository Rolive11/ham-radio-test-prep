import { useEffect, useState } from 'react'
import type { Question } from '../types'
import { figureUrl } from '../data'
import { speak, speechSupported, stopIfReading, stopSpeaking, useA11y, useReading } from '../speech'
import { TutorPanel } from './TutorPanel'

const LETTERS = 'ABCD'

const questionParts = (q: Question) => [q.question, ...q.choices.map((c, i) => `${LETTERS[i]}: ${c}`)]

function verdictText(q: Question, selected: number) {
  return selected === q.answer ? 'Correct!' : `Not quite. The correct answer is ${LETTERS[q.answer]}.`
}

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
  const { autoRead } = useA11y()
  const reading = useReading()
  const readingQ = reading.id === q.id
  const readingExp = reading.id === `${q.id}:exp`

  const readQuestion = () => speak(q.id, questionParts(q))
  const readExplanation = () => selected !== null && speak(`${q.id}:exp`, [verdictText(q, selected), q.explanation])

  // Auto-read each new question; stop reading this card when it goes away.
  useEffect(() => {
    if (autoRead && selected === null) readQuestion()
    return () => stopIfReading(q.id)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q.id])

  // Auto-read the explanation once the answer is revealed.
  useEffect(() => {
    if (autoRead && showResult) readExplanation()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [showResult])

  const speakButton = (active: boolean, start: () => void, label: string) =>
    speechSupported && (
      <button className="ghost speak" onClick={active ? stopSpeaking : start} aria-pressed={active}>
        {active ? '⏹ Stop' : `🔊 ${label}`}
      </button>
    )

  return (
    <div className="card question">
      <div className="q-meta">
        <span className="badge">{q.id}</span>
        {q.refs && <span className="muted">FCC Part 97 § {q.refs}</span>}
        <span className="grow" />
        {speakButton(readingQ, readQuestion, 'Read aloud')}
      </div>
      <h2 className={`q-text${readingQ && reading.part === 0 ? ' reading' : ''}`}>{q.question}</h2>

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
          if (readingQ && reading.part === i + 1) cls += ' reading'
          return (
            <button
              key={i}
              className={cls}
              onClick={() => {
                if (showResult) return
                stopIfReading(q.id)
                onSelect(i)
              }}
              disabled={showResult}
            >
              <span className="letter">{LETTERS[i]}</span>
              <span>{c}</span>
            </button>
          )
        })}
      </div>

      {showResult && (
        <div className={`explanation ${selected === q.answer ? 'ok' : 'bad'}${readingExp ? ' reading' : ''}`}>
          <div className="verdict">{verdictText(q, selected ?? -1)}</div>
          <p>{q.explanation}</p>
          <div className="row">
            {speakButton(readingExp, readExplanation, 'Read explanation')}
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
