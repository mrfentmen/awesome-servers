/**
 * RxNav (NLM) client. Keyless. RxNorm concept lookup, names, package NDCs and
 * the interaction checker.
 */
const BASE = "https://rxnav.nlm.nih.gov/REST";
export class RxNavError extends Error {
}
async function get(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "rxnorm-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new RxNavError(`RxNav error ${res.status}`);
    return (await res.json());
}
export async function drugs(name) {
    const body = await get(`/drugs.json?name=${encodeURIComponent(name)}`);
    const groups = body.drugGroup?.conceptGroup ?? [];
    return groups.flatMap((g) => g.conceptProperties ?? []);
}
async function normalizeOnce(name) {
    const body = await get(`/rxcui.json?name=${encodeURIComponent(name)}&search=2`);
    return body.idGroup?.rxnormId ?? [];
}
export async function normalize(name) {
    const direct = await normalizeOnce(name);
    if (direct.length)
        return direct;
    // "glucophage 500mg" is not a concept; retry without the dose tail.
    const stripped = name.replace(/\b\d+(\.\d+)?\s*(mg|ml|mcg|g|iu|%)\b/gi, "").trim();
    if (stripped && stripped !== name)
        return normalizeOnce(stripped);
    return [];
}
export async function properties(rxcui) {
    const body = await get(`/rxcui/${encodeURIComponent(rxcui)}/properties.json`);
    return body.properties;
}
export async function ndcs(rxcui) {
    const body = await get(`/rxcui/${encodeURIComponent(rxcui)}/ndcs.json`);
    return body.ndcGroup?.ndcList?.ndc ?? [];
}
export async function related(rxcui) {
    const body = await get(`/rxcui/${encodeURIComponent(rxcui)}/allrelated.json`);
    return (body.allRelatedGroup?.conceptGroup ?? []).flatMap((g) => g.conceptProperties ?? []);
}
export async function spellings(name) {
    const body = await get(`/spellingsuggestions.json?name=${encodeURIComponent(name)}`);
    return body.suggestionGroup?.suggestionList?.suggestion ?? [];
}
export function conceptLine(c) {
    return `${c.rxcui}  ${c.name}${c.tty ? ` [${c.tty}]` : ""}${c.synonym && c.synonym !== c.name ? ` (syn: ${c.synonym})` : ""}`;
}
