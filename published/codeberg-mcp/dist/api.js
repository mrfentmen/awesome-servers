const BASE = 'https://codeberg.org/api/v1';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ q, limit: String(limit) });
    const res = await fetch(`${BASE}/repos/search?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-codeberg-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Codeberg returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return `No Codeberg repos found for "${q}".`;
    return `Codeberg repos for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('full_name')}${s('description') ? ` | ${s('description').slice(0, 80)}` : ''}${s('stars_count') ? ` | stars ${s('stars_count')}` : ''}${s('html_url') ? `\n   ${s('html_url')}` : ''}`;
        })
            .join('\n');
}
export async function version(_args) {
    const res = await fetch(`${BASE}/version`, {
        headers: { 'User-Agent': 'mrfentmen-codeberg-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Codeberg returned ${res.status}`);
    const d = (await res.json());
    return `Codeberg server version: ${d.version ?? 'unknown'}`;
}
function repoPath(args) {
    const owner = (args.owner ?? '').trim();
    const repo = (args.repo ?? '').trim();
    if (!owner || !repo)
        throw new Error('Provide owner and repo.');
    return `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`;
}
function repoName(args) {
    return `${(args.owner ?? '').trim()}/${(args.repo ?? '').trim()}`;
}
function bound(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
async function getJson(path, params) {
    const query = params && [...params].length ? `?${params.toString()}` : '';
    const res = await fetch(`${BASE}${path}${query}`, {
        headers: { 'User-Agent': 'mrfentmen-codeberg-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new Error(`Codeberg has nothing at ${path}`);
    if (!res.ok)
        throw new Error(`Codeberg returned ${res.status} for ${path}`);
    return (await res.json());
}
export async function repoDetail(args) {
    const d = await getJson(repoPath(args));
    const facts = [
        d.language ? `language ${d.language}` : '',
        `stars ${d.stars_count ?? 0}`,
        `forks ${d.forks_count ?? 0}`,
        `watchers ${d.watchers_count ?? 0}`,
        `open issues ${d.open_issues_count ?? 0}`,
        `open PRs ${d.open_pr_counter ?? 0}`,
        d.default_branch ? `default branch ${d.default_branch}` : '',
        // Codeberg leaves this null even when a licence file exists, so say what
        // the API reported rather than claiming the repo has none
        d.license?.name ? `license ${d.license.name}` : 'license not reported',
        d.size ? `${Math.max(1, Math.round(d.size / 1024))} MB` : '',
        d.archived ? 'ARCHIVED' : '',
        d.fork ? 'fork' : '',
    ].filter(Boolean);
    const lines = [
        `${d.full_name ?? repoName(args)}`,
        d.description ? d.description.slice(0, 200) : 'No description.',
        facts.join(' | '),
        d.created_at ? `Created ${d.created_at.slice(0, 10)}, updated ${(d.updated_at ?? '').slice(0, 10)}` : '',
        d.website ? `Website ${d.website}` : '',
        d.html_url ?? '',
    ].filter(Boolean);
    return lines.join('\n');
}
export async function repoBranches(args) {
    const rows = await getJson(`${repoPath(args)}/branches`);
    if (!rows.length)
        return `${repoName(args)} has no branches.`;
    return `${rows.length} branch(es) in ${repoName(args)}:\n` +
        rows
            .map((b, i) => {
            const sha = (b.commit?.id ?? '').slice(0, 10);
            const when = (b.commit?.timestamp ?? '').slice(0, 10);
            return `${i + 1}. ${b.name ?? '?'}${sha ? ` | ${sha}` : ''}${when ? ` | ${when}` : ''}`;
        })
            .join('\n');
}
export async function repoReleases(args) {
    const limit = bound(args.limit, 5, 30);
    const rows = await getJson(`${repoPath(args)}/releases`, new URLSearchParams({ limit: String(limit) }));
    if (!rows.length)
        return `No releases in ${repoName(args)}.`;
    return (`Releases in ${repoName(args)} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const flags = [r.prerelease ? "prerelease" : "", r.draft ? "draft" : ""].filter(Boolean).join(", ");
            return `${i + 1}. ${r.tag_name ?? r.name ?? "untagged"}${flags ? ` (${flags})` : ""} - ${r.published_at ?? "not reported"}${r.html_url ? ` - ${r.html_url}` : ""}`;
        })
            .join("\n"));
}
export async function userOverview(args) {
    const user = (args.user ?? "").trim();
    if (!user)
        throw new Error("Provide a Codeberg user name.");
    const u = await getJson(`/users/${encodeURIComponent(user)}`);
    const lines = [
        `Codeberg user ${u.login ?? user}`,
        u.full_name ? `Name: ${u.full_name}` : "Name: not reported",
        u.description ? `Bio: ${u.description}` : "Bio: not reported",
        `Followers: ${u.followers_count ?? "not reported"} | Following: ${u.following_count ?? "not reported"}`,
        `Joined: ${u.created ?? "not reported"}`,
    ];
    if (u.location)
        lines.push(`Location: ${u.location}`);
    if (u.html_url)
        lines.push(u.html_url);
    return lines.join("\n");
}
