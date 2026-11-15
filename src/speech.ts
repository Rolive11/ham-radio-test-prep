import { useEffect, useState, useSyncExternalStore } from 'react'

/* ---------- Reading-help settings (per browser) ---------- */

export interface A11ySettings {
  /** Speech speed, 0.6 (slow) to 1.4 (fast). */
  rate: number
  /** Chosen system voice; empty means the browser's default English voice. */
  voiceURI: string
  /** Read each new question (and each explanation) automatically. */
  autoRead: boolean
  /** Easier-to-read font with extra letter, word and line spacing. */
  readable: boolean
  /** 0 = normal, 1 = large, 2 = extra large. */
  textSize: number
}

const KEY = 'hamprep.a11y'
const DEFAULTS: A11ySettings = { rate: 0.95, voiceURI: '', autoRead: false, readable: false, textSize: 0 }

function load(): A11ySettings {
  try {
    return { ...DEFAULTS, ...JSON.parse(localStorage.getItem(KEY) ?? '{}') }
  } catch {
    return { ...DEFAULTS }
  }
}

let settings = load()
const settingsListeners = new Set<() => void>()

export function setA11y(patch: Partial<A11ySettings>) {
  settings = { ...settings, ...patch }
  try {
    localStorage.setItem(KEY, JSON.stringify(settings))
  } catch {
    /* storage unavailable; settings last for this visit only */
  }
  applyA11yToDocument()
  settingsListeners.forEach((l) => l())
}

export const getA11y = () => settings

export function useA11y(): A11ySettings {
  return useSyncExternalStore(
    (l) => (settingsListeners.add(l), () => settingsListeners.delete(l)),
    () => settings,
  )
}

/** Applies the text options to <html>; loads the Lexend font only when it's first needed. */
export function applyA11yToDocument() {
  const root = document.documentElement
  root.classList.toggle('readable', settings.readable)
  root.dataset.textSize = String(settings.textSize)
  if (settings.readable && !document.getElementById('lexend-font')) {
    const link = document.createElement('link')
    link.id = 'lexend-font'
    link.rel = 'stylesheet'
    link.href = 'https://fonts.googleapis.com/css2?family=Lexend:wght@400;600;700&display=swap'
    document.head.appendChild(link)
  }
}

/* ---------- Text to speech ---------- */

export const speechSupported = typeof window !== 'undefined' && 'speechSynthesis' in window

export interface ReadingState {
  /** Which item is being read (e.g. a question id), or null when silent. */
  id: string | null
  /** Which part of that item is being spoken right now. */
  part: number
}

const IDLE: ReadingState = { id: null, part: -1 }
let reading = IDLE
let session = 0
const readingListeners = new Set<() => void>()

function setReading(r: ReadingState) {
  reading = r
  readingListeners.forEach((l) => l())
}

export function useReading(): ReadingState {
  return useSyncExternalStore(
    (l) => (readingListeners.add(l), () => readingListeners.delete(l)),
    () => reading,
  )
}

/** Unit symbols and notation that speech engines tend to mispronounce or spell out. */
const PRONUNCIATIONS: [RegExp, string][] = [
  [/\bGHz\b/g, ' gigahertz'],
  [/\bMHz\b/g, ' megahertz'],
  [/\bkHz\b/g, ' kilohertz'],
  [/\bHz\b/g, ' hertz'],
  [/\bkW\b/g, ' kilowatts'],
  [/\bmW\b/g, ' milliwatts'],
  [/(\d)\s*W\b/g, '$1 watts'],
  [/\bmA\b/g, ' milliamps'],
  [/(\d)\s*V\b/g, '$1 volts'],
  [/(\d)\s*cm\b/g, '$1 centimeters'],
  [/(\d)\s*m\b/g, '$1 meters'],
  [/\bdBi\b/g, 'D B I'],
  [/\bdBd\b/g, 'D B D'],
  [/\bdBm\b/g, 'D B M'],
  [/\bdB\b/g, 'D B'],
  [/(\d):(\d)/g, '$1 to $2'],
  [/§+/g, 'section '],
  [/Ω/g, ' ohms'],
  [/[µμ]/g, 'micro'],
  [/[*_`#>]+/g, ' '], // markdown symbols in tutor replies
]

export function forSpeech(text: string): string {
  return PRONUNCIATIONS.reduce((t, [re, sub]) => t.replace(re, sub), text).replace(/\s+/g, ' ').trim()
}

/** Splits long text into sentence-sized chunks; some browsers stop speaking partway through long utterances. */
function chunks(text: string): string[] {
  const out: string[] = []
  let cur = ''
  for (const s of text.split(/(?<=[.!?])\s+/)) {
    if (cur && cur.length + s.length > 220) {
      out.push(cur)
      cur = s
    } else cur = cur ? `${cur} ${s}` : s
  }
  if (cur) out.push(cur)
  return out
}

function findVoice(): SpeechSynthesisVoice | undefined {
  const voices = window.speechSynthesis.getVoices()
  return voices.find((v) => v.voiceURI === settings.voiceURI)
}

/**
 * Reads the parts aloud in order. `id` identifies what is being read so the page can
 * highlight it; `part` in the reading state tells which of `parts` is being spoken.
 */
export function speak(id: string, parts: string[]) {
  if (!speechSupported) return
  const synth = window.speechSynthesis
  synth.cancel()
  const mine = ++session
  const voice = findVoice()
  const queue = parts.flatMap((p, part) => chunks(forSpeech(p)).map((text) => ({ text, part })))
  if (queue.length === 0) return setReading(IDLE)
  setReading({ id, part: queue[0].part })
  queue.forEach(({ text, part }, i) => {
    const u = new SpeechSynthesisUtterance(text)
    u.rate = settings.rate
    if (voice) {
      u.voice = voice
      u.lang = voice.lang
    } else u.lang = 'en-US'
    u.onstart = () => mine === session && setReading({ id, part })
    const finish = () => mine === session && i === queue.length - 1 && setReading(IDLE)
    u.onend = finish
    u.onerror = () => mine === session && setReading(IDLE)
    synth.speak(u)
  })
}

export function stopSpeaking() {
  if (!speechSupported) return
  session++
  window.speechSynthesis.cancel()
  setReading(IDLE)
}

/** Stops speech only if it's reading something whose id starts with `prefix`. */
export function stopIfReading(prefix: string) {
  if (reading.id?.startsWith(prefix)) stopSpeaking()
}

/** English voices installed on this computer (the list loads asynchronously in some browsers). */
export function useVoices(): SpeechSynthesisVoice[] {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([])
  useEffect(() => {
    if (!speechSupported) return
    const synth = window.speechSynthesis
    const update = () => setVoices(synth.getVoices().filter((v) => v.lang.toLowerCase().startsWith('en')))
    update()
    synth.addEventListener('voiceschanged', update)
    return () => synth.removeEventListener('voiceschanged', update)
  }, [])
  return voices
}
