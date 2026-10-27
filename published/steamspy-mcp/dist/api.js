const BASE = 'https://steamspy.com/api.php';
export async function app(args) {
    const appid = Math.floor(args.appid ?? 0);
    if (!appid)
        return 'Provide a Steam app id.';
    const params = new URLSearchParams({ request: 'appdetails', appid: String(appid) });
    const res = await fetch(`${BASE}?${params.toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-steamspy-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`SteamSpy returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    if (d.error)
        return `SteamSpy: ${s('error')}`;
    const genre = (d.genres && Array.isArray(d.genres) ? d.genres.join(', ') : s('genre'));
    return [
        `${s('name')}`,
        genre ? `Genres: ${genre}` : '',
        s('owners') ? `Owners: ${s('owners')}` : '',
        s('price') ? `Price: $${Number(s('price')) / 100}` : '',
        s('positive') ? `Positive reviews: ${s('positive')}` : '',
        s('negative') ? `Negative reviews: ${s('negative')}` : '',
    ].filter(Boolean).join('\n') || `No data for app ${appid}.`;
}
async function spyGet(params) {
    const res = await fetch(`${BASE}?${new URLSearchParams(params).toString()}`, {
        headers: { 'User-Agent': 'mrfentmen-steamspy-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`SteamSpy returned ${res.status}`);
    return (await res.json());
}
function spyLine(app, i) {
    const reviews = app.positive !== undefined && app.negative !== undefined ? `${app.positive} positive / ${app.negative} negative` : 'not reported';
    return `${i + 1}. ${app.name ?? '?'} (appid ${app.appid ?? '?'}) | ${app.developer ?? 'developer not reported'} | owners ${app.owners ?? 'not reported'} | ${reviews}`;
}
