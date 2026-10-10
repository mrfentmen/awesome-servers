const UA = "mrfentmen-inspirobot-mcp/1.0 (https://github.com/mrfentmen)"

export class InspiroError extends Error {}

export async function generate(_args?: unknown): Promise<string> {
  const res = await fetch("https://inspirobot.me/api?generate=true", {
    headers: { "User-Agent": UA },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new InspiroError(`InspiroBot returned HTTP ${res.status}`)
  const url = (await res.text()).trim()
  if (!url.startsWith("http")) throw new InspiroError("InspiroBot returned an unexpected response")
  return `Generated inspirational poster:\n${url}`
}

// ---- muxF tools:
const API = "https://inspirobot.me/api"
const CDN = "https://generated.inspirobot.me"

interface ImageHead {
  url: string
  status: number
  contentType: string
  bytes: number | null
}

function bound(value: unknown, min: number, max: number, fallback: number): number {
  const n = Number(value)
  if (!Number.isFinite(n)) return fallback
  return Math.max(min, Math.min(Math.floor(n), max))
}

/** Check an inscription locally before spending a render on it: length, longest word, how it will wrap and which characters the poster fonts may not carry. */
export async function inscriptionMetrics(args: { inscription?: string; charsPerLine?: number }): Promise<string> {
  const raw = args.inscription
  const text = (typeof raw === 'string' ? raw : '').trim()
  if (!text) return 'Provide an inscription to measure.'
  const perLine = bound(args.charsPerLine, 4, 200, 34)
  const words = text.split(/\s+/).filter(Boolean)
  const longest = words.reduce((a, b) => (b.length > a.length ? b : a), '')
  const letters = text.replace(/\s/g, '').length
  const nonAscii = [...new Set([...text].filter((c) => c.codePointAt(0)! > 126))]
  const lines = Math.max(1, Math.ceil(letters / perLine))
  const query = new URLSearchParams({ generate: 'true', inscription: text }).toString()
  return [
    `Inscription metrics (computed locally, no render spent)`,
    `Characters including spaces: ${text.length}, excluding spaces: ${letters}`,
    `Words: ${words.length}, longest word "${longest}" at ${longest.length} character(s)`,
    `At ${perLine} characters per line this wraps to about ${lines} line(s); that is your assumption, not a measured font width`,
    text.length > 100 ? 'Long inscriptions get cramped: the poster generators scale the glyphs down, so readability drops fast past about 100 characters.' : 'That length is well inside what a poster carries comfortably.',
    `Characters outside printable ASCII (${nonAscii.length}): ${nonAscii.length ? nonAscii.join(' ') : 'none'}`,
    nonAscii.length
      ? 'Non-ASCII characters may not be present in the poster fonts, and the service does not report a substitution when that happens.'
      : 'Everything here is plain ASCII, which the poster fonts carry.',
    `Render it with: ${API}?${query}`,
  ].join('\n')
}
