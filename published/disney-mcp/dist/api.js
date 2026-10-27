const BASE = 'https://api.disneyapi.dev';
export async function character(args) {
    const query = (args.query ?? '').trim();
    if (!query)
        return 'Provide a character name or id.';
    const isNum = /^\d+$/.test(query);
    const url = isNum ? `${BASE}/characters/${query}` : `${BASE}/character?name=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-disney-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Disney returned ${res.status}`);
    const d = (await res.json());
    const arr = d.data ?? [];
    const data = (isNum ? arr[0] : arr[0]);
    if (!data)
        return `No character found for "${query}".`;
    const s = (k) => (data[k] != null ? String(data[k]) : '');
    const films = (data.films ?? []);
    const tv = (data.tvShows ?? []);
    const park = (data.parkAttractions ?? []);
    return [
        `${s('name')} (id ${s('_id')})`,
        films.length ? `Films: ${films.slice(0, 5).join(', ')}` : '',
        tv.length ? `TV: ${tv.slice(0, 5).join(', ')}` : '',
        park.length ? `Park attractions: ${park.slice(0, 3).join(', ')}` : '',
        s('url') ? `\n${s('url')}` : '',
    ].filter(Boolean).join('\n');
}
export async function characters(args) {
    const page = Math.max(1, Math.floor(args.page ?? 1));
    const res = await fetch(`${BASE}/character?page=${page}&pageSize=20`, {
        headers: { 'User-Agent': 'mrfentmen-disney-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Disney returned ${res.status}`);
    const d = (await res.json());
    const rows = d.data ?? [];
    if (!rows.length)
        return `No characters on page ${page}.`;
    return `Disney characters (page ${page}):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')}`;
        }).join('\n');
}
// ---- muxA tools:
const DISNEY = "https://api.disneyapi.dev";
function clamp(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
async function disneyGet(path) {
    const res = await fetch(`${DISNEY}${path}`, {
        headers: { "User-Agent": "mrfentmen-disney-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Disney returned ${res.status}`);
    return (await res.json());
}
export async function charactersByMedium(args) {
    const title = (args.title ?? "").trim().toLowerCase();
    if (!title)
        throw new Error("Provide the film, show, game or attraction title to search for.");
    const medium = (args.medium ?? "").trim();
    const known = ["films", "shortFilms", "tvShows", "videoGames", "parkAttractions"];
    if (medium && !known.includes(medium)) {
        return `Unknown medium "${medium}". Use one of: ${known.join(", ")}.`;
    }
    const fields = medium ? [medium] : known;
    const maxPages = clamp(args.max_pages, 3, 20);
    const found = new Map();
    let scanned = 0;
    for (let p = 1; p <= maxPages; p += 1) {
        const d = await disneyGet(`/character?page=${p}&pageSize=50`);
        const rows = d.data ?? [];
        if (!rows.length)
            break;
        scanned += rows.length;
        for (const r of rows) {
            for (const field of fields) {
                const items = Array.isArray(r[field]) ? r[field] : [];
                for (const item of items) {
                    if (!String(item).toLowerCase().includes(title))
                        continue;
                    const list = found.get(item) ?? [];
                    list.push(String(r.name ?? "?"));
                    found.set(item, list);
                }
            }
        }
        if (p >= Number(d.info?.totalPages ?? p))
            break;
    }
    if (!found.size) {
        return `No Disney character among ${scanned} scanned record(s) lists "${args.title}" in ${fields.join(", ")}.`;
    }
    const ranked = [...found.entries()].sort((a, b) => b[1].length - a[1].length);
    return [
        `Disney titles matching "${args.title}" across ${scanned} scanned character records: ${ranked.length} title(s).`,
        ...ranked.map(([title_, names], i) => `${i + 1}. ${title_} | ${names.length} character(s): ${names.slice(0, 12).join(", ")}${names.length > 12 ? `, plus ${names.length - 12} more` : ""}`),
        maxPages < Number(1e9) ? `Scanned at most ${maxPages} page(s) of 50 characters; raise max_pages to widen the search.` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
