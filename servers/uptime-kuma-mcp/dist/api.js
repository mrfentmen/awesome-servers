export class KumaError extends Error {
    constructor(message) {
        super(message);
        this.name = "KumaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.UPTIME_KUMA_URL;
    if (!b)
        throw new KumaError("Set UPTIME_KUMA_URL (your Uptime Kuma base URL).");
    return b.replace(/\/$/, "");
}
function headers() {
    const h = { ...UA, Accept: "application/json" };
    if (process.env.UPTIME_KUMA_TOKEN)
        h.Authorization = `Bearer ${process.env.UPTIME_KUMA_TOKEN}`;
    return h;
}
async function get(path, maxChars) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new KumaError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new KumaError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, maxChars);
}
export function getStatus() {
    return get("/api/status", 4000);
}
export function getMetrics() {
    return get("/metrics", 12000);
}
// ---- muxH tools:
// Both existing tools read one self-hosted Uptime Kuma instance, which means they
// can only report on a server the caller already owns. These two need no
// configuration at all: one measures a live URL the way a monitor would, phase by
// phase, and one reads the public Uptime Kuma project so an operator can see what
// they would be upgrading to.
import { lookup } from "node:dns/promises";
import { connect } from "node:tls";
import { performance } from "node:perf_hooks";
const UK_UA = "mcfentmen-uptime-kuma-mcp/1.1 (https://github.com/mcfentmen/uptime-kuma-mcp)";
const UK_REPO = "https://api.github.com/repos/louislam/uptime-kuma";
async function ukGet(path, label) {
    let res;
    try {
        res = await fetch(`${UK_REPO}${path}`, {
            headers: { "User-Agent": UK_UA, Accept: "application/vnd.github+json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new KumaError(`Could not reach ${label}: ${e.message}`);
    }
    if (res.status === 403 || res.status === 429) {
        throw new KumaError("GitHub is rate-limiting this client; its public API allows about 60 anonymous requests an hour.");
    }
    if (!res.ok)
        throw new KumaError(`${label} returned HTTP ${res.status}.`);
    return (await res.json());
}
const ms = (value) => (value >= 1000 ? `${(value / 1000).toFixed(2)} s` : `${value.toFixed(0)} ms`);
const daysUntil = (raw) => {
    const t = Date.parse(String(raw ?? ""));
    return Number.isFinite(t) ? Math.round((t - Date.now()) / 86400000) : null;
};
/** Whole days between a timestamp and now, positive when the timestamp is in the past. */
const daysSince = (raw) => {
    const t = Date.parse(String(raw ?? ""));
    return Number.isFinite(t) ? Math.round((Date.now() - t) / 86400000) : null;
};
/**
 * Measures a URL the way a monitor does, phase by phase: name resolution, the TLS
 * handshake and its certificate, then the request itself, repeated so the median
 * can be reported instead of a single lucky sample. No configuration needed, which
 * is what makes it usable when the instance you watch is the thing that is down.
 */
export async function httpProbe(args) {
    const raw = String(args?.url ?? "").trim();
    if (!raw)
        throw new KumaError("Give a URL to measure, for example https://example.com.");
    const runs = Math.min(Math.max(Number(args?.runs ?? 3) || 3, 1), 5);
    const target = /^https?:\/\//i.test(raw) ? raw : `https://${raw}`;
    let parsed;
    try {
        parsed = new URL(target);
    }
    catch {
        throw new KumaError(`"${args.url}" is not a URL.`);
    }
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
        throw new KumaError(`Only http and https can be measured; this URL is ${parsed.protocol}`);
    }
    const host = parsed.hostname;
    const samples = [];
    let lastHeaders = null;
    let dnsMs = null;
    let tlsMs = null;
    let cert = null;
    const failures = [];
    for (let i = 0; i < runs; i += 1) {
        if (i === 0) {
            let mark = performance.now();
            try {
                await lookup(host);
                dnsMs = performance.now() - mark;
            }
            catch (e) {
                failures.push(`name resolution failed: ${e.message}`);
            }
            if (parsed.protocol === "https:") {
                mark = performance.now();
                try {
                    // A socket can emit an error after the handshake resolves, so the
                    // outcome is latched here rather than letting a late error win.
                    let settled = false;
                    const socket = await new Promise((resolve, reject) => {
                        // URL.port is an empty string when the URL names no port, and
                        // Number("") is 0, so the scheme default has to be applied with ||.
                        const port = Number(parsed.port) || (parsed.protocol === "https:" ? 443 : 80);
                        const s = connect({ host, port, servername: host }, () => {
                            settled = true;
                            resolve(s);
                        });
                        s.once("error", (err) => {
                            if (!settled)
                                reject(err);
                        });
                    });
                    tlsMs = performance.now() - mark;
                    const peer = socket.getPeerCertificate();
                    const cn = (value) => (typeof value === "string" && value ? value : undefined);
                    cert = {
                        subject: cn(peer.subject?.CN),
                        issuer: cn(peer.issuer?.O) ?? cn(peer.issuer?.CN),
                        validFrom: cn(peer.valid_from),
                        validTo: cn(peer.valid_to),
                    };
                    socket.destroy();
                }
                catch (e) {
                    const detail = e instanceof Error && e.message ? `${e.message} (${e.name})` : String(e);
                    failures.push(`TLS handshake failed: ${detail}`);
                }
            }
        }
        const mark = performance.now();
        try {
            const res = await fetch(target, {
                method: "GET",
                redirect: "follow",
                headers: { "User-Agent": UK_UA, Accept: "*/*" },
                signal: AbortSignal.timeout(25000),
            });
            const ttfb = performance.now() - mark;
            const body = await res.arrayBuffer();
            samples.push({ total: ttfb, ttfb, status: res.status, bytes: body.byteLength });
            if (i === 0)
                lastHeaders = res.headers;
        }
        catch (e) {
            failures.push(`request failed: ${e.message}`);
        }
    }
    if (!samples.length) {
        return `Could not reach ${parsed.href} in ${runs} attempt(s). ${failures.join("; ") || "No further detail was returned."}`;
    }
    const median = (values) => {
        const sorted = [...values].sort((a, b) => a - b);
        return sorted[Math.floor(sorted.length / 2)];
    };
    const totals = samples.map((s) => s.total);
    const ttfbs = samples.map((s) => s.ttfb);
    const statuses = [...new Set(samples.map((s) => s.status))];
    const last = lastHeaders;
    const grades = totals.map((t) => (t < 500 ? "fast" : t < 1500 ? "acceptable" : t < 3000 ? "slow" : "poor"));
    const certDays = cert?.validTo ? daysUntil(cert.validTo) : null;
    return [
        `Probe of ${parsed.href}`,
        `  ${samples.length} of ${runs} attempt(s) completed, ${failures.length ? `${failures.length} failed: ${failures[0]}` : "none failed"}`,
        "",
        "Phases, measured once on the first attempt:",
        `  name resolution: ${dnsMs === null ? "not measured" : ms(dnsMs)}`,
        `  TLS handshake:   ${parsed.protocol === "https:" ? (tlsMs === null ? "failed" : ms(tlsMs)) : "not applicable, plain http"}`,
        `  time to headers: ${ms(median(ttfbs))} median of ${ttfbs.length}`,
        "",
        "Response:",
        `  status: ${statuses.join(", ")}${statuses.length > 1 ? " (varies between attempts, which is itself a fault)" : ""}`,
        `  body size: ${samples[0].bytes.toLocaleString()} bytes | total per attempt: ${totals.map((t) => ms(t)).join(", ")}`,
        `  median total ${ms(median(totals))}, spread ${ms(Math.max(...totals) - Math.min(...totals))}, judged ${grades[Math.floor(grades.length / 2)]}`,
        `  final URL after redirects: ${last?.get("url") ?? "not reported"}`,
        `  server: ${last?.get("server") ?? "not reported"} | content type: ${last?.get("content-type") ?? "not reported"} | ${last?.get("content-encoding") ?? "no content-encoding header"}`,
        ...(parsed.protocol === "https:"
            ? [
                `  certificate: ${certDays !== null ? `${certDays < 0 ? "EXPIRED " : ""}${Math.abs(certDays)} day(s) ${certDays < 0 ? "ago" : "remaining"}` : "not reported"}`,
                `    subject ${cert?.subject ?? "not reported"} | issuer ${cert?.issuer ?? "not reported"} | valid from ${cert?.validFrom ?? "not reported"}`,
            ]
            : []),
        "",
        "Each attempt is a real GET from wherever this server runs, so the figure is that vantage point's experience and not a global one; a single sample from one network says nothing about users elsewhere. Timing is wall clock with no warm-up, and a cold first attempt carries the DNS and TLS cost the later ones skip.",
    ].join("\n");
}
/**
 * What the Uptime Kuma project itself is doing: the current release and when it
 * shipped, the releases before it, how active the issue tracker is, and what has
 * been touched most recently. An operator deciding whether to upgrade wants this
 * without logging into a dashboard.
 */
export async function releaseWatch(args) {
    const releaseCount = Math.min(Math.max(Number(args?.releases ?? 5) || 5, 1), 15);
    const issueCount = Math.min(Math.max(Number(args?.issues ?? 6) || 6, 1), 20);
    const [releases, issues, repo] = await Promise.all([
        ukGet(`/releases?per_page=${releaseCount}`, "GitHub's release list"),
        ukGet(`/issues?state=open&per_page=${issueCount}&sort=updated&direction=desc`, "GitHub's issue list"),
        ukGet("", "GitHub's repository record"),
    ]);
    const shipped = releases.filter((r) => !r.draft);
    const latest = shipped[0];
    if (!latest)
        throw new KumaError("Uptime Kuma published no non-draft release.");
    const current = latest.tag_name ?? "not reported";
    const published = latest.published_at ?? "not reported";
    const ageDays = daysSince(published);
    const gaps = shipped
        .map((r) => ({ tag: r.tag_name ?? "?", at: Date.parse(String(r.published_at ?? "")) }))
        .filter((r) => Number.isFinite(r.at))
        .map((r, i, all) => (i === 0 ? null : (all[i - 1].at - r.at) / 86400000))
        .filter((g) => g !== null);
    const prs = issues.filter((i) => i.pull_request);
    const bugIssues = issues.filter((i) => i.labels?.some((l) => /bug/i.test(l.name ?? "")));
    return [
        `Uptime Kuma project watch`,
        `  current release: ${current}${latest.name && latest.name !== current ? ` ("${String(latest.name).slice(0, 60)}")` : ""}`,
        `  published ${String(published).slice(0, 10)}${ageDays !== null ? `, ${ageDays} day(s) ago` : ""}${latest.prerelease ? " (marked as a pre-release)" : ""}`,
        `  ${shipped.length} release(s) in view${gaps.length ? `, an average of ${(gaps.reduce((a, b) => a + b, 0) / gaps.length).toFixed(0)} day(s) between them` : ""}`,
        `  repository: ${(repo.stargazers_count ?? 0).toLocaleString()} stars, ${repo.open_issues_count ?? "an unstated number of"} open issues and pull requests combined, last push ${repo.pushed_at ? String(repo.pushed_at).slice(0, 10) : "not reported"}`,
        `  from the most recently updated open items: ${issues.length - prs.length} issue(s) and ${prs.length} pull request(s), ${bugIssues.length} labelled as a bug`,
        "",
        "Recent releases, newest first:",
        ...shipped.map((r, i) => `  ${String(i + 1).padStart(2)}. ${r.tag_name ?? "?"}${r.prerelease ? " (pre-release)" : ""}  ${String(r.published_at ?? "not reported").slice(0, 10)}  ${(r.assets ?? []).length} asset(s)  ${r.html_url ?? "no url"}`),
        "",
        "Most recently updated open items:",
        ...issues.map((item) => {
            const kind = item.pull_request ? "PR " : "issue";
            const labels = (item.labels ?? []).map((l) => l.name).filter(Boolean);
            return `  #${item.number ?? "?"} ${kind} ${String(item.title ?? "untitled").slice(0, 56).padEnd(56)} updated ${String(item.updated_at ?? "?").slice(0, 10)} ${item.comments ?? 0} comment(s)  ${labels.slice(0, 3).join(", ")}`;
        }),
        "",
        ...(latest.body
            ? [`Notes on ${current}:`, String(latest.body).replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim().slice(0, 400), ""]
            : []),
        "This is the public GitHub record of the project, not a statement from the maintainers and not a changelog for your instance. A release existing here does not mean your instance can reach it, and a bug labelled open here is not a promise it affects you.",
    ].join("\n");
}
