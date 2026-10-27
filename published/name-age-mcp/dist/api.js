const UA = "mrfentmen-name-age-mcp/1.0 (https://github.com/mrfentmen)";
export class NameError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new NameError("Name API rate limit hit, wait and retry");
    if (!res.ok)
        throw new NameError(`Name API error ${res.status}`);
    return (await res.json());
}
export async function estimateAge(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new NameError("Provide a first name");
    const d = await get(`https://api.agify.io/?name=${encodeURIComponent(name)}`);
    if (d?.age === null || d?.age === undefined)
        return `No age estimate for "${name}"`;
    return `"${d.name}" is typically about ${d.age} years old (based on ${d.count?.toLocaleString() ?? "?"} people in the dataset)`;
}
export async function estimateGender(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new NameError("Provide a first name");
    const d = await get(`https://api.genderize.io/?name=${encodeURIComponent(name)}`);
    if (!d?.gender)
        return `No gender estimate for "${name}"`;
    const pct = Math.round((d.probability ?? 0) * 100);
    return `"${d.name}" is estimated ${d.gender} with ${pct}% probability (based on ${d.count?.toLocaleString() ?? "?"} people)`;
}
