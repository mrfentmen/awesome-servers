const BASE = "https://dailymed.nlm.nih.gov/dailymed/services/v2";
const UA = "mrfentmen-dailymed-mcp/1.0 (https://github.com/mrfentmen)";
export class DailymedError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new DailymedError(`DailyMed returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const name = (args.drugName ?? "").trim();
    if (!name)
        throw new DailymedError("Provide a drug name");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}/spls.json?drug_name=${encodeURIComponent(name)}&pagesize=${limit}`);
    const list = (d?.data ?? []);
    const total = d?.metadata?.total ?? list.length;
    if (!list.length)
        return `No labels found for \"${name}\"`;
    return `DailyMed labels for \"${name}\" (${total} total):\n` + list.map((s, i) => {
        const date = s?.published_date ? s.published_date.slice(0, 10) : "";
        return `${i + 1}. ${s?.title ?? "untitled"} | ${date} | set ${s?.setid ?? ""}`;
    }).join("\n");
}
export async function spl(args) {
    const setId = (args.setId ?? "").trim();
    if (!setId)
        throw new DailymedError("Provide a DailyMed set ID");
    const d = await get(`${BASE}/spls/${encodeURIComponent(setId)}.json`);
    const s = d?.data?.[0] ?? d;
    if (!s?.setid && !s?.title)
        throw new DailymedError(`Label not found: ${setId}`);
    const lines = [
        `Title: ${s?.title ?? "n/a"}`,
        `Set ID: ${s?.setid ?? setId}`,
        `Published: ${s?.published_date?.slice(0, 10) ?? "n/a"}`,
        `Version: ${s?.spl_version ?? "n/a"}`,
    ];
    const active = s?.active_ingredients;
    if (Array.isArray(active) && active.length) {
        lines.push(`Active ingredients: ${active.map((a) => `${a?.name ?? ""} ${a?.strength ?? ""}`.trim()).filter(Boolean).join("; ")}`);
    }
    const indication = s?.indications_and_usage;
    if (typeof indication === "object" && indication && indication.indications_and_usage) {
        lines.push(`\nIndications: ${String(indication.indications_and_usage).slice(0, 500)}`);
    }
    return lines.join("\n");
}
export async function drugNames(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DailymedError("Provide part of a drug name");
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 10) || 10, 25));
    const d = await get(`${BASE}/drugnames.json?drug_name=${encodeURIComponent(q)}&pagesize=${limit}`);
    const list = d?.data ?? [];
    if (!list.length)
        return `DailyMed has no drug names matching "${q}".`;
    // DailyMed marks G for generic and B for brand; anything else is reported as
    // unclassified rather than guessed at.
    const kind = (t) => t === "G" ? "generic" : t === "B" ? "brand" : "unclassified";
    return [
        `DailyMed drug names matching "${q}" (${d?.metadata?.total ?? list.length} total, showing ${list.length}):`,
        ...list
            .slice(0, limit)
            .map((n, i) => `      ${String(i + 1).padStart(2)}. [${kind(n.name_type)}] ${n.drug_name ?? "not reported"}`),
    ].join("\n");
}
