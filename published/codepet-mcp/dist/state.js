import { access, chmod, mkdir, readFile, rename, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { homedir } from "node:os";
const defaultPath = join(homedir(), ".codepet", "state.json");
export const statePath = process.env.CODEPET_STATE_FILE || defaultPath;
const initial = { name: "CodePet", level: 1, xp: 0, hunger: 75, happiness: 60, energy: 70, streak: 0, fedLines: 0, fedCount: 0, languages: [], favoriteLang: null, achievements: ["hatch"], ideEvents: 0, history: [] };
function normalize(input) {
    const raw = input && typeof input === "object" ? input : {};
    const num = (key, fallback, lo = 0, hi = Number.MAX_SAFE_INTEGER) => { const value = Number(raw[key]); return Number.isFinite(value) ? Math.max(lo, Math.min(hi, value)) : fallback; };
    const strings = (key, fallback, max) => Array.isArray(raw[key]) ? raw[key].filter((value) => typeof value === "string").slice(0, max) : fallback;
    return {
        ...initial,
        name: typeof raw.name === "string" && raw.name.trim() ? raw.name.slice(0, 24) : initial.name,
        level: Math.max(1, Math.floor(num("level", 1))), xp: num("xp", 0), hunger: num("hunger", 75, 0, 100), happiness: num("happiness", 60, 0, 100), energy: num("energy", 70, 0, 100), streak: Math.floor(num("streak", 0)), fedLines: Math.floor(num("fedLines", 0)), fedCount: Math.floor(num("fedCount", 0)), ideEvents: Math.floor(num("ideEvents", 0)),
        languages: strings("languages", [], 50), achievements: strings("achievements", ["hatch"], 100), history: Array.isArray(raw.history) ? raw.history.filter((value) => value && typeof value === "object").slice(-20) : [], favoriteLang: typeof raw.favoriteLang === "string" ? raw.favoriteLang.slice(0, 40) : null,
    };
}
export async function load() {
    try {
        await access(statePath);
    }
    catch (error) {
        if (error.code === "ENOENT")
            return normalize(initial);
        throw new Error(`Cannot access CodePet state file: ${String(error)}`);
    }
    let parsed;
    try {
        parsed = JSON.parse(await readFile(statePath, "utf8"));
    }
    catch (error) {
        throw new Error(`Cannot parse CodePet state file: ${String(error)}`);
    }
    return normalize(parsed);
}
export async function save(state) { await mkdir(dirname(statePath), { recursive: true }); const temp = `${statePath}.tmp`; await writeFile(temp, JSON.stringify(normalize(state), null, 2) + "\n", { encoding: "utf8", mode: 0o600 }); await chmod(temp, 0o600); await rename(temp, statePath); await chmod(statePath, 0o600); }
export function safeEvent(input) {
    const statuses = new Set(["edited", "tests_passed", "tests_failed", "lint_clean", "lint_failed", "committed", "debugging"]);
    const status = typeof input.status === "string" && statuses.has(input.status) ? input.status : "edited";
    return { language: typeof input.language === "string" ? input.language.slice(0, 40) : "unknown", lines: Math.max(0, Math.min(500, Number(input.lines) || 0)), status, tests: Math.max(0, Math.min(100, Number(input.tests) || 0)), files: Math.max(0, Math.min(100, Number(input.files) || 0)) };
}
export function eventText(state, event) { return `${state.name} noticed ${event.status} activity in ${event.language}: ${event.lines} lines, ${event.tests} tests, ${event.files} files.`; }
// ---------------------------------------------------------------------------
// Derived read-only reports
//
// The pet keeps only the last 20 history events, so every breakdown below is
// explicitly scoped to that window rather than implying whole-life totals.
// ---------------------------------------------------------------------------
function countBy(values) {
    const out = new Map();
    for (const value of values) {
        out.set(value, (out.get(value) ?? 0) + 1);
    }
    return out;
}
function rankedText(counts, limit) {
    return [...counts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, limit)
        .map(([k, n]) => `${k} ${n}`)
        .join(" | ");
}
export async function petProgressReport(_input) {
    const state = await load();
    const history = state.history;
    const byStatus = countBy(history.map((h) => String(h.status ?? "unknown")));
    const byKind = countBy(history.map((h) => String(h.kind ?? "unknown")));
    const times = history
        .map((h) => Date.parse(h.at))
        .filter((n) => Number.isFinite(n))
        .sort((a, b) => a - b);
    const spanDays = times.length >= 2 ? (times[times.length - 1] - times[0]) / 86_400_000 : 0;
    const lines = [
        `${state.name} is level ${state.level} with ${state.xp} XP and ${state.ideEvents} recorded IDE event(s).`,
        `History window holds ${history.length} event(s)${times.length >= 2 ? ` from ${new Date(times[0]).toISOString().slice(0, 10)} to ${new Date(times[times.length - 1]).toISOString().slice(0, 10)}` : " with no usable timestamps"}.`,
        times.length >= 2
            ? `That is ${spanDays < 1 ? "under a day" : `${spanDays.toFixed(1)} day(s)`}, so ${(history.length / Math.max(spanDays, 0.01)).toFixed(1)} event(s) per day across the window.`
            : "A span needs at least two timestamped events, so no rate is reported.",
        `Event kinds: ${rankedText(byKind, 8) || "none recorded"}`,
        `Event statuses: ${rankedText(byStatus, 8) || "none recorded"}`,
        `Tests passed: ${history.filter((h) => h.status === "tests_passed").length} | tests failed: ${history.filter((h) => h.status === "tests_failed").length} | lint clean: ${history.filter((h) => h.status === "lint_clean").length}`,
        `Distinct languages seen: ${state.languages.length}${state.favoriteLang ? ` | favourite: ${state.favoriteLang}` : " | no favourite set"}`,
        `Achievements: ${state.achievements.length ? state.achievements.join(", ") : "none"}`,
        "The state file does not record the XP curve, so no next-level target is estimated here.",
    ];
    return lines.join("\n");
}
export async function languageBreakdown(_input) {
    const state = await load();
    const history = state.history;
    const rows = new Map();
    for (const h of history) {
        const key = h.language ?? "unknown";
        const row = rows.get(key) ?? { events: 0, lines: 0, statuses: new Set(), last: h.at };
        row.events += 1;
        row.lines += h.lines ?? 0;
        row.statuses.add(h.status ?? "unknown");
        if (h.at > row.last)
            row.last = h.at;
        rows.set(key, row);
    }
    if (!rows.size) {
        return `No language appears in the last ${history.length} history event(s), so there is nothing to break down.`;
    }
    const ranked = [...rows.entries()].sort((a, b) => b[1].lines - a[1].lines);
    const totalLines = ranked.reduce((s, [, r]) => s + r.lines, 0);
    return [
        `Language breakdown across the ${history.length} history event(s) CodePet retains:`,
        ...ranked.map(([lang, r], i) => {
            const share = totalLines ? ((r.lines / totalLines) * 100).toFixed(1) : "0.0";
            return `${i + 1}. ${lang} | ${r.events} event(s) | ${r.lines} line(s) (${share}% of window)` +
                ` | statuses: ${[...r.statuses].join(", ")} | last seen ${r.last.slice(0, 10)}`;
        }),
        `Total lines in window: ${totalLines}. Languages known overall: ${state.languages.length}${state.favoriteLang ? ` (favourite ${state.favoriteLang})` : ""}.`,
        "Only the retained history window is covered, not every event ever recorded.",
    ].join("\n");
}
export async function petExport(args) {
    const state = await load();
    const include = args?.include_history !== false;
    const payload = {
        exportedAt: new Date().toISOString(),
        name: state.name,
        level: state.level,
        xp: state.xp,
        hunger: Math.round(state.hunger),
        happiness: Math.round(state.happiness),
        energy: Math.round(state.energy),
        streak: state.streak,
        fedLines: state.fedLines,
        fedCount: state.fedCount,
        languages: state.languages,
        favoriteLang: state.favoriteLang,
        achievements: state.achievements,
        ideEvents: state.ideEvents,
    };
    if (include)
        payload.history = state.history;
    else
        payload.history = `omitted, ${state.history.length} event(s) in the state file`;
    return `CodePet export (${include ? "with" : "without"} history):\n${JSON.stringify(payload, null, 2)}`;
}

export async function findCodingQuests(args = {}) {
    const language = String(args?.language ?? '').trim();
    if (language.length > 40)
        throw new Error('Keep the language under 40 characters.');
    const limit = Math.min(Math.max(Number(args?.limit ?? 5) || 5, 1), 15);
    const q = ['is:issue', 'is:open', 'label:"good first issue"'];
    if (language)
        q.push(`language:${language}`);
    const url = `https://api.github.com/search/issues?q=${encodeURIComponent(q.join(' '))}&sort=updated&order=desc&per_page=${limit}`;
    const res = await fetch(url, {
        headers: { 'User-Agent': 'mrfentmen-codepet-mcp/1.0', Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(30000),
    });
    if (res.status === 403)
        throw new Error('GitHub rate-limited this search; try again in a minute.');
    if (!res.ok)
        throw new Error(`GitHub search returned ${res.status}`);
    const body = (await res.json());
    const items = Array.isArray(body.items) ? body.items : [];
    if (!items.length)
        return `No open good-first-issue reports${language ? ` for ${language}` : ''} right now.`;
    return [
        `${body.total_count ?? items.length} open good-first-issue(s)${language ? ` in ${language}` : ''}, newest ${items.length}:`,
        '',
        ...items.map((it, i) => `${i + 1}. ${it.title}\n   ${it.html_url}\n   ${it.comments ?? 0} comment(s) · updated ${String(it.updated_at ?? '').slice(0, 10)}`),
    ].join('\n');
}
