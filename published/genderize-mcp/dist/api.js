const BASE = 'https://api.genderize.io';
export async function gender(args) {
    const name = (args.name ?? '').trim();
    if (!name)
        return 'Provide a first name.';
    const res = await fetch(`${BASE}?name=${encodeURIComponent(name)}`, {
        headers: { 'User-Agent': 'mrfentmen-genderize-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(15000),
    });
    if (!res.ok)
        throw new Error(`Genderize returned ${res.status}`);
    const data = (await res.json());
    if (!data.gender)
        return `No gender estimate available for "${name}".`;
    const pct = Math.round((data.probability ?? 0) * 100);
    return `${name}: estimated gender ${data.gender} (${pct}% confidence, ${data.count ?? 0} records)`;
}
// ---- muxC tools:
const GENDERIZE_UA = "mrfentmen-genderize-mcp/1.0";
class GenderizeError extends Error {
}
