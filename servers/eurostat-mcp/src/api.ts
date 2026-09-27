const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0/data"
const UA = "mrfentmen-eurostat-mcp/1.0 (https://github.com/mrfentmen)"
export class EurostatError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, {
    headers: { "User-Agent": UA, Accept: "application/json" },
    signal: AbortSignal.timeout(45000),
  })
  if (!res.ok) throw new EurostatError(`Eurostat returned HTTP ${res.status}`)
  return (await res.json()) as T
}

interface Dim {
  category?: { label?: Record<string, string>; index?: Record<string, number> }
  [k: string]: unknown
}

function dimLabels(d: Dim): string[] {
  const cat = d?.category ?? {}
  const index = (cat?.index ?? {}) as Record<string, number>
  return Object.entries(index).sort((a, b) => a[1] - b[1]).map(([k]) => k)
}

export async function dataset(args: { code?: string; geo?: string; limit?: number }): Promise<string> {
  const code = (args.code ?? "").trim()
  if (!code) throw new EurostatError("Provide a dataset code like teilm020")
  const geo = (args.geo ?? "").trim().toUpperCase()
  const limit = Math.min(args.limit ?? 8, 20)
  const params = new URLSearchParams({ format: "JSON", lang: "en" })
  if (geo) params.set("geo", geo)
  const d = await get<any>(`${BASE}/${encodeURIComponent(code)}?${params.toString()}`)
  if (d?.class !== "dataset") throw new EurostatError(`Dataset not found: ${code}`)
  const dims = (d?.dimension ?? {}) as Record<string, Dim>
  const dimNames = Object.keys(dims)
  const value = (d?.value ?? {}) as Record<string, number>
  const values = Object.entries(value).slice(0, limit)
  const lines = [
    `Dataset ${code}: ${d?.label ?? "n/a"}`,
    `Updated: ${d?.updated ?? "n/a"}`,
    `Dimensions: ${dimNames.join(", ")}`,
  ]
  if (values.length) {
    lines.push("", "Sample values:")
    for (const [idxStr, val] of values) {
      const idx = Number(idxStr)
      if (!Number.isInteger(idx)) continue
      const labels = dimNames.map((dn, n) => {
        const dim = dims[dn]
        const list = dimLabels(dim)
        const dimSize = list.length
        const sizeAfter = dimNames.slice(n + 1).reduce((acc, dn2) => acc * Math.max(dimLabels(dims[dn2]).length, 1), 1)
        const slot = sizeAfter > 0 ? Math.floor(idx / sizeAfter) % Math.max(dimSize, 1) : 0
        return `${dn}=${list[slot] ?? "?"}`
      })
      lines.push(`${labels.join(" | ")}: ${val != null ? val.toLocaleString() : "n/a"}`)
    }
  }
  if (Object.keys(value).length > limit) lines.push(`... and ${Object.keys(value).length - limit} more values`)
  return lines.join("\n")
}

export async function unemployment(args: { geo?: string; limit?: number }): Promise<string> {
  const geo = (args.geo ?? "").trim().toUpperCase()
  const limit = Math.min(args.limit ?? 8, 20)
  const params = new URLSearchParams({ format: "JSON", lang: "en", sinceTimePeriod: "2020" })
  if (geo) params.set("geo", geo)
  const d = await get<any>(`${BASE}/une_rt_a?${params.toString()}`)
  if (d?.class !== "dataset") throw new EurostatError("Dataset not found: une_rt_a")
  const value = (d?.value ?? {}) as Record<string, number>
  const entries = Object.entries(value).slice(-limit)
  if (!entries.length) return "No unemployment data"
  return `EU unemployment rate (%${geo ? `, ${geo}` : ""}):\n` + entries.map(([k, v]) => `${k}: ${v}`).join("\n")
}

export async function gdp(args: { geo?: string; limit?: number }): Promise<string> {
  const geo = (args.geo ?? "").trim().toUpperCase()
  const limit = Math.min(args.limit ?? 8, 20)
  const params = new URLSearchParams({ format: "JSON", lang: "en", sinceTimePeriod: "2020" })
  if (geo) params.set("geo", geo)
  const d = await get<any>(`${BASE}/nama_10_gdp?${params.toString()}`)
  if (d?.class !== "dataset") throw new EurostatError("Dataset not found: nama_10_gdp")
  const value = (d?.value ?? {}) as Record<string, number>
  const entries = Object.entries(value).slice(-limit)
  if (!entries.length) return "No GDP data"
  return `EU GDP main components (${geo || "all"}):\n` + entries.map(([k, v]) => `${k}: ${Number(v).toLocaleString()}`).join("\n")
}

export async function population(args: { geo?: string; limit?: number }): Promise<string> {
  const geo = (args.geo ?? "").trim().toUpperCase()
  const limit = Math.min(args.limit ?? 8, 20)
  const params = new URLSearchParams({ format: "JSON", lang: "en", sinceTimePeriod: "2020" })
  if (geo) params.set("geo", geo)
  const d = await get<any>(`${BASE}/demo_pjan?${params.toString()}`)
  if (d?.class !== "dataset") throw new EurostatError("Dataset not found: demo_pjan")
  const value = (d?.value ?? {}) as Record<string, number>
  const entries = Object.entries(value).slice(-limit)
  if (!entries.length) return "No population data"
  return `EU population 1 Jan (${geo || "all"}):\n` + entries.map(([k, v]) => `${k}: ${Number(v).toLocaleString()}`).join("\n")
}

export async function inflation(args: { geo?: string }): Promise<string> {
  const geo = (args.geo ?? "DE").trim().toUpperCase()
  const params = new URLSearchParams({ format: "JSON", lang: "en", geo, sinceTimePeriod: "2023", untilTimePeriod: "2024" })
  const d = await get<any>(`${BASE}/prc_hicp_manr?${params.toString()}`)
  if (d?.class !== "dataset") throw new EurostatError("Dataset not found: prc_hicp_manr")
  const value = (d?.value ?? {}) as Record<string, number>
  const entries = Object.entries(value).slice(-12)
  if (!entries.length) return `No inflation data for ${geo}`
  return `HICP inflation ${geo} (annual %):\n` + entries.map(([k, v]) => `${k}: ${v}`).join("\n")
}
