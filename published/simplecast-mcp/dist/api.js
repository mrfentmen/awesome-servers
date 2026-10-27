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
const channelBlock = (xml) => /<channel[\s\S]*?<\/channel>/i.exec(xml)?.[0] ?? xml;
const itemBlocks = (xml) => {
    const channel = channelBlock(xml);
    const items = [...channel.matchAll(/<item\b[\s\S]*?<\/item>/gi)].map((m) => m[0]);
    if (items.length)
        return items;
    return [...channel.matchAll(/<entry\b[\s\S]*?<\/entry>/gi)].map((m) => m[0]);
};
const channelArtwork = (channel) => {
    const href = attrValue(channel, "itunes:image", "href");
    if (href)
        return href;
    const image = /<image[\s\S]*?<\/image>/i.exec(channel)?.[0];
    return image ? tagValue(image, "url") : null;
};
const htmlText = (value) => String(value ?? "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
const bytesOf = (raw) => {
    const value = String(raw ?? "").trim();
    return /^\d+$/.test(value) ? Number(value) : null;
};
function readItems(xml) {
    const blocks = itemBlocks(xml);
    if (!blocks.length)
        throw new Error("That URL returned no podcast episodes, so there is nothing to audit.");
    const channel = channelBlock(xml);
    const art = channelArtwork(channel);
    return blocks.map((block) => {
        const durationRaw = tagValue(block, "itunes:duration") ?? tagValue(block, "duration");
        const seconds = durationRaw ? (durationSeconds(durationRaw) ?? parseDuration(durationRaw)) : null;
        const mime = attrValue(block, "enclosure", "type");
        const title = stripTags(tagValue(block, "title") ?? "untitled");
        const summary = htmlText(tagValue(block, "description") ?? tagValue(block, "summary") ?? tagValue(block, "itunes:summary") ?? "");
        return {
            title,
            seconds: seconds && seconds > 0 ? seconds : null,
            size: bytesOf(attrValue(block, "enclosure", "length")),
            mime: mime ? mime.trim().toLowerCase() : null,
            url: attrValue(block, "enclosure", "url"),
            guid: (tagValue(block, "guid") ?? tagValue(block, "id") ?? "").trim(),
            summary,
            explicit: (tagValue(block, "itunes:explicit") ?? "").trim().toLowerCase(),
            artwork: attrValue(block, "itunes:image", "href") ?? art,
            episodeType: (tagValue(block, "itunes:episodeType") ?? "").trim().toLowerCase(),
            pubDate: tagValue(block, "pubDate") ?? tagValue(block, "published") ?? tagValue(block, "updated") ?? "",
        };
    });
}
export async function feedAudit(args) {
    const xml = await getText(feedUrl(args?.feed_url));
    const feed = parseFeed(xml);
    const items = readItems(xml);
    const total = items.length;
    const pct = (n) => `${total ? Math.round((n / total) * 1000) / 10 : 0}%`;
    const checks = [
        ["a duration", items.filter((i) => i.seconds !== null).length],
        ["an enclosure length", items.filter((i) => i.size !== null).length],
        ["an enclosure MIME type", items.filter((i) => i.mime !== null).length],
        ["an explicit flag", items.filter((i) => i.explicit === "yes" || i.explicit === "no" || i.explicit === "true" || i.explicit === "false").length],
        ["a guid", items.filter((i) => i.guid.length > 0).length],
        ["a summary", items.filter((i) => i.summary.length > 0).length],
        ["artwork", items.filter((i) => Boolean(i.artwork)).length],
    ];
    const types = {};
    for (const item of items) {
        const key = item.episodeType || "not declared";
        types[key] = (types[key] ?? 0) + 1;
    }
    const lines = [
        `Feed audit for ${feed.title} — ${total} item(s) in the feed`,
        "",
        "Coverage, the way a directory grades a feed:",
    ];
    for (const [label, count] of checks)
        lines.push(`  ${label.padEnd(24)}${String(count).padStart(4)} of ${total}  (${pct(count)})`);
    lines.push("", "Episode types:");
    for (const [name, count] of Object.entries(types).sort((a, b) => b[1] - a[1]))
        lines.push(`  ${name.padEnd(14)}${count}`);
    const gaps = checks.filter(([, count]) => count < total);
    lines.push("", gaps.length ? "Gaps a directory would notice:" : "Nothing missing: every item carries all seven fields.");
    for (const [label, count] of gaps) {
        const missing = items.filter((i) => {
            if (label === "a duration")
                return i.seconds === null;
            if (label === "an enclosure length")
                return i.size === null;
            if (label === "an enclosure MIME type")
                return i.mime === null;
            if (label === "an explicit flag")
                return !["yes", "no", "true", "false"].includes(i.explicit);
            if (label === "a guid")
                return i.guid.length === 0;
            if (label === "a summary")
                return i.summary.length === 0;
            return !i.artwork;
        });
        lines.push(`  ${count === 0 ? "every item lacks" : `${total - count} item(s) lack`} ${label} — e.g. ${missing.slice(0, 3).map((i) => i.title.slice(0, 40)).join("; ")}`);
    }
    if (types.trailer || types.bonus)
        lines.push("", `Of ${total} item(s), ${(types.trailer ?? 0) + (types.bonus ?? 0)} are declared trailers or bonus episodes rather than the show itself.`);
    lines.push("", `Note: coverage is read from the feed's own tags, so an item that hides its duration in a media:content element counts as missing here.`);
    return lines.join("\n");
}
export async function audioProfile(args) {
    const xml = await getText(feedUrl(args?.feed_url));
    const feed = parseFeed(xml);
    const items = readItems(xml);
    const limit = Math.min(Math.max(Number(args?.limit ?? 10) || 10, 1), 30);
    const typed = {};
    for (const item of items) {
        const key = item.mime ?? "not declared";
        typed[key] = (typed[key] ?? 0) + 1;
    }
    const measurable = items.filter((i) => i.size !== null && i.seconds !== null && i.seconds > 0);
    const hours = items.reduce((sum, i) => sum + (i.seconds ?? 0), 0) / 3600;
    const totalBytes = items.reduce((sum, i) => sum + (i.size ?? 0), 0);
    const lines = [
        `Audio profile for ${feed.title} — ${items.length} item(s)`,
        `Declared audio carried by the feed: ${hours.toFixed(1)} hour(s), ${(totalBytes / 1e9).toFixed(2)} GB.`,
        "",
        "Declared MIME types:",
    ];
    for (const [name, count] of Object.entries(typed).sort((a, b) => b[1] - a[1]))
        lines.push(`  ${name.padEnd(22)}${count}`);
    if (!measurable.length) {
        lines.push("", "No item declares both a file size and a duration, so no bitrate can be computed from this feed.");
        lines.push("Note: bitrate needs enclosure length and itunes:duration on the same item.");
        return lines.join("\n");
    }
    const withBitrate = measurable.map((i) => ({
        ...i,
        kbps: Math.round(((i.size * 8) / i.seconds) / 1000),
    }));
    const sorted = [...withBitrate].sort((a, b) => a.kbps - b.kbps);
    const mid = Math.floor(sorted.length / 2);
    const median = sorted.length % 2 ? sorted[mid].kbps : Math.round((sorted[mid - 1].kbps + sorted[mid].kbps) / 2);
    lines.push("", `Implied bitrate across ${withBitrate.length} item(s) with both fields: median ${median} kbps, lowest ${sorted[0].kbps} kbps, highest ${sorted[sorted.length - 1].kbps} kbps.`);
    const outliers = withBitrate
        .filter((i) => median > 0 && Math.abs(i.kbps - median) / median >= 0.3)
        .sort((a, b) => Math.abs(b.kbps - median) - Math.abs(a.kbps - median));
    lines.push("", outliers.length ? `${outliers.length} bitrate outlier(s) against the show's own median:` : "No item sits 30% or more away from the median, so the encode is consistent.");
    for (const item of outliers.slice(0, 8)) {
        const share = Math.round(((item.kbps - median) / median) * 100);
        lines.push(`  ${item.kbps} kbps (${share > 0 ? "+" : ""}${share}%) ${String(Math.round(item.size / 1e6)).padStart(5)} MB  ${item.title.slice(0, 60)}`);
    }
    lines.push("", `The ${Math.min(limit, withBitrate.length)} most recent item(s), as the feed orders them:`);
    for (const item of withBitrate.slice(0, limit)) {
        const mb = (item.size / 1e6).toFixed(1);
        const minutes = Math.round(item.seconds / 60);
        lines.push(`  ${item.kbps.toString().padStart(5)} kbps  ${mb.padStart(6)} MB  ${String(minutes).padStart(4)} min  ${item.mime ?? "no type"}  ${item.title.slice(0, 50)}`);
    }
    lines.push("", "Note: bitrate is computed as declared enclosure bytes times eight over declared duration, so a wrong length attribute or a rounded duration shows up as an outlier here.");
    return lines.join("\n");
}
