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
/**
 * The project record is the only place GitLab states licence, language and the
 * open-issue count together. Fields it omits are reported as not published
 * rather than defaulted to zero, because a zero star count and a missing one
 * look identical once a `?? 0` has been applied.
 */
export async function projectDetail(args) {
    const id = glProjectId(args.project);
    const row = (await glGet(`/projects/${id}`));
    if (!row || typeof row !== 'object')
        throw new Error('GitLab did not return a project record.');
    const shown = (key, fallback = 'not published') => {
        const value = row[key];
        return value == null || value === '' ? fallback : String(value);
    };
    const count = (key) => (Number.isFinite(Number(row[key])) ? Number(row[key]).toLocaleString() : 'not published');
    const licence = row.license;
    const licenceName = licence && typeof licence === 'object'
        ? String(licence.name ?? licence.nickname ?? licence.key ?? 'unrecognised')
        : row.license_url ? String(row.license_url).split('/').filter(Boolean).pop() : 'not declared';
    const topics = Array.isArray(row.topics) ? row.topics : Array.isArray(row.tag_list) ? row.tag_list : [];
    const date = (key) => (row[key] ? String(row[key]).slice(0, 19).replace('T', ' ') + ' UTC' : 'not published');
    const lines = [
        `${glText(row, 'path_with_namespace') || glText(row, 'name') || 'unnamed project'}${row.visibility ? ` · ${row.visibility}` : ''}`,
        glText(row, 'description', 300) || 'No description.',
        '',
        `Stars ${count('star_count')} | forks ${count('forks_count')} | open issues ${count('open_issues_count')}`,
        `Default branch ${shown('default_branch')} | language ${shown('language')} | licence ${licenceName}`,
        `Created ${date('created_at')} | last activity ${date('last_activity_at')}`,
        row.web_url ? `Web: ${row.web_url}` : '',
        row.readme_url ? `Readme: ${row.readme_url}` : 'No readme published.',
        topics.length ? `Topics: ${topics.slice(0, 20).join(', ')}` : 'No topics.',
        '',
        row.archived ? 'The project is archived, so it is read-only.' : 'The project is active, not archived.',
        row.forked_from_project ? `Fork of ${glText(row.forked_from_project, 'path_with_namespace') || 'another project'}.` : '',
        'Counts come from the project record itself; GitLab does not recompute them on request, so they can lag the underlying activity.',
    ].filter(Boolean);
    return lines.join('\n');
}
/**
 * Issue lists are paginated newest-first explicitly: GitLab's default order is
 * by created_at descending, but relying on the default would silently change the
 * meaning of the limit if that default ever moved.
 */
export async function projectIssues(args) {
    const id = glProjectId(args.project);
    const state = ['opened', 'closed', 'all'].includes(String(args.state)) ? String(args.state) : 'opened';
    const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 50));
    const rows = await glGet(`/projects/${id}/issues?state=${state}&order_by=created_at&sort=desc&per_page=${limit}`);
    if (!Array.isArray(rows))
        throw new Error('GitLab did not return an issue list.');
    if (!rows.length)
        return `No ${state === 'all' ? '' : state + ' '}issues on that project.${state === 'opened' ? ' A project with issues turned off reports none too.' : ''}`;
    const lines = [`${rows.length} ${state === 'all' ? '' : state + ' '}issue(s), newest first:`];
    for (const [i, row] of rows.entries()) {
        const author = row.author && typeof row.author === 'object' ? String(row.author.username ?? row.author.name ?? 'unknown') : 'unknown';
        const labels = Array.isArray(row.labels) ? row.labels.map((l) => String(l?.name ?? l)).filter(Boolean) : [];
        const when = row.created_at ? String(row.created_at).slice(0, 10) : 'undated';
        lines.push(`  ${i + 1}. ${glText(row, 'title', 100) || 'untitled'} [#${row.iid ?? row.id ?? '?'}] ${row.state ?? ''}`.trimEnd());
        lines.push(`     opened ${when} by ${author}${labels.length ? ` · ${labels.slice(0, 6).join(', ')}` : ''}`);
        if (row.web_url)
            lines.push(`     ${row.web_url}`);
    }
    if (rows.length >= limit)
        lines.push(`  A full page came back, so there may be more than these ${limit}.`);
    return lines.join('\n');
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
