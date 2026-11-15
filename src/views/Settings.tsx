import { useRef, useState } from 'react'
import type { Progress } from '../types'
import { emptyProgress, getApiKey, setApiKey } from '../storage'
import { describeError, testApiKey, TUTOR_MODEL } from '../tutor'
import { setA11y, speak, speechSupported, useA11y, useVoices } from '../speech'

const SAMPLE =
  'This is how questions will sound. What is the maximum transmitting power for a Technician on 146 MHz? A: 1,500 watts PEP output.'
const SIZES = ['Normal', 'Large', 'Extra large']

function ReadingHelp() {
  const a11y = useA11y()
  const voices = useVoices()
  return (
    <div className="card">
      <h3>Reading help</h3>
      {speechSupported ? (
        <>
          <p className="muted">
            Every question has a <strong>🔊 Read aloud</strong> button. The part being read is highlighted as it's spoken.
            Speech uses the voices built into your computer, so it's free and works without an API key.
          </p>
          <label className="setting">
            <input type="checkbox" checked={a11y.autoRead} onChange={(e) => setA11y({ autoRead: e.target.checked })} />
            <span>Read each question aloud automatically, and the explanation after I answer</span>
          </label>
          <label className="setting">
            <span className="setting-label">Speed</span>
            <input
              type="range" min={0.6} max={1.4} step={0.05} value={a11y.rate}
              onChange={(e) => setA11y({ rate: Number(e.target.value) })}
            />
            <span className="small muted">{a11y.rate < 0.9 ? 'Slower' : a11y.rate > 1.1 ? 'Faster' : 'Normal'}</span>
          </label>
          {voices.length > 0 && (
            <label className="setting">
              <span className="setting-label">Voice</span>
              <select value={a11y.voiceURI} onChange={(e) => setA11y({ voiceURI: e.target.value })}>
                <option value="">Default</option>
                {voices.map((v) => (
                  <option key={v.voiceURI} value={v.voiceURI}>{v.name} ({v.lang})</option>
                ))}
              </select>
            </label>
          )}
          <div className="row">
            <button className="secondary" onClick={() => speak('sample', [SAMPLE])}>🔊 Try it</button>
          </div>
        </>
      ) : (
        <p className="muted">This browser can't read text aloud. Try Chrome, Edge or Safari.</p>
      )}
      <hr />
      <label className="setting">
        <input type="checkbox" checked={a11y.readable} onChange={(e) => setA11y({ readable: e.target.checked })} />
        <span>Easier-to-read text (Lexend font with extra spacing between letters, words and lines)</span>
      </label>
      <div className="setting">
        <span className="setting-label">Text size</span>
        <div className="segmented">
          {SIZES.map((label, i) => (
            <button key={label} className={a11y.textSize === i ? '' : 'ghost'} onClick={() => setA11y({ textSize: i })}>
              {label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

interface Props {
  progress: Progress
  replace: (p: Progress) => void
}

export function Settings({ progress, replace }: Props) {
  const [key, setKey] = useState(getApiKey())
  const [status, setStatus] = useState('')
  const [testing, setTesting] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const save = async () => {
    setApiKey(key.trim())
    if (!key.trim()) {
      setStatus('API key cleared.')
      return
    }
    setTesting(true)
    setStatus('Checking key…')
    try {
      await testApiKey(key.trim())
      setStatus('Saved. Your key works and the tutor is ready.')
    } catch (e) {
      setStatus(`Saved, but the test failed: ${describeError(e)}`)
    } finally {
      setTesting(false)
    }
  }

  const exportProgress = () => {
    const blob = new Blob([JSON.stringify(progress, null, 1)], { type: 'application/json' })
    const a = document.createElement('a')
    a.href = URL.createObjectURL(blob)
    a.download = `ham-tech-progress-${new Date().toISOString().slice(0, 10)}.json`
    a.click()
    URL.revokeObjectURL(a.href)
  }

  const importProgress = async (f: File) => {
    try {
      const data = JSON.parse(await f.text()) as Progress
      if (!data || typeof data.q !== 'object' || !Array.isArray(data.exams)) throw new Error('Not a progress file')
      replace(data)
      setStatus('Progress imported.')
    } catch (e) {
      setStatus(`Import failed: ${describeError(e)}`)
    }
  }

  return (
    <div>
      <h1>Settings</h1>

      <ReadingHelp />

      <div className="card">
        <h3>AI tutor (Anthropic API key)</h3>
        <p className="muted">
          The tutor sends questions straight from your browser to Anthropic using your own API key (model: <code>{TUTOR_MODEL}</code>).
          The key is stored only in this browser on this computer and is never sent anywhere else. Get a key at console.anthropic.com.
          Each tutor question costs a small amount, typically a cent or two.
        </p>
        <div className="row">
          <input type="password" value={key} onChange={(e) => setKey(e.target.value)} placeholder="sk-ant-…" className="grow" autoComplete="off" />
          <button onClick={save} disabled={testing}>Save</button>
          {getApiKey() && (
            <button className="ghost" onClick={() => { setKey(''); setApiKey(''); setStatus('API key removed.') }}>Remove</button>
          )}
        </div>
        {status && <p className="small">{status}</p>}
      </div>

      <div className="card">
        <h3>Your progress</h3>
        <p className="muted">
          Progress is saved in this browser. Export it to back it up or move it to another computer.
        </p>
        <div className="row">
          <button className="secondary" onClick={exportProgress}>Export progress</button>
          <button className="secondary" onClick={() => fileRef.current?.click()}>Import progress</button>
          <input ref={fileRef} type="file" accept="application/json" hidden onChange={(e) => e.target.files?.[0] && importProgress(e.target.files[0])} />
          <button
            className="danger"
            onClick={() => {
              if (window.confirm('Erase all study progress and exam history? This cannot be undone.')) {
                replace(emptyProgress())
                setStatus('Progress reset.')
              }
            }}
          >
            Reset progress
          </button>
        </div>
      </div>
    </div>
  )
}
