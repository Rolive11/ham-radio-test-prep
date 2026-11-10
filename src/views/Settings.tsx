import { useRef, useState } from 'react'
import type { Progress } from '../types'
import { emptyProgress, getApiKey, setApiKey } from '../storage'
import { describeError, testApiKey, TUTOR_MODEL } from '../tutor'

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
