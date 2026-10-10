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

// ---- muxD tools:

/** Confluent returns either a bare array or a { data: [...] } envelope depending on the family. */
function cfRows(payload: unknown): Raw[] {
  if (Array.isArray(payload)) return payload as Raw[]
  const data = (payload as Raw | null)?.data
  return Array.isArray(data) ? (data as Raw[]) : []
}

const cfText = (v: unknown, max = 200): string => {
  if (v === null || v === undefined || v === '') return ''
  const s = typeof v === 'string' ? v : JSON.stringify(v)
  return s.length > max ? `${s.slice(0, max)}…` : s
};

const cfConfigValue = (configs: unknown, key: string): string => {
  if (!configs || typeof configs !== 'object') return ''
  const rec = configs as Record<string, unknown>
  const direct = rec[key]
  if (direct !== undefined) return cfText(direct, 60)
  // Confluent sometimes nests the same key under a default_config / topic_config object.
  for (const nested of ['default_config', 'topic_config', 'overrides']) {
    const inner = rec[nested]
    if (inner && typeof inner === 'object' && (inner as Record<string, unknown>)[key] !== undefined) {
      return cfText((inner as Record<string, unknown>)[key], 60)
    }
  }
  return ''
}

const CF_MS = 86400000

export interface TopicsArgs {
  cluster_id: string;
  limit?: number;
}

/** The topics on a Kafka cluster with the facts that decide whether each one is set up sanely. */
export async function listTopics(args: TopicsArgs): Promise<string> {
  const clusterId = String(args.cluster_id ?? '').trim()
  if (!clusterId) throw new ConfluentError('Provide the cluster id (lkc-...). See list_clusters.')
  const limit = Math.min(Math.max(Number(args.limit ?? 40), 1), 200)

  const payload = await getJson<unknown>(`/kafka/v3/clusters/${encodeURIComponent(clusterId)}/topics`)
  const rows = cfRows(payload)
  if (!rows.length) return `Confluent reported no topics on cluster ${clusterId}.`

  type Topic = {
    name: string
    state: string
    partitions: number
    replication: number
    durable: boolean
    retention: string
    cleanup: string
    raw: Raw
  }
  const topics: Topic[] = rows.map((r) => {
    // The spec types this body only as "The list of topics", so read the spec
    // block defensively and fall back to the top level.
    const spec = (r.spec ?? r) as Raw
    return {
      name: cfText(spec.topic_name ?? spec.name ?? r.metadata?.resource_name ?? '?', 120),
      state: cfText(spec.state ?? '?', 40),
      partitions: Number(spec.partitions_count ?? spec.num_partitions ?? NaN),
      replication: Number(spec.replication_factor ?? NaN),
      durable: spec.durable === true,
      retention: cfConfigValue(spec.configs, 'retention.ms'),
      cleanup: cfConfigValue(spec.configs, 'cleanup.policy'),
      raw: r,
    }
  })

  const shown = topics.slice(0, limit)
  const byState = new Map<string, number>()
  for (const t of topics) byState.set(t.state, (byState.get(t.state) ?? 0) + 1)
  const totalParts = topics.reduce((s, t) => s + (Number.isFinite(t.partitions) ? t.partitions : 0), 0)
  const avgRep = topics.filter((t) => Number.isFinite(t.replication) && t.replication > 0)
  const minRep = Math.min(...avgRep.map((t) => t.replication))

  const lines = [
    `Topics on cluster ${clusterId}: ${topics.length} total, ${totalParts} partition${totalParts === 1 ? '' : 's'}`,
    `State mix: ${[...byState.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}`,
    avgRep.length ? `Replication factor ranges from ${minRep} to ${Math.max(...avgRep.map((t) => t.replication))} across ${avgRep.length} topic(s).` : '',
    '',
    `${"topic".padEnd(44)}${"state".padEnd(12)}${"parts".padStart(6)}${"repl".padStart(6)}  retention / cleanup`,
  ]
  for (const t of shown) {
    const retention = t.retention && /^\d+$/.test(t.retention) ? `${Number(t.retention) / CF_MS} d` : t.retention || 'default'
    lines.push(
      `${t.name.slice(0, 44).padEnd(44)}${t.state.slice(0, 12).padEnd(12)}` +
      `${(Number.isFinite(t.partitions) ? t.partitions : '?').toString().padStart(6)}` +
      `${(Number.isFinite(t.replication) ? t.replication : '?').toString().padStart(6)}  ${retention} / ${t.cleanup || 'default'}${t.durable ? '' : ' (not durable)'}`,
    )
  }
  if (topics.length > shown.length) lines.push('', `...and ${topics.length - shown.length} more; raise limit to see them.`)

  const fragile = shown.filter((t) => Number.isFinite(t.replication) && t.replication < 3)
  if (fragile.length) {
    lines.push('', `Replication factor below 3 on: ${fragile.map((t) => `${t.name} (${t.replication})`).join(', ')}. Those topics lose a replica if two brokers fail, so they cannot survive a rack or zone outage.`)
  }
  const inactive = shown.filter((t) => !/^active$/i.test(t.state))
  if (inactive.length) lines.push('', `Not active: ${inactive.map((t) => `${t.name} (${t.state})`).join(', ')}`)
  return lines.filter((l) => l !== '').join('\n')
}

