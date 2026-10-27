const UA = "mrfentmen-meowfacts-mcp/1.0 (https://github.com/mrfentmen)";
export class MeowError extends Error {
}
async function one() {
    const res = await fetch("https://meowfacts.herokuapp.com/", { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(15000) });
    if (!res.ok)
        throw new MeowError(`MeowFacts returned HTTP ${res.status}`);
    const d = (await res.json());
    return d.data?.[0] ?? "Cats are mysterious.";
}
export async function fact(_args) {
    return one();
}
export async function many(args) {
    const count = Math.min(args.count ?? 3, 10);
    const out = [];
    for (let i = 0; i < count; i++) {
        out.push(`${i + 1}. ${await one()}`);
    }
    return out.join("\n\n");
}
// ---- muxC tools:
const MEOWFACTS_UA = "mrfentmen-meowfacts-mcp/1.0 (https://github.com/mrfentmen)";
