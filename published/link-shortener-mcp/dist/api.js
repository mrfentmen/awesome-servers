const BASE = "https://is.gd";
const UA = "mrfentmen-link-shortener-mcp/1.0 (https://github.com/mrfentmen)";
export class LinkError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new LinkError("is.gd rate limit hit, wait and retry");
    if (!res.ok)
        throw new LinkError(`is.gd error ${res.status}`);
    return (await res.json());
}
export async function shorten(args) {
    const url = (args.url ?? "").trim();
    if (!/^https?:\/\/.+/i.test(url))
        throw new LinkError("Provide a full URL starting with http or https");
    if (url.length > 2000)
        throw new LinkError("URL is too long");
    const d = await get(`${BASE}/create.php?format=json&url=${encodeURIComponent(url)}`);
    if (d?.errorcode)
        throw new LinkError(`is.gd: ${d.errormessage ?? "shorten failed"}`);
    return `Shortened:\n${d?.shorturl ?? ""}\n\nOriginal:\n${url}`;
}
export async function expand(args) {
    const url = (args.url ?? "").trim();
    if (!/^https?:\/\/.+/i.test(url))
        throw new LinkError("Provide a URL to expand");
    const res = await fetch(url, { headers: { "User-Agent": UA }, redirect: "manual", signal: AbortSignal.timeout(20000) });
    if (!res.ok && res.status !== 301 && res.status !== 302)
        throw new LinkError(`Expand error ${res.status}`);
    const loc = res.headers.get("location");
    return loc ? `${url} ->\n${loc}` : "No redirect found for this URL";
}
// ---- gap2b tools:
const MICROLINK = 'https://api.microlink.io';
function checkedUrl(raw, what) {
    const url = String(raw ?? '').trim();
    if (!/^https?:\/\/.+/i.test(url))
        throw new LinkError(`Provide a full ${what} starting with http or https`);
    if (url.length > 2000)
        throw new LinkError(`${what} is too long`);
    return url;
}
function clip(value, max = 300) {
    const text = typeof value === 'string' ? value : value == null ? '' : String(value);
    const clean = text.replace(/\s+/g, ' ').trim();
    return clean.length > max ? `${clean.slice(0, max)}…` : clean;
}
async function microlink(params) {
    const res = await fetch(`${MICROLINK}?${params.toString()}`, {
        headers: { 'User-Agent': UA, Accept: 'application/json' },
        signal: AbortSignal.timeout(45000),
    });
    let body;
    try {
        body = (await res.json());
    }
    catch {
        throw new LinkError(`microlink returned ${res.status} with a non-JSON body`);
    }
    if (!res.ok || body.status !== 'success') {
        const detail = typeof body.data?.url === 'string' ? body.data.url : `HTTP ${res.status} ${body.code ?? ''}`.trim();
        throw new LinkError(`microlink could not read the page: ${clip(detail, 200)}`);
    }
    return body;
}
/** Pull one CSS selector's text off a page (h1, meta description, first price…). */
export async function pageExtract(args) {
    const url = checkedUrl(args.url, 'URL');
    const selector = (args.selector ?? '').trim();
    if (!selector)
        throw new LinkError('Provide a CSS selector, for example h1 or meta[name=description]');
    const params = new URLSearchParams({ url, meta: 'false', 'data.value.selector': selector, 'data.value.type': 'string' });
    if (args.attribute)
        params.set('data.value.attr', args.attribute.trim());
    params.set('data.value.all', args.all ? 'true' : 'false');
    const body = await microlink(params);
    const found = body.data?.value;
    if (found == null)
        throw new LinkError(`The selector ${selector} matched nothing on ${url}`);
    const values = Array.isArray(found) ? found : [found];
    const shown = values.slice(0, 10);
    const header = `${selector} on ${url} (${values.length} match${values.length === 1 ? '' : 'es'}${values.length > shown.length ? `, showing ${shown.length}` : ''}):`;
    return header + '\n' + shown.map((v, i) => `${i + 1}. ${clip(v, 300) || '(empty)'}`).join('\n');
}
/** Every hop a URL goes through, with the status code of each redirect. */
export async function redirectChain(args) {
    let current = checkedUrl(args.url, 'URL');
    const maxHops = Math.max(1, Math.min(args.maxHops ?? 8, 20));
    const hops = [];
    for (let i = 0; i < maxHops; i++) {
        const res = await fetch(current, {
            method: 'HEAD',
            headers: { 'User-Agent': UA },
            redirect: 'manual',
            signal: AbortSignal.timeout(20000),
        });
        const location = res.headers.get('location');
        hops.push(`  ${i + 1}. ${res.status}${location ? '' : ' (final)'} ${current}${location ? `\n     -> ${new URL(location, current).toString()}` : ''}`);
        if (!location)
            return `Redirect chain for ${args.url}:\n${hops.join('\n')}`;
        current = new URL(location, current).toString();
    }
    return `Redirect chain for ${args.url} (stopped at the ${maxHops}-hop limit):\n${hops.join('\n')}`;
}
