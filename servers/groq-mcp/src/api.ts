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
