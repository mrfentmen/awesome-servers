const BASE = "https://www.bing.com/HPImageArchive.aspx";
const UA = "mrfentmen-bing-wallpaper-mcp/1.0 (https://github.com/mrfentmen)";
export class BingError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new BingError("Bing feed rate limit hit, wait and retry");
    if (!res.ok)
        throw new BingError(`Bing feed error ${res.status}`);
    return (await res.json());
}
function fmt(img) {
    const url = `https://www.bing.com${img?.url ?? ""}`;
    const copyright = (img?.copyright ?? "").replace(/ \(© .*?\)$/, "");
    return `${img?.title ?? "Untitled"}\n${copyright}\n${url}`;
}
export async function today(args) {
    const d = await get(`${BASE}?format=js&idx=0&n=1`);
    const img = d?.images?.[0];
    if (!img)
        return "No wallpaper data";
    return `Today Bing wallpaper:\n${fmt(img)}`;
}
export async function recent(args) {
    const count = Math.min(Math.max(args.count ?? 3, 1), 8);
    const d = await get(`${BASE}?format=js&idx=0&n=${count}`);
    const imgs = d?.images ?? [];
    if (!imgs.length)
        return "No wallpaper data";
    return imgs.map((img, i) => `${i + 1}. ${fmt(img)}`).join("\n\n");
}
// ---- muxA tools:
// The existing tools read today and the most recent few days from the default
// market. These walk further back into the archive and compare how the same day
// is illustrated in different markets.
/** The feed never returns more than this many images in one response. */
const MAX_PER_REQUEST = 8;
function market(mkt) {
    const value = (mkt ?? 'en-US').trim();
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(value)) {
        throw new BingError(`"${value}" is not a market code. Use a form like en-US, en-GB or de-DE.`);
    }
    return value;
}
function imageUrl(image) {
    if (image.url)
        return `https://www.bing.com${image.url}`;
    if (image.urlbase)
        return `https://www.bing.com${image.urlbase}_1920x1080.jpg`;
    return 'no image url reported';
}
function credit(image) {
    return (image.copyright ?? '').replace(/\s*\(©.*?\)\s*$/, '').trim();
}
async function fetchImages(idx, count, mkt) {
    const d = await get(`${BASE}?format=js&idx=${idx}&n=${count}&mkt=${encodeURIComponent(mkt)}`);
    return d?.images ?? [];
}
export async function markets(args = {}) {
    const raw = (args.markets ?? 'en-US,en-GB,de-DE,ja-JP').trim();
    const list = raw.split(/[,\s]+/).filter(Boolean).map(market);
    if (list.length < 2)
        throw new BingError('Give at least two market codes, like en-US,de-DE.');
    if (list.length > 6)
        throw new BingError('At most six markets at a time, because each one is a separate request.');
    const idx = Math.max(0, Math.min(Math.trunc(Number(args.idx ?? 0)) || 0, 500));
    const results = await Promise.all(list.map(async (mkt) => {
        try {
            const images = await fetchImages(idx, 1, mkt);
            return { mkt, image: images[0] };
        }
        catch (e) {
            return { mkt, error: e instanceof Error ? e.message : String(e) };
        }
    }));
    const lines = [`Bing wallpaper for the same day across ${list.length} markets (offset ${idx}):`];
    for (const r of results) {
        if (r.error) {
            lines.push(`  ${r.mkt}: ${r.error}`);
            continue;
        }
        if (!r.image) {
            lines.push(`  ${r.mkt}: no image reported`);
            continue;
        }
        lines.push(`  ${r.mkt} — ${r.image.title ?? 'Untitled'} (${r.image.startdate ?? '?'})`);
        lines.push(`     ${credit(r.image) || 'no credit line reported'}`);
        lines.push(`     ${imageUrl(r.image)}`);
    }
    const distinct = new Set(results.map((r) => r.image?.startdate).filter(Boolean));
    lines.push(`Days represented: ${distinct.size} of ${list.length} markets asked.`);
    return lines.join('\n');
}

const BING = 'https://www.bing.com/HPImageArchive.aspx';
export async function wallpaperArchive(args = {}) {
    const idx = Math.min(Math.max(Number(args?.idx ?? 0) || 0, 0), 16);
    const count = Math.min(Math.max(Number(args?.count ?? 4) || 4, 1), 16);
    const market = String(args?.market ?? 'en-US').trim();
    if (!/^[a-z]{2}-[A-Z]{2}$/.test(market))
        throw new Error('Market looks like en-US or de-DE.');
    const qs = new URLSearchParams({ format: 'js', idx: String(idx), n: String(count), mkt: market });
    const res = await fetch(`${BING}?${qs}`, {
        headers: { 'User-Agent': 'mrfentmen-bing-wallpaper-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Bing returned ${res.status}`);
    const body = (await res.json());
    const images = Array.isArray(body.images) ? body.images : [];
    if (!images.length)
        throw new Error(`Bing's archive has nothing at offset ${idx} for ${market}`);
    const lines = images.map((img, i) => {
        const date = String(img.startdate ?? '');
        const day = date.length === 8 ? `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6)}` : date;
        return `${i + 1}. ${day} — ${img.title ?? '(untitled)'}
   ${String(img.copyright ?? '').trim()}
   https://www.bing.com${img.url ?? ''}`;
    });
    return [
      `Bing wallpapers, ${market}, offset ${idx}, ${images.length} day(s):`,
      '',
      ...lines,
    ].join('\n');
}
