/**
 * Hex API client, keyless.
 * Docs: https://github.com/hexpm/hexpm/blob/main/lib/hexpm_web/controllers/api/package_controller.ex
 */
const BASE = "https://hex.pm/api";
export class HexError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "hex-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
    });
    if (res.status === 404)
        throw new HexError("No such package on Hex.");
    if (!res.ok)
        throw new HexError(`Hex error ${res.status}`);
    return (await res.json());
}
export async function getPackage(name) {
    const p = await getJson(`/packages/${encodeURIComponent(name.trim())}`);
    const releases = Array.isArray(p.releases) ? p.releases : [];
    const latest = releases.find((r) => r.version) ?? {};
    const links = p.meta?.links ?? p.links ?? {};
    const dl = p.downloads;
    const allDl = typeof dl === "number" ? dl : typeof dl?.all === "number" ? dl.all : undefined;
    return {
        name: String(p.name ?? name),
        description: p.meta?.description ? String(p.meta.description) : undefined,
        latest: latest.version ? String(latest.version) : undefined,
        downloads: allDl,
        docs: links.Documentation || (latest.version ? `https://hexdocs.pm/${p.name}/${latest.version}` : undefined),
        repo: links.GitHub || links.Repository,
        licenses: Array.isArray(p.meta?.licenses) ? p.meta.licenses.map(String) : [],
        releases: releases.map((r) => String(r.version)).slice(0, 8),
    };
}
export async function getRelease(name, version) {
    const r = await getJson(`/packages/${encodeURIComponent(name.trim())}/releases/${encodeURIComponent(version.trim())}`);
    const reqs = r.requirements ?? {};
    return {
        version: String(r.version ?? version),
        published: r.inserted_at ? String(r.inserted_at).slice(0, 10) : undefined,
        checksum: r.checksum ? String(r.checksum).slice(0, 16) + "..." : undefined,
        requirements: Object.entries(reqs).slice(0, 10).map(([k, v]) => `${k} ${v?.requirement ?? ""}`.trim()),
    };
}
export function formatPackage(p) {
    const lines = [
        `${p.name}${p.latest ? ` ${p.latest}` : ""}`,
        p.description ? `${p.description}` : "",
        p.downloads !== undefined ? `Downloads: ${p.downloads.toLocaleString()}` : "",
        p.licenses.length ? `Licenses: ${p.licenses.join(", ")}` : "",
        p.docs ? `Docs: ${p.docs}` : "",
        p.repo ? `Repo: ${p.repo}` : "",
        p.releases.length ? `Recent releases: ${p.releases.join(", ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export function formatRelease(name, r) {
    const lines = [
        `${name} ${r.version}`,
        r.published ? `Published: ${r.published}` : "",
        r.checksum ? `Checksum: ${r.checksum}` : "",
        r.requirements.length ? `Requires:\n- ${r.requirements.join("\n- ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
// ---- gap4d1 tools:
function hexSegment(value, label) {
    const clean = value.trim();
    if (!clean || clean.length > 200)
        throw new HexError(`Provide a ${label} of 1-200 characters.`);
    return encodeURIComponent(clean);
}
function hexField(value, max = 180) {
    return value === null || value === undefined || value === '' ? 'not reported' : String(value).replace(/\s+/g, ' ').slice(0, max);
}
function hexLimit(value) {
    return Math.max(1, Math.min(Math.trunc(Number.isFinite(value) ? value : 20), 50));
}
export async function packageOwners(args) {
    const rows = await getJson(`/packages/${hexSegment(args.name, 'package name')}/owners`);
    if (!Array.isArray(rows))
        throw new HexError('Hex did not return an owner list.');
    const shown = rows.slice(0, hexLimit(args.limit));
    return `Owners of ${hexField(args.name)} (${shown.length} of ${rows.length} shown):\n` +
        (shown.map((owner, i) => `${i + 1}. ${hexField(owner.username)} | name: ${hexField(owner.full_name)} | permission: ${hexField(owner.level)}`).join('\n') || 'No owners reported.');
}
