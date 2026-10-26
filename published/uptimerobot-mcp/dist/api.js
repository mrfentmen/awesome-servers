// ---- muxH tools:
// The six existing tools all check something from this one server's vantage
// point. These two answer the two questions that stays blind: how the target
// looks from other countries, and how the monitoring vendor's own service has
// been behaving. Both read public, keyless sources.
const UR_UA = "mcfentmen-uptimerobot-mcp/1.1 (https://github.com/mcfentmen/uptimerobot-mcp)";
const UR_STATUS = "https://status.uptimerobot.com/api";
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
