const BASE = "https://api.osv.dev/v1";
const headers = { "Content-Type": "application/json", "User-Agent": "mrfentmen-osv-mcp/1.0" };
export class OsvError extends Error {
}
async function request(path, init) {
    const res = await fetch(`${BASE}${path}`, { ...init, headers: { ...headers, ...(init?.headers ?? {}) }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new OsvError(`OSV API error ${res.status}: ${await res.text().catch(() => res.statusText)}`);
    return (await res.json());
}
export async function queryPackage(ref) {
    const body = { package: { ecosystem: ref.ecosystem, name: ref.name }, ...(ref.version ? { version: ref.version } : {}) };
    return request("/query", { method: "POST", body: JSON.stringify(body) }).then((data) => ({ vulns: data.vulns ?? [], nextPageToken: data.next_page_token }));
}
export async function queryBatch(packages) {
    const queries = packages.map((ref) => ({ package: { ecosystem: ref.ecosystem, name: ref.name }, ...(ref.version ? { version: ref.version } : {}) }));
    const data = await request("/querybatch", { method: "POST", body: JSON.stringify({ queries }) });
    return packages.map((ref, index) => ({ ref, vulns: data.results?.[index]?.vulns ?? [] }));
}
export function getVulnerability(id) {
    return request(`/vulns/${encodeURIComponent(id.trim())}`);
}
export function formatVulnerability(v) {
    const lines = [
        `${v.id ?? "Unknown vulnerability"}: ${v.summary ?? "No summary"}`,
        v.aliases?.length ? `Aliases: ${v.aliases.join(", ")}` : "",
        v.published ? `Published: ${v.published}` : "",
        v.modified ? `Modified: ${v.modified}` : "",
        v.details ? `Details: ${v.details.slice(0, 1200)}` : "",
        v.affected?.length ? `Affected packages: ${v.affected.map((a) => `${a.package?.ecosystem ?? "?"}/${a.package?.name ?? "?"}`).join(", ")}` : "",
        v.references?.length ? `References:\n${v.references.slice(0, 8).map((r) => `* ${r.type ?? "reference"}: ${r.url ?? ""}`).join("\n")}` : "",
    ];
    return lines.filter(Boolean).join("\n");
}
