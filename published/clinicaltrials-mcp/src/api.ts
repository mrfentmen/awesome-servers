const BASE = "https://clinicaltrials.gov/api/v2"
const FIELDS = [
  "NCTId",
  "BriefTitle",
  "OverallStatus",
  "Phase",
  "Condition",
  "InterventionName",
  "LeadSponsorName",
  "EnrollmentCount",
  "StartDate",
  "CompletionDate",
  "StudyType",
]

export class TrialsError extends Error {}

async function getJson(url: string, timeoutMs = 30000): Promise<any> {
  const ctrl = new AbortController()
  const timer = setTimeout(() => ctrl.abort(), timeoutMs)
  try {
    const res = await fetch(url, {
      signal: ctrl.signal,
      headers: { "user-agent": "clinicaltrials-mcp", accept: "application/json" },
    })
    if (res.status === 404) throw new TrialsError("No such study on ClinicalTrials.gov")
    if (!res.ok) throw new TrialsError(`ClinicalTrials.gov responded ${res.status}`)
    return await res.json()
  } catch (e) {
    if (e instanceof TrialsError) throw e
    if ((e as Error).name === "AbortError") throw new TrialsError("ClinicalTrials.gov request timed out")
    throw new TrialsError(`ClinicalTrials.gov request failed: ${(e as Error).message}`)
  } finally {
    clearTimeout(timer)
  }
}

const text = (v: unknown): string => (typeof v === "string" ? v : "")

function studyLine(s: any, i?: number): string {
  const p = s.protocolSection ?? {}
  const id = p.identificationModule?.nctId ?? "?"
  const title = p.identificationModule?.briefTitle ?? "(untitled)"
  const status = p.statusModule?.overallStatus ?? "UNKNOWN"
  const phase = (p.designModule?.phases ?? []).join("/") || "n/a"
  const cond = (p.conditionsModule?.conditions ?? []).slice(0, 2).join(", ")
  const sponsor = p.sponsorCollaboratorsModule?.leadSponsor?.name ?? "unknown sponsor"
  const prefix = typeof i === "number" ? `${i + 1}. ` : "• "
  return `${prefix}${id} — ${title}\n   ${status} · phase ${phase} · ${cond || "no condition listed"} · ${sponsor}`
}

function normalizeStatus(input: string): string {
  const s = input.trim().toUpperCase().replace(/[\s-]+/g, "_")
  const allowed = [
    "RECRUITING",
    "ACTIVE_NOT_RECRUITING",
    "COMPLETED",
    "ENROLLING_BY_INVITATION",
    "NOT_YET_RECRUITING",
    "SUSPENDED",
    "TERMINATED",
    "WITHDRAWN",
    "UNKNOWN",
  ]
  if (!allowed.includes(s)) {
    throw new TrialsError(`Unknown status "${input}" — use one of ${allowed.join(", ")}`)
  }
  return s
}

export async function searchStudies(term: string, status: string | undefined, limit: number): Promise<string> {
  const params = new URLSearchParams({
    "query.term": term.trim(),
    pageSize: String(limit),
    fields: FIELDS.join(","),
  })
  if (status) params.set("filter.overallStatus", normalizeStatus(status))
  const d = await getJson(`${BASE}/studies?${params.toString()}`)
  const studies: any[] = d.studies ?? []
  if (studies.length === 0) return `No trials matched "${term}"${status ? ` with status ${status}` : ""}.`
  return [
    `Trials matching "${term}"${status ? ` (${status})` : ""}:`,
    "",
    ...studies.map(studyLine),
    "",
    d.nextPageToken ? "More results exist — narrow the term to see them." : "",
  ]
    .filter(Boolean)
    .join("\n")
}