export interface ConnectorsArgs {
  environment_id: string;
  cluster_id: string;
  expand?: string;
}

/** The connectors on a cluster with their run state and any failure trace, which is where a broken pipeline announces itself. */
export async function listConnectors(args: ConnectorsArgs): Promise<string> {
  const envId = String(args.environment_id ?? '').trim()
  const clusterId = String(args.cluster_id ?? '').trim()
  if (!envId) throw new ConfluentError('Provide environment_id (env-...). See list_environments.')
  if (!clusterId) throw new ConfluentError('Provide cluster_id (lkc-...). See list_clusters.')
  const expand = String(args.expand ?? 'info,status,id').trim() || 'info,status,id'

  const payload = await getJson<unknown>(
    `/connect/v1/environments/${encodeURIComponent(envId)}/clusters/${encodeURIComponent(clusterId)}/connectors?expand=${encodeURIComponent(expand)}`,
  )
  const rows = cfRows(payload)
  if (!rows.length) return `No connectors are deployed on cluster ${clusterId} in environment ${envId}.`

  const byState = new Map<string, number>();
  for (const c of rows) {
    const s = cfText((c.status as Raw | undefined)?.state ?? c.state ?? 'UNKNOWN', 40) || 'UNKNOWN'
    byState.set(s, (byState.get(s) ?? 0) + 1)
  }
  const broken = rows.filter((c) => {
    const s = cfText((c.status as Raw | undefined)?.state ?? c.state ?? '', 40)
    return /FAILED|ERROR/i.test(s)
  })

  const lines = [
    `Connectors on cluster ${clusterId}: ${rows.length} deployed`,
    `State mix: ${[...byState.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}`,
    '',
  ]
  for (const c of rows) {
    const status = (c.status ?? {}) as Raw;
    const info = (c.info ?? {}) as Raw
    const cfg = (c.config ?? {}) as Raw
    const state = cfText(status.state ?? c.state ?? 'UNKNOWN', 40)
    const tasks = Array.isArray(status.tasks)
      ? (status.tasks as Raw[])
      : Array.isArray(c.tasks) ? (c.tasks as Raw[]) : []
    const taskStates = new Map<string, number>()
    for (const t of tasks) {
      const ts = cfText(t.state ?? '?', 30) || '?'
      taskStates.set(ts, (taskStates.get(ts) ?? 0) + 1)
    }
    const name = cfText(c.name ?? info.name ?? '?', 120)
    // With expand=info the config lives under info; without it, at the top level.
    const infoCfg = (info.config ?? {}) as Raw
    const connectorClass = cfText(cfg['connector.class'] ?? infoCfg['connector.class'] ?? c.connector_class ?? '', 90)
    lines.push(`${name} — ${state}`);
    lines.push(`  id ${cfText(c.id ?? '?', 40)} | type ${connectorClass || cfText(c.type ?? '', 60) || 'not reported'}`);
    lines.push(`  tasks ${tasks.length}${taskStates.size ? `: ${[...taskStates.entries()].map(([k, v]) => `${v} ${k}`).join(', ')}` : ''}`);
    for (const t of tasks) {
      if (!/FAILED|ERROR/i.test(cfText(t.state ?? '', 30))) continue
      lines.push(`  task ${cfText(t.id ?? t.task ?? '?', 30)} FAILED: ${cfText(t.worker_id ?? '', 40)}`)
    }
    const err = (status as Raw).error as Raw | undefined
    if (err && typeof err === 'object') {
      const trace = cfText((err as Raw).trace ?? (err as Raw).message ?? err, 300)
      if (trace) lines.push(`  error: ${trace}`)
    }
  }
  if (broken.length) {
    lines.push('', `${broken.length} connector(s) are in a failed state: ${broken.map((c) => cfText(c.name ?? '?', 80)).join(', ')}. Their data flow has stopped until the trace above is resolved.`)
  }
  return lines.join('\n')
}

