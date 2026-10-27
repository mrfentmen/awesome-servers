const BASE = "https://api.datacite.org/dois";
const UA = "mrfentmen-datacite-mcp/1.0 (https://github.com/mrfentmen)";
export class DataciteError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/vnd.api+json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new DataciteError(`DataCite returned HTTP ${res.status}`);
    return (await res.json());
}
function fmtDoi(rec, i) {
    const a = rec?.attributes ?? {};
    const title = a?.titles?.[0]?.title ?? "untitled";
    const creator = a?.creators?.[0]?.name ?? "unknown";
    const year = a?.publicationYear ?? "";
    const type = a?.types?.resourceTypeGeneral ?? a?.types?.resourceType ?? "";
    return `${i + 1}. ${title}\n   ${creator} | ${year}${type ? ` | ${type}` : ""} | ${rec?.id ?? ""}`;
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new DataciteError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}?query=${encodeURIComponent(q)}&page[size]=${limit}`);
    const list = (d?.data ?? []);
    if (!list.length)
        return `No DOIs found for \"${q}\"`;
    return `DataCite results for \"${q}\" (${d?.meta?.total ?? list.length} total):\n` + list.map(fmtDoi).join("\n");
}
export async function doi(args) {
    const doi = (args.doi ?? "").trim();
    if (!doi)
        throw new DataciteError("Provide a DOI like 10.5281/zenodo.20501604");
    const d = await get(`${BASE}/${encodeURIComponent(doi)}`);
    const rec = d?.data;
    if (!rec)
        throw new DataciteError(`DOI not found: ${doi}`);
    const a = rec?.attributes ?? {};
    const lines = [
        `DOI: ${rec?.id ?? doi}`,
        `Title: ${a?.titles?.[0]?.title ?? "n/a"}`,
        `Creators: ${(a?.creators ?? []).slice(0, 5).map((c) => c?.name).filter(Boolean).join(", ") || "n/a"}`,
        `Publisher: ${a?.publisher ?? "n/a"}`,
        `Published: ${a?.publicationYear ?? "n/a"}`,
        `Type: ${a?.types?.resourceTypeGeneral ?? "n/a"}`,
    ];
    if (a?.descriptions?.length)
        lines.push(`\nDescription: ${String(a.descriptions[0]?.description ?? "").slice(0, 400)}`);
    if (a?.url)
        lines.push(`\nURL: ${a.url}`);
    return lines.join("\n");
}
// ---- muxA tools:
const DATACITE = "https://api.datacite.org";
function cap(value, fallback, max) {
    return Math.max(1, Math.min(Math.round(value ?? fallback), max));
}
function one(value, max = 200) {
    if (value == null)
        return "not recorded";
    if (Array.isArray(value)) {
        const parts = value.map((v) => (v && typeof v === "object" ? String(v.title ?? JSON.stringify(v)) : String(v)));
        return parts.filter(Boolean).join("; ") || "not recorded";
    }
    const s = String(value).replace(/\s+/g, " ").trim();
    if (!s)
        return "not recorded";
    return s.length > max ? `${s.slice(0, max)}...` : s;
}
async function dcGet(path) {
    const res = await fetch(`${DATACITE}${path}`, {
        headers: { "User-Agent": UA, Accept: "application/vnd.api+json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok) {
        let detail = "";
        try {
            const body = (await res.json());
            detail = body.errors?.[0]?.title ?? "";
        }
        catch {
            detail = "";
        }
        throw new Error(`DataCite returned ${res.status}${detail ? `: ${detail}` : ""}`);
    }
    return (await res.json());
}
function titleOf(attrs) {
    return one(attrs.titles, 180);
}
export async function prefixDetails(args) {
    const prefix = (args.prefix ?? "").trim();
    if (!/^10\.\d{4,9}$/.test(prefix))
        throw new Error("Provide a bare DOI prefix such as 10.5281.");
    const limit = cap(args.limit, 10, 25);
    const p = await dcGet(`/prefixes/${encodeURIComponent(prefix)}`);
    const attrs = (p.data?.attributes ?? {});
    const clients = (p.data?.relationships?.clients?.data ?? []);
    const dois = await dcGet(`/dois?prefix=${encodeURIComponent(prefix)}&page%5Bsize%5D=${limit}&sort=-created`);
    const rows = (dois.data ?? []);
    return [
        `DataCite prefix ${prefix} (registered ${String(attrs.createdAt ?? "?").slice(0, 10)}), ${clients.length} member client(s).`,
        clients.length ? `Clients: ${clients.map((c) => c.id).join(", ")}` : "",
        `DOIs under this prefix: ${Number(dois.meta?.total ?? rows.length).toLocaleString("en-US")} reported, showing ${rows.length} most recent.`,
        ...rows.map((r, i) => {
            const a = r.attributes ?? {};
            return `${i + 1}. ${a.doi} | ${a.publicationYear ?? "?"} | ${a.publisher ?? "?"} | ${a.state ?? "?"}\n     ${titleOf(a)}`;
        }),
    ]
        .filter((l) => l !== "")
        .join("\n");
}
