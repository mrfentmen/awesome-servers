/**
 * The Odds API v4 client. Needs THEODDS_API_KEY
 * (free at https://the-odds-api.com/, 500 calls/month).
 * Docs: https://the-odds-api.com/liveapi/guides/v4/
 */
const BASE = "https://api.the-odds-api.com/v4";
export class OddsError extends Error {
}
function apiKey() {
    const k = process.env.THEODDS_API_KEY;
    if (!k)
        throw new OddsError("Set THEODDS_API_KEY first (free at the-odds-api.com).");
    return k;
}
async function getJson(path, extra = {}) {
    const qs = new URLSearchParams({ ...extra, apiKey: apiKey() }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "theoddsapi-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new OddsError("Odds API refused (401/403). Check API key.");
    if (res.status === 422)
        throw new OddsError("Odds API: bad request (check sport key). Quota info in x-requests headers.");
    if (!res.ok)
        throw new OddsError(`Odds API error ${res.status}`);
    return (await res.json());
}
const PRICE_FORMATS = ["decimal", "fractional", "american"];
function toDecimal(raw, format) {
    const t = String(raw ?? "").trim();
    if (!t)
        throw new OddsError("Empty price in the list.");
    const kind = format === "fractional" || (format !== "decimal" && t.includes("/"))
        ? "fractional"
        : format === "american" || (format !== "decimal" && /^[+-]\d+$/.test(t))
            ? "american"
            : "decimal";
    if (kind === "fractional") {
        const [a, b] = t.split("/").map((s) => Number(s.trim()));
        if (!Number.isFinite(a) || !Number.isFinite(b) || b <= 0 || a <= 0)
            throw new OddsError(`"${t}" is not a fractional price; they look like 5/2.`);
        return 1 + a / b;
    }
    if (kind === "american") {
        const n = Number(t.replace(/^\+/, ""));
        if (!Number.isFinite(n) || n === 0 || Math.abs(n) < 100)
            throw new OddsError(`"${t}" is not an American price; they look like -150 or +220, and 100 is the shortest legal price.`);
        return n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
    }
    const n = Number(t);
    if (!Number.isFinite(n) || n <= 1)
        throw new OddsError(`"${t}" is not a decimal price; anything at or below 1.00 pays no profit.`);
    return n;
}
const pct = (n, digits = 2) => `${(n * 100).toFixed(digits)}%`;
/**
 * Prices to probabilities, with the margin separated from the opinion. The
 * de-vigged column is the one to compare across books.
 */
export async function impliedProbability(args) {
    const raw = String(args?.odds ?? "").trim();
    if (!raw)
        throw new OddsError("Give at least two comma-separated prices, e.g. '2.10,3.40,3.90'.");
    const format = String(args?.format ?? "decimal").trim().toLowerCase();
    if (!PRICE_FORMATS.includes(format))
        throw new OddsError(`format must be one of ${PRICE_FORMATS.join(", ")}.`);
    const prices = raw.split(/[,\n;]+/).map((s) => s.trim()).filter(Boolean);
    if (prices.length < 2)
        throw new OddsError("A market needs at least two prices; one price cannot show a margin.");
    if (prices.length > 12)
        throw new OddsError("That is more than 12 outcomes; paste one market at a time.");
    const rows = prices.map((p) => {
        const decimal = toDecimal(p, format);
        return { input: p, decimal, implied: 1 / decimal };
    });
    const sum = rows.reduce((a, r) => a + r.implied, 0);
    const overround = sum - 1;
    const lines = [
        `Implied probabilities from ${rows.length} ${format} price(s)`, "",
        "  price        decimal    implied    fair (margin removed)",
        ...rows.map((r) => `  ${r.input.padEnd(11)} ${r.decimal.toFixed(3).padStart(7)}   ${pct(r.implied, 1).padStart(7)}    ${pct(r.implied / sum, 1).padStart(7)}`),
        "",
        `  sum of implied   ${pct(sum, 2)}`,
        overround >= 0
            ? `  bookmaker margin ${pct(overround, 2)} — the book keeps this if the stakes are balanced`
            : `  ARBITRAGE       the prices sum below 100%, so backing every outcome to return the same amount locks in ${pct(-overround, 2)}`, "",
    ];
    if (overround < 0) {
        lines.push("  Equal-return stakes on a 100 unit outlay:");
        for (const r of rows)
            lines.push(`    ${r.input.padEnd(11)} ${((r.implied / sum) * 100).toFixed(2).padStart(7)} units`);
        lines.push("");
    }
    lines.push("note: this is arithmetic on one set of prices. It cannot tell you whether the market is right, and an apparent arbitrage usually means a stale price, a limit on the stake, or a book that will not settle both sides.");
    return lines.join("\n");
}
/**
 * Your probabilities against the price, with Kelly sizing and the spread of
 * outcomes that the expected value alone hides.
 */
export async function expectedValue(args) {
    const raw = String(args?.bets ?? "").trim();
    if (!raw)
        throw new OddsError("Give at least one bet per line as 'probability,decimal-price', e.g. '0.55,2.10'.");
    const bankroll = Number(args?.bankroll ?? 100);
    if (!Number.isFinite(bankroll) || bankroll <= 0)
        throw new OddsError("bankroll must be a positive amount.");
    const fraction = Number(args?.kelly_fraction ?? 0.25);
    if (!Number.isFinite(fraction) || fraction < 0 || fraction > 1)
        throw new OddsError("kelly_fraction is a share of full Kelly, so it must be between 0 and 1 (0.25 is a quarter Kelly).");
    const bets = raw.split(/\n+/).map((l) => l.trim()).filter(Boolean).map((line, i) => {
        const parts = line.split(/[,\s]+/).filter(Boolean);
        if (parts.length !== 2)
            throw new OddsError(`Bet ${i + 1} ("${line}") is not 'probability,price'.`);
        const p = Number(parts[0]);
        const price = Number(parts[1]);
        if (!Number.isFinite(p) || p <= 0 || p >= 1)
            throw new OddsError(`Bet ${i + 1}: probability must be strictly between 0 and 1, got ${parts[0]}.`);
        if (!Number.isFinite(price) || price <= 1)
            throw new OddsError(`Bet ${i + 1}: decimal price must be above 1.00, got ${parts[1]}.`);
        return { line, p, price };
    });
    if (bets.length > 30)
        throw new OddsError("That is more than 30 bets; split them into batches.");
    const sized = bets.map((b) => {
        const edge = b.p * b.price - 1;
        const fullKelly = edge > 0 ? edge / (b.price - 1) : 0;
        const stake = bankroll * fraction * fullKelly;
        return { ...b, edge, fullKelly, stake, ev: stake * edge };
    });
    const totalStake = sized.reduce((a, b) => a + b.stake, 0);
    const totalEv = sized.reduce((a, b) => a + b.ev, 0);
    const variance = sized.reduce((a, b) => a + b.p * (1 - b.p) * (b.stake * b.price) ** 2, 0);
    const sd = Math.sqrt(variance);
    const lines = [
        `Expected value across ${sized.length} bet(s), bankroll ${bankroll.toFixed(2)}, staking ${pct(fraction, 0)} of full Kelly`, "",
        "  probability  price   edge      full Kelly  stake      EV",
        ...sized.map((b) => `  ${b.p.toFixed(3).padStart(11)}  ${b.price.toFixed(2).padStart(6)}  ${pct(b.edge, 1).padStart(7)}  ${pct(b.fullKelly, 1).padStart(10)}  ${b.stake.toFixed(2).padStart(8)}  ${b.ev.toFixed(2).padStart(8)}`),
        "",
        `  total staked     ${totalStake.toFixed(2)} (${pct(bankroll ? totalStake / bankroll : 0, 1)} of the bankroll)`,
        `  expected profit  ${totalEv.toFixed(2)}`,
        `  outcome spread   standard deviation ${sd.toFixed(2)} around that expectation`,
    ];
    const negatives = sized.filter((b) => b.edge <= 0);
    if (negatives.length)
        lines.push("", `  ${negatives.length} bet(s) price no value at your probability and are staked at zero: ${negatives.map((b) => b.line).join("; ")}`);
    lines.push("", "note: the edge is only as good as the probability you supplied — the arithmetic cannot check it. The standard deviation assumes the bets settle independently; correlated bets (the same team in two markets) make the real spread wider than this.");
    return lines.join("\n");
}
export async function listSports() {
    const rows = await getJson("/sports");
    return rows.slice(0, 40).map((s) => ({ key: String(s.key), title: s.title, group: s.group }));
}
export async function gameOdds(sport, limit = 5) {
    if (!sport.trim())
        throw new OddsError("Sport key is empty (use list_sports).");
    const rows = await getJson(`/sports/${encodeURIComponent(sport.trim())}/odds?regions=us&markets=h2h&oddsFormat=decimal`);
    return rows.slice(0, limit).map((g) => {
        const books = Array.isArray(g.bookmakers) ? g.bookmakers : [];
        return {
            home: g.home_team,
            away: g.away_team,
            start: g.commence_time ? String(g.commence_time).slice(0, 16).replace("T", " ") : undefined,
            books: books.slice(0, 5).map((b) => {
                const mkts = Array.isArray(b.markets) ? b.markets : [];
                const outs = Array.isArray(mkts[0]?.outcomes) ? mkts[0].outcomes : [];
                const prices = outs.map((o) => `${o.name ?? "?"} ${o.price ?? "?"}`).join(", ");
                return `${b.title ?? b.key ?? "?"}: ${prices || "no lines"}`;
            }),
        };
    });
}
export function formatGame(g, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}${g.away ?? "?"} at ${g.home ?? "?"}${g.start ? ` — ${g.start}` : ""}`,
        ...g.books.map((b) => `   ${b}`),
    ];
    return lines.join("\n");
}
// ---- muxG tools:
const ODDS_OPENLIGADB = "https://api.openligadb.de";
const ODDS_LIST_CAP = 10;
function oddsBound(value, min, max, fallback) {
    const n = Number(value);
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(Math.floor(n), max));
}
/** Accept decimal, fractional and American, because a price arrives in whichever one the book quotes. */
function oddsToDecimal(value, format) {
    const f = format.toLowerCase();
    if (f === "fractional" || f === "uk") {
        // e.g. 5/2 -> 3.5
        const text = String(value);
        const m = /^(-?\d+(?:\.\d+)?)\s*\/\s*(-?\d+(?:\.\d+)?)$/.exec(text);
        if (m) {
            const num = Number(m[1]);
            const den = Number(m[2]);
            if (den === 0)
                throw new OddsError(`Fractional odds "${text}" has a zero denominator.`);
            return { decimal: 1 + num / den, label: text };
        }
        throw new OddsError(`"${text}" is not fractional odds. They look like 5/2 or 1/1, not 2.5.`);
    }
    if (f === "american" || f === "us") {
        const n = Number(value);
        if (!Number.isFinite(n) || n === 0)
            throw new OddsError(`American odds "${value}" must be a non-zero number, e.g. -150 or +200.`);
        const decimal = n > 0 ? 1 + n / 100 : 1 + 100 / Math.abs(n);
        return { decimal, label: n > 0 ? `+${Math.round(n)}` : String(Math.round(n)) };
    }
    const decimal = Number(value);
    if (!Number.isFinite(decimal))
        throw new OddsError(`"${value}" is not a decimal price.`);
    if (decimal <= 1)
        throw new OddsError(`A decimal price of ${decimal} means no possible profit. Decimal prices must be greater than 1.000, which is an even-money price.`);
    return { decimal, label: decimal.toFixed(3).replace(/0+$/, "") };
}
function oddsImplied(decimal) {
    return 1 / decimal;
}
function olGoals(m, side) {
    const key = side === 1 ? "team1" : "team2";
    const r = m.matchResults?.[0]?.[side === 1 ? "resultsTeam1" : "resultsTeam2"];
    if (r?.goals !== undefined)
        return r.goals;
    return m[key]?.goals ?? null;
}
/** Real fixtures with real recent form, which is the input a price has to be judged against. */
export async function fixtureForm(args) {
    const league = String(args?.league ?? "bl1").trim().toLowerCase();
    if (!/^[a-z0-9]{2,10}$/.test(league))
        throw new OddsError(`"${league}" is not an OpenLigaDB league shortcut such as bl1, bl2 or fl2.`);
    const limit = oddsBound(args?.limit, 1, ODDS_LIST_CAP, 6);
    const formCount = oddsBound(args?.form, 1, 10, 5);
    const res = await fetch(`${ODDS_OPENLIGADB}/getmatchdata/${league}`, {
        headers: { "User-Agent": "awesome-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 404)
        throw new OddsError(`OpenLigaDB has no league with the shortcut "${league}". Known shortcuts include bl1, bl2, bl3 and fl1.`);
    if (!res.ok)
        throw new OddsError(`OpenLigaDB returned ${res.status} for ${league}.`);
    const matches = (await res.json());
    if (!Array.isArray(matches) || !matches.length)
        throw new OddsError(`OpenLigaDB returned no matches for ${league}.`);
    const now = Date.now();
    const finished = matches.filter((m) => m.matchIsFinished);
    const upcoming = matches
        .filter((m) => !m.matchIsFinished && Date.parse(m.matchDateTimeUTC ?? m.matchDateTime ?? "") >= now)
        .sort((a, b) => Date.parse(a.matchDateTimeUTC ?? a.matchDateTime ?? "") - Date.parse(b.matchDateTimeUTC ?? b.matchDateTime ?? ""));
    const formFor = (name) => {
        const out = { played: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0 };
        for (const m of finished) {
            const home = m.team1?.teamName;
            const away = m.team2?.teamName;
            const isHome = home === name;
            const isAway = away === name;
            if (!isHome && !isAway)
                continue;
            const mine = isHome ? olGoals(m, 1) : olGoals(m, 2);
            const theirs = isHome ? olGoals(m, 2) : olGoals(m, 1);
            if (mine === null || theirs === null)
                continue;
            out.played += 1;
            out.gf += mine;
            out.ga += theirs;
            if (mine > theirs)
                out.w += 1;
            else if (mine < theirs)
                out.l += 1;
            else
                out.d += 1;
        }
        return out;
    };
    const fmt = (f) => {
        if (!f.played)
            return "no finished matches with a score in this league's data";
        const gd = f.gf - f.ga;
        return `${f.w}W ${f.d}D ${f.l}L, ${f.gf} scored, ${f.ga} conceded, goal difference ${gd >= 0 ? "+" : ""}${gd}`;
    };
    return [
        `Fixtures and form for ${matches[0]?.leagueName ?? league} (OpenLigaDB, keyless)`,
        `${matches.length} match(es) in the data: ${finished.length} finished, ${upcoming.length} still to play, ${matches.length - finished.length - upcoming.length} in the past and not yet flagged finished`,
        "",
        `Next ${Math.min(limit, upcoming.length)} fixture(s), with each team's record in this league's finished matches:`,
        ...upcoming.slice(0, limit).map((m) => {
            const h = m.team1?.teamName ?? "home";
            const a = m.team2?.teamName ?? "away";
            const when = (m.matchDateTimeUTC ?? m.matchDateTime ?? "").replace("T", " ").replace(/\+.*$/, "").replace("Z", " UTC");
            return [
                `  ${when}  ${h} v ${a}${m.group?.groupName ? `  (${m.group.groupName})` : ""}`,
                `    ${h}: ${fmt(formFor(h))}`,
                `    ${a}: ${fmt(formFor(a))}`,
            ].join("\n");
        }),
        "",
        "This is one league and it carries no prices, so it cannot tell you what to back. It tells you what the teams have actually been doing, which is the input a price has to be checked against, and the two together are worth more than either alone.",
        "Record here covers only this league's own finished matches, so a promoted side and a Champions League side will look very different from their real strength.",
    ]
        .filter(Boolean)
        .join("\n");
}
