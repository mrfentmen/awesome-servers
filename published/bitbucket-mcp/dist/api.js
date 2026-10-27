const BASE = 'https://api.bitbucket.org/2.0/repositories';
const UA = 'mrfentmen-bitbucket-mcp/1.0';
export async function repos(args) {
    const workspace = (args.workspace ?? '').trim();
    if (!workspace)
        return 'Provide a workspace slug.';
    const limit = Math.min(Math.max(Number(args.limit ?? 15) || 15, 1), 30);
    const res = await fetch(`${BASE}/${encodeURIComponent(workspace)}?pagelen=${limit}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bitbucket returned ${res.status}`);
    const d = (await res.json());
    const values = d.values ?? [];
    if (!values.length)
        return `No repos for "${workspace}".`;
    return `Bitbucket repos for "${workspace}" (${values.length}):\n` +
        values.slice(0, limit).map((r, i) => `${i + 1}. ${r.name ?? '?'} [${r.language ?? '?'}] ${r.description ?? ''}`.trim()).join('\n');
}
export async function repo(args) {
    const workspace = (args.workspace ?? '').trim();
    const name = (args.repo ?? '').trim();
    if (!workspace || !name)
        return 'Provide workspace and repo.';
    const res = await fetch(`${BASE}/${encodeURIComponent(workspace)}/${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bitbucket returned ${res.status}`);
    const d = (await res.json());
    const clones = d.links?.clone ?? [];
    return [
        `Bitbucket repo: ${d.full_name ?? '?'}`,
        `Language: ${d.language ?? '?'} | Private: ${d.is_private ?? '?'}`,
        d.description ? `Description: ${d.description}` : null,
        `Created: ${d.created_on ?? '?'}`,
        `Updated: ${d.updated_on ?? '?'}`,
        d.size != null ? `Size: ${(d.size / 1024).toFixed(1)} KB` : null,
        clones.length ? `Clone:\n${clones.map((c) => `  ${c.name ?? '?'}: ${c.href ?? ''}`).join('\n')}` : null,
        d.links?.html?.href ? `Link: ${d.links.html.href}` : null,
    ].filter(Boolean).join('\n');
}
// ---- muxC tools:
const BB_UA = "mrfentmen-bitbucket-mcp/1.0 (https://github.com/mrfentmen)";
class BitbucketError extends Error {
}
const BB = "https://api.bitbucket.org/2.0";
async function bb(path, ms = 25000) {
    const res = await fetch(`${BB}${path}`, { headers: { "User-Agent": BB_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (res.status === 404)
        throw new BitbucketError(`Bitbucket has no public ${path.replace(/^\/+/, "").split("?")[0]}; it may be private or gone`);
    if (res.status === 410)
        throw new BitbucketError(`Bitbucket has deprecated ${path.replace(/^\/+/, "").split("?")[0]}`);
    if (!res.ok)
        throw new BitbucketError(`Bitbucket returned ${res.status} for ${path}`);
    return await res.json();
}
function checkSlug(value, what) {
    const v = (value ?? "").trim();
    if (!v)
        throw new BitbucketError(`Provide a ${what}`);
    if (!/^[A-Za-z0-9._-]+$/.test(v))
        throw new BitbucketError(`"${v}" is not a valid Bitbucket ${what}; use letters, digits, dots, underscores or hyphens`);
    return v;
}
