/**
 * CVE Services — the authoritative CVE record, published by MITRE. Keyless.
 *
 * Verified live: GET /api/cve/<CVE-ID> returns the CVE JSON 5.2 record; an
 * unknown id answers 404 `{"error":"CVE_RECORD_DNE"}`.
 */
const API = "https://cveawg.mitre.org/api/cve/"

export class CveError extends Error {}

interface Version {
  version?: string
  status?: string
}

interface Affected {
  vendor?: string
  product?: string
  packageName?: string
  defaultStatus?: string
  versions?: Version[]
}

interface Metric {
  cvssV3_1?: { baseScore?: number; baseSeverity?: string; vectorString?: string }
  cvssV4_0?: { baseScore?: number; baseSeverity?: string; vectorString?: string }
  cvssV2_0?: { baseScore?: number; vectorString?: string }
  other?: { type?: string; content?: { value?: string } }
}

interface Reference {
  url?: string
  name?: string
}

interface Cna {
  title?: string
  descriptions?: Array<{ lang?: string; value?: string }>
  affected?: Affected[]
  metrics?: Metric[]
  problemTypes?: Array<{ descriptions?: Array<{ description?: string; lang?: string }> }>
  references?: Reference[]
}

interface CveRecord {
  cveMetadata?: {
    cveId?: string
    state?: string
    assignerShortName?: string
    datePublished?: string
    dateUpdated?: string
    dateReserved?: string
  }
  containers?: { cna?: Cna }
}

async function get<T>(path: string, timeoutMs = 25000): Promise<T> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${API}${path}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "cveawg-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new CveError("CVE Services has no record with that id")
    if (!res.ok) throw new CveError(`CVE Services responded ${res.status}`)
    return (await res.json()) as T
  } catch (e) {
    if (e instanceof CveError) throw e
    if ((e as Error).name === "AbortError") throw new CveError("CVE Services request timed out")
    throw new CveError(`CVE Services request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function cleanId(input: string): string {
  const v = input.trim().toUpperCase()
  if (!/^CVE-\d{4}-\d{4,}$/.test(v)) {
    throw new CveError(`"${input}" is not a CVE id — expected something like CVE-2024-3094`)
  }
  return v
}

const day = (s: string | undefined): string => (s ?? "").slice(0, 10) || "unknown"

export async function lookup(id: string): Promise<string> {
  const clean = cleanId(id)
  const rec = await get<CveRecord>(encodeURIComponent(clean))
  const meta = rec.cveMetadata ?? {}
  const cna = rec.containers?.cna ?? {}

  const description = (cna.descriptions ?? []).find((d) => (d.lang ?? "en") === "en") ?? cna.descriptions?.[0]

  const severities = (cna.metrics ?? [])
    .map((m) => {
      const v3 = m.cvssV3_1 ?? m.cvssV4_0
      if (v3) return `${v3.baseScore ?? "?"} ${v3.baseSeverity ?? ""} (${v3.vectorString ?? "no vector"})`.trim()
      if (m.cvssV2_0) return `${m.cvssV2_0.baseScore ?? "?"} (${m.cvssV2_0.vectorString ?? "no vector"})`
      if (m.other?.content?.value) return `${m.other.type ?? "rating"}: ${m.other.content.value}`
      return ""
    })
    .filter((s) => s !== "")

  const affected = (cna.affected ?? [])
    .map((a) => {
      const vendor = a.vendor ?? ""
      const product = a.product ?? ""
      const name =
        vendor && product
          ? product.toLowerCase().startsWith(vendor.toLowerCase())
            ? product
            : `${vendor} ${product}`
          : product || vendor || a.packageName || "unnamed product"
      const versions = (a.versions ?? [])
        .map((v) => v.version)
        .filter((v) => v !== undefined && v !== "")
        .slice(0, 6)
      return `   - ${name}${versions.length > 0 ? `: ${versions.join(", ")}` : ""}`
    })
    .filter((s) => s !== "   - unnamed product")

  const weaknesses = (cna.problemTypes ?? [])
    .flatMap((p) => (p.descriptions ?? []).map((d) => d.description ?? ""))
    .filter((s) => s !== "")

  const refs = (cna.references ?? [])
    .filter((r) => r.url)
    .slice(0, 10)
    .map((r) => `   - ${r.url}`)

  return [
    `${clean} — ${cna.title ?? description?.value?.slice(0, 100) ?? "(no title)"}`,
    "",
    `State: ${meta.state ?? "unknown"}`,
    `Assigner: ${meta.assignerShortName ?? "unknown"}`,
    `Reserved: ${day(meta.dateReserved)}`,
    `Published: ${day(meta.datePublished)}`,
    `Updated: ${day(meta.dateUpdated)}`,
    severities.length > 0 ? `Severity: ${severities.join(" · ")}` : "",
    weaknesses.length > 0 ? `Weakness: ${weaknesses.join(", ")}` : "",
    affected.length > 0 ? `Affected:\n${affected.join("\n")}` : "Affected: not listed",
    refs.length > 0 ? `References:\n${refs.join("\n")}` : "",
    "",
    (description?.value ?? "(no description in the record)").replace(/\s+/g, " ").trim(),
  ]
    .filter((line) => line !== "")
    .join("\n")
}
