const UA = "mrfentmen-package-registry-mcp/1.0 (https://github.com/mrfentmen)"
export class RegistryError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { "User-Agent": UA }, signal: AbortSignal.timeout(25000) })
  if (!res.ok) throw new RegistryError(`Registry error ${res.status}`)
  return (await res.json()) as T
}

export async function npmPackage(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new RegistryError("Provide an npm package name")
  const d = await get<any>(`https://registry.npmjs.org/${encodeURIComponent(name)}`)
  const latest = d["dist-tags"]?.latest ?? ""
  const v = d.versions?.[latest] ?? {}
  return `${d.name ?? name}\nVersion: ${latest}\nDescription: ${v.description ?? d.description ?? ""}\nLicense: ${v.license ?? ""}\nHomepage: ${d.homepage ?? ""}\nWeekly downloads: ${d.downloads?.lastMonth ?? "n/a"}\nLast updated: ${d.time?.[latest] ?? ""}`
}

export async function pypiPackage(args: { name?: string }): Promise<string> {
  const name = (args.name ?? "").trim()
  if (!name) throw new RegistryError("Provide a PyPI package name")
  const d = await get<any>(`https://pypi.org/pypi/${encodeURIComponent(name)}/json`)
  const info = d.info ?? {}
  return `${info.name ?? name}\nVersion: ${info.version ?? ""}\nSummary: ${info.summary ?? ""}\nAuthor: ${info.author ?? ""}\nLicense: ${info.license ?? ""}\nHomepage: ${info.home_page ?? info.project_urls?.["Homepage"] ?? ""}\nRequires Python: ${info.requires_python ?? "any"}`
}

export async function npmSearch(args: { query?: string; limit?: number }): Promise<string> {
  const q = encodeURIComponent(args.query ?? "")
  const limit = Math.min(args.limit ?? 10, 25)
  const d = await get<any>(`https://registry.npmjs.org/-/v1/search?text=${q}&size=${limit}`)
  const objs = d.objects ?? []
  return objs.map((o: any, i: number) => {
    const p = o.package ?? {}
    return `${i + 1}. ${p.name}@${p.version ?? ""}\n   ${(p.description ?? "").slice(0, 120)}\n   ${p.links?.npm ?? ""}`
  }).join("\n\n") || "No packages found"
}

// ---- muxC tools:

