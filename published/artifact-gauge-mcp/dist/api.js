// ---- gap4e1 tools:
export {};

export async function githubRepoStats(args = {}) {
    const owner = String(args?.owner ?? 'modelcontextprotocol').trim();
    const repo = String(args?.repo ?? 'servers').trim();
    if (!/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo))
        throw new Error('Owner and repository names may only contain letters, digits, dot, dash and underscore.');
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'mrfentmen-artifact-gauge-mcp/1.0', Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`GitHub has no repository ${owner}/${repo}`);
    if (res.status === 403)
        throw new Error('GitHub rate-limited this request; try again in a minute.');
    if (!res.ok)
        throw new Error(`GitHub returned ${res.status}`);
    const r = (await res.json());
    return [
        `${r.full_name}`,
        `Size: ${Math.round(Number(r.size ?? 0) / 1024 * 10) / 10} MB of git history`,
        `Stars ${r.stargazers_count ?? 0} · forks ${r.forks_count ?? 0} · watchers ${r.subscribers_count ?? 0} · open issues ${r.open_issues_count ?? 0}`,
        `Language: ${r.language ?? 'none'} · licence ${r.license?.spdx_id ?? 'none'}`,
        `Last push: ${String(r.pushed_at ?? '').slice(0, 10) || '?'} · created ${String(r.created_at ?? '').slice(0, 10) || '?'}`,
        r.default_branch ? `Default branch: ${r.default_branch}` : '',
        r.description ? String(r.description).trim() : '',
        r.html_url ?? '',
    ].filter(Boolean).join('\n');
}
