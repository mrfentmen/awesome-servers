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
