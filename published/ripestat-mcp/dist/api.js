/**
 * RIPE Stat — keyless public API client.
 */
const BASE = "https://stat.ripe.net";
const SOURCE = "RIPE Stat";
const UA = "ripestat-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            ...init,
            signal: ctrl.signal,
            headers: {
                "user-agent": UA,
                accept: "application/json",
                ...init?.headers,
            },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path, init) {
    const res = await request(path, init);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
export async function network_info(a) {
    const resource = clean(a.resource);
    if (!resource)
        throw new SourceError("resource is required");
    const d = await getJson(`/data/network-info/data.json?resource=${encodeURIComponent(resource)}`);
    const asns = Array.isArray(d?.data?.asns) ? d.data.asns.map((x) => clean(x)) : [];
    const prefix = clean(d?.data?.prefix) || "unknown";
    if (!asns.length)
        return `${resource} is not announced in the global routing table (covering prefix ${prefix}).`;
    return `${resource} → ${prefix}\n  announced by ${asns.map((x) => "AS" + x).join(", ")}`;
}
export async function prefix_overview(a) {
    const resource = clean(a.resource);
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/data/prefix-overview/data.json?resource=${encodeURIComponent(resource)}`);
    const data = d?.data ?? {};
    const asns = Array.isArray(data.asns) ? data.asns : [];
    if (!asns.length)
        return `${resource} is not announced.`;
    const rows = asns.slice(0, limit).map((x, i) => `${i + 1}. AS${clean(x.asn)} ${clean(x.holder)}${x.description ? " — " + clean(x.description) : ""}`);
    return section(`${clean(data.resource) || resource} is announced by ${asns.length} ASN(s)`, rows);
}
export async function as_overview(a) {
    const raw = clean(a.asn);
    if (!/^(AS)?\d+$/i.test(raw))
        throw new SourceError("asn must be a number such as 15169 or AS15169");
    const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`;
    const d = await getJson(`/data/as-overview/data.json?resource=${encodeURIComponent(id)}`);
    const x = d?.data ?? {};
    if (!x.resource)
        throw new SourceError(`RIPE Stat has no data for ${id}`);
    return section(`${id}`, [bullet("Holder", x.holder), bullet("Announced", x.announced === true ? "yes" : x.announced === false ? "no" : x.announced), bullet("Type", x.type)]);
}
export async function announced_prefixes(a) {
    const raw = clean(a.asn);
    if (!/^(AS)?\d+$/i.test(raw))
        throw new SourceError("asn must be a number such as 15169 or AS15169");
    const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`;
    const limit = clampLimit(a.limit, 20, 100);
    const d = await getJson(`/data/announced-prefixes/data.json?resource=${encodeURIComponent(id)}`);
    const list = Array.isArray(d?.data?.prefixes) ? d.data.prefixes : [];
    if (!list.length)
        return `${id} announces no prefixes.`;
    const rows = list.slice(0, limit).map((p, i) => `${i + 1}. ${clean(p.prefix)}`);
    return section(`${id} announces ${list.length} prefix(es)`, rows);
}
export async function asn_neighbours(a) {
    const raw = clean(a.asn);
    if (!/^(AS)?\d+$/i.test(raw))
        throw new SourceError("asn must be a number such as 15169 or AS15169");
    const id = /^AS/i.test(raw) ? raw.toUpperCase() : `AS${raw}`;
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson(`/data/asn-neighbours/data.json?resource=${encodeURIComponent(id)}`);
    const list = Array.isArray(d?.data?.neighbours) ? d.data.neighbours : [];
    if (!list.length)
        return `${id} has no neighbours in RIPE Stat.`;
    const rows = list.slice(0, limit).map((n) => `AS${clean(n.asn)} (${clean(n.type) || "neighbour"}${n.power !== undefined ? ", " + clean(n.power) + " shared prefixes" : ""})`);
    return section(`${id} has ${list.length} neighbour(s)`, rows);
}
