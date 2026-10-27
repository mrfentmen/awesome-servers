// Additional VG Resource public endpoint clients.
// ---- gap4a5 tools:
function vgText(value) {
    return value.replace(/<[^>]*>/g, ' ').replace(/&#(x[0-9a-f]+|[0-9]+);/gi, (_, code) => {
        const point = code[0].toLowerCase() === 'x' ? parseInt(code.slice(1), 16) : Number(code);
        return point > 0 && point <= 0x10ffff ? String.fromCodePoint(point) : '\uFFFD';
    }).replace(/&quot;/g, '"').replace(/&apos;/g, "'").replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim().slice(0, 300);
}
export async function getSiteStats(args) {
    const resource = args.resource ?? 'sprites';
    const sites = { sprites: 'www', models: 'models', textures: 'textures', sounds: 'sounds' };
    if (!Object.hasOwn(sites, resource))
        throw new Error('Choose sprites, models, textures, or sounds.');
    const url = `https://${sites[resource]}.spriters-resource.com/stats/`;
    const res = await fetch(url, { headers: { 'User-Agent': 'mrfentmen-vg-resource-mcp/1.0', Accept: 'text/html' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new Error(`VG Resource returned HTTP ${res.status}`);
    const html = await res.text();
    const table = [...html.matchAll(/<table\b[^>]*>([\s\S]*?)<\/table>/gi)].find((m) => /class=\x22title\x22[^>]*>Main Stats<\/td>/.test(m[1]));
    if (!table)
        throw new Error('VG Resource did not return the expected statistics table.');
    const lines = [];
    for (const row of table[1].matchAll(/<tr\b[^>]*>([\s\S]*?)<\/tr>/gi)) {
        const cells = [...row[1].matchAll(/<td\b[^>]*>([\s\S]*?)<\/td>/gi)].map((m) => vgText(m[1]));
        if (cells.length === 2)
            lines.push(`${cells[0] || 'not reported'}: ${cells[1] || 'not reported'}`);
    }
    if (!lines.length)
        throw new Error('VG Resource returned no statistics fields.');
    return `${resource} archive statistics\n${lines.slice(0, 12).join('\n')}\nSource: ${url}`;
}
