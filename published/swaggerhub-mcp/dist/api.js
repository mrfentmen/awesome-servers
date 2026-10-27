const BASE = 'https://api.swaggerhub.com';
const UA = 'mrfentmen-swaggerhub-mcp/1.0 (https://github.com/mrfentmen)';
export class SwaggerhubError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { 'User-Agent': UA, Accept: 'application/json' }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new SwaggerhubError(`SwaggerHub returned ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? '').trim();
    const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
    const url = q ? `${BASE}/apis?query=${encodeURIComponent(q)}&limit=${limit}` : `${BASE}/apis?limit=${limit}`;
    const d = await get(url);
    const apis = d.apis ?? [];
    if (!apis.length)
        return `No APIs found${q ? ` for "${q}"` : ''}.`;
    return `SwaggerHub APIs${q ? ` matching "${q}"` : ''} (${d.totalCount ?? apis.length} total, ${apis.length} shown):\n` +
        apis.map((a, i) => {
            const spec = a.properties?.find((p) => p.type === 'Swagger' || p.type === 'OpenAPI')?.url ?? '';
            return `${i + 1}. ${a.name ?? '?'}\n   ${a.description ?? ''}\n   ${spec}`;
        }).join('\n');
}
export async function byOwner(args) {
    const owner = (args.owner ?? '').trim();
    if (!owner)
        throw new SwaggerhubError('Provide an owner (user or org)');
    const limit = Math.max(1, Math.min(args.limit ?? 8, 20));
    const d = await get(`${BASE}/apis/${encodeURIComponent(owner)}?limit=${limit}`);
    const apis = d.apis ?? [];
    if (!apis.length)
        return `No APIs found for owner "${owner}".`;
    return `APIs by ${owner} (${apis.length} shown):\n` + apis.map((a, i) => `${i + 1}. ${a.name ?? '?'}\n   ${a.description ?? ''}`).join('\n');
}
// ---- muxC tools:
const SORT_VALUES = ["NAME", "UPDATED", "CREATED", "OWNER", "BEST_MATCH", "TITLE"];
function specUrlOf(a) {
    return a.properties?.find((p) => p.type === "Swagger" || p.type === "OpenAPI")?.url ?? "";
}
function propValue(a, type) {
    return a.properties?.find((p) => p.type === type)?.value ?? "not reported";
}
/** Every version SwaggerHub holds for one API, not just the default. */
export async function apiVersions(args) {
    const owner = (args.owner ?? "").trim();
    const api = (args.api ?? "").trim();
    if (!owner || !api)
        throw new SwaggerhubError("Provide both owner and api, e.g. owner smartbear and api 0-0-0");
    const d = await get(`${BASE}/apis/${encodeURIComponent(owner)}/${encodeURIComponent(api)}`);
    const apis = d.apis ?? [];
    if (!apis.length)
        return `No API ${owner}/${api} in the registry.`;
    return `Versions of ${owner}/${api} (${d.totalCount ?? apis.length} total, default ${d.defaultVersion ?? "not reported"}):\n` +
        apis
            .map((a, i) => {
            const version = propValue(a, "X-Version");
            return `${i + 1}. ${version}${version === d.defaultVersion ? " (default)" : ""} | modified ${propValue(a, "X-Modified")} | OAS ${propValue(a, "X-OASVersion")}\n   ${specUrlOf(a)}`;
        })
            .join("\n");
}
