/**
 * Formbricks Management API client. Points at any instance via FORMBRICKS_URL
 * (default https://app.formbricks.com). Needs FORMBRICKS_API_KEY.
 * Docs: https://formbricks.com/docs/api-v1
 */
const BASE = (process.env.FORMBRICKS_URL ?? "https://app.formbricks.com").replace(/\/+$/, "")

export class FormbricksError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.FORMBRICKS_API_KEY
  if (!key) throw new FormbricksError("Set FORMBRICKS_API_KEY first.")
  return { "User-Agent": "formbricks-mcp/1.0", Accept: "application/json", "x-api-key": key }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new FormbricksError("Formbricks refused (401/403). Check URL and key.")
  if (res.status === 404) throw new FormbricksError("Not found.")
  if (!res.ok) throw new FormbricksError(`Formbricks error ${res.status}`)
  return (await res.json()) as T
}

export interface Survey {
  id: string
  name?: string
  status?: string
  responses?: number
}

export async function listSurveys(limit = 10): Promise<Survey[]> {
  const data = await getJson<Raw>(`/api/v1/management/surveys?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((s) => ({
    id: String(s.id),
    name: s.name,
    status: s.status,
    responses: typeof s.responseCount === "number" ? s.responseCount : undefined,
  }))
}

export async function surveyResponses(id: string, limit = 10): Promise<string[]> {
  if (!id.trim()) throw new FormbricksError("Survey id is empty.")
  const data = await getJson<Raw>(`/api/v1/management/surveys/${encodeURIComponent(id.trim())}/responses?limit=${Math.min(Math.max(limit, 1), 100)}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.slice(0, limit).map((r, i) => {
    const answers = r.data && typeof r.data === "object" ? Object.values(r.data as Raw).map(String).join(" | ").slice(0, 160) : ""
    return `${i + 1}. ${answers || "(empty response)"}`;
  })
}

export function formatSurvey(s: Survey, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  return `${prefix}[${s.id}] ${s.name ?? "(unnamed)"}${s.status ? ` [${s.status}]` : ""}${s.responses !== undefined ? ` (${s.responses} responses)` : ""}`
}
