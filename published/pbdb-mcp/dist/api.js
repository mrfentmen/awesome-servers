const BASE = "https://paleobiodb.org/data1.2";
const UA = "mrfentmen-pbdb-mcp/1.0 (https://github.com/mrfentmen)";
export class PbdbError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new PbdbError(`PBDB returned HTTP ${res.status}`);
    return (await res.json());
}
export async function occurrences(args) {
    const taxon = (args.taxon ?? "").trim();
    if (!taxon)
        throw new PbdbError("Provide a taxon name like Triceratops");
    const limit = Math.min(args.limit ?? 10, 25);
    const d = await get(`${BASE}/occs/list.json?taxon_name=${encodeURIComponent(taxon)}&limit=${limit}&vocab=pbdb`);
    const recs = (d?.records ?? []);
    if (!recs.length)
        return `No occurrences found for ${taxon}`;
    const lines = recs.map((r, i) => {
        const name = r?.accepted_name ?? r?.identified_name ?? r?.taxon_name ?? "n/a";
        const interval = r?.early_interval ?? r?.late_interval ?? "n/a";
        const age = r?.max_ma != null ? `${r.max_ma}-${r.min_ma ?? r.max_ma} Ma` : "";
        const place = [r?.cc, r?.state, r?.county].filter(Boolean).join(", ") || "n/a";
        return `${i + 1}. ${name} | ${interval} ${age} | ${place}`;
    });
    return `Fossil occurrences of ${taxon} (${d?.records?.length ?? recs.length} shown):\n` + lines.join("\n");
}
export async function taxa(args) {
    const name = (args.name ?? "").trim();
    if (!name)
        throw new PbdbError("Provide a taxon name");
    const d = await get(`${BASE}/taxa/list.json?name=${encodeURIComponent(name)}&show=attr`);
    const t = (d?.records ?? [])[0];
    if (!t)
        throw new PbdbError(`Taxon not found: ${name}`);
    const rank = t?.taxon_rank ?? "";
    const lines = [
        `${t?.taxon_name ?? name}${rank ? ` (${rank})` : ""}`,
        `Parent: ${t?.parent ?? "n/a"}`,
    ];
    if (t?.firstapp_max_ma != null || t?.lastapp_min_ma != null) {
        lines.push(`First appearance: ${t?.firstapp_max_ma ?? "?"} Ma | Last appearance: ${t?.lastapp_min_ma ?? "?"} Ma`);
    }
    if (t?.namer)
        lines.push(`Namer: ${t.namer}`);
    return lines.join("\n");
}
// ---- muxC tools:
const PBDB_UA = "mrfentmen-pbdb-mcp/1.0 (https://github.com/mrfentmen)";
class PbdbToolError extends Error {
}
async function pbdb(path, ms = 30000) {
    const res = await fetch(`https://paleobiodb.org/data1.2/${path}`, { headers: { "User-Agent": PBDB_UA, Accept: "application/json" }, signal: AbortSignal.timeout(ms) });
    if (!res.ok)
        throw new PbdbToolError(`The Paleobiology Database returned ${res.status} for ${path}`);
    return await res.json();
}
function warn(d) {
    const w = d?.warnings ?? [];
    return w.length ? `note: ${w.join("; ")}` : null;
}
