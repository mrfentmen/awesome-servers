const m0 = (() => {
    const BASE = "https://api.urbandictionary.com/v0";
    const UA = "mrfentmen-urban-dictionary-mcp/1.0 (https://github.com/mrfentmen)";
    class UrbanError extends Error {
    }
    async function get(url) {
        const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
        if (res.status === 429)
            throw new UrbanError("Urban Dictionary rate limit hit, wait and retry");
        if (!res.ok)
            throw new UrbanError(`Urban Dictionary error ${res.status}`);
        return (await res.json());
    }
    function fmtEntry(e, i) {
        return `${i + 1}. ${e?.word ?? "Untitled"}\n   ${(e?.definition ?? "").slice(0, 300)}\n   Example: ${(e?.example ?? "").slice(0, 150)}${e?.author ? `\n   by ${e.author}` : ""}`;
    }
    async function define(args) {
        const term = (args.term ?? "").trim();
        if (!term)
            throw new UrbanError("Provide a term to look up");
        const limit = Math.min(args.limit ?? 3, 10);
        const d = await get(`${BASE}/define?term=${encodeURIComponent(term)}`);
        const list = d?.list ?? [];
        if (!list.length)
            return `No definitions for "${term}"`;
        return list.slice(0, limit).map(fmtEntry).join("\n\n");
    }
    async function random(args) {
        const d = await get(`${BASE}/random`);
        const list = d?.list ?? [];
        if (!list.length)
            return "No entries returned";
        return fmtEntry(list[0], 0);
    }
    return { UrbanError, define, random };
})();
const m1 = (() => {
    const BASE = "https://api.urbandictionary.com/v0";
    const UA = "mrfentmen-slang-dictionary-mcp/1.0 (https://github.com/mrfentmen)";
    class SlangError extends Error {
    }
    async function define(args) {
        const term = (args.term ?? "").trim();
        if (!term)
            throw new SlangError("Provide a term");
        const limit = Math.min(args.limit ?? 3, 10);
        const res = await fetch(`${BASE}/define?term=${encodeURIComponent(term)}`, {
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(20000),
        });
        if (!res.ok)
            throw new SlangError(`Urban Dictionary error ${res.status}`);
        const d = await res.json();
        const rows = (d.list ?? []).slice(0, limit);
        return rows.map((r, i) => `${term} (${i + 1}): ${(r.definition ?? "").replace(/\s+/g, " ").slice(0, 400)}\n  Example: ${(r.example ?? "").replace(/\s+/g, " ").slice(0, 200)}\n  ${r.thumbs_up ?? 0} up | ${r.thumbs_down ?? 0} down`).join("\n\n") || `No definitions for ${term}`;
    }
    return { SlangError, define };
})();
export const SlangError = m1.SlangError;
export const UrbanError = m0.UrbanError;
export const define = m0.define;
export const random = m0.random;
export const m0_random = m0.random;
export const m0_UrbanError = m0.UrbanError;
export const m0_define = m0.define;
export const m1_SlangError = m1.SlangError;
export const m1_define = m1.define;
// ---- muxC tools:
