const UA = "mrfentmen-html-meta-mcp/1.0 (https://github.com/mrfentmen)";
export class HtmlmetaError extends Error {
}
function attr(html, name) {
    const re = new RegExp(`(?:name|property)="${name}"[^>]*content="([^"]*)"`, "i");
    const m = html.match(re);
    if (m)
        return decodeEntities(m[1]).trim();
    const re2 = new RegExp(`content="([^"]*)"[^>]*(?:name|property)="${name}"`, "i");
    const m2 = html.match(re2);
    return m2 ? decodeEntities(m2[1]).trim() : null;
}
function decodeEntities(s) {
    return s
        .replace(/&#39;/g, "'")
        .replace(/&quot;/g, '"')
        .replace(/&amp;/g, "&")
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&nbsp;/g, " ");
}
function first(html, regex) {
    const m = html.match(regex);
    return m ? decodeEntities(m[1]).replace(/\s+/g, " ").trim() : null;
}
export async function meta(args) {
    const raw = (args.url ?? "").trim();
    if (!raw)
        throw new HtmlmetaError("Provide a URL");
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: "text/html" },
            redirect: "follow",
            signal: AbortSignal.timeout(15000),
        });
    }
    catch (e) {
        throw new HtmlmetaError(`Could not fetch ${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok)
        throw new HtmlmetaError(`HTTP ${res.status} from ${url}`);
    const html = (await res.text()).slice(0, 400000);
    const title = attr(html, "og:title") ?? first(html, /<title[^>]*>([^<]*)<\/title>/i) ?? "no title";
    const description = attr(html, "og:description") ?? attr(html, "description") ?? "no description";
    const image = attr(html, "og:image");
    const site = attr(html, "og:site_name");
    const type = attr(html, "og:type");
    const canonical = first(html, /<link[^>]*rel="canonical"[^>]*href="([^"]*)"/i);
    const author = attr(html, "author");
    const published = attr(html, "article:published_time");
    const lines = [
        `URL: ${url}`,
        `Title: ${title.slice(0, 200)}`,
        `Description: ${description.slice(0, 300)}`,
    ];
    if (site)
        lines.push(`Site: ${site}`);
    if (type)
        lines.push(`Type: ${type}`);
    if (image)
        lines.push(`Image: ${image}`);
    if (canonical)
        lines.push(`Canonical: ${canonical}`);
    if (author)
        lines.push(`Author: ${author}`);
    if (published)
        lines.push(`Published: ${published.slice(0, 10)}`);
    return lines.join("\n");
}
// ---- muxC tools:
function normaliseUrl(raw) {
    const value = raw.trim();
    if (!value)
        throw new HtmlmetaError("Provide a URL");
    return /^https?:\/\//i.test(value) ? value : `https://${value}`;
}
async function fetchText(url, accept, timeout = 15000) {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UA, Accept: accept },
            redirect: "follow",
            signal: AbortSignal.timeout(timeout),
        });
    }
    catch (e) {
        throw new HtmlmetaError(`Could not fetch ${url}: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!res.ok)
        throw new HtmlmetaError(`HTTP ${res.status} from ${url}`);
    return { res, body: await res.text() };
}
