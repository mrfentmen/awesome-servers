const UA = "mrfentmen-patents-mcp/1.0 (https://github.com/mrfentmen)"
export class PatentError extends Error {}

export async function searchPatents(args: { query?: string; limit?: number }): Promise<string> {
  const q = encodeURIComponent(`q=${args.query ?? ""}`)
  const limit = Math.min(args.limit ?? 10, 25)
  const res = await fetch(`https://patents.google.com/xhr/query?url=${q}&exp=`, {
    headers: { "User-Agent": UA, "X-Requested-With": "XMLHttpRequest" },
    signal: AbortSignal.timeout(25000),
  })
  if (!res.ok) throw new PatentError(`Google Patents error ${res.status}`)
  const d = await res.json()
  const results = d.results?.cluster?.[0]?.result ?? []
  const rows = results.slice(0, limit).map((r: any) => {
    const p = r.patent ?? {}
    return `${r.patent_title ?? p.title ?? "patent"} | ${r.publication_number ?? p.publication_number ?? ""}\n  ${(r.snippet ?? p.abstract ?? "").replace(/<[^>]+>/g, "").slice(0, 180)}`
  })
  return `Patents for "${args.query}"\n${rows.join("\n\n") || "No patents found"}`
}

// ---- muxB tools:

type RefRow = { number: string; priority: string; published: string; assignee: string; title: string }

