const ALL = "https://whiskyhunter.net/api/auctions_data/";
const UA = "mrfentmen-whiskyhunter-mcp/1.0 (https://github.com/mrfentmen)";
export class WhiskyhunterError extends Error {
}
async function getJson(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new WhiskyhunterError(`Not found (404): ${url}`);
    if (!res.ok)
        throw new WhiskyhunterError(`WhiskyHunter returned ${res.status}`);
    const d = (await res.json());
    if (!Array.isArray(d))
        throw new WhiskyhunterError("Unexpected response shape from WhiskyHunter");
    return d;
}
let cache = null;
/** WhisyHunter's full dataset is ~2,000 monthly records; cache it for the session. */
async function allRecords() {
    if (cache && Date.now() - cache.at < 300000)
        return cache.records;
    const records = await getJson(ALL);
    cache = { at: Date.now(), records };
    return records;
}
const money = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : "—";
};
const num = (v) => {
    const n = Number(v);
    return Number.isFinite(n) ? n.toLocaleString() : "—";
};
const bySlug = (a, slug) => !slug || (a.auction_slug ?? "").toLowerCase() === slug.trim().toLowerCase();
function recordLine(r, i, showDate = true) {
    const pre = i === undefined ? "" : `${i + 1}. `;
    const head = showDate ? `${r.dt ?? "?"} — ${r.auction_name ?? r.auction_slug ?? "?"}` : (r.auction_name ?? r.auction_slug ?? "?");
    return `${pre}${head}\n   mean winning bid ${money(r.winning_bid_mean)} | trading volume ${money(r.auction_trading_volume)} | ${num(r.auction_lots_count)} lot(s)`;
}
export async function auctions(args) {
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 40);
    const slug = (args.auction ?? "").trim();
    const all = await allRecords();
    const list = all.filter((a) => bySlug(a, slug || undefined));
    if (!list.length) {
        const slugs = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12);
        return slug
            ? `No auction data for "${slug}". Known slugs include: ${slugs.join(", ")}`
            : "No auction data returned.";
    }
    const recent = [...list].sort((a, b) => String(b.dt ?? "").localeCompare(String(a.dt ?? "")));
    return (`Whisky auction results${slug ? ` for ${slug}` : ""} — latest ${Math.min(limit, recent.length)} of ${recent.length} monthly record(s):\n\n` +
        recent.slice(0, limit).map((r, i) => recordLine(r, i)).join("\n\n"));
}
export async function auctionByDate(args) {
    const date = (args.date ?? "").trim();
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date))
        return "Provide a date as YYYY-MM-DD, e.g. '2024-09-01'.";
    const list = (await allRecords()).filter((a) => a.dt === date);
    if (!list.length)
        return `No auction results recorded on ${date}.`;
    const ranked = [...list].sort((a, b) => (b.auction_trading_volume ?? 0) - (a.auction_trading_volume ?? 0));
    const totalVolume = ranked.reduce((s, a) => s + (Number(a.auction_trading_volume) || 0), 0);
    return (`Whisky auctions on ${date} (${ranked.length}):\n` +
        `Combined trading volume: ${money(totalVolume)}\n\n` +
        ranked.map((r, i) => recordLine(r, i, false)).join("\n"));
}
export async function auctionSummary(args) {
    const slug = (args.auction ?? "").trim();
    const all = await allRecords();
    const list = all.filter((a) => bySlug(a, slug || undefined));
    if (!list.length)
        return `No auction data for "${slug}".`;
    const bids = list.map((a) => Number(a.winning_bid_mean)).filter(Number.isFinite);
    const volumes = list.map((a) => Number(a.auction_trading_volume)).filter(Number.isFinite);
    const lots = list.map((a) => Number(a.auction_lots_count)).filter(Number.isFinite);
    const dates = list.map((a) => String(a.dt ?? "")).filter(Boolean).sort();
    const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
    return [
        `${slug || "All whisky auctions"} — summary`,
        `Monthly records: ${list.length}`,
        `Date range: ${dates[0] ?? "?"} to ${dates[dates.length - 1] ?? "?"}`,
        `Mean winning bid: ${money(mean(bids))}`,
        `Highest mean winning bid: ${money(Math.max(...bids))}`,
        `Lowest mean winning bid: ${money(Math.min(...bids))}`,
        `Total trading volume: ${money(volumes.reduce((s, x) => s + x, 0))}`,
        `Average volume per month: ${money(mean(volumes))}`,
        `Total lots sold: ${num(lots.reduce((s, x) => s + x, 0))}`,
    ].join("\n");
}
export async function topAuctions(args) {
    const limit = Math.min(Math.max(Number(args.limit) || 10, 1), 31);
    const metric = args.metric ?? "volume";
    const all = await allRecords();
    const groups = new Map();
    for (const a of all) {
        const key = a.auction_slug ?? a.auction_name ?? "?";
        groups.set(key, [...(groups.get(key) ?? []), a]);
    }
    const sum = (xs) => xs.reduce((s, x) => s + x, 0);
    const rows = [...groups.entries()].map(([slug, records]) => {
        const volumes = records.map((r) => Number(r.auction_trading_volume)).filter(Number.isFinite);
        const bids = records.map((r) => Number(r.winning_bid_mean)).filter(Number.isFinite);
        const lots = records.map((r) => Number(r.auction_lots_count)).filter(Number.isFinite);
        const value = metric === "volume" ? sum(volumes) : metric === "lots" ? sum(lots) : bids.length ? sum(bids) / bids.length : 0;
        return { slug, name: records[0]?.auction_name ?? slug, value, months: records.length, volume: sum(volumes), meanBid: bids.length ? sum(bids) / bids.length : NaN };
    });
    rows.sort((a, b) => b.value - a.value);
    const label = metric === "volume" ? "total trading volume" : metric === "lots" ? "total lots sold" : "average mean winning bid";
    return (`Whisky auctions ranked by ${label}:\n` +
        rows
            .slice(0, limit)
            .map((r, i) => `${i + 1}. ${r.name} — ${metric === "mean_bid" ? money(r.value) : money(r.value)} | ${metric === "lots" ? `${num(r.value)} lots` : `vol ${money(r.volume)}`} | mean bid ${money(r.meanBid)} | ${r.months} month(s)`)
            .join("\n"));
}
/** Mean winning bid over time for one auction, or for the whole market. */
export async function marketTrend(args) {
    const points = Math.min(Math.max(Number(args.points) || 12, 1), 40);
    const slug = (args.auction ?? "").trim();
    const all = await allRecords();
    const list = all.filter((a) => bySlug(a, slug || undefined));
    if (!list.length)
        return `No auction data for "${slug}".`;
    const byMonth = new Map();
    for (const a of list) {
        const bid = Number(a.winning_bid_mean);
        if (!a.dt || !Number.isFinite(bid))
            continue;
        byMonth.set(a.dt, [...(byMonth.get(a.dt) ?? []), bid]);
    }
    const months = [...byMonth.entries()].sort((a, b) => a[0].localeCompare(b[0])).slice(-points);
    if (!months.length)
        return "No dated records for that selection.";
    return (`Mean winning bid by month — ${slug || "all whisky auctions"}:\n` +
        months.map(([dt, bids]) => `${dt} | ${money(bids.reduce((s, x) => s + x, 0) / bids.length)} (${bids.length} auction(s))`).join("\n"));
}
/** Mean winning bid and volume for each calendar month, averaged over all years. */
export async function seasonality(args) {
    const slug = (args.auction ?? "").trim();
    const all = await allRecords();
    const list = all.filter((a) => bySlug(a, slug || undefined));
    if (!list.length)
        return `No auction data for "${slug}".`;
    const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const bids = new Map();
    const volumes = new Map();
    const lots = new Map();
    let dated = 0;
    for (const a of list) {
        const month = Number(String(a.dt ?? "").slice(5, 7));
        if (!Number.isInteger(month) || month < 1 || month > 12)
            continue;
        dated += 1;
        const bid = Number(a.winning_bid_mean);
        if (Number.isFinite(bid))
            bids.set(month, [...(bids.get(month) ?? []), bid]);
        const volume = Number(a.auction_trading_volume);
        if (Number.isFinite(volume))
            volumes.set(month, [...(volumes.get(month) ?? []), volume]);
        const lot = Number(a.auction_lots_count);
        if (Number.isFinite(lot))
            lots.set(month, [...(lots.get(month) ?? []), lot]);
    }
    if (!dated)
        return "No dated records for that selection.";
    const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
    const ranked = MONTHS.map((label, i) => ({
        label,
        month: i + 1,
        months: bids.get(i + 1)?.length ?? 0,
        bid: mean(bids.get(i + 1) ?? []),
        volume: mean(volumes.get(i + 1) ?? []),
        lots: mean(lots.get(i + 1) ?? []),
    })).filter((row) => row.months > 0);
    const byMonth = MONTHS.map((label, i) => {
        const row = ranked.find((r) => r.month === i + 1);
        if (!row)
            return "";
        return `  ${label}: mean bid ${money(row.bid)} | avg volume ${money(row.volume)} | avg ${num(row.lots)} lot(s) over ${row.months} month(s)`;
    }).filter(Boolean);
    const best = [...ranked].sort((a, b) => b.bid - a.bid);
    return [
        `Whisky auction seasonality${slug ? ` — ${slug}` : " — all auctions"} (${dated} dated record(s)):`,
        ...byMonth,
        "",
        `Strongest month by mean winning bid: ${best[0].label} at ${money(best[0].bid)}`,
        best.length > 1 ? `Weakest month: ${best[best.length - 1].label} at ${money(best[best.length - 1].bid)}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
/** Side by side comparison of two or more auctions over the same period. */
export async function auctionCompare(args) {
    const wanted = String(args.auctions ?? "")
        .split(",")
        .map((s) => s.trim())
        .filter(Boolean);
    if (wanted.length < 2)
        return "Provide at least two comma separated auction slugs, e.g. 'whiskyauctioneer,scotchwhiskyauctions'.";
    const limit = Math.min(Math.max(Number(args.limit) || 12, 2), 30);
    const all = await allRecords();
    const blocks = [];
    const missing = [];
    for (const slug of wanted) {
        const list = all.filter((a) => bySlug(a, slug));
        if (!list.length) {
            missing.push(slug);
            continue;
        }
        const bids = list.map((a) => Number(a.winning_bid_mean)).filter(Number.isFinite);
        const volumes = list.map((a) => Number(a.auction_trading_volume)).filter(Number.isFinite);
        const lots = list.map((a) => Number(a.auction_lots_count)).filter(Number.isFinite);
        const dates = list.map((a) => String(a.dt ?? "")).filter(Boolean).sort();
        const recent = [...list].sort((a, b) => String(b.dt ?? "").localeCompare(String(a.dt ?? ""))).slice(0, limit);
        const mean = (xs) => (xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : NaN);
        blocks.push(`${list[0]?.auction_name ?? slug} (${slug})` +
            `\n   Records: ${list.length} | Range: ${dates[0] ?? "?"} to ${dates[dates.length - 1] ?? "?"}` +
            `\n   Mean winning bid: ${money(mean(bids))} | Highest: ${money(Math.max(...bids))}` +
            `\n   Total volume: ${money(volumes.reduce((s, x) => s + x, 0))} | Avg volume/month: ${money(mean(volumes))}` +
            `\n   Lots sold: ${num(lots.reduce((s, x) => s + x, 0))}` +
            `\n   Latest months:\n` +
            recent.map((r) => `      ${r.dt ?? "?"} | ${money(r.winning_bid_mean)} mean bid | ${money(r.auction_trading_volume)} volume`).join("\n"));
    }
    if (!blocks.length) {
        const slugs = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12);
        return `No auction data for any of those slugs. Known slugs include: ${slugs.join(", ")}`;
    }
    return [
        `Comparing ${blocks.length} whisky auction(s):`,
        "",
        blocks.join("\n\n"),
        missing.length ? `\nNo data for: ${missing.join(", ")}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
const metricOf = (records, metric) => {
    const values = records.map((r) => metric === "volume" ? Number(r.auction_trading_volume) : metric === "lots" ? Number(r.auction_lots_count) : Number(r.winning_bid_mean)).filter(Number.isFinite);
    if (!values.length)
        return NaN;
    // Volume and lots are totals for the month; the winning bid is an average.
    return metric === "mean_bid" ? values.reduce((s, x) => s + x, 0) / values.length : values.reduce((s, x) => s + x, 0);
};
const metricLabel = {
    volume: "trading volume",
    mean_bid: "mean winning bid",
    lots: "lots sold",
};
const pctChange = (previous, recent) => {
    if (!Number.isFinite(previous) || !Number.isFinite(recent))
        return "n/a";
    if (previous === 0)
        return recent === 0 ? "0%" : "new activity";
    const pct = ((recent - previous) / previous) * 100;
    return `${pct >= 0 ? "+" : ""}${pct.toFixed(1)}%`;
};
/**
 * Compares the most recent months against the months immediately before them,
 * so a direction ("the market is cooling") comes with a number behind it.
 */
export async function marketMomentum(args) {
    const slug = (args.auction ?? "").trim();
    const months = Math.min(Math.max(Math.trunc(Number(args.months) || 6), 1), 24);
    const all = await allRecords();
    const list = all.filter((a) => bySlug(a, slug || undefined));
    if (!list.length) {
        return slug ? `No auction data for "${slug}".` : "No auction data returned.";
    }
    const byMonth = new Map();
    for (const record of list) {
        const dt = String(record.dt ?? "");
        if (!/^\d{4}-\d{2}/.test(dt))
            continue;
        byMonth.set(dt, [...(byMonth.get(dt) ?? []), record]);
    }
    const dates = [...byMonth.keys()].sort();
    if (!dates.length)
        return "No dated records for that selection.";
    const recentDates = dates.slice(-months);
    const priorDates = dates.slice(-months * 2, -months);
    const gather = (keys) => keys.flatMap((key) => byMonth.get(key) ?? []);
    const recent = gather(recentDates);
    const prior = gather(priorDates);
    const metricOn = (metric, records) => metricOf(records, metric);
    const lines = ["mean_bid", "volume", "lots"].map((metric) => {
        const now = metricOn(metric, recent);
        const before = prior.length ? metricOn(metric, prior) : NaN;
        const direction = !Number.isFinite(before)
            ? "no earlier window to compare"
            : now > before
                ? "up"
                : now < before
                    ? "down"
                    : "flat";
        return `  ${metricLabel[metric]}: ${metric === "lots" ? num(now) : money(now)} vs ${Number.isFinite(before) ? (metric === "lots" ? num(before) : money(before)) : "—"} → ${pctChange(before, now)} (${direction})`;
    });
    const label = slug || "all whisky auctions";
    return [
        `Whisky market momentum — ${label}`,
        `Recent window: ${recentDates[0]} to ${recentDates[recentDates.length - 1]} (${recentDates.length} month(s))`,
        priorDates.length
            ? `Compare window: ${priorDates[0]} to ${priorDates[priorDates.length - 1]} (${priorDates.length} month(s))`
            : "Compare window: not enough earlier records in the dataset",
        "",
        ...lines,
        "",
        priorDates.length
            ? "Each metric is the recent window against the window before it, so the direction is a change in the market, not a single month's noise."
            : "Only one window of records exists for this selection, so no change can be measured yet.",
    ].join("\n");
}
/**
 * Who led the market in the last few months, on volume, lots or winning bid,
 * with each house's share of the volume traded in that window.
 */
export async function auctionLeaderboard(args) {
    const months = Math.min(Math.max(Math.trunc(Number(args.months) || 3), 1), 12);
    const metric = args.metric === "lots" || args.metric === "mean_bid" ? args.metric : "volume";
    const limit = Math.min(Math.max(Math.trunc(Number(args.limit) || 10), 1), 31);
    const all = await allRecords();
    if (!all.length)
        return "No auction data returned.";
    const dates = [...new Set(all.map((a) => String(a.dt ?? "")).filter((dt) => /^\d{4}-\d{2}/.test(dt)))].sort();
    if (!dates.length)
        return "No dated records in the dataset.";
    const window = new Set(dates.slice(-months));
    const inWindow = all.filter((a) => window.has(String(a.dt ?? "")));
    if (!inWindow.length)
        return `No records in the last ${months} recorded month(s).`;
    const groups = new Map();
    for (const record of inWindow) {
        const key = record.auction_slug ?? record.auction_name ?? "?";
        groups.set(key, [...(groups.get(key) ?? []), record]);
    }
    const rows = [...groups.entries()].map(([slug, records]) => ({
        slug,
        name: records[0]?.auction_name ?? slug,
        value: metricOf(records, metric),
        volume: metricOf(records, "volume"),
        lots: metricOf(records, "lots"),
        months: new Set(records.map((r) => String(r.dt ?? ""))).size,
    }));
    rows.sort((a, b) => (Number.isFinite(b.value) ? b.value : -Infinity) - (Number.isFinite(a.value) ? a.value : -Infinity));
    const totalVolume = rows.reduce((sum, row) => sum + (Number.isFinite(row.volume) ? row.volume : 0), 0);
    return [
        `Whisky auction leaderboard — last ${window.size} recorded month(s) (${[...window].sort()[0]} to ${[...window].sort().pop()}), ranked by ${metricLabel[metric]}`,
        "",
        ...rows.slice(0, limit).map((row, i) => {
            const share = totalVolume > 0 && Number.isFinite(row.volume) ? ` | ${Math.round((row.volume / totalVolume) * 100)}% of volume` : "";
            const value = metric === "lots" ? `${num(row.value)} lot(s)` : money(row.value);
            return `  ${i + 1}. ${row.name} (${row.slug}) — ${value} | volume ${money(row.volume)}${share} | ${row.months} month(s) in window`;
        }),
        "",
        `${rows.length} auction house(s) traded in this window; combined volume ${money(totalVolume)}.`,
        rows.length > limit ? `Showing the top ${limit}.` : "",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
/**
 * Two auction houses, month by month: who took more volume, more lots or the
 * higher winning bid, and the running tally.
 */
export async function slugHeadToHead(args) {
    const first = (args.a ?? "").trim();
    const second = (args.b ?? "").trim();
    if (!first || !second)
        return "Provide two auction slugs, e.g. a='whiskyauctioneer', b='scotchwhiskyauctions'.";
    if (first.toLowerCase() === second.toLowerCase())
        return "Give two different auction slugs to compare.";
    const months = Math.min(Math.max(Math.trunc(Number(args.months) || 12), 1), 40);
    const metric = args.metric === "lots" || args.metric === "mean_bid" ? args.metric : "volume";
    const all = await allRecords();
    const left = all.filter((a) => bySlug(a, first));
    const right = all.filter((a) => bySlug(a, second));
    if (!left.length || !right.length) {
        const known = [...new Set(all.map((a) => a.auction_slug))].filter(Boolean).slice(0, 12);
        const missing = !left.length ? first : second;
        return `No auction data for "${missing}". Known slugs include: ${known.join(", ")}`;
    }
    const common = [...new Set([...left, ...right].map((r) => String(r.dt ?? "")))]
        .filter((dt) => /^\d{4}-\d{2}/.test(dt))
        .sort()
        .slice(-months);
    let leftWins = 0;
    let rightWins = 0;
    let ties = 0;
    const lines = [];
    for (const dt of common) {
        const leftValue = metricOf(left.filter((r) => String(r.dt ?? "") === dt), metric);
        const rightValue = metricOf(right.filter((r) => String(r.dt ?? "") === dt), metric);
        const show = (value) => (Number.isFinite(value) ? (metric === "lots" ? num(value) : money(value)) : "—");
        let verdict = "tie";
        if (Number.isFinite(leftValue) && Number.isFinite(rightValue)) {
            if (leftValue > rightValue) {
                leftWins += 1;
                verdict = first;
            }
            else if (rightValue > leftValue) {
                rightWins += 1;
                verdict = second;
            }
            else {
                ties += 1;
            }
        }
        else {
            ties += 1;
        }
        lines.push(`  ${dt} | ${first} ${show(leftValue)} | ${second} ${show(rightValue)} → ${verdict}`);
    }
    const total = (records) => metricOf(records, metric);
    const leftTotal = total(left);
    const rightTotal = total(right);
    const overall = !Number.isFinite(leftTotal) || !Number.isFinite(rightTotal)
        ? "not comparable"
        : leftTotal > rightTotal
            ? first
            : rightTotal > leftTotal
                ? second
                : "tie";
    const showTotal = (value) => (Number.isFinite(value) ? (metric === "lots" ? num(value) : money(value)) : "—");
    return [
        `Head to head on ${metricLabel[metric]} — ${first} vs ${second}`,
        `Months compared: ${common.length}${common.length ? ` (${common[0]} to ${common[common.length - 1]})` : ""}`,
        "",
        ...lines,
        "",
        `Monthly wins: ${first} ${leftWins}, ${second} ${rightWins}, ties ${ties}.`,
        `All-time totals in the dataset: ${first} ${showTotal(leftTotal)} vs ${second} ${showTotal(rightTotal)} → ${overall}.`,
    ].join("\n");
}
const whIntl = (n) => n.toLocaleString(undefined, { maximumFractionDigits: 0 });
const whMoney = (n) => `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
/**
 * The market as a whole rather than any one house: how many lots and how much
 * value moved each year, what the market's own average hammer did, and how much of
 * each year the top five houses took. House-level trends cannot show this, because
 * a house can grow while the market it sells into shrinks.
 */
export async function marketStructure(args) {
    const years = Math.min(Math.max(Number(args?.years ?? 12) || 12, 3), 24);
    const records = await allRecords();
    if (!records.length)
        throw new WhiskyhunterError("WhiskyHunter returned no auction records to structure.");
    const allDates = records.map((r) => String(r.dt ?? "")).filter(Boolean).sort();
    const fromYear = new Date().getUTCFullYear() - years;
    const window = records.filter((r) => Number(String(r.dt ?? "").slice(0, 4)) >= fromYear);
    if (!window.length) {
        const last = allDates[allDates.length - 1] ?? "not reported";
        return `No records fall in the last ${years} years. The dataset's most recent record is ${last}, so a window that recent is empty rather than missing.`;
    }
    const byYear = new Map();
    for (const r of window) {
        const year = String(r.dt ?? "").slice(0, 4);
        if (!/^\d{4}$/.test(year))
            continue;
        const entry = byYear.get(year) ?? { year, lots: 0, volume: 0, hammerSum: 0, months: 0, houseLots: new Map() };
        const lots = Number(r.auction_lots_count ?? 0);
        entry.lots += lots;
        entry.volume += Number(r.auction_trading_volume ?? 0);
        entry.hammerSum += Number(r.winning_bid_mean ?? 0);
        entry.months += 1;
        const slug = String(r.auction_slug ?? "unknown");
        entry.houseLots.set(slug, (entry.houseLots.get(slug) ?? 0) + lots);
        byYear.set(year, entry);
    }
    const series = [...byYear.values()].sort((a, b) => a.year.localeCompare(b.year));
    if (!series.length)
        throw new WhiskyhunterError("No usable year values in the records.");
    const first = series[0];
    const last = series[series.length - 1];
    const maxLots = Math.max(...series.map((y) => y.lots));
    const concentration = series.map((y) => {
        const top5 = [...y.houseLots.values()].sort((a, b) => b - a).slice(0, 5).reduce((s, n) => s + n, 0);
        return { year: y.year, share: top5 / (y.lots || 1), houses: y.houseLots.size };
    });
    return [
        `Whisky auction market structure, ${first.year} to ${last.year}`,
        `  ${series.length} year(s) in the window, ${first.year} saw ${whIntl(first.lots)} lots and ${last.year} saw ${whIntl(last.lots)}`,
        `  lots ${last.lots >= first.lots ? "grew" : "fell"} ${Math.abs(((last.lots - first.lots) / (first.lots || 1)) * 100).toFixed(0)}% across the window; traded value ${last.volume >= first.volume ? "grew" : "fell"} ${Math.abs(((last.volume - first.volume) / (first.volume || 1)) * 100).toFixed(0)}%`,
        `  houses reporting in ${first.year}: ${concentration[0]?.houses ?? "?"} | in ${last.year}: ${concentration[concentration.length - 1]?.houses ?? "?"}`,
        "",
        "By year:",
        ...series.map((y) => {
            const mean = y.months ? y.hammerSum / y.months : 0;
            const conc = concentration.find((c) => c.year === y.year);
            return (`  ${y.year}  ${whIntl(y.lots).padStart(9)} lots  ${whMoney(y.volume).padStart(14)}  mean hammer ${whMoney(mean).padStart(8)}  ` +
                `${String(y.months).padStart(2)} month(s) reported  top five ${((conc?.share ?? 0) * 100).toFixed(0).padStart(3)}%  ${"#".repeat(Math.max(0, Math.round((y.lots / maxLots) * 26)))}`);
        }),
        "",
        "Concentration of lots in the five largest houses, by year:",
        ...concentration.map((c) => `  ${c.year}  ${(c.share * 100).toFixed(0).padStart(3)}%  ${"#".repeat(Math.round(c.share * 40))}`),
        "",
        "Read as: a market whose top five take a rising share is one where scale is being lost to consolidation, and a falling share means smaller houses are taking volume. The mean hammer here averages each house's monthly mean rather than weighting by lots, so a small house selling one expensive cask moves it as much as a large one selling hundreds, which is why it should be read beside the lots column and not on its own. Months reported differs year to year, so a year with fewer months is a thinner record rather than a quieter market.",
    ].join("\n");
}
/**
 * Volume against price. A house's mean hammer says what its bottles fetch; its
 * lots and traded value say whether it is a business or a boutique, and the two
 * orderings rarely agree.
 */
export async function liquidityProfile(args) {
    const months = Math.min(Math.max(Number(args?.months ?? 24) || 24, 3), 120);
    const limit = Math.min(Math.max(Number(args?.limit ?? 15) || 15, 1), 31);
    const records = await allRecords();
    if (!records.length)
        throw new WhiskyhunterError("WhiskyHunter returned no auction records to profile.");
    // WhiskyHunter stopped updating in late 2024, so a window anchored to today
    // is empty. The window is anchored to the newest record instead, and the
    // anchor is printed so nobody mistakes it for the present.
    const dates = records.map((r) => String(r.dt ?? "")).filter((d) => /^\d{4}-\d{2}-\d{2}$/.test(d)).sort();
    if (!dates.length)
        throw new WhiskyhunterError("WhiskyHunter returned records with no usable dates.");
    const latest = dates[dates.length - 1];
    const cutoff = new Date(`${latest}T00:00:00Z`);
    cutoff.setUTCMonth(cutoff.getUTCMonth() - months);
    const from = cutoff.toISOString().slice(0, 10);
    const window = records.filter((r) => {
        const dt = String(r.dt ?? "");
        return /^\d{4}-\d{2}-\d{2}$/.test(dt) && dt >= from;
    });
    if (!window.length)
        return `No records fall between ${from} and ${latest}, the dataset's newest record, so that window is empty rather than missing.`;
    const houses = new Map();
    for (const r of window) {
        const slug = String(r.auction_slug ?? "unknown");
        const entry = houses.get(slug) ?? { slug, name: r.auction_name ?? slug, lots: 0, volume: 0, hammerSum: 0, months: 0 };
        entry.lots += Number(r.auction_lots_count ?? 0) || 0;
        entry.volume += Number(r.auction_trading_volume ?? 0) || 0;
        entry.hammerSum += Number(r.winning_bid_mean ?? 0) || 0;
        entry.months += 1;
        houses.set(slug, entry);
    }
    const totalVolume = [...houses.values()].reduce((s, h) => s + h.volume, 0);
    const totalLots = [...houses.values()].reduce((s, h) => s + h.lots, 0);
    const ranked = [...houses.values()]
        .map((h) => ({
        ...h,
        meanHammer: h.months ? h.hammerSum / h.months : 0,
        perLot: h.lots ? h.volume / h.lots : 0,
        volumeShare: totalVolume ? h.volume / totalVolume : 0,
        lotShare: totalLots ? h.lots / totalLots : 0,
    }))
        .sort((a, b) => b.volume - a.volume);
    const byHammer = [...ranked].sort((a, b) => b.meanHammer - a.meanHammer).map((h) => h.slug);
    const rankOf = new Map(byHammer.map((slug, i) => [slug, i + 1]));
    const maxVolume = ranked[0]?.volume || 1;
    const lines = ranked.slice(0, limit).map((h, i) => {
        const move = rankOf.get(h.slug) - (i + 1);
        const verdict = h.lots >= totalLots / Math.max(ranked.length, 1) * 1.5 && h.meanHammer < ranked.reduce((s, x) => s + x.meanHammer, 0) / ranked.length
            ? "volume seller"
            : h.meanHammer > ranked.reduce((s, x) => s + x.meanHammer, 0) / ranked.length && h.lots < totalLots / Math.max(ranked.length, 1)
                ? "boutique"
                : "mid-market";
        return (`  ${String(i + 1).padStart(2)}. ${h.name.slice(0, 34).padEnd(34)} ${whIntl(h.lots).padStart(8)} lots  ` +
            `${whMoney(h.volume).padStart(13)}  ${whMoney(h.perLot).padStart(8)}/lot  ` +
            `${(h.volumeShare * 100).toFixed(1).padStart(5)}% of value  hammer rank ${String(rankOf.get(h.slug)).padStart(2)} (${move === 0 ? "same" : move > 0 ? `+${move}` : move})  ${verdict}\n      ${"#".repeat(Math.max(1, Math.round((h.volume / maxVolume) * 44)))}`);
    });
    const silent = ranked.filter((h) => h.lots === 0);
    return [
        `Whisky auction liquidity, ${months} months to ${latest} (${from} onward)`,
        `  ${window.length} monthly records from ${ranked.length} house(s)`,
        `  ${whIntl(totalLots)} lots traded for ${whMoney(totalVolume)}`,
        `  average per lot across the market ${whMoney(totalLots ? totalVolume / totalLots : 0)}`,
        "",
        "Ranked by traded value (hammer rank shows where the same house sits on price):",
        ...lines,
        "",
        silent.length ? `${silent.length} house(s) reported months with no lots at all: ${silent.slice(0, 8).map((h) => h.name).join(", ")}` : "Every house in the window reported lots in every month it appeared.",
        "",
        "note: value per lot divides traded value by lots, so a house that sells few expensive bottles and one that sells many cheap ones can land in the same place — read it beside the lots column. Hammer rank is the position by mean winning bid, and the bracketed move is how far that differs from the value rank, so a large positive move means the house is cheaper than its turnover suggests. A \"volume seller\" here means above-average lots at a below-average hammer, not a judgement on quality.",
    ].join("\n");
}
