const m0 = (() => {
    const UA = 'mrfentmen-tvmaze-mcp/1.0';
    async function search(args) {
        const query = (args.query ?? '').trim();
        if (!query)
            return 'Provide a show name.';
        const limit = Math.min(Math.max(Number(args.limit ?? 5) || 5, 1), 20);
        const res = await fetch(`https://api.tvmaze.com/search/shows?q=${encodeURIComponent(query)}`, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`TVMaze returned ${res.status}`);
        const d = (await res.json());
        if (!d.length)
            return `No shows for "${query}".`;
        return `TVMaze shows for "${query}":\n` +
            d.slice(0, limit).map((x, i) => {
                const s = x.show ?? {};
                return `${i + 1}. ${s.name ?? '?'} (${s.premiered?.slice(0, 4) ?? '?'}) | status: ${s.status ?? '?'} | genres: ${(s.genres ?? []).join(', ') || '?'} | rating: ${s.rating?.average ?? '?'}`;
            }).join('\n');
    }
    async function schedule(args) {
        const country = (args?.country ?? 'US').trim();
        const date = (args?.date ?? '').trim();
        const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 20);
        const url = date
            ? `https://api.tvmaze.com/schedule?country=${encodeURIComponent(country)}&date=${encodeURIComponent(date)}`
            : `https://api.tvmaze.com/schedule?country=${encodeURIComponent(country)}`;
        const res = await fetch(url, {
            headers: { 'User-Agent': UA, Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`TVMaze returned ${res.status}`);
        const d = (await res.json());
        if (!d.length)
            return 'No schedule entries found.';
        return `TVMaze schedule for ${country}${date ? ` on ${date}` : ''}: (${d.length} entries, showing ${Math.min(limit, d.length)})\n` +
            d.slice(0, limit).map((x, i) => `${i + 1}. ${x.show?.name ?? '?'} - ${x.name ?? '?'} (${x.airdate ?? '?'} ${x.airtime ?? '?'})`).join('\n');
    }
    return { schedule, search };
})();
const m1 = (() => {
    const BASE = "https://api.tvmaze.com";
    const UA = "mrfentmen-tv-maze-mcp/1.0 (https://github.com/mrfentmen)";
    class TvError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new TvError("TVMaze rate limit hit, wait and retry");
        if (!res.ok)
            throw new TvError(`TVMaze error ${res.status}`);
        return (await res.json());
    }
    async function searchShows(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new TvError("Provide a show name");
        const limit = Math.min(args.limit ?? 5, 15);
        const d = await get(`${BASE}/search/shows?q=${encodeURIComponent(q)}`);
        if (!d.length)
            return "No shows found";
        return d.slice(0, limit).map((r, i) => {
            const s = r?.show ?? {};
            return `${i + 1}. ${s.name ?? "Untitled"} (${s.premiered ? s.premiered.slice(0, 4) : "year n/a"}) | rating ${s.rating?.average ?? "n/a"}\n   ${s.genres?.length ? s.genres.join(", ") : ""} | id ${s.id}\n   ${s.summary ? s.summary.replace(/<[^>]+>/g, "").slice(0, 160) : "no summary"}`;
        }).join("\n\n");
    }
    async function showEpisodes(args) {
        const id = args.showId;
        if (id === undefined || id <= 0)
            throw new TvError("Provide a TVMaze show ID");
        const d = await get(`${BASE}/shows/${id}/episodes`);
        if (!d.length)
            return "No episodes found";
        return d.map((e) => `S${String(e.season).padStart(2, "0")}E${String(e.number).padStart(2, "0")} ${e.name} (${e.airdate ?? ""})`).join("\n");
    }
    async function todaySchedule(args) {
        const country = (args.country ?? "US").toUpperCase();
        const d = await get(`${BASE}/schedule?country=${encodeURIComponent(country)}`);
        if (!d.length)
            return "No schedule for today";
        return d.slice(0, 20).map((e, i) => `${i + 1}. ${e.show?.name ?? "Untitled"} | ${e.name ?? ""} | ${e.airtime ?? ""}`).join("\n");
    }
    return { TvError, searchShows, showEpisodes, todaySchedule };
})();
export const TvError = m1.TvError;
export const schedule = m0.schedule;
export const search = m0.search;
export const searchShows = m1.searchShows;
export const showEpisodes = m1.showEpisodes;
export const todaySchedule = m1.todaySchedule;
export const m0_schedule = m0.schedule;
export const m0_search = m0.search;
export const m1_todaySchedule = m1.todaySchedule;
export const m1_TvError = m1.TvError;
export const m1_showEpisodes = m1.showEpisodes;
export const m1_searchShows = m1.searchShows;
