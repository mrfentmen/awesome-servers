const m0 = (() => {
    const BASE = 'https://api.openbrewerydb.org/v1/breweries';
    async function search(args = {}) {
        const limit = Math.max(1, Math.min(args.limit ?? 10, 25));
        const params = new URLSearchParams({ per_page: String(limit) });
        if (args.query?.trim())
            params.set('by_name', args.query.trim());
        if (args.city?.trim())
            params.set('by_city', args.city.trim());
        const res = await fetch(`${BASE}?${params}`, {
            headers: { 'User-Agent': 'mrfentmen-openbrewery-mcp/1.0', Accept: 'application/json' },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new Error(`Open Brewery DB returned ${res.status}`);
        const rows = (await res.json());
        if (!rows.length)
            return 'No breweries found for that search.';
        return `Breweries (${rows.length} shown):\n` +
            rows
                .map((b, i) => {
                const city = b.city ? ` | ${b.city}, ${b.state ?? ''}` : '';
                const type = b.brewery_type ? ` | ${b.brewery_type}` : '';
                return `${i + 1}. ${b.name ?? 'untitled'}${type}${city}`;
            })
                .join('\n');
    }
    return { search };
})();
const m1 = (() => {
    const BASE = "https://api.openbrewerydb.org/v1/breweries";
    const UA = "mrfentmen-breweries-mcp/1.0 (https://github.com/mrfentmen)";
    class BreweryError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new BreweryError("OpenBreweryDB rate limit hit, wait and retry");
        if (!res.ok)
            throw new BreweryError(`OpenBreweryDB error ${res.status}`);
        return (await res.json());
    }
    function fmtB(b) {
        const parts = [b?.name ?? "Untitled", b?.brewery_type ? `(${b.brewery_type})` : ""].filter(Boolean).join(" ");
        const loc = [b?.city, b?.state_province, b?.country].filter(Boolean).join(", ");
        return `${parts}${loc ? `\n   ${loc}` : ""}${b?.website_url ? `\n   ${b.website_url}` : ""}`;
    }
    async function byCity(args) {
        const city = (args.city ?? "").trim();
        if (!city)
            throw new BreweryError("Provide a city name");
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`${BASE}?by_city=${encodeURIComponent(city)}&per_page=${limit}`);
        if (!d.length)
            return `No breweries in ${city}`;
        return d.map(fmtB).join("\n\n");
    }
    async function search(args) {
        const q = (args.query ?? "").trim();
        if (!q)
            throw new BreweryError("Provide a brewery name");
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`${BASE}?by_name=${encodeURIComponent(q)}&per_page=${limit}`);
        if (!d.length)
            return "No breweries found";
        return d.map(fmtB).join("\n\n");
    }
    async function byState(args) {
        const state = (args.state ?? "").trim();
        if (!state)
            throw new BreweryError("Provide a state name");
        const limit = Math.min(args.limit ?? 10, 25);
        const d = await get(`${BASE}?by_state=${encodeURIComponent(state)}&per_page=${limit}`);
        if (!d.length)
            return `No breweries in ${state}`;
        return d.map(fmtB).join("\n\n");
    }
    return { BreweryError, byCity, byState, search };
})();
export const BreweryError = m1.BreweryError;
export const byCity = m1.byCity;
export const byState = m1.byState;
export const search = m0.search;
export const m0_search = m0.search;
export const m1_search = m1.search;
export const m1_byState = m1.byState;
export const m1_BreweryError = m1.BreweryError;
export const m1_byCity = m1.byCity;