export interface SchemasArgs {
  subject_prefix?: string;
  latest_only?: string;
  limit?: number;
}

/** The subjects in Schema Registry with their type, id and version, which is how you spot a subject that has drifted. */
export async function listSchemas(args: SchemasArgs = {}): Promise<string> {
  const limit = Math.min(Math.max(Number(args.limit ?? 40), 1), 100)
  const params = new URLSearchParams()
  const prefix = String(args.subject_prefix ?? '').trim()
  if (prefix) params.set('subjectPrefix', prefix)
  if (args.latest_only === 'true' || args.latest_only === '1') params.set('latestOnly', 'true')
  params.set('limit', String(limit))

  const payload = await getJson<unknown>(`/schemas?${params.toString()}`)
  const rows = cfRows(payload)
  if (!rows.length) {
    return `Schema Registry returned no subjects${prefix ? ` with prefix "${prefix}"` : ''}. Check the cluster and that subjects have been registered.`
  }

  const subjects = new Map<string, { versions: number[]; latest: number; id: number | null; type: string; tags: string[] }>()
  for (const r of rows) {
    const name = cfText(r.subject ?? '?', 140)
    const version = Number(r.version ?? NaN)
    // Confluent omits schemaType for Avro, so an absent type means AVRO.
    const schemaType = cfText(r.schemaType || 'AVRO', 20) || 'AVRO'
    const entry = subjects.get(name) ?? { versions: [], latest: -1, id: null, type: schemaType, tags: [] }
    if (Number.isFinite(version)) entry.versions.push(version)
    if (version > entry.latest) {
      entry.latest = version
      entry.id = Number.isFinite(Number(r.id)) ? Number(r.id) : null
    }
    if (entry.type === 'AVRO' && schemaType !== 'AVRO') entry.type = schemaType
    const tags = r.schemaTags
    if (Array.isArray(tags)) for (const tag of tags as unknown[]) entry.tags.push(cfText(tag, 40))
    subjects.set(name, entry)
  }

  const byType = new Map<string, number>()
  for (const [, e] of subjects) byType.set(e.type, (byType.get(e.type) ?? 0) + 1)
  const shown = [...subjects.entries()].sort((a, b) => b[1].versions.length - a[1].versions.length || a[0].localeCompare(b[0]))

  const lines = [
    `Schema Registry: ${rows.length} version row(s) across ${subjects.size} subject(s)${prefix ? ` with prefix "${prefix}"` : ''}${args.latest_only === 'true' ? ', latest only' : ''}`,
    `Schema types: ${[...byType.entries()].map(([k, v]) => `${k} ${v}`).join(', ')}`,
    '',
    `${"subject".padEnd(52)}${"versions".padStart(9)}${"latest".padStart(8)}${"schema id".padStart(10)}  type`,
  ]
  for (const [name, e] of shown.slice(0, limit)) {
    const vList = e.versions.length ? `${e.versions.length} (up to v${Math.max(...e.versions)})` : '?';
    lines.push(
      `${name.slice(0, 52).padEnd(52)}${vList.padStart(9)}${(e.latest >= 0 ? `v${e.latest}` : '?').padStart(8)}` +
      `${(e.id ?? '?').toString().padStart(10)}  ${e.type}${e.tags.length ? `  tags: ${[...new Set(e.tags)].join(', ')}` : ''}`,
    )
  }
  if (subjects.size > shown.slice(0, limit).length) {
    lines.push('', `...and ${subjects.size - shown.slice(0, limit).length} more subjects; raise limit to see them.`)
  }
  return lines.join('\n')
}
