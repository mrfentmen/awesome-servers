const BASE = 'https://api.deps.dev/v3/systems';
export async function info(args) {
    const system = (args.system ?? '').trim().toLowerCase();
    const name = (args.name ?? '').trim();
    if (!system || !name)
        return 'Provide an ecosystem (npm, pypi, maven, cargo) and a package name.';
    const version = (args.version ?? '').trim();
    const url = version
        ? `${BASE}/${encodeURIComponent(system)}/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`
        : `${BASE}/${encodeURIComponent(system)}/packages/${encodeURIComponent(name)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-deps-dev-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`deps.dev returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const str = (k) => {
        const v = d[k];
        if (Array.isArray(v))
            return v.slice(0, 10).map((x) => (x && typeof x === 'object' ? JSON.stringify(x).slice(0, 80) : String(x))).join(', ');
        return v != null ? String(v) : '';
    };
    return [
        `${s('name')}${s('version') ? ` ${s('version')}` : ''}`,
        s('description') ? `Desc: ${s('description').slice(0, 120)}` : '',
        s('licenses') ? `Licenses: ${s('licenses')}` : '',
        str('links') ? `Links: ${str('links')}` : '',
    ].filter(Boolean).join('\n') || `No data for ${name}.`;
}
async function getDeps(url) {
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-deps-dev-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new Error('deps.dev does not know that package or version.');
    if (!res.ok)
        throw new Error(`deps.dev returned ${res.status}`);
    return res.json();
}
function packageUrl(system, name) {
    const sys = (system ?? '').trim().toLowerCase();
    const pkg = (name ?? '').trim();
    if (!sys || !pkg)
        throw new Error('Provide an ecosystem (npm, pypi, maven, go, cargo) and a package name.');
    return `${BASE}/${encodeURIComponent(sys)}/packages/${encodeURIComponent(pkg)}`;
}
export async function releaseHistory(args) {
    const data = (await getDeps(packageUrl(args.system ?? '', args.name ?? '')));
    const versions = data.versions ?? [];
    if (!versions.length)
        throw new Error('deps.dev listed no versions for that package.');
    const dated = versions.filter((v) => v.publishedAt).sort((a, b) => String(a.publishedAt).localeCompare(String(b.publishedAt)));
    const deprecated = versions.filter((v) => v.isDeprecated);
    const majors = new Set();
    for (const v of versions) {
        const m = /^(\d+)/.exec(v.versionKey?.version ?? '');
        if (m)
            majors.add(m[1]);
    }
    const lines = [
        `${(args.name ?? '').trim()} on ${(args.system ?? '').trim().toLowerCase()}`,
        `  versions published: ${versions.length}`,
        `  deprecated: ${deprecated.length}${deprecated.length ? `, for example ${deprecated.slice(0, 3).map((v) => v.versionKey?.version ?? '?').join(', ')}` : ''}`,
        `  distinct major versions: ${majors.size}${majors.size ? `, the newest numbered ${[...majors].sort((a, b) => Number(b) - Number(a))[0]}` : ''}`,
    ];
    if (dated.length) {
        lines.push(`  first release: ${dated[0].publishedAt} (${dated[0].versionKey?.version ?? '?'})`);
        lines.push(`  latest release: ${dated[dated.length - 1].publishedAt} (${dated[dated.length - 1].versionKey?.version ?? '?'})`);
        lines.push('  newest five by publish date:');
        for (const v of dated.slice(-5).reverse())
            lines.push(`    ${v.versionKey?.version ?? '?'} on ${v.publishedAt}`);
    }
    else {
        lines.push('  deps.dev reported no publish dates for these versions.');
    }
    if (dated.length !== versions.length) {
        lines.push(`  ${versions.length - dated.length} version(s) carry no publish date, so they are counted but cannot be placed in time.`);
    }
    lines.push('  the list is every version the registry holds, prerelease and canary builds included.');
    return lines.join('\n');
}

const DEPS = 'https://api.deps.dev/v3/systems';
export async function versionDetail(args = {}) {
    const system = String(args?.system ?? '').trim().toLowerCase();
    const name = String(args?.name ?? '').trim();
    const version = String(args?.version ?? '').trim();
    if (!/^[a-z]+$/.test(system))
        throw new Error('System looks like npm, pypi, maven, go or cargo.');
    if (!name || !version)
        throw new Error('Give both a package name and an exact version.');
    const url = `${DEPS}/${encodeURIComponent(system)}/packages/${encodeURIComponent(name)}/versions/${encodeURIComponent(version)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-deps-dev-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`deps.dev has no ${system} ${name} ${version}`);
    if (!res.ok)
        throw new Error(`deps.dev returned ${res.status}`);
    const d = (await res.json());
    const advisories = (d.advisoryKeys ?? []).map((a) => a.id);
    const registries = (d.registries ?? []).map((r) => `${r.url ?? r.name ?? '?'}`);
    const projects = (d.relatedProjects ?? []).map((p) => `${p.projectKey?.id ?? '?'}${p.relationType ? ` (${p.relationType})` : ''}`);
    return [
        `${name} ${version} — ${String(d.versionKey?.system ?? system).toLowerCase()}`,
        `Licences: ${(d.licenses ?? []).join(', ') || 'none published'}`,
        `Published: ${String(d.publishedAt ?? '').slice(0, 10) || '?'}${d.isDefault ? ' · the default version' : ''}${d.isDeprecated ? ` · deprecated: ${d.deprecatedReason || 'no reason given'}` : ''}`,
        advisories.length ? `Advisories (${advisories.length}): ${advisories.slice(0, 10).join(', ')}` : 'Advisories: none on record',
        registries.length ? `Registries: ${registries.slice(0, 5).join(', ')}` : 'Registries: none',
        projects.length ? `Related projects: ${projects.slice(0, 5).join(', ')}` : 'Related projects: none',
        `https://deps.dev/${encodeURIComponent(system)}/${encodeURIComponent(name)}/${encodeURIComponent(version)}`,
    ].filter(Boolean).join('\n');
}
