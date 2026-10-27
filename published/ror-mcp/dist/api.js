/**
 * Research Organization Registry (ROR) v2 — keyless registry of 110k+
 * research organizations worldwide with stable ids, geolocation and links.
 */
const BASE = "https://api.ror.org";
export class RorError extends Error {
}
async function getJson(url, timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(url, {
            signal: ctrl.signal,
            headers: { "user-agent": "ror-mcp", accept: "application/json" },
        });
        if (res.status === 404)
            throw new RorError("ROR has no organization with that id");
        if (!res.ok)
            throw new RorError(`ROR responded ${res.status}`);
        return await res.json();
    }
    catch (e) {
        if (e instanceof RorError)
            throw e;
        if (e.name === "AbortError")
            throw new RorError("ROR request timed out");
        if (e instanceof SyntaxError)
            throw new RorError("ROR returned malformed JSON");
        throw new RorError(`ROR request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
const idArg = (id) => {
    const v = id.trim().replace(/^https?:\/\/ror\.org\//i, "");
    if (!/^0[a-z0-9]{8}$/i.test(v))
        throw new RorError(`"${id}" is not a ROR id, e.g. 042nb2s44`);
    return v.toLowerCase();
};
const countryArg = (code) => {
    const v = code.trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(v))
        throw new RorError(`"${code}" is not a 2-letter country code, e.g. US`);
    return v;
};
function name(o) {
    const names = o?.names ?? [];
    return (names.find((n) => n.lang === "en") ?? names[0])?.value ?? "unnamed";
}
function location(o) {
    const g = o?.locations?.[0]?.geonames_details;
    if (!g)
        return "location unknown";
    return [g.name, g.country_name].filter(Boolean).join(", ");
}
function website(o) {
    return (o?.links ?? []).find((l) => l.type === "website")?.value ?? "";
}
function orgLine(o, i) {
    const acronym = o?.acronyms?.length ? ` (${o.acronyms.slice(0, 3).join(", ")})` : "";
    const types = o?.types?.length ? ` · ${o.types.join("/")}` : "";
    const est = o?.established ? ` · est. ${o.established}` : "";
    return `${i !== undefined ? `${i + 1}. ` : ""}${name(o)}${acronym}\n   ${location(o)}${types}${est}\n   ${idArg(o.id)}${website(o) ? ` · ${website(o)}` : ""}`;
}
async function search(query, filter, limit = 10) {
    const cap = Math.max(1, Math.min(limit, 50));
    const url = `${BASE}/organizations?query=${encodeURIComponent(query)}&page=1${filter ? `&filter=${encodeURIComponent(filter)}` : ""}`;
    const d = await getJson(url);
    return { total: Number(d?.number_of_results ?? 0), items: (d?.items ?? []).slice(0, cap) };
}
export async function searchOrganizations(query, country) {
    const q = query.trim();
    if (q.length < 2)
        throw new RorError("Search query must be at least 2 characters");
    const filter = country ? `country.country_code:${countryArg(country)}` : undefined;
    const { total, items } = await search(q, filter, 10);
    if (items.length === 0)
        return `ROR has no organizations matching "${query}"${country ? ` in ${country.toUpperCase()}` : ""}.`;
    return [
        `ROR organizations matching "${query}"${country ? ` in ${country.toUpperCase()}` : ""} (${items.length} of ${total.toLocaleString("en-US")}):`,
        "",
        ...items.map((o, i) => orgLine(o, i)),
    ].join("\n");
}
export async function organizationDetail(id) {
    const ror = idArg(id);
    const o = await getJson(`${BASE}/organizations/${ror}`);
    const aliases = (o?.aliases ?? []).slice(0, 6);
    const acr = (o?.acronyms ?? []).slice(0, 6);
    const labels = (o?.labels ?? []).slice(0, 4);
    return [
        `${name(o)}${acr.length ? ` (${acr.join(", ")})` : ""}`,
        `ROR id: ${o.id ?? ror}`,
        `Location: ${location(o)}`,
        `Types: ${(o?.types ?? ["unknown"]).join(", ")}`,
        o?.established ? `Established: ${o.established}` : "",
        aliases.length ? `Aliases: ${aliases.join(" · ")}` : "",
        labels.length ? `Other-language names: ${labels.map((l) => `${l.label} [${l.lang}]`).join(" · ")}` : "",
        website(o) ? `Website: ${website(o)}` : "",
        (o?.links ?? []).length > 1 ? `Links: ${(o.links ?? []).map((l) => l.value).slice(0, 4).join(" · ")}` : "",
        o?.email_address ? `Email: ${o.email_address}` : "",
        o?.admin?.last_modified?.date ? `Last updated: ${o.admin.last_modified.date}` : "",
    ]
        .filter(Boolean)
        .join("\n");
}
export async function organizationsByCountry(country, limit = 10) {
    const cc = countryArg(country);
    const { total, items } = await search("*", `country.country_code:${cc}`, limit);
    if (items.length === 0)
        return `No ROR organizations in country ${cc}.`;
    return [
        `ROR organizations in ${cc} (showing ${items.length} of ${total.toLocaleString("en-US")}; alphabetical, use search_organizations to filter):`,
        "",
        ...items.map((o, i) => orgLine(o, i)),
    ].join("\n");
}
export async function organizationsByType(type, country, limit = 10) {
    const t = type.trim().toLowerCase();
    const allowed = ["education", "facility", "company", "government", "healthcare", "nonprofit", "archive", "funder", "other"];
    if (!allowed.includes(t))
        throw new RorError(`unknown ROR type "${type}" — one of: ${allowed.join(", ")}`);
    const filter = [`types:${t}`, country ? `country.country_code:${countryArg(country)}` : ""].filter(Boolean).join(",");
    const { total, items } = await search("*", filter, limit);
    if (items.length === 0)
        return `No ROR ${t} organizations${country ? ` in ${country.toUpperCase()}` : ""}.`;
    return [
        `ROR ${t} organizations${country ? ` in ${country.toUpperCase()}` : ""} (showing ${items.length} of ${total.toLocaleString("en-US")}):`,
        "",
        ...items.map((o, i) => orgLine(o, i)),
    ].join("\n");
}
export async function organizationBatch(ids) {
    if (!Array.isArray(ids) || ids.length === 0)
        throw new RorError("Provide 1 to 10 ROR ids");
    if (ids.length > 10)
        throw new RorError("At most 10 ids per call");
    const clean = ids.map(idArg);
    const rows = await Promise.all(clean.map(async (id) => {
        try {
            const o = await getJson(`${BASE}/organizations/${id}`);
            return `${name(o)} — ${location(o)} · ${(o?.types ?? []).join("/") || "unknown type"} · ${o.id ?? id}`;
        }
        catch (e) {
            return `id ${id} — ${e instanceof Error ? e.message : String(e)}`;
        }
    }));
    return [`ROR batch lookup (${clean.length}):`, "", ...rows.map((r, i) => `${i + 1}. ${r}`)].join("\n");
}
