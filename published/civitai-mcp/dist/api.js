const BASE = 'https://civitai.com/api/v1/models';
export async function models(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 30));
    const params = new URLSearchParams({ limit: String(limit) });
    if (args.query)
        params.set('query', args.query.trim());
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-civitai-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Civitai returned ${res.status}`);
    const d = (await res.json());
    const rows = d.items ?? [];
    if (!rows.length)
        return 'No models returned.';
    const label = args.query ? ` for "${args.query.trim()}"` : '';
    return `Civitai models${label} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            const stats = (r.stats && typeof r.stats === 'object' ? r.stats : {});
            return `${i + 1}. ${s('name')}${s('type') ? ` [${s('type')}]` : ''}${s('description') ? ` | ${s('description').replace(/<[^>]*>/g, '').slice(0, 80)}` : ''}${stats.downloadCount ? ` | dl ${stats.downloadCount}` : ''}`;
        })
            .join('\n');
}
export async function model(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        return 'Provide a numeric model ID.';
    const res = await fetch(`${BASE}/${id}`, {
        headers: { 'User-Agent': 'mrfentmen-civitai-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Civitai returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const stats = (d.stats && typeof d.stats === 'object' ? d.stats : {});
    const ss = (k) => (stats[k] != null ? String(stats[k]) : '');
    return [
        `${s('name')}${s('type') ? ` [${s('type')}]` : ''}`,
        s('description') ? `Desc: ${s('description').replace(/<[^>]*>/g, '').slice(0, 150)}` : '',
        ss('downloadCount') ? `Downloads: ${ss('downloadCount')}` : '',
        ss('rating') ? `Rating: ${ss('rating')}` : '',
        ss('favoriteCount') ? `Favorites: ${ss('favoriteCount')}` : '',
        s('createdAt') ? `Created: ${String(s('createdAt')).slice(0, 10)}` : '',
    ].filter(Boolean).join('\n') || `No data for model ${id}.`;
}
// ---- muxE tools:
// The two existing tools read the model list and the model record, both of which
// stop at the model. The new ones go one level deeper to a single released
// version and its files and generation settings, and sideways to everything one
// creator has published, which the models route cannot filter for on its own.
const API_ROOT = 'https://civitai.com/api/v1';
const CIV_UA = 'mrfentmen-civitai-mcp/1.0';
async function civGet(url, notFound) {
    const res = await fetch(url, {
        headers: { 'User-Agent': CIV_UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    const raw = await res.text();
    let parsed = null;
    try {
        parsed = raw ? JSON.parse(raw) : null;
    }
    catch {
        // the body was not JSON, so only the status is available as a reason
        parsed = null;
    }
    if (!res.ok) {
        if (notFound && res.status === 404)
            throw new Error(notFound);
        const why = typeof parsed?.message === 'string' ? parsed.message : typeof parsed?.error === 'string' ? parsed.error : `Civitai returned ${res.status}`;
        throw new Error(why);
    }
    if (!parsed)
        throw new Error('Civitai returned a body that is not JSON.');
    if (typeof parsed.error === 'string')
        throw new Error(`Civitai said: ${parsed.error}`);
    return parsed;
}
export async function creatorModels(args) {
    const username = (args?.username ?? '').trim();
    if (!username)
        throw new Error('Provide a Civitai username.');
    if (!/^[\w.-]{1,64}$/.test(username)) {
        throw new Error('A Civitai username may only hold letters, digits, dots, dashes and underscores.');
    }
    const limit = Math.max(1, Math.min(Number(args?.limit ?? 10) || 10, 30));
    const url = `${API_ROOT}/models?username=${encodeURIComponent(username)}&limit=${limit}`;
    const d = await civGet(url, `Civitai has no creator called "${username}".`);
    const rows = Array.isArray(d.items) ? d.items : [];
    if (!rows.length)
        return `Civitai lists no public model for the creator "${username}".`;
    const totalItems = typeof d.metadata?.totalItems === 'number' ? d.metadata.totalItems : null;
    const lines = [
        `Public models by ${username} on Civitai (${rows.length} shown${totalItems !== null ? `, the API reports ${totalItems.toLocaleString('en-US')} in total` : ''}):`,
    ];
    let downloads = 0;
    let counted = 0;
    rows.forEach((r, i) => {
        const s = (k) => (r[k] != null ? String(r[k]) : '');
        const stats = (r.stats && typeof r.stats === 'object' ? r.stats : {});
        const dl = typeof stats.downloadCount === 'number' ? stats.downloadCount : null;
        const tu = typeof stats.thumbsUpCount === 'number' ? stats.thumbsUpCount : null;
        if (dl !== null) {
            downloads += dl;
            counted += 1;
        }
        const tags = Array.isArray(r.tags) ? r.tags.map((t) => (t && typeof t === 'object' ? String(t.name ?? '') : String(t))).filter(Boolean) : [];
        const bases = Array.isArray(r.baseModels) ? r.baseModels.map((b) => String(b)).filter(Boolean) : [];
        const versions = Array.isArray(r.modelVersions) ? r.modelVersions.length : null;
        lines.push(`${i + 1}. ${s('name') || 'name not reported'} [${s('type') || 'type not reported'}]`);
        lines.push(`   id ${s('id') || 'not reported'}, downloads ${dl !== null ? dl.toLocaleString('en-US') : 'not reported'}, thumbs up ${tu !== null ? tu.toLocaleString('en-US') : 'not reported'}${versions !== null ? `, ${versions} version(s)` : ''}`);
        lines.push(`   created ${s('createdAt') ? String(s('createdAt')).slice(0, 10) : 'not reported'}, mode ${s('mode') || 'not reported'}${r.nsfw === true ? ', marked NSFW' : ''}`);
        if (bases.length)
            lines.push(`   base models: ${bases.slice(0, 6).join(', ')}`);
        if (tags.length)
            lines.push(`   tags: ${tags.slice(0, 10).join(', ')}${tags.length > 10 ? `, and ${tags.length - 10} more` : ''}`);
        const desc = s('description').replace(/<[^>]*>/g, '').trim();
        if (desc)
            lines.push(`   ${desc.slice(0, 160)}`);
    });
    if (counted) {
        lines.push(`  downloads across the ${counted} model(s) above: ${downloads.toLocaleString('en-US')}`);
    }
    return lines.join('\n');
}
