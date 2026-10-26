// ---- muxH tools:
// The six existing tools all check something from this one server's vantage
// point. These two answer the two questions that stays blind: how the target
// looks from other countries, and how the monitoring vendor's own service has
// been behaving. Both read public, keyless sources.
const UR_UA = "mcfentmen-uptimerobot-mcp/1.1 (https://github.com/mcfentmen/uptimerobot-mcp)";
const UR_STATUS = "https://status.uptimerobot.com/api";
// Globalping runs measurements from volunteer probes in many countries and needs
// no account for a handful of them.
const UR_GP = "https://api.globalping.io/v1";
// This identifier is published in the page's own asset URLs, so it is not a credential.
const UR_BOARD = "MQWpGhqM";
async function urJson(url, label, accept = "application/json") {
    let res;
    try {
        res = await fetch(url, {
            headers: { "User-Agent": UR_UA, Accept: accept },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new Error(`Could not reach ${label}: ${e.message}`);
    }
    if (res.status === 429)
        throw new Error(`${label} is rate-limiting this client; try again in a minute.`);
    if (!res.ok)
        throw new Error(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
async function urGlobalping(path, init = {}) {
    let res;
    try {
        res = await fetch(`${UR_GP}${path}`, {
            method: init.method ?? "GET",
            headers: {
                "User-Agent": UR_UA,
                Accept: "application/json",
                ...(init.body ? { "Content-Type": "application/json" } : {}),
            },
            body: init.body ? JSON.stringify(init.body) : undefined,
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new Error(`Could not reach the global measurement network: ${e.message}`);
    }
    if (res.status === 429)
        throw new Error("The global measurement network is rate-limiting this client; try again in a minute.");
    if (!res.ok) {
        const detail = (await res.text()).slice(0, 200);
        throw new Error(`The global measurement network returned HTTP ${res.status}: ${detail}`);
    }
    return await res.json();
}
// The measurement network takes a hostname plus a path, not a full URL, and the
// scheme picks the protocol it dials.
function urTarget(raw) {
    const text = String(raw ?? "").trim();
    if (!text)
        throw new Error("Give a URL to check, for example https://example.com.");
    const withScheme = /^https?:\/\//i.test(text) ? text : `https://${text}`;
    let parsed;
    try {
        parsed = new URL(withScheme);
    }
    catch {
        throw new Error(`"${text}" is neither a URL nor a hostname.`);
    }
    if (!parsed.hostname)
        throw new Error(`"${text}" has no hostname to check.`);
    return {
        host: parsed.hostname,
        path: `${parsed.pathname || "/"}${parsed.search || ""}`,
        protocol: parsed.protocol === "http:" ? "HTTP" : "HTTPS",
        shown: withScheme,
    };
}
function urResultLine(entry) {
    const probe = entry?.probe ?? {};
    const result = entry?.result ?? {};
    const where = [probe.country, probe.city].filter(Boolean).join(", ") || "location not published";
    const network = String(probe.network ?? "network not published");
    const ms = typeof result?.timings?.total === "number" ? `${Math.round(result.timings.total)} ms` : "no timing";
    const code = result?.statusCode ? `HTTP ${result.statusCode}${result.statusCodeName ? ` ${result.statusCodeName}` : ""}` : "no HTTP status";
    const state = result?.status === "finished" ? code : `${code} (${String(result?.status ?? "failed")})`;
    return { where, network, ms, state, ok: Boolean(result?.statusCode && result.statusCode < 400), probe };
}
/**
 * The same URL fetched from probes in several countries at once, so a fault that
 * only exists in one region is visible instead of hiding behind one vantage point.
 */
export async function multiRegionCheck(args) {
    const target = urTarget(args?.url);
    const nodes = Math.min(Math.max(Number(args?.nodes ?? 4) || 4, 1), 8);
    const created = await urGlobalping("/measurements", {
        method: "POST",
        body: {
            type: "http",
            target: target.host,
            locations: [{ magic: "World" }],
            limit: nodes,
            measurementOptions: {
                protocol: target.protocol,
                request: { method: "GET", path: target.path },
            },
        },
    });
    const id = created?.id;
    if (!id)
        throw new Error("The measurement network accepted the request but returned no id to poll.");
    let measurement = null;
    for (let attempt = 0; attempt < 20; attempt += 1) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        const polled = await urGlobalping(`/measurements/${encodeURIComponent(id)}`);
        if (polled?.status === "finished" || polled?.status === "failed") {
            measurement = polled;
            break;
        }
    }
    if (!measurement)
        throw new Error("The measurement did not finish within 30 seconds; the network was probably busy, so try again.");
    const entries = Array.isArray(measurement.results) ? measurement.results : [];
    if (!entries.length)
        throw new Error("The measurement network returned no probe results for that URL.");
    const rows = entries.map(urResultLine);
    const ok = rows.filter((r) => r.ok);
    const failed = rows.filter((r) => !r.ok);
    const timings = rows
        .map((r) => Number.parseInt(String(r.ms), 10))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
    const median = timings.length
        ? timings.length % 2
            ? timings[(timings.length - 1) / 2]
            : Math.round((timings[timings.length / 2 - 1] + timings[timings.length / 2]) / 2)
        : null;
    const countries = new Set(rows.map((r) => r.probe?.country).filter(Boolean));
    return [
        `Multi-region check of ${target.shown}`,
        `  requested ${target.protocol} ${target.host}${target.path === "/" ? "" : target.path} from ${nodes} probe(s)`,
        `  ${rows.length} probe(s) answered from ${countries.size} country(ies); ${ok.length} reached it, ${failed.length} did not`,
        median === null ? "  no probe reported a timing" : `  median response time ${median} ms, range ${timings[0]}–${timings[timings.length - 1]} ms`,
        "",
        "Probe                       Network                       Status                      Time",
        ...rows
            .slice()
            .sort((a, b) => (a.ok === b.ok ? String(a.where).localeCompare(String(b.where)) : a.ok ? -1 : 1))
            .map((r) => `  ${String(r.where).slice(0, 26).padEnd(26)} ${String(r.network).slice(0, 28).padEnd(29)} ${String(r.state).slice(0, 26).padEnd(27)} ${r.ms}`),
        ...(failed.length
            ? [
                "",
                "Even the failures are region-specific evidence: a probe that could not connect says something different from a probe that got an HTTP error, and only the code shows which one happened.",
            ]
            : []),
        "",
        "Each row is an independent volunteer probe, so its country and network describe where the request came from, not where the site is hosted. Probe choice is random within the requested spread, so two runs are not directly comparable and a single failing probe is not proof of an outage.",
    ].join("\n");
}
/**
 * How UptimeRobot's own service has been behaving, from its public status board:
 * every monitor it publishes, its uptime ratio over the whole window and over 30
 * and 90 days, and the days it was not at full availability.
 */
export async function vendorUptime(args) {
    const limit = Math.min(Math.max(Number(args?.limit ?? 8) || 8, 1), 20);
    const board = await urJson(`${UR_STATUS}/getMonitorList/${UR_BOARD}`, "UptimeRobot's public status board");
    const monitors = board.data ?? board.psp?.monitors ?? [];
    if (!monitors.length)
        throw new Error("UptimeRobot's status board published no monitors.");
    const days = board.days ?? [];
    const stats = board.statistics ?? {};
    const rows = monitors.map((m) => {
        const daily = (m.dailyRatios ?? []).map((d) => ({
            date: String(d.date ?? ""),
            ratio: Number(d.ratio ?? 0),
            label: d.label ?? "not reported",
        }));
        const imperfect = daily.filter((d) => d.ratio < 100);
        const worst = daily.reduce((low, d) => (!low || d.ratio < low.ratio ? { date: d.date, ratio: d.ratio } : low), null);
        return { monitor: m, daily, imperfect, worst };
    });
    const down = rows.filter((r) => String(r.monitor.statusClass ?? "") !== "success");
    const sorted = [...rows].sort((a, b) => (a.monitor.ratio ? Number(a.monitor.ratio) : 999) - (b.monitor.ratio ? Number(b.monitor.ratio) : 999));
    return [
        "UptimeRobot's own service record",
        `  window: ${days.length ? `${days[0]} to ${days[days.length - 1]}` : "dates not published"} (${days.length} day(s))`,
        `  ${monitors.length} monitor(s) published | ${stats.count_result ?? "summary not published"}: ${stats.counts?.up ?? 0} up, ${stats.counts?.down ?? 0} down, ${stats.counts?.paused ?? 0} paused`,
        stats.latest_downtime ? `  most recent downtime: ${JSON.stringify(stats.latest_downtime).slice(0, 200)}` : "  no downtime recorded in the published summary",
        "",
        `Monitors by overall ratio, worst first (${Math.min(limit, rows.length)} of ${rows.length}):`,
        ...sorted.slice(0, limit).map((r, i) => {
            const m = r.monitor;
            return (`  ${String(i + 1).padStart(2)}. ${String(m.name ?? "?").slice(0, 26).padEnd(26)} ${String(m.type ?? "?").padEnd(10)}` +
                ` overall ${String(m.ratio ?? "not reported").padStart(7)}%  30d ${String(m["30dRatio"] ?? "-").padStart(7)}%  90d ${String(m["90dRatio"] ?? "-").padStart(7)}%` +
                `  ${String(m.statusClass ?? "?") === "success" ? "up" : `state ${m.statusClass}`}  ${r.imperfect.length} imperfect day(s)`);
        }),
        "",
        "Days that were not a clean 100%:",
        ...(rows.some((r) => r.imperfect.length)
            ? rows
                .filter((r) => r.imperfect.length)
                .map((r) => `  ${String(r.monitor.name ?? "?").slice(0, 26).padEnd(26)} worst ${r.worst ? `${r.worst.ratio.toFixed(2)}% on ${r.worst.date}` : "not reported"}` +
                `  days: ${r.imperfect.map((d) => `${d.date.slice(5)} ${d.ratio.toFixed(1)}%`).join(", ")}`)
            : ["  none, every published day on every monitor was a clean 100%"]),
        ...down.length
            ? ["", `Not fully up right now: ${down.map((r) => `${r.monitor.name} (${r.monitor.statusClass})`).join(", ")}`]
            : [],
        "",
        "Ratios are UptimeRobot's own computation over its own checks, and a 100% day can still hide short blips below its sampling interval. These are UptimeRobot's corporate services, which are not the same thing as the monitors a paying account creates, so a clean board here says nothing about your own monitors.",
    ].join("\n");
}
