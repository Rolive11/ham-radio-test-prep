import { useEffect, useState } from 'react'
import { useProgress } from './storage'
import { Dashboard } from './views/Dashboard'
import { Study } from './views/Study'
import { Exam } from './views/Exam'
import { Review } from './views/Review'
import { Guide } from './views/Guide'
import { Settings } from './views/Settings'

const VIEWS = {
  dashboard: 'Dashboard',
  study: 'Study',
  exam: 'Practice Exam',
  review: 'Smart Review',
  guide: 'License Guide',
  settings: 'Settings',
} as const
type View = keyof typeof VIEWS

const viewFromHash = (): View => {
  const h = window.location.hash.slice(1)
  return h in VIEWS ? (h as View) : 'dashboard'
}

export default function App() {
  const [view, setView] = useState<View>(viewFromHash)
  const { progress, recordAnswer, recordExam, toggleFlag, replace } = useProgress()

  useEffect(() => {
    const onHash = () => setView(viewFromHash())
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const go = (v: View) => {
    window.location.hash = v
    setView(v)
    window.scrollTo(0, 0)
  }
  const toSettings = () => go('settings')

  return (
    <div className="app">
      <header>
        <div className="brand">
          <span className="logo" aria-hidden>📡</span>
          <span>Ham Radio Test Prep <span className="muted">· Technician</span></span>
        </div>
        <nav>
          {(Object.keys(VIEWS) as View[]).map((v) => (
            <button key={v} className={v === view ? 'active' : ''} onClick={() => go(v)}>
              {VIEWS[v]}
            </button>
          ))}
        </nav>
      </header>
      <main>
        {view === 'dashboard' && <Dashboard progress={progress} go={go} />}
        {view === 'study' && <Study progress={progress} onAnswer={recordAnswer} onToggleFlag={toggleFlag} onGoToSettings={toSettings} />}
        {view === 'exam' && (
          <Exam progress={progress} onAnswer={recordAnswer} onFinish={recordExam} onToggleFlag={toggleFlag} onGoToSettings={toSettings} />
        )}
        {view === 'review' && <Review progress={progress} onAnswer={recordAnswer} onToggleFlag={toggleFlag} onGoToSettings={toSettings} />}
        {view === 'guide' && <Guide />}
        {view === 'settings' && <Settings progress={progress} replace={replace} />}
      </main>
      <footer className="muted small">
        Question pool: NCVEC Question Pool Committee (public domain). Explanations are AI-assisted. Verify anything that looks off.
      </footer>
    </div>
  )
}
