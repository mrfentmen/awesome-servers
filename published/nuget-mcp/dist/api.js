const BASE = "https://azuresearch-usnc.nuget.org/query";
const UA = "mrfentmen-nuget-mcp/1.0 (https://github.com/mrfentmen)";
export class NugetError extends Error {
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new NugetError(`NuGet returned HTTP ${res.status}`);
    return (await res.json());
}
export async function search(args) {
    const q = (args.query ?? "").trim();
    if (!q)
        throw new NugetError("Provide a search query");
    const limit = Math.min(args.limit ?? 10, 20);
    const d = await get(`${BASE}?q=${encodeURIComponent(q)}&take=${limit}`);
    const list = (d?.data ?? []);
    if (!list.length)
        return `No packages found for \"${q}\"`;
    return `NuGet results for \"${q}\" (${d?.totalHits ?? list.length} total):\n` + list.map((p, i) => {
        const authors = (p?.authors ?? []).join(", ");
        return `${i + 1}. ${p?.id ?? "n/a"} ${p?.version ?? ""}\n   ${(p?.description ?? "no description").slice(0, 140)}${authors ? ` | ${authors}` : ""} | ${p?.totalDownloads?.toLocaleString() ?? "?"} downloads`;
    }).join("\n");
}
export async function packageInfo(args) {
    const id = (args.packageId ?? "").trim();
    if (!id)
        throw new NugetError("Provide a package ID like Newtonsoft.Json");
    const d = await get(`${BASE}?q=packageid:${encodeURIComponent(id)}&take=1`);
    const p = (d?.data ?? [])[0];
    if (!p)
        throw new NugetError(`Package not found: ${id}`);
    const lines = [
        `Package: ${p?.id ?? id}`,
        `Latest: ${p?.version ?? "n/a"}`,
        `Downloads: ${p?.totalDownloads?.toLocaleString() ?? "n/a"}`,
        `Authors: ${(p?.authors ?? []).join(", ") || "n/a"}`,
        `Description: ${(p?.description ?? "n/a").slice(0, 300)}`,
        `Project: ${p?.projectUrl ?? "n/a"}`,
    ];
    return lines.join("\n");
}
