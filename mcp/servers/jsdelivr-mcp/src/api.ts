const BASE = "https://data.jsdelivr.com/v1"
const UA = "mrfentmen-jsdelivr-mcp/1.0 (https://github.com/mrfentmen)"
export class JsdelivrError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(30000),
  })
  if (!res.ok) throw new JsdelivrError(`jsDelivr returned HTTP ${res.status}`)
  return (await res.json()) as T
}

export async function packageInfo(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new JsdelivrError("Provide an npm package name like lodash")
  const d = await get<any>(`${BASE}/packages/npm/${encodeURIComponent(name)}`)
  if (!d?.versions) throw new JsdelivrError(`Package not found: ${name}`)
  const versions = (d?.versions ?? []) as any[]
  const latestTag = d?.tags?.latest ?? versions[0]?.version ?? ""
  const lines = [
    `Package: ${name}`,
    `Latest: ${latestTag}`,
    `Versions: ${versions.length}`,
  ]
  const recent = versions.slice(0, 12).map((v: any) => v?.version ?? "")
  if (recent.length) lines.push(`Recent: ${recent.join(", ")}`)
  return lines.join("\n")
}

export async function stats(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new JsdelivrError("Provide an npm package name")
  const d = await get<any>(`${BASE}/stats/packages/npm/${encodeURIComponent(name)}`)
  if (!d?.hits) throw new JsdelivrError(`No stats for package ${name}`)
  const h = d.hits ?? {}
  const lines = [
    `Package: ${name}`,
    `Total requests: ${h?.total != null ? h.total.toLocaleString() : "n/a"}`,
    `Rank: ${h?.rank != null ? `#${h.rank}` : "n/a"}${h?.typeRank != null ? ` (type #${h.typeRank})` : ""}`,
  ]
  if (d?.versions) lines.push(`Versions tracked: ${d.versions}`)
  return lines.join("\n")
}

// ---- muxC tools:

