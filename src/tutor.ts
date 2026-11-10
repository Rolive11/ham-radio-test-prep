import Anthropic from '@anthropic-ai/sdk'
import type { Question } from './types'

export type TutorMessage = Anthropic.Beta.Messages.BetaMessageParam

export const TUTOR_MODEL = 'claude-opus-5-5'

const BASE_SYSTEM = `You are a friendly, patient "Elmer" (ham radio mentor) helping a student prepare for the US FCC Amateur Radio Technician class exam (Element 2, 2026-2030 question pool).

How to help:
- Explain concepts in plain language first, then add the technical detail. Use short worked examples for any math (Ohm's law, power, decibels, wavelength).
- When a rule question is involved, cite the relevant FCC Part 97 section.
- Explain why the wrong answer choices are wrong when that helps understanding.
- Offer a memory aid when one exists.
- Keep answers focused and reasonably short (a few short paragraphs) unless the student asks for more depth.
- If you are not certain of a fact, say so plainly rather than guessing. Accuracy matters more than confidence: the student will be tested on this.
- Stay on topic: amateur radio, electronics, and exam preparation.`

export function systemPromptFor(q: Question | null): string {
  if (!q) return BASE_SYSTEM
  const choices = q.choices.map((c, i) => `${'ABCD'[i]}. ${c}`).join('\n')
  return `${BASE_SYSTEM}

The student is studying this question from the official pool:
${q.id}${q.refs ? ` [${q.refs}]` : ''}
${q.question}
${choices}
Correct answer: ${'ABCD'[q.answer]}${q.figure ? `\n(This question refers to schematic figure ${q.figure} in the pool.)` : ''}

The app's stored explanation (written ahead of time; flag it to the student if you think it is wrong):
${q.explanation}`
}

/** Streams a tutor reply. Calls onText for each chunk and returns the assistant turn to append to history. */
export async function askTutor(
  apiKey: string,
  system: string,
  messages: TutorMessage[],
  onText: (delta: string) => void,
  signal?: AbortSignal,
): Promise<TutorMessage> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  const stream = client.beta.messages.stream(
    {
      model: TUTOR_MODEL,
      max_tokens: 16000,
      output_config: { effort: 'medium' },
      // If the model declines a request, the API retries it on a suitable fallback model automatically.
      betas: ['server-side-fallback-2026-07-01'],
      fallbacks: 'default',
      system,
      messages,
    },
    { signal },
  )
  stream.on('text', onText)
  const final = await stream.finalMessage()
  if (final.stop_reason === 'refusal') {
    throw new Error('The tutor could not answer that request. Try rephrasing your question.')
  }
  // Send the full content back on later turns (not just the text), as the API expects.
  return { role: 'assistant', content: final.content }
}

export function describeError(err: unknown): string {
  if (err instanceof Anthropic.AuthenticationError) return 'Your API key was rejected. Check it on the Settings page.'
  if (err instanceof Anthropic.PermissionDeniedError) return 'This API key does not have permission to use the tutor model.'
  if (err instanceof Anthropic.RateLimitError) return 'Rate limited by the API. Wait a moment and try again.'
  if (err instanceof Anthropic.APIConnectionError) return 'Could not reach the Anthropic API. Check your internet connection.'
  if (err instanceof Anthropic.APIError) return `API error ${err.status ?? ''}: ${err.message}`
  if (err instanceof Error) return err.message
  return String(err)
}

/** Cheap call used by Settings to confirm a key works. */
export async function testApiKey(apiKey: string): Promise<void> {
  const client = new Anthropic({ apiKey, dangerouslyAllowBrowser: true })
  await client.models.retrieve(TUTOR_MODEL)
}
