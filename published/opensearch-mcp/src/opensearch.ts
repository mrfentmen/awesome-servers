const DEFAULT_HOST = "http://localhost:9200"

interface OpenSearchConfig {
  host: string
  username?: string
  password?: string
  apiKey?: string
}

function getConfig(): OpenSearchConfig {
  return {
    host: process.env.OPENSEARCH_URL || DEFAULT_HOST,
    username: process.env.OPENSEARCH_USERNAME,
    password: process.env.OPENSEARCH_PASSWORD,
    apiKey: process.env.OPENSEARCH_API_KEY,
  }
}

function getHeaders(): Record<string, string> {
  const cfg = getConfig()
  const headers: Record<string, string> = { "Content-Type": "application/json" }
  if (cfg.apiKey) headers.Authorization = `ApiKey ${cfg.apiKey}`
  else if (cfg.username && cfg.password) {
    headers.Authorization = "Basic " + Buffer.from(`${cfg.username}:${cfg.password}`).toString("base64")
  }
  return headers
}

export async function checkHealth(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_cluster/health`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Health check failed: ${res.status}`)
  return res.json()
}

export async function listIndices(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_cat/indices?format=json`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`List indices failed: ${res.status}`)
  return res.json()
}

export async function createIndex(index: string, settings?: any): Promise<any> {
  const cfg = getConfig()
  const body: any = {}
  if (settings) body.settings = settings
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Create index failed: ${res.status}`)
  return res.json()
}

export async function deleteIndex(index: string): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Delete index failed: ${res.status}`)
  return res.json()
}

export async function getIndex(index: string): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Get index failed: ${res.status}`)
  return res.json()
}

export async function indexDocument(index: string, doc: any, id?: string): Promise<any> {
  const cfg = getConfig()
  const path = id
    ? `/${encodeURIComponent(index)}/_doc/${encodeURIComponent(id)}`
    : `/${encodeURIComponent(index)}/_doc`
  const method = id ? "PUT" : "POST"
  const res = await fetch(`${cfg.host}${path}`, {
    method,
    headers: getHeaders(),
    body: JSON.stringify(doc),
  })
  if (!res.ok) throw new Error(`Index document failed: ${res.status}`)
  return res.json()
}

export async function getDocument(index: string, id: string): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_doc/${encodeURIComponent(id)}`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Get document failed: ${res.status}`)
  return res.json()
}

export async function deleteDocument(index: string, id: string): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_doc/${encodeURIComponent(id)}`, {
    method: "DELETE",
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Delete document failed: ${res.status}`)
  return res.json()
}

export async function searchIndex(index: string, query: string, limit = 20, from = 0): Promise<any> {
  const cfg = getConfig()
  const body = {
    query: query
      ? {
          multi_match: {
            query,
            fields: ["*"],
          },
        }
      : { match_all: {} },
    size: limit,
    from,
  }
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_search`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(body),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

export async function searchIndexRaw(index: string, searchBody: any): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_search`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(searchBody),
  })
  if (!res.ok) throw new Error(`Search failed: ${res.status}`)
  return res.json()
}

export async function getStats(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_stats`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Get stats failed: ${res.status}`)
  return res.json()
}

export async function getClusterStats(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_cluster/stats`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Get cluster stats failed: ${res.status}`)
  return res.json()
}

export async function getTasks(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_tasks`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Get tasks failed: ${res.status}`)
  return res.json()
}

export async function getMappings(index: string): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_mapping`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Get mappings failed: ${res.status}`)
  return res.json()
}

export async function updateMapping(index: string, mapping: any): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/${encodeURIComponent(index)}/_mapping`, {
    method: "PUT",
    headers: getHeaders(),
    body: JSON.stringify(mapping),
  })
  if (!res.ok) throw new Error(`Update mapping failed: ${res.status}`)
  return res.json()
}

export async function listShards(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_cat/shards?format=json`, { headers: getHeaders() })
  if (!res.ok) throw new Error(`Get shards failed: ${res.status}`)
  return res.json()
}

export async function listNodes(): Promise<any> {
  const cfg = getConfig()
  const res = await fetch(`${cfg.host}/_cat/nodes?format=json&full_id=true`, {
    headers: getHeaders(),
  })
  if (!res.ok) throw new Error(`Get nodes failed: ${res.status}`)
  return res.json()
}

export function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`
}
