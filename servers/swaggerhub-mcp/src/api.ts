const BASE = 'https://api.swaggerhub.com';
const UA = 'mrfentmen-swaggerhub-mcp/1.0 (https://github.com/mrfentmen)';
export class SwaggerhubError extends Error {}

async function get<T>(url: string): Promise<T> {
  const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
  if (!res.ok) throw new SwaggerhubError(`SwaggerHub returned ${res.status}`);
  return (await res.json()) as T;
}

interface ApiEntry {
  name?: string;
  description?: string;
  properties?: Array<{ type?: string; url?: string }>;
}

export async function search(args: { query?: string; limit?: number }): Promise<string> {
  const q = (args.query ?? '').trim();
  const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
  const url = q ? `${BASE}/apis?query=${encodeURIComponent(q)}&limit=${limit}` : `${BASE}/apis?limit=${limit}`;
  const d = await get<{ totalCount?: number; apis?: ApiEntry[] }>(url);
  const apis = d.apis ?? [];
  if (!apis.length) return `No APIs found${q ? ` for "${q}"` : ''}.`;
  return `SwaggerHub APIs${q ? ` matching "${q}"` : ''} (${d.totalCount ?? apis.length} total, ${apis.length} shown):\n` +
    apis.map((a, i) => {
      const spec = a.properties?.find((p) => p.type === 'Swagger' || p.type === 'OpenAPI')?.url ?? '';
      return `${i + 1}. ${a.name ?? '?'}\n   ${a.description ?? ''}\n   ${spec}`;
    }).join('\n');
}

export async function byOwner(args: { owner?: string; limit?: number }): Promise<string> {
  const owner = (args.owner ?? '').trim();
  if (!owner) throw new SwaggerhubError('Provide an owner (user or org)');
  const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
  const d = await get<{ apis?: ApiEntry[] }>(`${BASE}/apis/${encodeURIComponent(owner)}?limit=${limit}`);
  const apis = d.apis ?? [];
  if (!apis.length) return `No APIs found for owner "${owner}".`;
  return `APIs by ${owner} (${apis.length} shown):\n` + apis.map((a, i) => `${i + 1}. ${a.name ?? '?'}\n   ${a.description ?? ''}`).join('\n');
}

// ---- muxC tools:

const SORT_VALUES = ["NAME", "UPDATED", "CREATED", "OWNER", "BEST_MATCH", "TITLE"]

// The listing carries both spec URLs and scalar metadata (version, dates, owner)
// on each entry, so the local shape is wider than the one search reads.
interface RegistryEntry {
  name?: string
  properties?: Array<{ type?: string; url?: string; value?: string }>
}

function specUrlOf(a: RegistryEntry): string {
  return a.properties?.find((p) => p.type === "Swagger" || p.type === "OpenAPI")?.url ?? ""
}

function propValue(a: RegistryEntry, type: string): string {
  return a.properties?.find((p) => p.type === type)?.value ?? "not reported"
}

/** Every version SwaggerHub holds for one API, not just the default. */
export async function apiVersions(args: { owner?: string; api?: string }): Promise<string> {
  const owner = (args.owner ?? "").trim()
  const api = (args.api ?? "").trim()
  if (!owner || !api) throw new SwaggerhubError("Provide both owner and api, e.g. owner smartbear and api 0-0-0")
  const d = await get<{ totalCount?: number; defaultVersion?: string; apis?: RegistryEntry[] }>(
    `${BASE}/apis/${encodeURIComponent(owner)}/${encodeURIComponent(api)}`,
  )
  const apis = d.apis ?? []
  if (!apis.length) return `No API ${owner}/${api} in the registry.`
  return `Versions of ${owner}/${api} (${d.totalCount ?? apis.length} total, default ${d.defaultVersion ?? "not reported"}):\n` +
    apis
      .map((a, i) => {
        const version = propValue(a, "X-Version")
        return `${i + 1}. ${version}${version === d.defaultVersion ? " (default)" : ""} | modified ${propValue(a, "X-Modified")} | OAS ${propValue(a, "X-OASVersion")}\n   ${specUrlOf(a)}`
      })
      .join("\n")
}

