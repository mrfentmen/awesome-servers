/**
 * CricAPI v1 client. Needs CRICAPI_API_KEY (free at https://cricapi.com/).
 * Docs: https://cricapi.com/api/
 */
const BASE = "https://api.cricapi.com/v1";
export class CricApiError extends Error {
}
function apiKey() {
    const k = process.env.CRICAPI_API_KEY;
    if (!k)
        throw new CricApiError("Set CRICAPI_API_KEY first (free at cricapi.com).");
    return k;
}
async function getJson(path, extra = {}) {
    const qs = new URLSearchParams({ ...extra, apikey: apiKey() }).toString();
    const res = await fetch(`${BASE}${path}?${qs}`, {
        headers: { "User-Agent": "cricapi-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new CricApiError("CricAPI refused (401/403). Check API key.");
    if (!res.ok)
        throw new CricApiError(`CricAPI error ${res.status}`);
    const data = (await res.json());
    if (data.status === "failure")
        throw new CricApiError(`CricAPI: ${String(data.reason ?? "failed").slice(0, 160)}`);
    return data;
}
export async function currentMatches(limit = 5) {
    const data = await getJson("/currentMatches", { offset: "0" });
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map(toMatch);
}
const toMatch = (m) => {
    const scores = Array.isArray(m.score) ? m.score : [];
    const score = scores.map((s) => `${s.inning ?? ""} ${s.r ?? 0}/${s.w ?? 0}${s.o ? ` (${s.o} ov)` : ""}`).join(", ").trim();
    return {
        id: m.id,
        name: m.name,
        status: m.status,
        date: m.date ? String(m.date).slice(0, 10) : undefined,
        venue: m.venue,
        score: score || undefined,
    };
};
export async function matchInfo(id) {
    if (!id.trim())
        throw new CricApiError("Match id is empty.");
    const data = await getJson(`/cricket/${encodeURIComponent(id.trim())}`);
    return toMatch((data.data ?? {}));
}
export async function searchSeries(query, limit = 5) {
    if (!query.trim())
        throw new CricApiError("Query is empty.");
    const data = await getJson(`/series?search=${encodeURIComponent(query.trim())}&offset=0`);
    const rows = Array.isArray(data.data) ? data.data : [];
    return rows.slice(0, limit).map((s) => `[${String(s.id ?? "?")}] ${String(s.name ?? "?")}${s.startDate ? ` (${String(s.startDate).slice(0, 10)})` : ""}`);
}
export function formatMatch(m, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}${m.name ?? "(unnamed)"}${m.status ? ` [${m.status}]` : ""}${m.score ? `\n   ${m.score}` : ""}${m.date ? `\n   ${m.date}${m.venue ? ` at ${m.venue}` : ""}` : ""}`;
}
// ---- muxB tools:
const ESPN = "https://site.web.api.espn.com/apis/site/v2";
async function espnGet(path) {
    const res = await fetch(`${ESPN}${path}`, {
        headers: { "User-Agent": "cricapi-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new CricApiError(`ESPNcricinfo has nothing at ${path}. Check the id, they are their own numbers and differ from CricAPI ids.`);
    if (!res.ok)
        throw new CricApiError(`ESPNcricinfo returned ${res.status} for ${path}.`);
    return (await res.json());
}
async function espnSeriesId(series) {
    const given = String(series ?? "").trim();
    if (/^\d+$/.test(given))
        return { id: given, name: `series ${given}` };
    if (!given) {
        throw new CricApiError("Give an ESPNcricinfo series id (the number at the end of a cricinfo.com/series/... url) or a competition name to look up.");
    }
    const data = (await espnGet("/leagues/dropdown?region=us&lang=en&contentorigin=espn&sport=cricket&limit=500"));
    const rows = Array.isArray(data.leagues) ? data.leagues : [];
    const ql = given.toLowerCase();
    const hit = rows.find((l) => (l.name ?? "").toLowerCase() === ql || (l.abbreviation ?? "").toLowerCase() === ql) ?? rows.find((l) => (l.name ?? "").toLowerCase().includes(ql));
    if (!hit) {
        throw new CricApiError(`No competition in ESPNcricinfo's catalogue of ${rows.length} entries matches "${given}". Pass the numeric series id from a cricinfo.com series url instead.`);
    }
    return { id: String(hit.id), name: String(hit.name ?? given), searched: given };
}
function espnLink(e) {
    for (const l of e.links ?? [])
        if (l.href && l.href.includes("/series/"))
            return l.href;
    return `https://www.espncricinfo.com/series/_/game/${e.id ?? "?"}`;
}
export async function seriesFixtures(args) {
    const target = await espnSeriesId(args.series);
    const qs = new URLSearchParams({ limit: String(Math.min(Math.max(Number(args.limit ?? 20), 1), 200)) });
    if (args.year !== undefined && Number.isFinite(args.year))
        qs.set("dates", String(Math.round(args.year)));
    const data = (await espnGet(`/sports/cricket/${target.id}/scoreboard?${qs.toString()}`));
    const league = (data.leagues ?? [])[0];
    const events = Array.isArray(data.events) ? data.events : [];
    if (events.length === 0) {
        return `${league?.name ?? target.name} (series ${target.id}) has no matches${args.year ? ` for ${args.year}` : ""} in ESPNcricinfo's schedule.`;
    }
    const out = [
        `${league?.name ?? target.name} (series ${target.id}): ${events.length} match(es)${args.year ? ` for ${args.year}` : ""}.`,
    ];
    for (const e of events.slice(0, 40)) {
        const c = (e.competitions ?? [])[0];
        const state = e.status?.type?.state ?? "unknown";
        const label = e.status?.type?.description ?? e.status?.type?.detail ?? "status not reported";
        const teams = (c?.competitors ?? [])
            .map((t) => `${t.homeAway === "home" ? "" : "@"}${t.team?.displayName ?? "?"} ${t.score ?? "no score"}`)
            .join("  v  ");
        out.push(`  ${String(e.date ?? "?").slice(0, 10)}  ${e.name ?? "(unnamed)"}`);
        const suffix = state === "in" ? ", in progress" : state === "pre" ? ", not started" : "";
        out.push(`     ${teams}  [${label}${suffix}]`);
        if (c?.venue?.fullName)
            out.push(`     at ${c.venue.fullName}`);
        out.push(`     ${espnLink(e)}`);
    }
    if (events.length > 40)
        out.push(`  ...and ${events.length - 40} more.`);
    return out.join("\n");
}
export async function seriesStandings(args) {
    const target = await espnSeriesId(args.series);
    const data = (await espnGet(`/sports/cricket/${target.id}/scoreboard?limit=1`));
    const league = (data.leagues ?? [])[0];
    const table = Array.isArray(data.standings) ? data.standings : [];
    if (table.length === 0) {
        return `${league?.name ?? target.name} (series ${target.id}) has no standings table. Not every format keeps one; a Test series is the usual reason.`;
    }
    const columns = [];
    const out = [`${league?.name ?? target.name} (series ${target.id}) standings, ${table.length} team(s).`, ""];
    for (const row of table) {
        const stats = Array.isArray(row.stats) ? row.stats : [];
        for (const s of stats) {
            const label = String(s.displayName ?? s.name ?? "?");
            if (!columns.includes(label) && row.team)
                columns.push(label);
        }
        const cells = stats.map((s) => `${s.displayName ?? s.name ?? "?"} ${s.displayValue ?? s.value ?? "not reported"}`);
        out.push(`  ${row.team?.displayName ?? "(unknown team)"}${row.team?.abbreviation ? ` [${row.team.abbreviation}]` : ""}: ${cells.join(", ") || "no stats reported"}`);
    }
    return out.join("\n");
}
