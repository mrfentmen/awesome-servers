const BASE = 'https://formulae.brew.sh/api/formula';
export async function formula(args) {
    const name = (args.name ?? '').trim().toLowerCase();
    if (!name)
        return 'Provide a formula name like git.';
    const res = await fetch(`${BASE}/${encodeURIComponent(name)}.json`, {
        headers: { 'User-Agent': 'mrfentmen-homebrew-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Homebrew returned ${res.status}`);
    const d = (await res.json());
    const str = (k) => (d[k] != null ? String(d[k]) : '');
    const dep = (k) => {
        const v = d[k];
        if (Array.isArray(v))
            return v.join(', ');
        if (v && typeof v === 'object')
            return JSON.stringify(v).slice(0, 200);
        return v != null ? String(v) : '';
    };
    const lines = [
        `${str('name')} ${str('versions') ? `(stable ${(str('versions').match(/"stable":"([^"]*)"/) ?? [])[1] ?? ''})` : ''}`,
        str('desc') ? `Desc: ${str('desc')}` : '',
        str('homepage') ? `Home: ${str('homepage')}` : '',
        dep('dependencies') ? `Deps: ${dep('dependencies')}` : '',
        str('license') ? `License: ${str('license')}` : '',
    ].filter(Boolean);
    return lines.join('\n') || `No data for formula ${name}.`;
}
