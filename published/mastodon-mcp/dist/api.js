const DEFAULT = 'https://mastodon.social';
export async function instance(args) {
    const base = (args.domain ?? '').trim().replace(/\/$/, '') || DEFAULT;
    const res = await fetch(`${base}/api/v1/instance`, {
        headers: { 'User-Agent': 'mrfentmen-mastodon-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Mastodon returned ${res.status}`);
    const d = (await res.json());
    const s = (k) => (d[k] != null ? String(d[k]) : '');
    const stats = (d.stats && typeof d.stats === 'object' ? d.stats : {});
    const ss = (k) => (stats[k] != null ? String(stats[k]) : '');
    return [
        `${s('title')} (${s('uri') ?? base.replace('https://', '')})`,
        s('description') ? `Desc: ${s('description').slice(0, 150)}` : '',
        ss('user_count') ? `Users: ${ss('user_count')}` : '',
        ss('status_count') ? `Posts: ${ss('status_count')}` : '',
        s('version') ? `Version: ${s('version')}` : '',
    ].filter(Boolean).join('\n') || `No data for ${base}.`;
}
export async function trends(args) {
    const base = (args.domain ?? '').trim().replace(/\/$/, '') || DEFAULT;
    const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
    const res = await fetch(`${base}/api/v1/trends?limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-mastodon-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`Mastodon returned ${res.status}`);
    const rows = (await res.json());
    if (!rows.length)
        return `No trends on ${base}.`;
    return `Trending tags on ${base} (${rows.length} shown):\n` +
        rows
            .map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')}${s('history') && r.history?.[0] ? ` | ${r.history[0].uses ?? ''} posts` : ''}`;
        })
            .join('\n');
}
// ---- muxF tools:
/**
 * Two more public Mastodon endpoints: resolving a handle to a real account
 * across the fediverse, and reading a hashtag timeline, which is a different
 * question from what is trending right now.
 */
const MS_UA = { "User-Agent": "mrfentmen-mastodon-mcp/1.0", Accept: "application/json" };
function msBase(domain) {
    const base = (domain ?? "").trim().replace(/\/+$/, "");
    if (base && !/^https:\/\//i.test(base))
        return `https://${base}`;
    return base || DEFAULT;
}
async function msGet(url, what) {
    let res;
    try {
        res = await fetch(url, { headers: MS_UA, signal: AbortSignal.timeout(20000) });
    }
    catch (e) {
        throw new Error(`Network error talking to Mastodon: ${e.message}`);
    }
    if (res.status === 401 || res.status === 403)
        throw new Error(`Mastodon requires authentication for ${what} (${res.status}).`);
    if (res.status === 404)
        throw new Error(`Mastodon returned 404 for ${what}.`);
    if (!res.ok)
        throw new Error(`Mastodon returned ${res.status} for ${what}.`);
    const body = (await res.text()).trim();
    if (!body)
        throw new Error(`Mastodon returned an empty body for ${what}.`);
    return JSON.parse(body);
}
const msText = (value, max = 120) => String(value ?? "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .slice(0, max);
const msDate = (value) => {
    const stamp = Date.parse(String(value ?? ""));
    if (!Number.isFinite(stamp))
        return "not reported";
    const days = Math.round((Date.now() - stamp) / 86_400_000);
    return `${new Date(stamp).toISOString().slice(0, 10)} (${days} day(s) ago)`;
};
const msHost = (raw) => new URL(raw).host.replace(/^www\./, "");
const msLastStatus = (value) => {
    const seconds = Number(value);
    if (!Number.isFinite(seconds) || seconds <= 0)
        return "not reported";
    return msDate(new Date(seconds * 1000).toISOString());
};
const msCount = (value) => {
    const n = Number(value);
    return Number.isFinite(n) ? n : 0;
};
const msFlag = (value) => value === true ? "yes" : value === false ? "no" : "not reported";
export async function accountLookup(args = {}) {
    const raw = String(args.acct ?? "").trim().replace(/^@+/, "");
    if (!raw)
        throw new Error("Give a handle, for example Gargron@mastodon.social.");
    const at = raw.indexOf("@");
    const user = at === -1 ? raw : raw.slice(0, at);
    const domain = at === -1 ? "" : raw.slice(at + 1);
    if (!user)
        throw new Error(`"${raw}" has no account name before the @.`);
    const base = msBase(domain || args.instance);
    const acct = domain ? `${user}@${domain}` : user;
    const account = await msGet(`${base}/api/v1/accounts/lookup?acct=${encodeURIComponent(acct)}`, `the account @${acct}`);
    if (!account || !account.id)
        throw new Error(`Mastodon did not return an account for @${acct} on ${base}.`);
    const followers = msCount(account.followers_count);
    const following = msCount(account.following_count);
    const ratio = following ? Math.round((followers / following) * 100) / 100 : null;
    const kind = account.bot === true ? "bot" : account.locked === true ? "locked account" : "ordinary account";
    const fields = Array.isArray(account.fields) ? account.fields : [];
    const lines = [
        `@${String(account.acct ?? acct)} on ${msHost(String(account.url ?? base))}`,
        `${String(account.display_name ?? "").trim() || "(no display name)"} — ${kind}`,
        `Joined ${msDate(account.created_at)}`,
        `Posts ${msCount(account.statuses_count)} | Followers ${followers} | Following ${following}${ratio !== null ? ` | follower ratio ${ratio}x` : ""}`,
        `Last post ${msLastStatus(account.last_status_at)}`,
    ];
    if (account.note)
        lines.push(`Bio: ${msText(account.note, 200)}`);
    lines.push(`Flags: locked ${msFlag(account.locked)} | bot ${msFlag(account.bot)} | discoverable ${msFlag(account.discoverable)} | indexable ${msFlag(account.indexable)}`);
    if (account.limited === true || account.suspended === true || account.noindex === true) {
        lines.push(`Restricted: limited ${msFlag(account.limited)} | suspended ${msFlag(account.suspended)} | noindex ${msFlag(account.noindex)}`);
    }
    if (fields.length) {
        lines.push("", `Profile fields (${fields.length}):`);
        fields.slice(0, 8).forEach((f) => {
            lines.push(`  ${msText(f.name, 40)}: ${msText(f.value, 120)}`);
        });
    }
    const emojis = Array.isArray(account.emojis) ? account.emojis : [];
    if (emojis.length) {
        lines.push(`Custom emoji: ${emojis.slice(0, 12).map((e) => `:${e.shortcode}:`).join(" ")}${emojis.length > 12 ? ` (+${emojis.length - 12} more)` : ""}`);
    }
    return lines.join("\n");
}
export async function hashtagTimeline(args = {}) {
    const tag = String(args.tag ?? "").trim().replace(/^#+/, "");
    if (!tag)
        throw new Error("Give a hashtag, for example opensource.");
    const base = msBase(args.instance);
    const limit = Math.max(1, Math.min(Number(args.limit ?? 10) || 10, 20));
    const rows = await msGet(`${base}/api/v1/timelines/tag/${encodeURIComponent(tag)}?limit=${limit}`, `the #${tag} timeline on ${base}`);
    if (!Array.isArray(rows)) {
        throw new Error(`Mastodon returned ${typeof rows} instead of a list of posts for #${tag} on ${base}.`);
    }
    if (!rows.length) {
        return `No public post under #${tag} on ${base} right now. An instance that requires a login for tag timelines answers 401, which is reported as an error rather than as an empty tag.`;
    }
    const authors = new Map();
    const languages = new Map();
    const servers = new Map();
    let replies = 0;
    let boosts = 0;
    let withMedia = 0;
    const posts = [];
    for (const post of rows) {
        const boost = post?.reblog ?? null;
        const entry = boost ?? post;
        const account = entry?.account ?? {};
        const acct = String(account.acct ?? "unknown");
        authors.set(acct, (authors.get(acct) ?? 0) + 1);
        const lang = String(entry?.language ?? "und");
        languages.set(lang, (languages.get(lang) ?? 0) + 1);
        let host = "unknown";
        try {
            host = msHost(String(account.url ?? entry?.url ?? ""));
        }
        catch {
            host = String(account.acct ?? "").split("@")[1] ?? "unknown";
        }
        servers.set(host, (servers.get(host) ?? 0) + 1);
        if (boost)
            boosts += 1;
        if (post?.in_reply_to_id)
            replies += 1;
        if (Array.isArray(entry?.media_attachments) && entry.media_attachments.length)
            withMedia += 1;
        posts.push({
            acct,
            lang,
            boosted: Boolean(boost),
            text: msText(entry?.content, 140),
            at: msDate(entry?.created_at),
        });
    }
    const ranked = (map) => [...map.entries()].sort((a, b) => b[1] - a[1]);
    const lines = [
        `#${tag} on ${base} — ${rows.length} post(s) read`,
        `Replies ${replies} | boosts ${boosts} | with media ${withMedia}`,
        `Languages: ${ranked(languages).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ")}`,
        `Servers: ${ranked(servers).slice(0, 8).map(([k, v]) => `${k} ${v}`).join(", ")}`,
        `Most active: ${ranked(authors).slice(0, 5).map(([k, v]) => `@${k} (${v})`).join(", ")}`,
        "",
    ];
    posts.forEach((p, i) => {
        lines.push(`${i + 1}. @${p.acct}${p.boosted ? " [boost]" : ""} ${p.lang} ${p.at}`);
        if (p.text)
            lines.push(`   ${p.text}`);
    });
    return lines.join("\n");
}
