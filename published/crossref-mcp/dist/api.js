const BASE = "https://api.crossref.org";
const UA = "mrfentmen-crossref-mcp/1.0 (https://github.com/mrfentmen)";
export class CrossrefError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (res.status === 429)
        throw new CrossrefError("Crossref rate limit hit, wait and retry");
    if (!res.ok)
        throw new CrossrefError(`Crossref error ${res.status}`);
    return (await res.json());
}
function fmtWork(w, i) {
    const authors = (w?.author ?? []).slice(0, 3).map((a) => `${a.given ?? ""} ${a.family ?? ""}`.trim()).join(", ");
    const year = w?.issued?.["date-parts"]?.[0]?.[0] ?? "year n/a";
    return `${i + 1}. ${w?.title?.[0] ?? "Untitled"} (${year})\n   ${authors || "n/a"} | ${w?.type ?? ""}${w?.DOI ? ` | doi ${w.DOI}` : ""}`;
}
export async function searchWorks(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new CrossrefError("Provide search terms");
    const limit = Math.min(args.limit ?? 5, 15);
    const d = await get(`${BASE}/works?query=${encodeURIComponent(q)}&rows=${limit}`);
    const items = d?.message?.items ?? [];
    if (!items.length)
        return "No works found";
    return items.map(fmtWork).join("\n\n");
}
export async function doiLookup(args) {
    const doi = (args.doi ?? "").trim();
    if (!doi)
        throw new CrossrefError("Provide a DOI");
    const d = await get(`${BASE}/works/${encodeURIComponent(doi)}`);
    const w = d?.message ?? {};
    return `Title: ${w?.title?.[0] ?? "n/a"}\nType: ${w?.type ?? "n/a"}\nPublisher: ${w?.publisher ?? "n/a"}\nYear: ${w?.issued?.["date-parts"]?.[0]?.[0] ?? "n/a"}\nAuthors: ${(w?.author ?? []).slice(0, 5).map((a) => `${a.given ?? ""} ${a.family ?? ""}`.trim()).join(", ") || "n/a"}\nDOI: ${w?.DOI ?? doi}\nURL: https://doi.org/${w?.DOI ?? doi}`;
}
async function listEndpoint(args, path, label) {
    const q = (args.query ?? "").trim();
    const limit = Math.min(args.limit ?? 5, 20);
    const url = q ? `${BASE}/${path}?query=${encodeURIComponent(q)}&rows=${limit}` : `${BASE}/${path}?rows=${limit}`;
    const d = await get(url);
    const items = d?.message?.items ?? [];
    if (!items.length)
        return `No ${label} found`;
    return items.map((m, i) => `${i + 1}. ${m?.title ?? m?.name ?? "Untitled"}${m?.publisher ? ` | ${m.publisher}` : ""}${m?.counts?.["total-dois"] ? ` | DOIs ${m.counts["total-dois"]}` : ""}`).join("\n\n");
}
export async function journals(args) {
    return listEndpoint(args, "journals", "journals");
}
export async function journalLookup(args) {
    const issn = (args.issn ?? "").trim();
    if (!issn)
        throw new CrossrefError("Provide an ISSN like 0028-0836");
    const d = await get(`${BASE}/journals/${encodeURIComponent(issn)}`);
    const m = d?.message ?? {};
    return `Title: ${m?.title ?? "n/a"}\nPublisher: ${m?.publisher ?? "n/a"}\nSubjects: ${(m?.subjects ?? []).slice(0, 5).join(", ") || "n/a"}`;
}
export async function funders(args) {
    return listEndpoint(args, "funders", "funders");
}
export async function funderLookup(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new CrossrefError("Provide a funder id like 100000001");
    const d = await get(`${BASE}/funders/${encodeURIComponent(id)}`);
    const m = d?.message ?? {};
    return `Name: ${m?.name ?? "n/a"}\nLocation: ${m?.location ?? "n/a"}\nAwards: ${m?.["award-count"] ?? "n/a"} | Descendants: ${m?.["descendant-count"] ?? "n/a"}`;
}
export async function members(args) {
    return listEndpoint(args, "members", "members");
}
export async function memberLookup(args) {
    const id = (args.id ?? "").trim();
    if (!id)
        throw new CrossrefError("Provide a member id");
    const d = await get(`${BASE}/members/${encodeURIComponent(id)}`);
    const m = d?.message ?? {};
    return `Name: ${m?.["primary-name"] ?? "n/a"}\nLocation: ${m?.location ?? "n/a"}\nTotal DOIs: ${m?.counts?.["total-dois"] ?? "n/a"} | Current year: ${m?.counts?.["current-dois"] ?? "n/a"}`;
}
export async function workTypes() {
    const d = await get(`${BASE}/types?rows=30`);
    const items = d?.message?.items ?? [];
    return items.map((t) => `${t?.id ?? "?"} — ${t?.label ?? ""}`).join("\n");
}
export async function licenses() {
    const d = await get(`${BASE}/licenses?rows=30`);
    const items = d?.message?.items ?? [];
    return items.map((l) => `${l?.URL ?? "?"} (DOIs ${l?.["total-dois"] ?? "?"})`).join("\n");
}
