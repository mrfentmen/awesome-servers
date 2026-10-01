/**
 * Logseq HTTP APIs plugin client. Talks to Logseq on localhost via the
 * "HTTP APIs" plugin (default http://localhost:12315). Optional
 * LOGSEQ_API_TOKEN if the plugin is configured with one.
 * Plugin: https://github.com/lastnpe/logseq-http-apis (install in Logseq first).
 */
const BASE = (process.env.LOGSEQ_URL ?? "http://localhost:12315").replace(/\/+$/, "")

export class LogseqError extends Error {}

function headers(): Record<string, string> {
  const h: Record<string, string> = { "User-Agent": "logseq-mcp/1.0", "Content-Type": "application/json", Accept: "application/json" }
  if (process.env.LOGSEQ_API_TOKEN) h.Authorization = `Bearer ${process.env.LOGSEQ_API_TOKEN as string}`
  return h
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function callApi<T>(method: string, args: Raw = {}): Promise<T> {
  let res: Response
  try {
    res = await fetch(`${BASE}/api`, {
      method: "POST",
      headers: headers(),
      body: JSON.stringify({ method, args }),
      signal: AbortSignal.timeout(20000),
    })
  } catch {
    throw new LogseqError(`Logseq is unreachable at ${BASE}. Open Logseq with the HTTP APIs plugin enabled.`)
  }
  if (res.status === 401 || res.status === 403) throw new LogseqError("Logseq refused (401/403). Check LOGSEQ_API_TOKEN.")
  if (!res.ok) throw new LogseqError(`Logseq error ${res.status}`)
  return (await res.json()) as T
}

export interface Page {
  name: string
  id?: string | number
}

export async function listPages(): Promise<Page[]> {
  const rows = await callApi<Raw[]>("logseq.Editor.getAllPages", {})
  const list = Array.isArray(rows) ? rows : []
  return list.slice(0, 50).map((p) => ({ name: String(p.name ?? p.originalName ?? "?"), id: p.id ?? p.uuid }))
}

export async function getPage(name: string): Promise<Raw | null> {
  if (!name.trim()) throw new LogseqError("Page name is empty.")
  const page = await callApi<Raw | null>("logseq.Editor.getPage", { pageName: name.trim() })
  return page ?? null
}

export async function pageBlocks(name: string, limit = 20): Promise<string[]> {
  if (!name.trim()) throw new LogseqError("Page name is empty.")
  const tree = await callApi<Raw[]>("logseq.Editor.getPageBlocksTree", { pageName: name.trim() })
  const out: string[] = []
  const walk = (nodes: Raw[], depth: number): void => {
    for (const n of nodes.slice(0, limit)) {
      const content = String(n.content ?? "").split("\n")[0].slice(0, 160)
      if (content) out.push(`${"  ".repeat(Math.min(depth, 4))}- ${content}`)
      if (Array.isArray(n.children) && out.length < limit) walk(n.children, depth + 1)
      if (out.length >= limit) break
    }
  }
  walk(Array.isArray(tree) ? tree : [], 0)
  return out.slice(0, limit)
}

export function formatPage(name: string, page: Raw | null, blocks: string[]): string {
  const lines = [
    `# ${name}`,
    page?.properties ? `Properties: ${JSON.stringify(page.properties).slice(0, 200)}` : "",
    blocks.length ? `\n${blocks.join("\n")}` : "(no blocks)",
  ].filter(Boolean)
  return lines.join("\n")
}
