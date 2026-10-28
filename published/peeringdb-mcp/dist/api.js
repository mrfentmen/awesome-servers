/**
 * PeeringDB — keyless public API client.
 */
const BASE = "https://www.peeringdb.com";
const SOURCE = "PeeringDB";
const UA = "peeringdb-mcp";
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
export async function network_by_asn(a) {
    const asn = a.asn;
    if (!Number.isInteger(asn) || asn < 1)
        throw new SourceError("asn must be a positive integer");
    const d = await getJson(`/api/net?asn=${asn}`);
    const n = Array.isArray(d?.data) ? d.data[0] : undefined;
    if (!n)
        throw new SourceError(`PeeringDB has no network for AS${asn}`);
    return section(`AS${n.asn} — ${clean(n.name)}`, [
        bullet("Type", n.info_type),
        bullet("Website", n.website),
        bullet("IRR as-set", n.irr_as_set),
        bullet("Looking glass", n.looking_glass),
        bullet("Peering policy", n.policy_general),
        bullet("Traffic", n.info_traffic),
    ]);
}
export async function network_search(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/api/net?name__contains=${encodeURIComponent(name)}&limit=${limit}`);
    const list = Array.isArray(d?.data) ? d.data : [];
    if (!list.length)
        return `No PeeringDB network matches "${name}".`;
    return section(`${list.length} network(s) match "${name}"`, list.map((n, i) => `${i + 1}. ${clean(n.name)} — AS${clean(n.asn)}${n.info_type ? " · " + clean(n.info_type) : ""}`));
}
export async function exchange_search(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/api/ix?name__contains=${encodeURIComponent(name)}&limit=${limit}`);
    const list = Array.isArray(d?.data) ? d.data : [];
    if (!list.length)
        return `No PeeringDB exchange matches "${name}".`;
    return section(`${list.length} exchange(s) match "${name}"`, list.map((x, i) => `${i + 1}. ${clean(x.name)} — ${clean(x.city)}, ${clean(x.country)}${x.media ? " · " + clean(x.media) : ""}`));
}
export async function facility_search(a) {
    const name = clean(a.name);
    if (name.length < 2)
        throw new SourceError("name must be at least 2 characters");
    const limit = clampLimit(a.limit, 10, 50);
    const d = await getJson(`/api/fac?name__contains=${encodeURIComponent(name)}&limit=${limit}`);
    const list = Array.isArray(d?.data) ? d.data : [];
    if (!list.length)
        return `No PeeringDB facility matches "${name}".`;
    return section(`${list.length} facility(ies) match "${name}"`, list.map((x, i) => `${i + 1}. ${clean(x.name)} — ${clean(x.city)}, ${clean(x.country)} · ${clean(x.net_count)} networks`));
}
export async function network_contacts(a) {
    const asn = a.asn;
    if (!Number.isInteger(asn) || asn < 1)
        throw new SourceError("asn must be a positive integer");
    const d = await getJson(`/api/net?asn=${asn}`);
    const n = Array.isArray(d?.data) ? d.data[0] : undefined;
    if (!n)
        throw new SourceError(`PeeringDB has no network for AS${asn}`);
    const contacts = Array.isArray(n.poc_set) ? n.poc_set : [];
    if (!contacts.length)
        return `AS${asn} (${clean(n.name)}) lists no public contacts.`;
    return section(`AS${asn} — ${clean(n.name)} contacts`, contacts.map((c, i) => `${i + 1}. ${clean(c.role)}: ${clean(c.name)}${c.email ? " <" + clean(c.email) + ">" : ""}${c.phone ? " · " + clean(c.phone) : ""}`));
}
