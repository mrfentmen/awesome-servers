/**
 * Transport for London — keyless public API client.
 */
const BASE = "https://api.tfl.gov.uk";
const SOURCE = "Transport for London";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "tfl-mcp", accept },
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
export async function getJson(path, accept = "application/json", timeoutMs = 25000) {
    const res = await request(path, accept, timeoutMs);
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
const MODES = ["tube", "dlr", "overground", "elizabeth-line", "tram", "bus", "national-rail", "cable-car", "river-bus"];
export async function lineStatus(a) {
    const modes = clean(a.modes || "tube").split(",").map((m) => clean(m)).filter(Boolean);
    const bad = modes.filter((m) => !MODES.includes(m));
    if (bad.length)
        throw new SourceError(`unknown mode(s): ${bad.join(", ")} - allowed: ${MODES.join(", ")}`);
    const data = await getJson(`/Line/Mode/${modes.join(",")}/Status`, "application/json", 30000);
    if (!Array.isArray(data) || !data.length)
        throw new SourceError("TfL returned no line status");
    const good = data.filter((l) => (l?.lineStatuses ?? []).every((s) => Number(s?.statusSeverity) >= 10));
    return [
        `${data.length} line(s) across ${modes.join(", ")}: ${good.length} good service, ${data.length - good.length} with issues`,
        "",
        ...data.map((line) => {
            const statuses = Array.isArray(line?.lineStatuses) ? line.lineStatuses : [];
            const worst = statuses.reduce((acc, s) => (acc === null || Number(s?.statusSeverity) < Number(acc?.statusSeverity) ? s : acc), null);
            const severity = Number(worst?.statusSeverity);
            const name = clean(line?.name);
            const text = clean(worst?.statusSeverityDescription) || "Unknown";
            const reason = clean(worst?.reason);
            const marker = severity >= 10 ? "ok " : severity >= 6 ? "warn" : "BAD ";
            const lines = [`${marker} ${name}: ${text}`];
            if (reason && severity < 10)
                lines.push(`      ${reason.slice(0, 220)}`);
            return lines.join("\n");
        }),
    ].join("\n");
}
export async function searchStops(a) {
    const limit = clampLimit(a.limit, 5, 20);
    const q = clean(a.query);
    const data = await getJson(`/StopPoint/Search/${encodeURIComponent(q)}`, "application/json", 30000);
    const matches = Array.isArray(data?.matches) ? data.matches : [];
    if (!matches.length)
        return `TfL found no stops matching "${q}".`;
    return [
        `${data?.total ?? matches.length} match(es) for "${q}" (showing ${Math.min(limit, matches.length)}):`,
        "",
        ...matches.slice(0, limit).map((m, i) => {
            const modes = Array.isArray(m?.modes) ? m.modes.join(", ") : "";
            const zone = clean(m?.zone);
            const bits = [modes, zone ? `zone ${zone}` : ""].filter(Boolean);
            return `${i + 1}. ${clean(m?.name)} · ${clean(m?.id)}${bits.length ? `\n   ${bits.join(" · ")}` : ""}`;
        }),
    ].join("\n");
}
export async function stationArrivals(a) {
    const limit = clampLimit(a.limit, 10, 30);
    const id = clean(a.stopId);
    if (!/^[A-Za-z0-9]{3,24}$/.test(id))
        throw new SourceError(`"${id}" is not a valid TfL stop id`);
    const data = await getJson(`/StopPoint/${encodeURIComponent(id)}/Arrivals`, "application/json", 30000);
    if (!Array.isArray(data))
        throw new SourceError("TfL returned an unexpected arrivals payload");
    if (!data.length)
        return `No arrivals at ${id} right now.`;
    const rows = [...data].sort((x, y) => Number(x?.timeToStation) - Number(y?.timeToStation)).slice(0, limit);
    return [
        `Next ${rows.length} arrival(s) at ${clean(rows[0]?.stationName) || id}:`,
        "",
        ...rows.map((p) => {
            const mins = Math.round(Number(p?.timeToStation) / 60);
            const platform = clean(p?.platformName);
            const where = clean(p?.towards) || clean(p?.destinationName);
            return `${String(mins).padStart(3)} min  ${clean(p?.lineName).padEnd(18)} to ${where}${platform ? ` · ${platform}` : ""}`;
        }),
    ].join("\n");
}
export async function roadDisruptions() {
    const data = await getJson("/Road/all/Disruption", "application/json", 30000);
    const rows = Array.isArray(data) ? data : [];
    if (!rows.length)
        return "TfL reports no road disruptions right now.";
    return [
        `${rows.length} road disruption(s):`,
        "",
        ...rows.slice(0, 20).map((d, i) => `${i + 1}. ${clean(d?.severity)} · ${clean(d?.location)} · ${clean(d?.comments).slice(0, 160)}`),
    ].join("\n");
}
export async function stopDetail(a) {
    const id = clean(a.stopId);
    if (!/^[A-Za-z0-9]{3,24}$/.test(id))
        throw new SourceError(`"${id}" is not a valid TfL stop id`);
    const s = await getJson(`/StopPoint/${encodeURIComponent(id)}`, "application/json", 30000);
    if (!s?.id)
        throw new SourceError(`No TfL stop ${id}`);
    const lines = Array.isArray(s?.lines) ? s.lines : [];
    return [
        `${clean(s.commonName) || clean(s.name)} (${clean(s.id)})`,
        "",
        `Modes: ${Array.isArray(s.modes) ? s.modes.join(", ") : clean(s.modeName)}`,
        `Zone: ${clean(s.zone)}`,
        `Coordinates: ${s.lat}, ${s.lon}`,
        `Lines: ${lines.slice(0, 10).map((l) => clean(l.name)).join(", ")}`,
        `Towards: ${Array.isArray(s.children) ? s.children.slice(0, 6).map((c) => clean(c.towards)).filter(Boolean).join(" · ") : ""}`,
    ].filter(Boolean).join("\n");
}
export async function lineRoute(a) {
    const id = clean(a.lineId).toLowerCase();
    if (!/^[a-z0-9-]{2,30}$/.test(id))
        throw new SourceError(`"${id}" is not a valid TfL line id`);
    const data = await getJson(`/Line/${encodeURIComponent(id)}/Route/Sequence/${a.direction}`, "application/json", 30000);
    const stops = Array.isArray(data?.stopPointSequences)
        ? data.stopPointSequences.flatMap((s) => Array.isArray(s?.stopPoint) ? s.stopPoint : [])
        : [];
    if (!stops.length)
        return `TfL has no ${a.direction} route stops for line ${id}.`;
    return [
        `${clean(data?.lineName) || id} ${a.direction} · ${stops.length} stops`,
        "",
        ...stops.slice(0, 40).map((s, i) => `${String(i + 1).padStart(3)}. ${clean(s.name)} · ${clean(s.id)}`),
    ].join("\n");
}
