const UA = "mrfentmen-simplecast-mcp/1.0";
const ITUNES = "https://itunes.apple.com";
const CHARTS = "https://rss.applemarketingtools.com/api/v2";
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Upstream returned HTTP ${res.status}.`);
    return (await res.json());
}
async function getText(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/rss+xml, application/xml, text/xml, */*" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new Error(`Feed returned HTTP ${res.status}.`);
    return await res.text();
}
export async function searchPodcasts(args) {
    const query = (args.query ?? "").trim();
    if (!query)
        return "Provide a search term, for example technology news.";
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
    const data = await getJson(`${ITUNES}/search?term=${encodeURIComponent(query)}&entity=podcast&limit=${limit}`);
    if (!data.results?.length)
        return `No podcasts found for "${query}".`;
    const lines = [`${data.resultCount} podcast(s) matching "${query}":`, ""];
    data.results.forEach((p, i) => {
        lines.push(`${i + 1}. ${p.collectionName ?? "untitled"} — ${p.artistName ?? "unknown"}`);
        lines.push(`   ${p.trackCount ?? "?"} episode(s) | ${p.primaryGenreName ?? "no genre"} | id ${p.collectionId ?? "?"}`);
        if (p.feedUrl)
            lines.push(`   feed: ${p.feedUrl}`);
    });
    return lines.join("\n");
}
export async function searchEpisodes(args) {
    const query = (args.query ?? "").trim();
    if (!query)
        return "Provide a search term for episode titles.";
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 50);
    const data = await getJson(`${ITUNES}/search?term=${encodeURIComponent(query)}&entity=podcastEpisode&limit=${limit}`);
    if (!data.results?.length)
        return `No episodes found for "${query}".`;
    const lines = [`${data.resultCount} episode(s) matching "${query}":`, ""];
    data.results.forEach((e, i) => {
        const minutes = e.trackTimeMillis ? Math.round(e.trackTimeMillis / 60000) : null;
        lines.push(`${i + 1}. ${e.trackName ?? "untitled"}`);
        lines.push(`   ${e.collectionName ?? "unknown show"} | ${e.releaseDate?.slice(0, 10) ?? "no date"}${minutes ? ` | ${minutes} min` : ""}`);
    });
    return lines.join("\n");
}
export async function podcastCharts(args) {
    const country = (args.country ?? "us").trim().toLowerCase();
    if (!/^[a-z]{2}$/.test(country))
        return 'Provide a two-letter country code such as "us" or "gb".';
    const limit = Math.min(Math.max(Number(args.limit ?? 10) || 10, 1), 100);
    const data = await getJson(`${CHARTS}/${country}/podcasts/top/${limit}/podcasts.json`);
    const results = data.feed?.results ?? [];
    if (!results.length)
        return `Apple returned no chart for country "${country}".`;
    const lines = [
        `Apple Podcasts top ${results.length} in ${country.toUpperCase()} (chart updated ${data.feed.updated ?? "recently"}):`,
        "",
    ];
    results.forEach((entry, i) => {
        const genre = entry.genres?.[0]?.name ?? "no genre";
        lines.push(`${i + 1}. ${entry.name ?? "untitled"} — ${entry.artistName ?? "unknown"} (${genre})`);
        lines.push(`   id ${entry.id ?? "?"}${entry.url ? ` | ${entry.url}` : ""}`);
    });
    return lines.join("\n");
}
export async function podcastDetails(args) {
    let podcast;
    if (args.podcastId) {
        const data = await getJson(`${ITUNES}/lookup?id=${Number(args.podcastId)}&entity=podcast`);
        podcast = data.results?.[0];
    }
    else if (args.name?.trim()) {
        const data = await getJson(`${ITUNES}/search?term=${encodeURIComponent(args.name.trim())}&entity=podcast&limit=1`);
        podcast = data.results?.[0];
    }
    else {
        return "Provide a podcastId or a name.";
    }
    if (!podcast)
        return "No podcast found for that id or name.";
    const lines = [
        `Podcast: ${podcast.collectionName ?? "untitled"}`,
        `Publisher: ${podcast.artistName ?? "unknown"}`,
        `Genre: ${podcast.primaryGenreName ?? "no genre"} | Country: ${(podcast.country ?? "?").toUpperCase()}`,
        `Episodes: ${podcast.trackCount ?? "?"}`,
        `Apple id: ${podcast.collectionId ?? "?"}`,
        `Latest release: ${podcast.releaseDate?.slice(0, 10) ?? "unknown"}`,
    ];
    if (podcast.feedUrl) {
        lines.push(`RSS feed: ${podcast.feedUrl}`);
        const stats = await feedStats(podcast.feedUrl).catch(() => null);
        if (stats) {
            lines.push("", `Feed check: ${stats.episodes.length} item(s) in the feed, newest ${stats.episodes[0]?.date.slice(0, 10) ?? "unknown"}.`);
            if (stats.cadenceDays != null)
                lines.push(`Publishing cadence: one episode every ${stats.cadenceDays} day(s).`);
        }
    }
    return lines.join("\n");
}
const decodeEntities = (value) => value
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    // Feeds are full of numeric entities such as &#038; and &#8211;.
    .replace(/&#x([0-9a-f]+);/gi, (_, hex) => String.fromCodePoint(parseInt(hex, 16)))
    .replace(/&#(\d+);/g, (_, dec) => String.fromCodePoint(Number(dec)))
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, " ")
    .replace(/&hellip;/g, "...")
    .replace(/&amp;/g, "&");
const stripTags = (value) => decodeEntities(value).replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
function tagValue(block, tag) {
    const match = new RegExp(`<${tag}(?:\\s[^>]*)?>([\\s\\S]*?)</${tag}>`, "i").exec(block);
    return match ? decodeEntities(match[1]).trim() : null;
}
function attrValue(block, tag, attribute) {
    const match = new RegExp(`<${tag}\\b[^>]*\\b${attribute}=["']([^"']+)["']`, "i").exec(block);
    return match ? match[1] : null;
}
/** Handles the three duration formats feeds use: seconds, MM:SS and HH:MM:SS. */
export function parseDuration(raw) {
    if (!raw)
        return null;
    const value = raw.trim();
    if (!value)
        return null;
    if (/^\d+(\.\d+)?$/.test(value))
        return Math.round(Number(value));
    const parts = value.split(":").map((p) => Number(p));
    if (parts.some((p) => Number.isNaN(p)))
        return null;
    if (parts.length === 3)
        return parts[0] * 3600 + parts[1] * 60 + parts[2];
    if (parts.length === 2)
        return parts[0] * 60 + parts[1];
    return null;
}
/** A small RSS/Atom reader — enough for podcast feeds, no extra dependency. */
export function parseFeed(xml) {
    const channel = /<channel[\s\S]*?<\/channel>/i.exec(xml)?.[0] ?? xml;
    const itemBlocks = [...channel.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
    const entryBlocks = itemBlocks.length ? [] : [...channel.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
    const episodes = [...itemBlocks, ...entryBlocks].map((block) => {
        const durationRaw = tagValue(block, "itunes:duration") ?? tagValue(block, "duration");
        const date = tagValue(block, "pubDate") ?? tagValue(block, "published") ?? tagValue(block, "updated") ?? "";
        const parsed = date ? new Date(date) : null;
        return {
            title: stripTags(tagValue(block, "title") ?? "untitled"),
            date: parsed && !Number.isNaN(parsed.getTime()) ? parsed.toISOString() : "",
            durationSeconds: parseDuration(durationRaw),
            audioUrl: attrValue(block, "enclosure", "url") ?? tagValue(block, "link"),
            link: tagValue(block, "link") ?? tagValue(block, "guid"),
            description: stripTags(tagValue(block, "description") ?? tagValue(block, "summary") ?? tagValue(block, "itunes:summary") ?? ""),
        };
    });
    return {
        title: stripTags(tagValue(channel, "title") ?? "untitled feed"),
        description: stripTags(tagValue(channel, "description") ?? tagValue(channel, "subtitle") ?? ""),
        language: tagValue(channel, "language") ?? "unknown",
        link: tagValue(channel, "link"),
        episodes,
    };
}
function normalizeFeedUrl(input) {
    const raw = (input ?? "").trim();
    if (!raw)
        throw new Error("Provide the podcast RSS feed URL, for example https://example.com/feed.xml.");
    if (!/^https?:\/\//i.test(raw))
        throw new Error("The feed URL must start with http:// or https://.");
    return raw;
}
async function feedStats(feedUrl) {
    const xml = await getText(normalizeFeedUrl(feedUrl));
    const feed = parseFeed(xml);
    if (!feed.episodes.length)
        throw new Error("That URL did not return a podcast feed with episodes.");
    const episodes = [...feed.episodes]
        .filter((e) => e.date)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const cadenceDays = episodes.length >= 2
        ? Math.round((new Date(episodes[0].date).getTime() - new Date(episodes[episodes.length - 1].date).getTime())
            / 86400000 / (episodes.length - 1))
        : null;
    return { feed, episodes: episodes.length ? episodes : feed.episodes, cadenceDays };
}
export async function latestEpisodes(args) {
    const count = Math.min(Math.max(Number(args.count ?? 5) || 5, 1), 25);
    const { feed, episodes } = await feedStats(args.feedUrl);
    const lines = [`${feed.title} — latest ${Math.min(count, episodes.length)} of ${feed.episodes.length} item(s) in the feed`, ""];
    episodes.slice(0, count).forEach((e, i) => {
        const minutes = e.durationSeconds ? `${Math.round(e.durationSeconds / 60)} min` : "duration not listed";
        lines.push(`${i + 1}. ${e.title}`);
        lines.push(`   ${e.date.slice(0, 10) || "no date"} | ${minutes}`);
        if (e.audioUrl)
            lines.push(`   audio: ${e.audioUrl.slice(0, 160)}`);
    });
    return lines.join("\n");
}
export async function podcastStats(args) {
    const { feed, episodes, cadenceDays } = await feedStats(args.feedUrl);
    const durations = episodes.map((e) => e.durationSeconds).filter((d) => d != null);
    const average = durations.length
        ? Math.round(durations.reduce((a, b) => a + b, 0) / durations.length / 60)
        : null;
    const daysSinceLast = episodes[0]?.date
        ? Math.round((Date.now() - new Date(episodes[0].date).getTime()) / 86400000)
        : null;
    const lines = [
        `Feed stats for ${feed.title}`,
        `Language: ${feed.language}${feed.link ? ` | Site: ${feed.link}` : ""}`,
        `Episodes in feed: ${episodes.length}`,
        `First published: ${episodes[episodes.length - 1]?.date.slice(0, 10) ?? "unknown"}`,
        `Latest episode: ${episodes[0]?.date.slice(0, 10) ?? "unknown"}${daysSinceLast != null ? ` (${daysSinceLast} day(s) ago)` : ""}`,
        `Average episode length: ${average != null ? `${average} min` : "not listed in the feed"}`,
        `Publishing cadence: ${cadenceDays != null ? `about one episode every ${cadenceDays} day(s)` : "not enough dated episodes to tell"}`,
    ];
    if (daysSinceLast != null && cadenceDays != null && daysSinceLast > cadenceDays * 3 && cadenceDays > 0) {
        lines.push("", `Warning: this show is overdue — ${daysSinceLast} days since the last episode against a ${cadenceDays}-day cadence.`);
    }
    if (durations.length < episodes.length) {
        lines.push(`Note: ${episodes.length - durations.length} episode(s) do not publish a duration.`);
    }
    return lines.join("\n");
}
export async function comparePodcasts(args) {
    const [a, b] = await Promise.all([feedStats(args.feedA), feedStats(args.feedB)]);
    const row = (label, left, right) => `${label.padEnd(20)} ${left.padEnd(24)} ${right}`;
    const avg = (episodes) => {
        const d = episodes.map((e) => e.durationSeconds).filter((v) => v != null);
        return d.length ? `${Math.round(d.reduce((x, y) => x + y, 0) / d.length / 60)} min` : "not listed";
    };
    return [
        "Podcast comparison",
        "",
        row("", a.feed.title.slice(0, 22), b.feed.title.slice(0, 22)),
        row("Episodes in feed", String(a.episodes.length), String(b.episodes.length)),
        row("Latest episode", a.episodes[0]?.date.slice(0, 10) ?? "unknown", b.episodes[0]?.date.slice(0, 10) ?? "unknown"),
        row("Average length", avg(a.episodes), avg(b.episodes)),
        row("Cadence (days)", a.cadenceDays != null ? String(a.cadenceDays) : "unknown", b.cadenceDays != null ? String(b.cadenceDays) : "unknown"),
        row("Language", a.feed.language, b.feed.language),
        "",
        `${a.feed.title} publishes ${a.episodes.length > b.episodes.length ? "more" : a.episodes.length < b.episodes.length ? "fewer" : "the same number of"} episodes.`,
    ].join("\n");
}
// ---- muxH tools:
// The tools above list what a feed publishes. These two check whether the feed
// is actually well formed, which is the thing a podcast network is graded on:
// whether every episode carries a duration, a file size and an explicit flag,
// and how many of them are trailers rather than the show.
const tag = (xml, name) => {
    const match = new RegExp(`<${name}(?:\\s[^>]*)?>([\\s\\S]*?)</${name}>`, "i").exec(xml);
    if (!match)
        return null;
    return match[1].replace(/^\s*<!\[CDATA\[/, "").replace(/\]\]>\s*$/, "").trim();
};
const countMatches = (xml, name) => (xml.match(new RegExp(`<${name}[\\s>]`, "gi")) ?? []).length;
function feedUrl(raw) {
    const input = (raw ?? "").trim();
    if (!input)
        throw new Error("Give a podcast feed URL, for example https://feeds.megaphone.fm/darknetdiaries.");
    const withScheme = /^https?:\/\//i.test(input) ? input : `https://${input}`;
    try {
        new URL(withScheme);
    }
    catch {
        throw new Error(`"${raw}" is not a URL.`);
    }
    return withScheme;
}
const durationSeconds = (raw) => {
    if (!raw)
        return null;
    const parts = raw.trim().split(":").map((p) => Number(p));
    if (parts.some((n) => !Number.isFinite(n)))
        return null;
    return parts.reduce((acc, n) => acc * 60 + n, 0);
};
