const UA = "mrfentmen-fdic-mcp/1.0 (https://github.com/mrfentmen)";
export class FdicError extends Error {
}
async function request(path) {
    const res = await fetch(`https://api.fdic.gov${path}`, {
        headers: { "User-Agent": UA },
        signal: AbortSignal.timeout(25000),
    });
    if (!res.ok)
        throw new FdicError(`FDIC error ${res.status}`);
    return (await res.json());
}
function money(v) {
    const n = Number(v);
    if (!Number.isFinite(n) || n <= 0)
        return "n/a";
    return `$${(n * 1000).toLocaleString()}`; // FDIC reports assets and deposits in thousands of dollars
}
function fmt(rows) {
    return rows
        .map((r) => {
        const d = r.data ?? r;
        return `${d.NAME ?? ""} | ${d.CITY ?? ""}, ${d.STNAME ?? ""}\n  Assets ${money(d.ASSET)} | Deposits ${money(d.DEP)}`;
    })
        .join("\n\n");
}
export async function institutions(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const name = args.name?.trim() ?? "";
    const filter = name ? `&filters=NAME:(${encodeURIComponent(name)}*)` : "";
    const d = await request(`/banks/institutions?limit=${limit}&fields=NAME,CITY,STNAME,ASSET,DEP${filter}&sort_by=ASSET&sort_order=DESC`);
    const rows = d.data ?? [];
    return `FDIC insured institutions (${d.meta?.total ?? rows.length} matched)\n${fmt(rows) || "None found"}`;
}
export async function largestBanks(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const d = await request(`/banks/institutions?limit=${limit}&fields=NAME,CITY,STNAME,ASSET,DEP&sort_by=ASSET&sort_order=DESC`);
    const rows = d.data ?? [];
    return `Largest FDIC insured institutions\n${fmt(rows)}`;
}
export async function failures(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const d = await request(`/banks/failures?limit=${limit}&sort_by=FAILDATE&sort_order=DESC`);
    const rows = d.data ?? [];
    if (!rows.length)
        return "No bank failures found.";
    return rows.map((r) => {
        const f = r.data ?? r;
        return `${f.NAME ?? ""} | ${f.CITY ?? ""}, ${f.STNAME ?? ""} | Failed ${f.FAILDATE ?? "?"} | Acquirer: ${f.ACQINSTITUTION ?? "none"}`;
    }).join("\n\n");
}
export async function history(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const name = args.name?.trim().toUpperCase() ?? "";
    const filter = name ? `&filters=INSTNAME:(${encodeURIComponent(name)}*)` : "";
    const d = await request(`/banks/history?limit=${limit}${filter}`);
    const rows = d.data ?? [];
    if (!rows.length)
        return "No history events found.";
    return rows.map((r) => {
        const h = r.data ?? r;
        return `${h.INSTNAME ?? ""} | ${h.CHANGECODE_DESC ?? h.CHANGECODE ?? ""} | ${h.PROCDATE ?? ""}`.trim();
    }).join("\n");
}
export async function locations(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const filters = [];
    if ((args.city ?? "").trim())
        filters.push(`CITY:(${encodeURIComponent(args.city.trim())}*)`);
    if ((args.state ?? "").trim())
        filters.push(`STNAME:(${encodeURIComponent(args.state.trim())}*)`);
    const filter = filters.length ? `&filters=${filters.join(" AND ")}` : "";
    const d = await request(`/banks/locations?limit=${limit}${filter}`);
    const rows = d.data ?? [];
    if (!rows.length)
        return "No branches found.";
    return rows.map((r) => {
        const l = r.data ?? r;
        return `${l.NAME ?? ""} | ${l.ADDRESS ?? ""}, ${l.CITY ?? ""} ${l.STALP ?? ""} ${l.ZIP ?? ""}`;
    }).join("\n");
}
export async function financials(args) {
    const limit = Math.min(args.limit ?? 10, 50);
    const name = args.name?.trim().toUpperCase() ?? "";
    const filter = name ? `&filters=NAME:(${encodeURIComponent(name)}*)` : "";
    const d = await request(`/banks/financials?limit=${limit}&sort_by=ASSET&sort_order=DESC${filter}`);
    const rows = d.data ?? [];
    if (!rows.length)
        return "No financials found.";
    return rows.map((r) => {
        const f = r.data ?? r;
        return `${f.NAME ?? f.NAMEHCR ?? f.CERT ?? ""} (${f.CERT ?? ""})\n  Assets ${money(f.ASSET)} | Deposits ${money(f.DEP)} | Equity ${money(f.EQ)} | Net income ${money(f.NIMY)}`;
    }).join("\n\n");
}
export async function summary() {
    const d = await request(`/banks/summary`);
    const txt = JSON.stringify(d.totals ?? d, null, 2).slice(0, 1500);
    return `FDIC summary:\n${txt}`;
}
