/**
 * DeepAI client. Every call is a form-encoded POST to /api/<model> with the
 * API key in an `api-key` header. Inputs are URLs or plain text only — DeepAI
 * fetches images itself, so local files must be uploaded somewhere first.
 */
const BASE = "https://api.deepai.org"

export class DeepAiError extends Error {}

export interface DeepAiResult {
  id?: string
  model: string
  outputs: string[]
  raw: Record<string, unknown>
}

function apiKey(): string {
  const key = process.env.DEEPAI_API_KEY
  if (!key) throw new DeepAiError("DEEPAI_API_KEY is not set")
  return key
}

export async function callModel(
  model: string,
  params: Record<string, string | number | undefined>
): Promise<DeepAiResult> {
  const body = new URLSearchParams()
  for (const [k, v] of Object.entries(params)) {
    if (v !== undefined && v !== "") body.set(k, String(v))
  }

  const res = await fetch(`${BASE}/api/${model}`, {
    method: "POST",
    headers: {
      "api-key": apiKey(),
      "Content-Type": "application/x-www-form-urlencoded",
      Accept: "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(60000),
  })

  const text = await res.text()
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    throw new DeepAiError(
      `DeepAI ${model} returned non-JSON (${res.status}): ${text.slice(0, 200)}`
    )
  }

  if (!res.ok) {
    throw new DeepAiError(`DeepAI ${model} error ${res.status}: ${describe(parsed)}`)
  }

  const raw = (parsed ?? {}) as Record<string, unknown>
  return {
    id: typeof raw.id === "string" ? raw.id : undefined,
    model,
    outputs: collectOutputs(raw),
    raw,
  }
}

function collectOutputs(raw: Record<string, unknown>): string[] {
  const out: string[] = []
  if (typeof raw.output_url === "string") out.push(raw.output_url)
  const output = raw.output
  if (typeof output === "string") out.push(output)
  if (Array.isArray(output)) {
    for (const item of output) {
      if (typeof item === "string") out.push(item)
      else if (item && typeof item === "object") {
        const o = item as Record<string, unknown>
        for (const key of ["url", "output_url", "text", "value"]) {
          if (typeof o[key] === "string") out.push(o[key] as string)
        }
      }
    }
  }
  if (out.length === 0 && raw.data && typeof raw.data === "object") {
    for (const value of Object.values(raw.data as Record<string, unknown>)) {
      if (typeof value === "string" && /^https?:\/\//.test(value)) out.push(value)
    }
  }
  return [...new Set(out)]
}

function describe(parsed: unknown): string {
  if (parsed && typeof parsed === "object") {
    const o = parsed as Record<string, unknown>
    for (const key of ["err", "error", "message", "detail"]) {
      if (typeof o[key] === "string") return o[key] as string
    }
  }
  return JSON.stringify(parsed).slice(0, 200)
}

export function formatResult(r: DeepAiResult): string {
  const lines = [`Model: ${r.model}`]
  if (r.id) lines.push(`Job id: ${r.id}`)
  if (r.outputs.length === 0) {
    lines.push("No output returned.")
    const keys = Object.keys(r.raw)
    if (keys.length) lines.push(`Response keys: ${keys.join(", ")}`)
  } else if (r.outputs.length === 1) {
    lines.push(`Output: ${r.outputs[0]}`)
  } else {
    lines.push("Outputs:")
    r.outputs.forEach((v, i) => lines.push(`${i + 1}. ${v}`))
  }
  return lines.join("\n")
}
