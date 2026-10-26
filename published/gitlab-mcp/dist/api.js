const BASE = 'https://gitlab.com/api/v4/projects';
export async function search(args) {
    const q = (args.query ?? '').trim();
    if (!q)
        return 'Provide search terms.';
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const params = new URLSearchParams({ search: q, per_page: String(limit), simple: 'true' });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-gitlab-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`GitLab returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return `No GitLab projects found for "${q}".`;
    return `GitLab projects for "${q}" (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('path_with_namespace')}${s('description') ? ` | ${s('description').slice(0, 80)}` : ''}${s('star_count') ? ` | stars ${s('star_count')}` : ''}${s('web_url') ? `\n   ${s('web_url')}` : ''}`;
        })
            .join('\n');
}
// ---- muxG tools:
const GL_HOST = 'https://gitlab.com/api/v4';
const glText = (row, key, max = 120) => {
    const value = row[key];
    if (value == null || value === '')
        return '';
    return String(value).slice(0, max);
};
function glProjectId(input) {
    const value = (input ?? '').trim();
    if (!value)
        throw new Error('Provide a project as namespace/project or its numeric id.');
    if (/^\d+$/.test(value))
        return value;
    if (!/^[A-Za-z0-9._-]+(\/[A-Za-z0-9._-]+){1,4}$/.test(value)) {
        throw new Error(`"${input}" is neither a numeric project id nor a namespace/project path.`);
    }
    return encodeURIComponent(value);
}
async function glGet(path) {
    const res = await fetch(`${GL_HOST}${path}`, {
        headers: { 'User-Agent': 'mrfentmen-gitlab-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 403)
        throw new Error(`GitLab returned 403 for that path - on this project the resource is not public.`);
    if (res.status === 404)
        throw new Error('GitLab has nothing at that path (404).');
    if (!res.ok)
        throw new Error(`GitLab returned ${res.status}`);
    const body = await res.text();
    if (!body.trim())
        throw new Error('GitLab returned an empty body.');
    return JSON.parse(body);
}
export async function projectBranches(args) {
    const id = glProjectId(args.project);
    const limit = Math.max(1, Math.min(args.limit ?? 10, 100));
    const rows = await glGet(`/projects/${id}/repository/branches?per_page=${limit}`);
    if (!Array.isArray(rows))
        throw new Error('GitLab did not return a branch list.');
    if (!rows.length)
        return 'That project reports no public branches.';
    const lines = [`${rows.length} branch(es) on the project:`];
    for (const [i, row] of rows.entries()) {
        const commit = (row.commit ?? {});
        lines.push(`  ${i + 1}. ${glText(row, 'name') || 'name not reported'}${row.protected ? ' (protected)' : row.default ? ' (default)' : ''}`);
        lines.push(`     ${String(commit.short_id ?? 'not reported').slice(0, 12)} · ${String(commit.committed_date ?? 'not reported').slice(0, 19).replace('T', ' ')} · ${glText(commit, 'title', 80) || 'no message'}`);
    }
    if (rows.length >= limit)
        lines.push(`  GitLab returned a full page, so more branches may exist beyond the first ${limit}.`);
    return lines.join('\n');
}
