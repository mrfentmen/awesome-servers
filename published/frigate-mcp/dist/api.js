/**
 * Frigate NVR HTTP API client. Points at any instance via FRIGATE_URL
 * (default http://localhost:5000). No auth by default; if behind a
 * proxy, set FRIGATE_USER + FRIGATE_PASSWORD (basic auth).
 * Docs: https://docs.frigate.video/integrations/api/
 */
const BASE = (process.env.FRIGATE_URL ?? "http://localhost:5000").replace(/\/+$/, "");
export class FrigateError extends Error {
}
function headers() {
    const h = { "User-Agent": "frigate-mcp/1.0", Accept: "application/json" };
    if (process.env.FRIGATE_USER && process.env.FRIGATE_PASSWORD) {
        h.Authorization = `Basic ${Buffer.from(`${process.env.FRIGATE_USER}:${process.env.FRIGATE_PASSWORD}`).toString("base64")}`;
    }
    return h;
}
async function getJson(path) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            headers: headers(),
            signal: AbortSignal.timeout(20000),
        });
    }
    catch {
        throw new FrigateError(`Frigate at ${BASE} is unreachable. Set FRIGATE_URL.`);
    }
    if (res.status === 401 || res.status === 403)
        throw new FrigateError("Frigate refused (401/403). Check credentials.");
    if (res.status === 404)
        throw new FrigateError("Not found.");
    if (!res.ok)
        throw new FrigateError(`Frigate error ${res.status}`);
    return (await res.json());
}
export async function serverVersion() {
    const v = await getJson("/api/version");
    return `Frigate ${String(v ?? "?")}`;
}
export async function stats() {
    const s = await getJson("/api/stats");
    const cams = s.cameras ?? {};
    const names = Object.keys(cams);
    const det = (s.detectors ?? {});
    const detNames = Object.keys(det);
    const lines = [
        `Uptime: ${s.service?.uptime !== undefined ? `${Math.round(Number(s.service.uptime) / 3600)}h` : "?"}`,
        `Cameras (${names.length}): ${names.join(", ") || "(none)"}`,
        `Detection FPS: ${s.detection_fps ?? "?"}`,
        detNames.length ? `Detectors: ${detNames.map((d) => `${d} (${det[d]?.inference_speed ?? "?"}ms)`).join(", ")}` : "",
    ].filter(Boolean);
    return lines.join("\n");
}
export async function recentEvents(camera = "", limit = 10) {
    const qs = new URLSearchParams({ limit: String(Math.min(Math.max(limit, 1), 100)) });
    if (camera.trim())
        qs.set("cameras", camera.trim());
    const rows = await getJson(`/api/events?${qs}`);
    return rows.slice(0, limit).map((e) => ({
        id: String(e.id),
        camera: e.camera,
        label: e.label,
        score: typeof e.top_score === "number" ? Math.round(e.top_score * 100) / 100 : undefined,
        start: e.start_time ? new Date(Number(e.start_time) * 1000).toISOString().slice(0, 16).replace("T", " ") : undefined,
        hasClip: e.has_clip,
    }));
}
export function formatEvent(e, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${e.id}] ${e.label ?? "event"} on ${e.camera ?? "?"}${e.score !== undefined ? ` (${e.score})` : ""}${e.start ? ` at ${e.start}` : ""}${e.hasClip ? " [clip]" : ""}`;
}
// ---- muxE tools:
// recent_events prints one line per detection, which is fine for a handful and
// unusable for a few hundred: a car parked in view for an hour reads as a
// hundred separate events, and the confidence score that decides whether any of
// them were real is never gathered up. Frigate itself is self-hosted and there
// is no instance to probe from here, so these three read the event objects the
// caller already has and derive what a flat list cannot show. No network call.
import { z } from "zod";
// The subset of the Frigate /api/events object these tools read. passthrough
// everywhere, because the real record carries many more fields and a strict
// schema would reject a perfectly good payload.
const Event = z
    .object({
    id: z.string().optional(),
    camera: z.string().optional(),
    label: z.string().optional(),
    sub_label: z.string().optional(),
    score: z.number().optional(),
    top_score: z.number().optional(),
    average_score: z.number().optional(),
    start_time: z.number().optional(),
    end_time: z.number().optional(),
    has_clip: z.boolean().optional(),
    has_snapshot: z.boolean().optional(),
    has_been_reviewed: z.boolean().optional(),
    zones: z.array(z.string()).optional(),
})
    .passthrough();
// Frigate carries several confidence figures and they mean different things, so
// the one being reported is always named rather than implied.
function confidence(e) {
    const cands = [
        ["top_score", e.top_score],
        ["score", e.score],
        ["average_score", e.average_score],
    ];
    for (const [name, v] of cands) {
        if (typeof v === "number" && Number.isFinite(v))
            return { value: v, source: name };
    }
    return null;
}
const stamp = (sec) => {
    const ms = sec < 1e11 ? sec * 1000 : sec; // seconds, unless it is already ms
    const d = new Date(ms);
    if (Number.isNaN(d.getTime()))
        return `unreadable time ${sec}`;
    return d.toISOString().replace("T", " ").slice(0, 19) + "Z";
};
const hourOf = (sec) => {
    const ms = sec < 1e11 ? sec * 1000 : sec;
    return new Date(ms).getUTCHours();
};
const DAY = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
function median(values) {
    if (!values.length)
        return null;
    const s = [...values].sort((a, b) => a - b);
    const mid = s.length >> 1;
    return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
}
function groupBy(rows, key) {
    const out = new Map();
    for (const row of rows) {
        const k = key(row);
        const list = out.get(k) ?? [];
        list.push(row);
        out.set(k, list);
    }
    return out;
}
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "n/a");
function statsBy(rows, keyFn) {
    const out = new Map();
    for (const e of rows) {
        const k = keyFn(e) || "unlabelled";
        let s = out.get(k);
        if (!s) {
            s = { label: k, count: 0, scores: [], median: null, min: null, max: null, reviewed: 0, withClip: 0, withSnapshot: 0, cameras: new Map(), subs: new Map() };
            out.set(k, s);
        }
        s.count += 1;
        const c = confidence(e);
        if (c)
            s.scores.push(c.value);
        if (e.has_been_reviewed)
            s.reviewed += 1;
        if (e.has_clip)
            s.withClip += 1;
        if (e.has_snapshot)
            s.withSnapshot += 1;
        if (e.camera)
            s.cameras.set(e.camera, (s.cameras.get(e.camera) ?? 0) + 1);
        if (e.sub_label)
            s.subs.set(e.sub_label, (s.subs.get(e.sub_label) ?? 0) + 1);
    }
    for (const s of out.values()) {
        s.median = median(s.scores);
        s.min = s.scores.length ? Math.min(...s.scores) : null;
        s.max = s.scores.length ? Math.max(...s.scores) : null;
    }
    return out;
}
const describe = (s, total) => {
    const lines = [
        `  ${s.label}: ${s.count} event${s.count === 1 ? "" : "s"} (${pct(s.count, total)})`,
        `    confidence ${s.median === null ? "unknown" : `median ${s.median.toFixed(3)}`}${s.min !== null && s.max !== null ? `, range ${s.min.toFixed(3)} to ${s.max.toFixed(3)}` : ""}${s.scores.length < s.count ? `, ${s.count - s.scores.length} with no score field` : ""}`,
    ];
    if (s.reviewed)
        lines.push(`    ${s.reviewed} already reviewed, so ${pct(s.reviewed, s.count)} of this label has a human verdict`);
    if (s.withClip)
        lines.push(`    ${s.withClip} with a saved clip, ${s.count - s.withClip} without`);
    const cams = [...s.cameras.entries()].sort((a, b) => b[1] - a[1]);
    if (cams.length > 1)
        lines.push(`    cameras: ${cams.map(([c, n]) => `${c} (${n})`).join(", ")}`);
    else if (cams.length === 1)
        lines.push(`    only on ${cams[0][0]}`);
    const subs = [...s.subs.entries()].sort((a, b) => b[1] - a[1]);
    if (subs.length)
        lines.push(`    sub-labels: ${subs.map(([s2, n]) => `${s2} (${n})`).join(", ")}`);
    return lines;
};
function usable(rows) {
    const withTime = [];
    let without = 0;
    for (const e of rows) {
        if (typeof e.start_time === "number" && Number.isFinite(e.start_time))
            withTime.push(e);
        else
            without += 1;
    }
    return { withTime, without };
}
export function analyze_events(args) {
    const rows = args?.events;
    if (!Array.isArray(rows) || !rows.length) {
        return "Pass an array of Frigate event objects, the records behind a recent_events call.";
    }
    const scored = rows.filter((e) => e && typeof e === "object" && confidence(e));
    const lines = [
        "What a batch of Frigate detections adds up to, rather than one line per event:",
        `  events: ${rows.length}, of which ${scored.length} ${scored.length === 1 ? "carries" : "carry"} a confidence figure${scored.length < rows.length ? ` and ${rows.length - scored.length} ${rows.length - scored.length === 1 ? "carries" : "carry"} none` : ""}.`,
    ];
    if (!scored.length) {
        lines.push("  nothing here can be scored, so no confidence, camera or time statement can be made.");
        return lines.join("\n");
    }
    const total = scored.length;
    const byLabel = statsBy(scored, (e) => String(e.label ?? ""));
    const ranked = [...byLabel.values()].sort((a, b) => b.count - a.count);
    lines.push(`  ${ranked.length} label${ranked.length === 1 ? "" : "s"}, ranked by volume:`);
    for (const s of ranked)
        lines.push(...describe(s, total));
    // A label that is mostly low-confidence and mostly unreviewed is the usual
    // false positive profile, and it is worth naming explicitly rather than
    // leaving the reader to do the arithmetic.
    lines.push("");
    lines.push("  what that suggests:");
    for (const s of ranked) {
        if (s.median === null || s.count < 2)
            continue;
        const lowShare = s.scores.filter((v) => v < 0.5).length / s.scores.length;
        const unreviewedShare = (s.count - s.reviewed) / s.count;
        if (lowShare > 0.5 && unreviewedShare > 0.5) {
            lines.push(`    ${s.label} looks like a false positive candidate: ${(lowShare * 100).toFixed(0)}% of its detections score under 0.50 and ${(unreviewedShare * 100).toFixed(0)}% have never been reviewed, so nobody has yet confirmed any of them.`);
        }
        else if (s.median >= 0.8 && s.reviewed / s.count > 0.5) {
            lines.push(`    ${s.label} looks healthy: a median of ${s.median.toFixed(2)} with most detections already reviewed.`);
        }
    }
    const camCount = new Set(scored.map((e) => e.camera).filter(Boolean)).size;
    lines.push("");
    lines.push(`  across ${camCount} camera${camCount === 1 ? "" : "s"}.`);
    const all = scored.map((e) => confidence(e).value);
    const med = median(all);
    lines.push(`  every label together: median confidence ${med === null ? "unknown" : med.toFixed(3)}, ${all.filter((v) => v >= 0.8).length} at or above 0.80, ${all.filter((v) => v < 0.5).length} below 0.50.`);
    if (camCount > 1) {
        // Cameras are the usual culprit behind a flood, so the busiest one is named.
        const perCam = [...statsBy(scored, (e) => String(e.camera ?? "")).values()].sort((a, b) => b.count - a.count);
        const top = perCam[0];
        if (top && top.count / total > 0.6 && perCam.length > 1) {
            lines.push(`  ${top.label} alone produced ${pct(top.count, total)} of these events, so a problem here is more likely that one camera than the detector.`);
        }
    }
    return lines.join("\n");
}
export function event_timeline(args) {
    const rows = args?.events;
    if (!Array.isArray(rows) || !rows.length)
        return "Pass an array of Frigate event objects.";
    const gap = Math.max(1, Math.floor(Number(args?.gapMinutes ?? 5) || 5));
    const { withTime, without } = usable(rows.filter((e) => e && typeof e === "object"));
    const lines = [
        `Frigate detections grouped into incidents, where a gap of ${gap} minute${gap === 1 ? "" : "s"} or less on the same camera counts as the same incident:`,
        `  events: ${rows.length}, of which ${withTime.length} ${withTime.length === 1 ? "carries" : "carry"} a start time${without ? ` and ${without} ${without === 1 ? "does" : "do"} not, so ${without === 1 ? "it is" : "those are"} left out` : ""}.`,
    ];
    if (withTime.length < 2) {
        lines.push("  at least two timed events are needed to form an incident, so nothing can be grouped here.");
        return lines.join("\n");
    }
    const byCam = groupBy(withTime, (e) => String(e.camera ?? "unknown camera"));
    const gapSec = gap * 60;
    let incidentTotal = 0;
    for (const [cam, camRows] of byCam) {
        const sorted = [...camRows].sort((a, b) => a.start_time - b.start_time);
        const groups = [];
        for (const e of sorted) {
            const last = groups[groups.length - 1];
            if (last && e.start_time - (last[last.length - 1].end_time ?? last[last.length - 1].start_time ?? e.start_time) <= gapSec) {
                last.push(e);
            }
            else {
                groups.push([e]);
            }
        }
        incidentTotal += groups.length;
        const linesForCam = [`  ${cam}: ${sorted.length} event${sorted.length === 1 ? "" : "s"} became ${groups.length} incident${groups.length === 1 ? "" : "s"}`];
        const biggest = groups.map((g) => ({ g, n: g.length, start: g[0].start_time })).sort((a, b) => b.n - a.n);
        for (const { g, n, start } of biggest.slice(0, 6)) {
            const lastE = g[g.length - 1];
            const dur = typeof lastE.end_time === "number" ? Math.round(lastE.end_time - start) : null;
            const labels = [...new Set(g.map((e) => e.label).filter(Boolean))].join(", ") || "unlabelled";
            const scores = g.map((e) => confidence(e)?.value).filter((v) => v !== undefined);
            const top = scores.length ? Math.max(...scores) : null;
            linesForCam.push(`    ${stamp(start)}${dur !== null && dur > 0 ? ` lasting ${dur}s` : ""} — ${n} event${n === 1 ? "" : "s"} of ${labels}${top !== null ? `, best score ${top.toFixed(2)}` : ""}`);
        }
        const hidden = groups.length - biggest.slice(0, 6).length;
        if (hidden > 0)
            linesForCam.push(`    and ${hidden} further incident${hidden === 1 ? "" : "s"} not listed`);
        if (groups.length < sorted.length) {
            const collapse = (1 - groups.length / sorted.length) * 100;
            linesForCam.push(`    grouping collapsed ${sorted.length} rows into ${groups.length}, so ${collapse.toFixed(0)}% of what Frigate listed was the same thing seen again.`);
        }
        lines.push(...linesForCam);
    }
    lines.push(`  across all cameras: ${withTime.length} timed events became ${incidentTotal} incidents.`);
    lines.push("  A long incident with a low best score is usually one object lingering in view rather than a series of real detections, and is the case most worth tuning a threshold against.");
    return lines.join("\n");
}
export function threshold_advice(args) {
    const rows = args?.events;
    if (!Array.isArray(rows) || !rows.length)
        return "Pass an array of Frigate event objects.";
    const scored = rows.filter((e) => e && typeof e === "object" && confidence(e));
    if (!scored.length)
        return "None of these events carry a confidence figure, so no threshold can be advised.";
    const want = (args.label ?? "").trim();
    const target = want ? scored.filter((e) => String(e.label ?? "") === want) : scored;
    if (!target.length)
        return `No scored event carries the label "${want}". Labels present: ${[...new Set(scored.map((e) => String(e.label ?? "?")))].sort().join(", ")}`;
    const threshold = Number.isFinite(Number(args.threshold)) ? Number(args.threshold) : 0.5;
    if (threshold < 0 || threshold > 1)
        return `A threshold of ${threshold} is outside 0 to 1, which is the range a Frigate confidence score occupies.`;
    const head = want
        ? `Where to put the confidence threshold for ${want}, read from ${target.length} of the ${scored.length} scored events:`
        : `Where to put the confidence threshold across all labels, read from ${target.length} scored events:`;
    const lines = [head];
    const kept = target.filter((e) => confidence(e).value >= threshold);
    const dropped = target.length - kept.length;
    lines.push(`  at ${threshold.toFixed(2)}: ${kept.length} event${kept.length === 1 ? "" : "s"} kept, ${dropped} dropped (${pct(dropped, target.length)} of the batch would disappear).`);
    const perLabel = [...statsBy(target, (e) => String(e.label ?? "")).values()].sort((a, b) => b.count - a.count);
    lines.push(`  ${"threshold".padEnd(11)}${perLabel.map((s) => s.label.slice(0, 12).padEnd(13)).join("")}events left`);
    for (let t = 0.2; t <= 0.95; t += 0.05) {
        const cells = perLabel.map((s) => {
            const n = s.scores.filter((v) => v >= t).length;
            return `${n}/${s.count}`.padEnd(13);
        });
        const total = target.filter((e) => confidence(e).value >= t).length;
        lines.push(`  ${t.toFixed(2).padEnd(11)}${cells.join("")}${total}`);
    }
    // The cliff is the biggest single drop between adjacent steps, which is where
    // a threshold costs least and removes most of the noise.
    const counts = new Map();
    for (let t = 0.2; t <= 0.95; t += 0.05)
        counts.set(Math.round(t * 100) / 100, target.filter((e) => confidence(e).value >= t).length);
    let cliff = { from: 0, to: 0, drop: 0, share: 0 };
    const steps = [...counts.keys()].sort((a, b) => a - b);
    for (let i = 0; i < steps.length - 1; i += 1) {
        const from = steps[i];
        const to = steps[i + 1];
        const drop = (counts.get(from) ?? 0) - (counts.get(to) ?? 0);
        const share = target.length > 0 ? drop / target.length : 0;
        if (drop > cliff.drop)
            cliff = { from, to, drop, share };
    }
    if (cliff.drop > 0) {
        lines.push(`  the sharpest drop is between ${cliff.from.toFixed(2)} and ${cliff.to.toFixed(2)}, which removes ${cliff.drop} event${cliff.drop === 1 ? "" : "s"} and ${(cliff.share * 100).toFixed(0)}% of the batch in one step, so that is the cheapest place to put a threshold.`);
    }
    else {
        lines.push("  there is no step where a large group of events disappears, so no threshold will buy much here; the detections are too evenly spread to separate by score alone.");
    }
    const belowAll = target.filter((e) => confidence(e).value < 0.2).length;
    if (belowAll)
        lines.push(`  ${belowAll} event${belowAll === 1 ? "" : "s"} score under 0.20, and no positive threshold will ever remove them, so they are a filtering problem rather than a threshold one.`);
    const reviewedKept = kept.filter((e) => e.has_been_reviewed).length;
    if (kept.length) {
        lines.push(`  of the ${kept.length} you would keep, ${reviewedKept} ${reviewedKept === 1 ? "has" : "have"} already been reviewed${reviewedKept ? ", so that part of the set is known good" : ", so none of the kept set has a human verdict yet"}.`);
    }
    const { withTime, without } = usable(target.filter((e) => confidence(e).value >= threshold));
    if (withTime.length) {
        const byHour = new Map();
        for (const e of withTime) {
            const h = hourOf(e.start_time);
            byHour.set(h, (byHour.get(h) ?? 0) + 1);
        }
        const busiest = [...byHour.entries()].sort((a, b) => b[1] - a[1]).slice(0, 3);
        lines.push(`  among what survives, the busiest hours in UTC are ${busiest.map(([h, n]) => `${String(h).padStart(2, "0")}:00 (${n})`).join(", ")}.`);
        const dow = new Map();
        for (const e of withTime)
            dow.set(new Date(e.start_time * 1000).getUTCDay(), (dow.get(new Date(e.start_time * 1000).getUTCDay()) ?? 0) + 1);
        const topDay = [...dow.entries()].sort((a, b) => b[1] - a[1])[0];
        if (topDay)
            lines.push(`  and the busiest weekday is ${DAY[topDay[0]]} with ${topDay[1]}, so a schedule that only watches that day would keep ${pct(topDay[1], withTime.length)} of the survivors.`);
    }
    else if (without) {
        lines.push(`  none of the survivors carry a start time, so their hours of the day cannot be shown.`);
    }
    lines.push("  Scores here are the events' own top_score, falling back to score and then average_score, and the count says nothing about whether a kept event was ever a real one unless it has been reviewed.");
    return lines.join("\n");
}
