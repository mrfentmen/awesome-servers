const BASE = 'https://unpkg.com';
export async function info(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a package name.';
    const version = (args.version ?? '').trim();
    const url = version ? `${BASE}/${encodeURIComponent(name)}@${encodeURIComponent(version)}/package.json` : `${BASE}/${encodeURIComponent(name)}/package.json`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-unpkg-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`unpkg returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const deps = (d.dependencies && typeof d.dependencies === 'object' ? Object.keys(d.dependencies).slice(0, 10).join(', ') : '');
    return [
        `${s('name')}${s('version') ? ` ${s('version')}` : ''}`,
        s('description') ? `Desc: ${s('description').slice(0, 120)}` : '',
        s('license') ? `License: ${s('license')}` : '',
        deps ? `Deps: ${deps}` : '',
        s('repository') ? `Repo: ${s('repository').slice(0, 100)}` : '',
    ].filter(Boolean).join('\n') || `No data for ${name}.`;
}
