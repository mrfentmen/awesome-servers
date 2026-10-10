/**
 * Groq API client (OpenAI-compatible). Needs GROQ_API_KEY
 * (free at https://console.groq.com/keys).
 * Docs: https://console.groq.com/docs/overview
 */
const BASE = "https://api.groq.com/openai/v1"

export class GroqError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.GROQ_API_KEY
  if (!key) throw new GroqError("Set GROQ_API_KEY first (free at console.groq.com/keys).")
  return { "User-Agent": "groq-mcp/1.0", Accept: "application/json", "Content-Type": "application/json", Authorization: `Bearer ${key}` }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function postJson<T>(path: string, body: Raw): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: headers(),
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(60000),
  })
  if (res.status === 401 || res.status === 403) throw new GroqError("Groq rejected the key (401/403). Check GROQ_API_KEY.")
  if (res.status === 429) throw new GroqError("Groq rate limit hit; wait a bit and retry.")
  if (!res.ok) throw new GroqError(`Groq error ${res.status}`)
  return (await res.json()) as T
}

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new GroqError("Groq rejected the key (401/403). Check GROQ_API_KEY.")
  if (!res.ok) throw new GroqError(`Groq error ${res.status}`)
  return (await res.json()) as T
}

export async function listModels(): Promise<string[]> {
  const data = await getJson<Raw>("/models")
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.map((m) => String(m.id)).filter(Boolean).sort()
}

export async function chat(model: string, message: string, system = ""): Promise<string> {
  if (!message.trim()) throw new GroqError("Message is empty.")
  const messages: Raw[] = []
  if (system.trim()) messages.push({ role: "system", content: system.trim() })
  messages.push({ role: "user", content: message })
  const data = await postJson<Raw>("/chat/completions", {
    model: model.trim() || "llama-3.3-70b-versatile",
    messages,
    temperature: 0.7,
    max_tokens: 1024,
  })
  const text = data.choices?.[0]?.message?.content
  if (typeof text !== "string" || !text) throw new GroqError("Groq returned no text.")
  const usage = data.usage as Raw | undefined
  const stats = usage ? `\n\n[${usage.prompt_tokens ?? "?"} in / ${usage.completion_tokens ?? "?"} out tokens]` : ""
  return text + stats
}

// ---- muxG tools:
const HF_BASE = 'https://huggingface.co/api'

type HubRow = Record<string, unknown>

interface HubModel extends HubRow {
  id?: string
  modelId?: string
  downloads?: number
  likes?: number
  pipeline_tag?: string
  library_name?: string
  createdAt?: string
  lastModified?: string
  tags?: string[]
}

interface HubDataset extends HubRow {
  id?: string
  author?: string
  downloads?: number
  likes?: number
  createdAt?: string
  lastModified?: string
  gated?: boolean | string
  disabled?: boolean
  description?: string
  tags?: string[]
}

async function hubJson<T>(path: string): Promise<T> {
  const res = await fetch(`${HF_BASE}${path}`, {
    headers: { 'User-Agent': 'groq-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(25000),
  })
  if (res.status === 429) throw new GroqError('Hugging Face rate limit hit; wait and retry.')
  if (!res.ok) throw new GroqError(`Hugging Face returned ${res.status}`)
  const body = await res.text()
  if (!body.trim()) throw new GroqError('Hugging Face returned an empty body.')
  return JSON.parse(body) as T
}

const compactTags = (tags: string[] | undefined, prefixes: string[]): string[] =>
  (tags ?? []).filter((tag) => prefixes.some((prefix) => tag === prefix || tag.startsWith(prefix))).slice(0, 10)

/** Open weights on the Hugging Face Hub, ranked, with the download and licence facts. */
export async function hubModelSearch(args: { search: string; limit?: number }): Promise<string> {
  const query = String(args?.search ?? '').trim()
  if (!query) throw new GroqError('search is required, for example "mixtral" or "whisper".')
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30)
  const rows = await hubJson<HubModel[]>(
    `/models?search=${encodeURIComponent(query)}&limit=${n}&sort=downloads&direction=-1&full=false`,
  )
  if (!Array.isArray(rows) || !rows.length) return `No Hugging Face model matches "${query}".`

  const lines = [`Hugging Face models matching "${query}" (${rows.length} of the most downloaded):`]
  for (const [i, row] of rows.entries()) {
    const id = row.id ?? row.modelId ?? 'unnamed'
    const license = compactTags(row.tags, ['license:'])
    lines.push(`  ${i + 1}. ${id}`)
    lines.push(`     ${(row.downloads ?? 0).toLocaleString()} download(s) in 30 days · ${(row.likes ?? 0).toLocaleString()} like(s) · task ${row.pipeline_tag ?? 'not reported'} · library ${row.library_name ?? 'not reported'}`)
    if (license.length) lines.push(`     licence: ${license.join(', ')}`)
    const updated = typeof row.lastModified === 'string' ? row.lastModified : (typeof row.createdAt === 'string' ? row.createdAt : null)
    if (updated) lines.push(`     last touched ${updated.slice(0, 10)}`)
  }
  return lines.join('\n')
}

/** Datasets on the Hub, so a fine-tuning or evaluation set can be found without a key. */
export async function hubDatasetSearch(args: { search: string; limit?: number }): Promise<string> {
  const query = String(args?.search ?? '').trim()
  if (!query) throw new GroqError('search is required, for example "summarization" or "code".')
  const n = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30)
  const rows = await hubJson<HubDataset[]>(
    `/datasets?search=${encodeURIComponent(query)}&limit=${n}&sort=downloads&direction=-1&full=false`,
  )
  if (!Array.isArray(rows) || !rows.length) return `No Hugging Face dataset matches "${query}".`

  const lines = [`Hugging Face datasets matching "${query}" (${rows.length} of the most downloaded):`]
  for (const [i, row] of rows.entries()) {
    lines.push(`  ${i + 1}. ${row.id ?? 'unnamed'}`)
    const gate = row.gated === true || typeof row.gated === 'string' ? row.gated : row.gated === false ? 'open' : 'not reported'
    lines.push(`     ${(row.downloads ?? 0).toLocaleString()} download(s) in 30 days · ${(row.likes ?? 0).toLocaleString()} like(s) · access ${gate}${row.disabled === true ? ' · disabled' : ''}`)
    const size = compactTags(row.tags, ['size_categories:'])
    const tasks = compactTags(row.tags, ['task_categories:'])
    if (tasks.length) lines.push(`     tasks: ${tasks.join(', ')}`)
    if (size.length) lines.push(`     size: ${size.join(', ')}`)
    if (typeof row.description === 'string' && row.description.trim()) lines.push(`     ${row.description.trim().slice(0, 180)}`)
  }
  return lines.join('\n')
}
