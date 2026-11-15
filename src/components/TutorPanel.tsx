import { useEffect, useRef, useState } from 'react'
import type { Question } from '../types'
import { askTutor, describeError, systemPromptFor, type TutorMessage } from '../tutor'
import { getApiKey } from '../storage'
import { Markdown } from './Markdown'
import { getA11y, speak, speechSupported, stopIfReading, stopSpeaking, useReading } from '../speech'

interface Props {
  question: Question | null
  onGoToSettings: () => void
}

const SUGGESTIONS = [
  'Explain this in simpler terms.',
  'Why are the other answers wrong?',
  'Give me a memory trick for this.',
  'Walk me through the underlying concept.',
]

function textOf(m: TutorMessage): string {
  if (typeof m.content === 'string') return m.content
  return (m.content ?? []).map((b) => (b.type === "text" ? b.text : "")).join("")
}

export function TutorPanel({ question, onGoToSettings }: Props) {
  const [messages, setMessages] = useState<TutorMessage[]>([])
  const [streaming, setStreaming] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [input, setInput] = useState('')
  const abortRef = useRef<AbortController | null>(null)
  const apiKey = getApiKey()
  const reading = useReading()

  // Reset the conversation when the question changes.
  useEffect(() => {
    abortRef.current?.abort()
    stopIfReading('tutor:')
    setMessages([])
    setStreaming('')
    setError('')
    setBusy(false)
  }, [question?.id])

  useEffect(() => () => {
    abortRef.current?.abort()
    stopIfReading('tutor:')
  }, [])

  async function send(text: string) {
    if (!text.trim() || busy || !apiKey) return
    const history: TutorMessage[] = [...messages, { role: 'user', content: text.trim() }]
    setMessages(history)
    setInput('')
    setBusy(true)
    setError('')
    setStreaming('')
    const ctrl = new AbortController()
    abortRef.current = ctrl
    try {
      const reply = await askTutor(apiKey, systemPromptFor(question), history, (d) => setStreaming((s) => s + d), ctrl.signal)
      setMessages([...history, reply])
      if (getA11y().autoRead) speak(`tutor:${history.length}`, [textOf(reply)])
    } catch (e) {
      // Drop the unanswered turn so the conversation stays valid and the question can be retried.
      setMessages(messages)
      setInput(text)
      if (!ctrl.signal.aborted) setError(describeError(e))
    } finally {
      setStreaming('')
      setBusy(false)
    }
  }

  if (!apiKey) {
    return (
      <div className="tutor">
        <div className="tutor-head">AI Tutor</div>
        <p className="muted">
          The AI tutor uses your own Anthropic API key. Add one on the{' '}
          <button className="link" onClick={onGoToSettings}>Settings</button> page to ask follow-up questions.
        </p>
      </div>
    )
  }

  return (
    <div className="tutor">
      <div className="tutor-head">AI Tutor {question && <span className="muted">· about {question.id}</span>}</div>
      <div className="tutor-log">
        {messages.length === 0 && !busy && (
          <div className="chips">
            {SUGGESTIONS.map((s) => (
              <button key={s} className="chip" onClick={() => send(s)}>{s}</button>
            ))}
          </div>
        )}
        {messages.map((m, i) => {
          const id = `tutor:${i}`
          const active = reading.id === id
          return (
            <div key={i} className={`msg ${m.role}${active ? ' reading' : ''}`}>
              {m.role === 'assistant' ? <Markdown text={textOf(m)} /> : textOf(m)}
              {m.role === 'assistant' && speechSupported && (
                <button className="link small" onClick={() => (active ? stopSpeaking() : speak(id, [textOf(m)]))}>
                  {active ? '⏹ Stop' : '🔊 Read aloud'}
                </button>
              )}
            </div>
          )
        })}
        {busy && (
          <div className="msg assistant">
            {streaming ? <Markdown text={streaming} /> : <span className="muted">Thinking…</span>}
          </div>
        )}
        {error && <div className="error">{error}</div>}
      </div>
      <form
        className="tutor-input"
        onSubmit={(e) => {
          e.preventDefault()
          void send(input)
        }}
      >
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask anything about this question…"
          disabled={busy}
        />
        {busy ? (
          <button type="button" onClick={() => abortRef.current?.abort()}>Stop</button>
        ) : (
          <button type="submit" disabled={!input.trim()}>Ask</button>
        )}
      </form>
    </div>
  )
}