export async function studyDetail(nctId: string): Promise<string> {
  const id = nctId.trim().toUpperCase()
  if (!/^NCT\d{8}$/.test(id)) throw new TrialsError(`"${nctId}" is not an NCT id (expected NCT followed by 8 digits)`)
  const d = await getJson(`${BASE}/studies/${id}`)
  const p = d.protocolSection ?? {}
  const idm = p.identificationModule ?? {}
  const st = p.statusModule ?? {}
  const des = p.designModule ?? {}
  const sp = p.sponsorCollaboratorsModule ?? {}
  const out = p.outcomesModule ?? {}
  const elig = p.eligibilityModule ?? {}
  const rows = [
    `${idm.nctId ?? id} — ${idm.briefTitle ?? idm.officialTitle ?? "(untitled)"}`,
    `Status: ${st.overallStatus ?? "unknown"}${st.startDateStruct?.date ? ` · started ${st.startDateStruct.date}` : ""}${st.completionDateStruct?.date ? ` · completes ${st.completionDateStruct.date}` : ""}`,
    `Phase: ${(des.phases ?? []).join(", ") || "n/a"} · type: ${des.studyType ?? "n/a"} · enrollment: ${des.enrollmentInfo?.count ?? "n/a"}`,
    `Condition(s): ${(p.conditionsModule?.conditions ?? []).join(", ") || "n/a"}`,
    `Lead sponsor: ${sp.leadSponsor?.name ?? "unknown"}`,
    `Eligibility: ages ${elig.minimumAge ?? "?"} to ${elig.maximumAge ?? "?"}, sex ${elig.sex ?? "ALL"}`,
  ]
  const outcomes: any[] = out.primaryOutcomes ?? []
  if (outcomes.length) {
    rows.push("", "Primary outcomes:")
    for (const o of outcomes.slice(0, 5)) rows.push(`   • ${text(o.measure)}`)
  }
  return rows.join("\n")
}

export async function recruitingByCondition(condition: string, limit: number): Promise<string> {
  const params = new URLSearchParams({
    "query.cond": condition.trim(),
    "filter.overallStatus": "RECRUITING",
    pageSize: String(limit),
    fields: FIELDS.join(","),
  })
  const d = await getJson(`${BASE}/studies?${params.toString()}`)
  const studies: any[] = d.studies ?? []
  if (studies.length === 0) return `No recruiting trials for "${condition}".`
  return [`Recruiting trials for "${condition}":`, "", ...studies.map(studyLine)].join("\n")
}

export async function bySponsor(sponsor: string, limit: number): Promise<string> {
  const params = new URLSearchParams({
    "query.spons": sponsor.trim(),
    pageSize: String(limit),
    fields: FIELDS.join(","),
  })
  const d = await getJson(`${BASE}/studies?${params.toString()}`)
  const studies: any[] = d.studies ?? []
  if (studies.length === 0) return `No trials sponsored by "${sponsor}".`
  return [`Trials sponsored by "${sponsor}":`, "", ...studies.map(studyLine)].join("\n")
}

export async function interventionSearch(intervention: string, status: string | undefined, limit: number): Promise<string> {
  const params = new URLSearchParams({
    "query.intr": intervention.trim(),
    pageSize: String(limit),
    fields: FIELDS.join(","),
  })
  if (status) params.set("filter.overallStatus", normalizeStatus(status))
  const d = await getJson(`${BASE}/studies?${params.toString()}`)
  const studies: any[] = d.studies ?? []
  if (studies.length === 0) return `No trials testing "${intervention}".`
  return [`Trials testing "${intervention}":`, "", ...studies.map(studyLine)].join("\n")
}

export async function studyLocations(nctId: string): Promise<string> {
  const id = nctId.trim().toUpperCase()
  if (!/^NCT\d{8}$/.test(id)) throw new TrialsError(`"${nctId}" is not an NCT id`)
  const d = await getJson(`${BASE}/studies/${id}?fields=protocolSection.identificationModule,NCTId,protocolSection.contactsLocationsModule`)
  const p = d.protocolSection ?? {}
  const sites: any[] = p.contactsLocationsModule?.locations ?? []
  if (sites.length === 0) return `${id} lists no study locations.`
  const byCountry = new Map<string, string[]>()
  for (const s of sites) {
    const country = String(s.country ?? "unknown")
    const label = [s.facility, s.city, s.state].filter(Boolean).join(", ")
    if (!byCountry.has(country)) byCountry.set(country, [])
    byCountry.get(country)!.push(label || "unnamed site")
  }
  const rows: string[] = []
  for (const [country, list] of [...byCountry.entries()].sort((a, b) => b[1].length - a[1].length)) {
    rows.push(`${country} (${list.length}):`)
    for (const site of list.slice(0, 6)) rows.push(`   • ${site}`)
    if (list.length > 6) rows.push(`   … ${list.length - 6} more`)
  }
  return [`${id} — ${p.identificationModule?.briefTitle ?? ""}`, `Sites: ${sites.length}`, "", ...rows].join("\n")
}
