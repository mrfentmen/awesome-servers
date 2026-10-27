const UA = "mrfentmen-hn-reddit-mcp/1.0 (https://github.com/mrfentmen)";
export class SocialError extends Error {
}
async function get(url, headers = {}) {
    const res = await fetch(url, { headers: { "User-Agent": UA, ...headers }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new SocialError(`API error ${res.status}`);
    return (await res.json());
}
export async function hnTop(args) {
    const limit = Math.min(args.limit ?? 15, 30);
    const ids = await get("https://hacker-news.firebaseio.com/v0/topstories.json");
    const items = await Promise.all(ids.slice(0, limit).map((id) => get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`)));
    return items.map((it, i) => `${i + 1}. ${it.title ?? ""} (${it.score ?? 0} pts)\n   ${it.url ?? `https://news.ycombinator.com/item?id=${it.id}`}`).join("\n\n");
}
export async function hnItem(args) {
    const id = args.item_id ?? 0;
    if (!id)
        throw new SocialError("Provide an item id");
    const it = await get(`https://hacker-news.firebaseio.com/v0/item/${id}.json`);
    return `${it.title ?? "item"} (${it.score ?? 0} pts, ${it.descendants ?? 0} comments)\n${it.url ?? `https://news.ycombinator.com/item?id=${it.id}`}\n\n${(it.text ?? "").slice(0, 2000)}`;
}
function parseRss(xml) {
    const out = [];
    const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
    let m;
    while ((m = entryRe.exec(xml)) !== null) {
        const e = m[1];
        const title = /<title>([\s\S]*?)<\/title>/.exec(e)?.[1] ?? "";
        const link = /<link[^>]*href="([^"]+)"/.exec(e)?.[1] ?? "";
        const author = /<name>([\s\S]*?)<\/name>/.exec(e)?.[1] ?? "";
        if (title)
            out.push({ title, link, author });
    }
    return out;
}
export async function redditTop(args) {
    const sub = encodeURIComponent(args.subreddit ?? "programming");
    const limit = Math.min(args.limit ?? 10, 25);
    const res = await fetch(`https://www.reddit.com/r/${sub}/top/.rss?t=week`, {
        headers: { "User-Agent": UA, Accept: "application/atom+xml" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new SocialError(`Reddit error ${res.status}`);
    const posts = parseRss(await res.text()).slice(0, limit);
    return posts.map((p, i) => `${i + 1}. ${p.title}\n   u/${p.author || "unknown"} | r/${sub}\n   ${p.link}`).join("\n\n") || "No posts found";
}
const hnText = (html, max = 220) => String(html ?? "")
    .replace(/<[^>]*>/g, " ")
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&gt;/g, ">")
    .replace(/&lt;/g, "<")
    .replace(/&quot;/g, '"')
    .replace(/&#x27;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const redditUser = (author) => {
    const name = author.trim().replace(/^\/?u\//i, "");
    return name ? `u/${name}` : "u/unknown";
};
export async function hnComments(args) {
    const id = Math.floor(args.id ?? 0);
    if (!id)
        throw new SocialError("Provide a Hacker News item id");
    const maxDepth = Math.max(1, Math.min(args.depth ?? 2, 6));
    const d = await get(`https://hn.algolia.com/api/v1/items/${id}`);
    if (!d || d.title === undefined)
        return `No Hacker News item ${id}.`;
    const lines = [];
    let shown = 0;
    const walk = (nodes, level) => {
        for (const node of nodes ?? []) {
            if (shown >= 40)
                return;
            const text = hnText(node.text, 260);
            if (text) {
                lines.push(`${"  ".repeat(level)}- ${node.author ?? "unknown"}: ${text}`);
                shown++;
            }
            if (level + 1 < maxDepth)
                walk(node.children ?? [], level + 1);
        }
    };
    walk(d.children ?? [], 1);
    return [
        `${d.title ?? `item ${id}`} (${d.points ?? 0} pts) by ${d.author ?? "unknown"}`,
        d.url ?? `https://news.ycombinator.com/item?id=${id}`,
        "",
        lines.length ? `Comments (${shown} shown, depth ${maxDepth}):` : "No comment text at this depth.",
        ...lines,
    ].join("\n");
}
