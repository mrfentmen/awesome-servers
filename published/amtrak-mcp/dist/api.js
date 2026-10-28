/**
 * Amtraker — keyless public API client.
 */
const BASE = "https://api.amtraker.com/v3";
const SOURCE = "Amtraker";
const UA = "amtrak-mcp";
export class SourceError extends Error {
}
async function request(path, init, timeoutMs = 40000) {
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
export async function getText(path, init) {
    const res = await request(path, init);
    return await res.text();
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
export async function live_trains(a) {
    const limit = clampLimit(a.limit, 25, 100);
    const d = await getJson("/trains");
    const groups = Object.values(d ?? {}).flat();
    if (!groups.length)
        return "Amtraker returned no live trains.";
    return section(`${groups.length} live train(s), showing ${Math.min(limit, groups.length)}`, groups.slice(0, limit).map((t, i) => `${i + 1}. ${clean(t.routeName)} ${clean(t.trainNum)} · ${clean(t.trainTimely) || "on time?"} · ${Math.round(Number(t.lat) * 100) / 100}, ${Math.round(Number(t.lon) * 100) / 100} · ${clean(t.speed)} mph`));
}
export async function train_status(a) {
    const key = clean(a.train);
    if (!/^[0-9A-Za-z-]{1,12}$/.test(key))
        throw new SourceError("train must be a train number or id");
    const d = await getJson(`/trains/${encodeURIComponent(key)}`);
    const list = Array.isArray(d) ? d : Array.isArray(d?.[key]) ? d[key] : Object.values(d ?? {}).flat();
    if (!list.length)
        throw new SourceError(`No live train ${key}`);
    return section(`${list.length} live instance(s) of train ${key}`, list.map((t, i) => [
        `${i + 1}. ${clean(t.routeName)} ${clean(t.trainNum)} (${clean(t.trainID)})`,
        bullet("  Status", t.trainTimely),
        bullet("  Speed", t.speed ? `${t.speed} mph` : ""),
        bullet("  Heading", t.heading),
        bullet("  Position", `${t.lat}, ${t.lon}`),
        bullet("  Last update", t.lastValUpdatedAt ?? t.updatedAt),
        bullet("  Destination", t.destination),
    ].filter(Boolean).join("\n")));
}
export async function route_trains(a) {
    const want = clean(a.route).toLowerCase();
    if (want.length < 2)
        throw new SourceError("route must be at least 2 characters");
    const limit = clampLimit(a.limit, 15, 50);
    const d = await getJson("/trains");
    const groups = Object.values(d ?? {}).flat();
    const hits = groups.filter((t) => clean(t.routeName).toLowerCase().includes(want));
    if (!hits.length)
        return `No live trains on a route matching "${a.route}".`;
    return section(`${hits.length} live train(s) on routes matching "${a.route}"`, hits.slice(0, limit).map((t, i) => `${i + 1}. ${clean(t.routeName)} ${clean(t.trainNum)} · ${clean(t.trainTimely) || "status unknown"} · ${clean(t.speed)} mph`));
}
export async function stations(a) {
    const limit = clampLimit(a.limit, 25, 100);
    const st = a.state ? clean(a.state).toUpperCase() : "";
    if (st && !/^[A-Z]{2}$/.test(st))
        throw new SourceError("state must be a two letter code");
    const d = await getJson("/stations");
    const list = Object.values(d ?? {});
    const hits = st ? list.filter((s) => clean(s.state).toUpperCase() === st) : list;
    if (!hits.length)
        return `No Amtrak stations${st ? ` in ${st}` : ""}.`;
    return section(`${hits.length} station(s)${st ? ` in ${st}` : ""}, showing ${Math.min(limit, hits.length)}`, hits.slice(0, limit).map((s, i) => `${i + 1}. ${clean(s.name)} (${clean(s.code)}) · ${clean(s.city)}, ${clean(s.state)} · ${clean(s.lat)}, ${clean(s.lon)}`));
}
export async function station(a) {
    const code = clean(a.code).toUpperCase();
    if (!/^[A-Z]{2,5}$/.test(code))
        throw new SourceError("code must be a station code");
    const d = await getJson("/stations");
    const s = d?.[code];
    if (!s)
        throw new SourceError(`No station ${code}`);
    return section(clean(s.name), [
        bullet("Code", s.code),
        bullet("Address", [clean(s.address1), clean(s.address2), clean(s.city), clean(s.state), clean(s.zip)].filter(Boolean).join(", ")),
        bullet("Coordinates", `${s.lat}, ${s.lon}`),
        bullet("Timezone", s.tz),
    ]);
}
