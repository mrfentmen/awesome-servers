export class YoutubeError extends Error {
    constructor(message) {
        super(message);
        this.name = "YoutubeError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function key() {
    const k = process.env.YOUTUBE_API_KEY;
    if (!k)
        throw new YoutubeError("Set YOUTUBE_API_KEY (free Google API key).");
    return k;
}
async function get(path) {
    const sep = path.includes("?") ? "&" : "?";
    let res;
    try {
        res = await fetch(`https://www.googleapis.com/youtube/v3${path}${sep}key=${encodeURIComponent(key())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new YoutubeError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new YoutubeError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function search(query, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/search?part=snippet&type=video&maxResults=${n}&q=${encodeURIComponent(query)}`);
}
export function videoDetails(videoId) {
    return get(`/videos?part=snippet,statistics&id=${encodeURIComponent(videoId)}`);
}
export function channelDetails(channelId) {
    return get(`/channels?part=snippet,statistics&id=${encodeURIComponent(channelId)}`);
}
export function playlistItems(playlistId, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/playlistItems?part=snippet&maxResults=${n}&playlistId=${encodeURIComponent(playlistId)}`);
}
export function channelPlaylists(channelId, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/playlists?part=snippet&maxResults=${n}&channelId=${encodeURIComponent(channelId)}`);
}
export function mostPopular(region, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/videos?part=snippet,statistics&chart=mostPopular&maxResults=${n}&regionCode=${encodeURIComponent(region ?? "US")}`);
}
export function videoComments(videoId, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/commentThreads?part=snippet&maxResults=${n}&videoId=${encodeURIComponent(videoId)}&order=relevance`);
}
export function channelVideos(channelId, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/search?part=snippet&type=video&order=date&maxResults=${n}&channelId=${encodeURIComponent(channelId)}`);
}
export function searchChannels(query, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/search?part=snippet&type=channel&maxResults=${n}&q=${encodeURIComponent(query)}`);
}
export function liveStreams(query, maxResults) {
    const n = Math.min(Number(maxResults ?? 10) || 10, 50);
    return get(`/search?part=snippet&type=video&eventType=live&maxResults=${n}&q=${encodeURIComponent(query)}`);
}
// ---- muxH tools:
// The ten tools above call the YouTube Data API, which needs a Google API key.
// These two need no key at all: a channel's own public Atom feed, which YouTube
// publishes for every channel whether or not anyone holds a key, and the oEmbed
// endpoint every embed on the internet already uses.
const YT_UA = "mcfentmen-youtube-mcp/1.2 (https://github.com/mcfentmen/youtube-mcp)";
const YT_FEED = "https://www.youtube.com/feeds/videos.xml";
const YT_OEMBED = "https://www.youtube.com/oembed";
async function ytGet(url, label, accept) {
    let res;
    try {
        res = await fetch(url, { headers: { "User-Agent": YT_UA, Accept: accept }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new YoutubeError(`Could not reach ${label}: ${e.message}`);
    }
    if (res.status === 404)
        throw new YoutubeError(`${label} has nothing at that address.`);
    if (!res.ok)
        throw new YoutubeError(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
/** The tag values out of one Atom entry or document, without an XML dependency. */
function ytTag(xml, tag) {
    const out = [];
    const pattern = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "gi");
    let match;
    while ((match = pattern.exec(xml)) !== null) {
        const value = match[1]
            .replace(/^\s*<!\[CDATA\[/, "")
            .replace(/\]\]>\s*$/, "")
            .replace(/<[^>]+>/g, "")
            .replace(/&amp;/g, "&")
            .replace(/&lt;/g, "<")
            .replace(/&gt;/g, ">")
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();
        if (value)
            out.push(value);
    }
    return out;
}
/**
 * A channel's latest uploads, read from the Atom feed YouTube publishes at
 * /feeds/videos.xml for every channel. It costs no key and no quota, and it is the
 * only view of a channel that works for a channel with no API access at all.
 */
export async function channelFeed(args) {
    const raw = String(args?.channel_id ?? "").trim();
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 50);
    let feedUrl;
    if (/^UC[\w-]{20,}$/.test(raw)) {
        feedUrl = `${YT_FEED}?channel_id=${encodeURIComponent(raw)}`;
    }
    else if (/^https?:\/\//i.test(raw)) {
        // A channel URL carries the id in its path, which is how the feed is addressed.
        const id = /channel\/(UC[\w-]+)/.exec(raw)?.[1];
        if (!id) {
            throw new YoutubeError("That URL does not contain a channel id. Use the /channel/UC... form, or pass the UC id itself; a /@handle URL is not enough, because the feed is addressed by id.");
        }
        feedUrl = `${YT_FEED}?channel_id=${encodeURIComponent(id)}`;
    }
    else {
        throw new YoutubeError("Give a channel id beginning UC, or a full https://www.youtube.com/channel/UC... URL.");
    }
    let res;
    try {
        res = await fetch(feedUrl, { headers: { "User-Agent": YT_UA, Accept: "application/atom+xml, application/xml" }, signal: AbortSignal.timeout(25000) });
    }
    catch (e) {
        throw new YoutubeError(`Could not reach YouTube's feed service: ${e.message}`);
    }
    if (res.status === 404)
        throw new YoutubeError(`YouTube publishes no feed for ${raw}; check the channel id.`);
    if (!res.ok)
        throw new YoutubeError(`YouTube's feed service returned HTTP ${res.status}.`);
    const xml = await res.text();
    if (!/<feed/i.test(xml))
        throw new YoutubeError("That address did not return an Atom feed.");
    const headerEnd = xml.indexOf("<entry");
    const header = headerEnd < 0 ? xml : xml.slice(0, headerEnd);
    const channelTitle = ytTag(header, "title")[0] ?? "channel name not published";
    // The header's <link> elements are self-closing, so the href is read from the tag itself.
    const channelLink = [...header.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1]).find((h) => h.includes("youtube.com/channel")) ?? "not reported";
    const entries = [...xml.matchAll(/<entry>([\s\S]*?)<\/entry>/gi)].map((m) => m[1]);
    if (!entries.length)
        throw new YoutubeError("The feed parsed but carries no entries, which means the channel has published nothing.");
    const parsed = entries.map((entry) => {
        const links = [...entry.matchAll(/<link[^>]*href="([^"]+)"/g)].map((m) => m[1]);
        return {
            title: ytTag(entry, "title")[0] ?? "untitled",
            videoId: ytTag(entry, "yt:videoId")[0] ?? (/v=([\w-]{6,})/.exec(links.join(" "))?.[1] ?? "not reported"),
            published: ytTag(entry, "published")[0] ?? "not reported",
            updated: ytTag(entry, "updated")[0] ?? "not reported",
            author: ytTag(entry, "name")[0] ?? channelTitle,
            link: links.find((l) => l.includes("watch")) ?? "not reported",
            views: ytTag(entry, "statistics:views")[0] ?? null,
        };
    });
    const dates = parsed.map((p) => Date.parse(p.published)).filter((n) => Number.isFinite(n));
    const gaps = [];
    for (let i = 1; i < Math.min(parsed.length, 12); i += 1) {
        const days = (Date.parse(parsed[i - 1].published) - Date.parse(parsed[i].published)) / 86400000;
        if (Number.isFinite(days) && days >= 0)
            gaps.push(Math.round(days));
    }
    const medianGap = gaps.length ? gaps.sort((a, b) => a - b)[Math.floor(gaps.length / 2)] : null;
    return [
        `Channel feed for ${channelTitle}`,
        `  ${channelLink}`,
        `  ${parsed.length} entr(ies) in the feed, newest first`,
        ...(dates.length
            ? [
                `  published between ${new Date(Math.min(...dates)).toISOString().slice(0, 10)} and ${new Date(Math.max(...dates)).toISOString().slice(0, 10)}`,
                `  median gap between the ${Math.min(parsed.length, 12)} newest: ${medianGap !== null ? `${medianGap} day(s)` : "not computable"}`,
            ]
            : []),
        "",
        ...parsed.slice(0, limit).map((entry, i) => `  ${String(i + 1).padStart(2)}. ${entry.title.slice(0, 68).padEnd(68)} ${entry.published.slice(0, 10)}  id ${entry.videoId}` +
            `\n      ${entry.link}`),
        ...(parsed.length > limit ? [`  (+${parsed.length - limit} further entr(ies) not shown)`] : []),
        "",
        "This is the public Atom feed YouTube generates for the channel, so it costs no API key and no quota, and it works for channels that have never been touched by the Data API. YouTube keeps roughly the fifteen most recent uploads, so this is not a back catalogue, and a private or unlisted video never appears here even if it has an id.",
    ].join("\n");
}
/**
 * The card YouTube itself renders for any public video or playlist: title, channel
 * and its URL, and the thumbnail. This is what an embed asks for, so it works on
 * an unlisted-in-your-account video and costs no key.
 */
export async function embedCard(args) {
    const raw = String(args?.url ?? "").trim();
    if (!raw)
        throw new YoutubeError("Give a YouTube video or playlist URL, e.g. https://www.youtube.com/watch?v=dQw4w9WgXcQ.");
    let target;
    if (/^https?:\/\//i.test(raw)) {
        target = raw;
    }
    else if (/^[\w-]{11}$/.test(raw)) {
        target = `https://www.youtube.com/watch?v=${raw}`;
    }
    else {
        throw new YoutubeError(`"${args.url}" is neither a URL nor an 11-character video id.`);
    }
    let parsed;
    try {
        parsed = new URL(target);
    }
    catch {
        throw new YoutubeError(`"${args.url}" is not a URL.`);
    }
    if (!/(^|\.)youtube\.com$|(^|\.)youtu\.be$|(^|\.)youtube-nocookie\.com$/i.test(parsed.hostname)) {
        throw new YoutubeError(`That is a ${parsed.hostname} address; the oEmbed endpoint only answers for YouTube.`);
    }
    const card = await ytGet(`${YT_OEMBED}?url=${encodeURIComponent(parsed.href)}&format=json`, "YouTube's oEmbed endpoint", "application/json");
    if (!card.title)
        throw new YoutubeError("oEmbed returned no title, so there is no card to show.");
    const kind = /\/playlist\b/.test(parsed.pathname) || parsed.searchParams.get("list") ? "playlist" : "video";
    const id = parsed.searchParams.get("v") ?? (/playlist\?list=([\w-]+)/.exec(parsed.href)?.[1] ?? "not reported");
    return [
        `YouTube card for a public ${kind}`,
        `  title: ${card.title}`,
        `  channel: ${card.author_name ?? "not reported"}${card.author_url ? ` (${card.author_url})` : ""}`,
        `  provider: ${card.provider_name ?? "not reported"} | id: ${id}`,
        `  canonical URL: ${parsed.href}`,
        card.thumbnail_url
            ? `  thumbnail: ${card.thumbnail_url} at ${card.thumbnail_width ?? "?"}x${card.thumbnail_height ?? "?"}`
            : "  thumbnail: none published",
        `  embed size: ${card.width ?? "not reported"}x${card.height ?? "not reported"}`,
        "",
        "This is the same document every oEmbed embed on the web fetches, so it needs no key and reveals nothing the Data API would not. It carries no view count, no description and no duration: oEmbed exists to draw a card, not to describe a video. A private video answers 404 here, which is the only confirmation the endpoint gives that it is not public.",
    ].join("\n");
}
