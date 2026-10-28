/**
 * openFDA. Keyless for modest volumes; every response carries the agency's
 * "not validated, not medical advice" disclaimer, which the tools repeat.
 */
const BASE = "https://api.fda.gov"
const DISCLAIMER = "openFDA data is unvalidated and is not medical advice."

export class OpenFdaError extends Error {}

async function getJson(path: string, search: Record<string, string>, limit: number, timeoutMs = 30000): Promise<any> {
  const params = new URLSearchParams({ limit: String(Math.min(limit, 100)), ...search })
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(`${BASE}/${path}?${params.toString()}`, {
      signal: ctrl.signal,
      headers: { "user-agent": "openfda-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new OpenFdaError("openFDA found no matching records")
    if (res.status === 429) throw new OpenFdaError("openFDA rate limit reached — try again in a minute")
    if (!res.ok) throw new OpenFdaError(`openFDA responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof OpenFdaError) throw e
    if ((e as Error).name === "AbortError") throw new OpenFdaError("openFDA request timed out")
    if (e instanceof SyntaxError) throw new OpenFdaError("openFDA returned a non-JSON response")
    throw new OpenFdaError(`openFDA request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

function quote(term: string, field: string): string {
  const t = term.trim().replace(/"/g, "")
  if (t.length < 2) throw new OpenFdaError("Search term must be at least 2 characters")
  return `${field}:"${t}"`
}

const day = (v: unknown): string => String(v ?? "").slice(0, 10) || "unknown";

export async function drugLabels(name: string, limit: number): Promise<string> {
  const d = await getJson("drug/label.json", { search: quote(name, "openfda.brand_name") }, limit)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No FDA drug labels for "${name}". ${DISCLAIMER}`
  const body = rows.map((r, i) => {
    const openfda = r.openfda ?? {}
    const brand = (openfda.brand_name ?? []).join(", ") || "unknown brand"
    const generic = (openfda.generic_name ?? []).join(", ") || "unknown generic"
    const route = (openfda.route ?? []).join(", ") || "n/a"
    const indications = String((r.indications_and_usage ?? [""])[0] ?? "").replace(/\s+/g, " ").slice(0, 260)
    return `${i + 1}. ${brand} (${generic})\n   Route: ${route} · effective ${day(r.effective_time)}\n   Use: ${indications || "not stated"}`
  })
  return [`FDA drug labels for "${name}" (${rows.length}):`, "", ...body, "", DISCLAIMER].join("\n")
}

export async function adverseEvents(drug: string, limit: number): Promise<string> {
  const d = await getJson("drug/event.json", { search: quote(drug, "patient.drug.medicinalproduct") }, limit)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No adverse-event reports naming "${drug}". ${DISCLAIMER}`
  const body = rows.map((r, i) => {
    const reactions = (r.patient?.reaction ?? []).map((x: any) => x.reactionmeddrapt).filter(Boolean).slice(0, 5)
    const serious = r.serious === "1" ? "serious" : "non-serious"
    const country = r.occurcountry ?? "unknown country"
    return `${i + 1}. ${day(r.receiptdate)} · ${serious} · ${country}\n   Reactions: ${reactions.join(", ") || "none listed"}`
  })
  const total = d.meta?.results?.total
  return [
    `Adverse-event reports naming "${drug}"${total ? ` (${total.toLocaleString("en-US")} reports exist)` : ""}, ${rows.length} shown:`,
    "",
    ...body,
    "",
    `${DISCLAIMER} A report does not mean the drug caused the reaction.`,
  ].join("\n")
}

interface RecallRow {
  recalling_firm: string
  product_description: string
  reason_for_recall: string
  classification: string
  report_date: string
  status: string
}

export async function recalls(kind: "drug" | "device" | "food", term: string, limit: number): Promise<string> {
  const field = kind === "device" ? "product_description" : kind === "food" ? "product_description" : "openfda.brand_name"
  const d = await getJson(`${kind}/enforcement.json`, { search: quote(term, field) }, limit)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No ${kind} recalls matched "${term}". ${DISCLAIMER}`
  const body = rows.map((r: RecallRow, i) => {
    const reason = String(r.reason_for_recall ?? "").replace(/\s+/g, " ").slice(0, 200)
    return `${i + 1}. ${day(r.report_date)} · class ${r.classification ?? "?"} · ${r.status ?? "?"}\n   ${(r.product_description ?? "").replace(/\s+/g, " ").slice(0, 150)}\n   Firm: ${r.recalling_firm ?? "unknown"} · Reason: ${reason}`
  })
  const total = d.meta?.results?.total
  return [
    `${kind[0].toUpperCase()}${kind.slice(1)} recalls matching "${term}"${total ? ` (${total.toLocaleString("en-US")} total)` : ""}:`,
    "",
    ...body,
    "",
    DISCLAIMER,
  ].join("\n")
}

export async function ndcLookup(name: string, limit: number): Promise<string> {
  const d = await getJson("drug/ndc.json", { search: quote(name, "brand_name") }, limit)
  const rows: any[] = d.results ?? []
  if (rows.length === 0) return `No NDC records for "${name}". ${DISCLAIMER}`
  const body = rows.map((r, i) => {
    const pack = (r.packaging ?? []).map((p: any) => p.description).filter(Boolean).slice(0, 2).join("; ")
    return `${i + 1}. ${r.brand_name ?? "unknown"} (${r.generic_name ?? "generic n/a"})\n   NDC ${r.product_ndc ?? "?"} · ${r.dosage_form ?? "form n/a"} · ${r.product_type ?? "type n/a"}\n   ${pack}`
  })
  return [`NDC directory for "${name}" (${rows.length}):`, "", ...body, "", DISCLAIMER].join("\n")
}

export async function labelSections(name: string): Promise<string> {
  const d = await getJson("drug/label.json", { search: quote(name, "openfda.brand_name") }, 1)
  const r = (d.results ?? [])[0]
  if (!r) return `No FDA label for "${name}". ${DISCLAIMER}`
  const wanted: [string, string][] = [
    ["Indications", "indications_and_usage"],
    ["Dosage", "dosage_and_administration"],
    ["Warnings", "warnings_and_cautions"],
    ["Adverse reactions", "adverse_reactions"],
    ["Contraindications", "contraindications"],
    ["Drug interactions", "drug_interactions"],
  ]
  const rows: string[] = []
  for (const [label, key] of wanted) {
    const value = Array.isArray(r[key]) ? r[key][0] : r[key]
    if (!value) continue
    rows.push(`${label}: ${String(value).replace(/\s+/g, " ").slice(0, 400)}`)
  }
  return [`Label sections for "${name}":`, "", rows.length ? rows.join("\n\n") : "No labelled sections found.", "", DISCLAIMER].join("\n")
}
