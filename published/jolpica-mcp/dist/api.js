const m0 = (() => {
    const BASE = 'https://api.jolpi.ca/ergast/f1';
    async function current(_args) {
        const res = await fetch(`${BASE}/current.json`, {
            headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Jolpica returned ${res.status}`);
        const d = (await res.json());
        const mr = (d.MRData ?? {});
        const raceTable = (mr.RaceTable ?? {});
        const races = (raceTable.Races ?? []);
        return `F1 ${String(raceTable.season ?? 'current')} season (${races.length} races):\n` +
            races.slice(0, 10).map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                const c = (r.Circuit ?? {});
                return `${i + 1}. ${s('round')}. ${s('raceName')} | ${String(c.circuitName ?? '')} | ${s('date')}`;
            }).join('\n');
    }
    async function races(args) {
        const year = args.year ?? 'current';
        const res = await fetch(`${BASE}/${year}.json`, {
            headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Jolpica returned ${res.status}`);
        const d = (await res.json());
        const mr = (d.MRData ?? {});
        const rt = (mr.RaceTable ?? {});
        const races = (rt.Races ?? []);
        return `F1 ${String(rt.season ?? year)} race calendar:\n` +
            races.map((r, i) => {
                const s = (k) => (r[k] != null ? String(r[k]) : '');
                const c = (r.Circuit ?? {});
                return `${i + 1}. ${s('round')}. ${s('raceName')} | ${String(c.circuitName ?? '')} | ${s('date')}`;
            }).join('\n');
    }
    async function drivers(args) {
        const year = args.year ?? 'current';
        const res = await fetch(`${BASE}/${year}/drivers.json`, {
            headers: { 'User-Agent': 'mrfentmen-jolpica-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Jolpica returned ${res.status}`);
        const d = (await res.json());
        const mr = (d.MRData ?? {});
        const dt = (mr.DriverTable ?? {});
        const drivers = (dt.Drivers ?? []);
        return `F1 ${String(dt.season ?? year)} drivers (${drivers.length}):\n` +
            drivers.map((dr, i) => {
                const s = (k) => (dr[k] != null ? String(dr[k]) : '');
                return `${i + 1}. ${s('code')} ${s('givenName')} ${s('familyName')} (${s('nationality')})`;
            }).join('\n');
    }
    return { current, drivers, races };
})();
const m1 = (() => {
    const BASE = "https://api.jolpi.ca/ergast/f1";
    const UA = "mrfentmen-formula1-mcp/1.0 (https://github.com/mrfentmen)";
    class F1Error extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new F1Error("F1 API rate limit hit, wait and retry");
        if (!res.ok)
            throw new F1Error(`F1 API error ${res.status}`);
        return (await res.json());
    }
    async function lastRace(args) {
        const d = await get(`${BASE}/current/last/results/?format=json`);
        const race = d?.MRData?.RaceTable?.Races?.[0];
        if (!race)
            return "No race data";
        const results = (race.Results ?? []).slice(0, 10).map((r, i) => {
            const d2 = r?.Driver ?? {};
            const t = r?.Time?.time ?? "";
            return `${i + 1}. ${d2.givenName} ${d2.familyName} (${d2.code ?? ""})${t ? ` ${t}` : ""}`;
        });
        return `Race: ${race.raceName} | ${race.Circuit?.circuitName ?? ""}\nDate: ${race.date ?? ""}\n\n${results.join("\n")}`;
    }
    async function driverStandings(args) {
        const d = await get(`${BASE}/current/driverstandings/?format=json`);
        const standings = d?.MRData?.StandingsTable?.StandingsLists?.[0];
        if (!standings)
            return "No standings data";
        return (standings.DriverStandings ?? []).slice(0, 10).map((s, i) => {
            const dr = s?.Driver ?? {};
            return `${i + 1}. ${dr.givenName} ${dr.familyName} | ${s.points} pts | ${s.wins} wins | team ${s.Constructors?.[0]?.name ?? "n/a"}`;
        }).join("\n");
    }
    async function seasonSchedule(args) {
        const season = args.season ?? "current";
        const d = await get(`${BASE}/${season}/races/?format=json&limit=30`);
        const races = d?.MRData?.RaceTable?.Races ?? [];
        if (!races.length)
            return "No schedule data";
        return races.map((r) => `${r.round}. ${r.raceName} | ${r.date ?? ""} | ${r.Circuit?.circuitName ?? ""}`).join("\n");
    }
    return { F1Error, driverStandings, lastRace, seasonSchedule };
})();
export const F1Error = m1.F1Error;
export const current = m0.current;
export const driverStandings = m1.driverStandings;
export const drivers = m0.drivers;
export const lastRace = m1.lastRace;
export const races = m0.races;
export const seasonSchedule = m1.seasonSchedule;
export const m0_drivers = m0.drivers;
export const m0_races = m0.races;
export const m0_current = m0.current;
export const m1_seasonSchedule = m1.seasonSchedule;
export const m1_lastRace = m1.lastRace;
export const m1_driverStandings = m1.driverStandings;
export const m1_F1Error = m1.F1Error;
