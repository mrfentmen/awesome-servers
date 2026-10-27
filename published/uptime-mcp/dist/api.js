const UA = "mrfentmen-uptime-mcp/1.0 (https://github.com/mrfentmen)";
export class UptimeError extends Error {
}
export async function check(args) {
    const raw = (args.url ?? "").trim();
    if (!raw)
        throw new UptimeError("Provide a URL like https://example.com");
    const url = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed;
    try {
        parsed = new URL(url);
    }
    catch {
        throw new UptimeError("That URL is not valid");
    }
    const started = Date.now();
    let res;
    try {
        res = await fetch(parsed.toString(), {
            method: "GET",
            redirect: "follow",
            headers: { "User-Agent": UA },
            signal: AbortSignal.timeout(12000),
        });
    }
    catch (e) {
        return `DOWN | ${url}\n  ${e instanceof Error ? e.message : String(e)}`;
    }
    const latency = Date.now() - started;
    const lines = [
        `URL: ${url}`,
        `Status: ${res.status} ${res.statusText}`,
        `Latency: ${latency} ms`,
        `Final URL: ${res.url ?? url}`,
        `Content type: ${res.headers.get("content-type") ?? "n/a"}`,
    ];
    if (res.ok)
        lines.push(`State: UP`);
    else
        lines.push(`State: WARNING (non 2xx status)`);
    return lines.join("\n");
}
// ---- muxB tools:
const DOH = 'https://dns.google/resolve';
const DNS_TYPES = {
    A: 1, NS: 2, CNAME: 5, SOA: 6, PTR: 12, MX: 15, TXT: 16, AAAA: 28, SRV: 33, CAA: 257,
};
const STATUS_PAGES = {
    github: { name: "GitHub", url: "https://www.githubstatus.com/api/v2" },
    cloudflare: { name: "Cloudflare", url: "https://www.cloudflarestatus.com/api/v2" },
    reddit: { name: "Reddit", url: "https://www.redditstatus.com/api/v2" },
};
async function statusEvents(path, field) {
    const response = await fetch(`https://www.githubstatus.com/api/v2/${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000),
    });
    if (!response.ok)
        throw new UptimeError(`GitHub status history returned ${response.status}`);
    const data = await response.json();
    if (!Array.isArray(data[field]))
        throw new UptimeError("GitHub status history did not contain an event list");
    return data[field];
}
export async function maintenanceWindows(args) {
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 5), 20));
    const rows = (await statusEvents("scheduled-maintenances.json", "scheduled_maintenances")).slice(0, limit);
    if (!rows.length)
        return "GitHub publishes no maintenance windows in this response.";
    return "Published GitHub maintenance windows (may include completed work):\n" + rows.map((r, i) => [
        `${i + 1}. ${(r.name ?? "not reported").slice(0, 180)} | ${r.status ?? "not reported"}`,
        `Scheduled from ${r.scheduled_for ?? "not reported"} until ${r.scheduled_until ?? "not reported"}`,
        `Latest update: ${(r.incident_updates?.[0]?.body ?? "not reported").replace(/\s+/g, " ").slice(0, 500)}`,
        r.shortlink ?? "Link not reported",
    ].join("\n")).join("\n\n");
}
