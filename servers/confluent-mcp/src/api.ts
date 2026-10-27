/**
 * Confluent Cloud API client. Needs CONFLUENT_API_KEY + CONFLUENT_API_SECRET
 * (Cloud Console > API access, with OrganizationAdmin or EnvironmentAdmin role).
 * Docs: https://docs.confluent.io/cloud/current/api.html
 */
const BASE = "https://api.confluent.cloud"

export class ConfluentError extends Error {}

function headers(): Record<string, string> {
  const key = process.env.CONFLUENT_API_KEY
  const secret = process.env.CONFLUENT_API_SECRET
  if (!key || !secret) {
    throw new ConfluentError("Set CONFLUENT_API_KEY and CONFLUENT_API_SECRET first.")
  }
  return {
    "User-Agent": "confluent-mcp/1.0",
    Accept: "application/json",
    Authorization: `Basic ${Buffer.from(`${key}:${secret}`).toString("base64")}`,
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Raw = Record<string, any>

async function getJson<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: headers(),
    signal: AbortSignal.timeout(20000),
  })
  if (res.status === 401 || res.status === 403) throw new ConfluentError("Confluent refused (401/403). Check key, secret, and role.")
  if (res.status === 404) throw new ConfluentError("Not found.")
  if (!res.ok) throw new ConfluentError(`Confluent error ${res.status}`)
  return (await res.json()) as T
}

export interface Environment {
  id: string
  name?: string
}

export async function listEnvironments(): Promise<Environment[]> {
  const data = await getJson<Raw>("/org/v2/environments")
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.map((e) => ({ id: String(e.id), name: e.display_name }))
}

export interface Cluster {
  id: string
  name?: string
  cloud?: string
  region?: string
  availability?: string
  endpoint?: string
}

export async function listClusters(environment: string): Promise<Cluster[]> {
  if (!environment.trim()) throw new ConfluentError("Environment id is empty.")
  const data = await getJson<Raw>(`/cmk/v2/clusters?environment=${encodeURIComponent(environment.trim())}`)
  const rows: Raw[] = Array.isArray(data.data) ? data.data : []
  return rows.map((c) => ({
    id: String(c.id),
    name: c.spec?.display_name,
    cloud: c.spec?.cloud,
    region: c.spec?.region,
    availability: c.spec?.availability,
    endpoint: c.spec?.http_endpoint,
  }))
}

export function formatCluster(c: Cluster, index?: number): string {
  const prefix = index !== undefined ? `${index + 1}. ` : ""
  const where = [c.cloud, c.region, c.availability].filter(Boolean).join("/")
  return `${prefix}[${c.id}] ${c.name ?? "(unnamed)"}${where ? ` (${where})` : ""}${c.endpoint ? `\n   ${c.endpoint}` : ""}`
}
