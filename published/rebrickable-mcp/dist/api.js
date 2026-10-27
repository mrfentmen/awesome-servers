/**
 * Rebrickable API v3 client. Needs REBRICKABLE_API_KEY
 * (free at https://rebrickable.com/api/).
 * Docs: https://rebrickable.com/downloads/
 */
const BASE = "https://rebrickable.com/api/v3";
export class RebrickableError extends Error {
}
function apiKey() {
    const k = process.env.REBRICKABLE_API_KEY;
    if (!k)
        throw new RebrickableError("Set REBRICKABLE_API_KEY first (free at rebrickable.com/api).");
    return k;
}
async function getJson(path) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}key=${encodeURIComponent(apiKey())}`, {
        headers: { "User-Agent": "rebrickable-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new RebrickableError("Rebrickable refused (401/403). Check API key.");
    if (res.status === 404)
        throw new RebrickableError("Not found.");
    if (!res.ok)
        throw new RebrickableError(`Rebrickable error ${res.status}`);
    return (await res.json());
}
export async function searchSets(query, limit = 5) {
    if (!query.trim())
        throw new RebrickableError("Query is empty.");
    const data = await getJson(`/sets/?search=${encodeURIComponent(query.trim())}&page_size=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((s) => ({
        number: String(s.set_num),
        name: s.name,
        year: s.year,
        parts: s.num_parts,
        image: s.set_img_url,
    }));
}
export async function getSet(number) {
    const clean = number.trim();
    if (!/^[\w-]+$/.test(clean))
        throw new RebrickableError(`Not a set number: "${number}". Try like "75192-1".`);
    const s = await getJson(`/sets/${encodeURIComponent(clean)}/`);
    const lines = [
        `[${s.set_num ?? clean}] ${s.name ?? "(unnamed)"} (${s.year ?? "?"})`,
        `Parts: ${s.num_parts ?? "?"}`,
        s.set_img_url ? `${s.set_img_url}` : "",
        `More: https://rebrickable.com/sets/${s.set_num ?? clean}/`,
    ].filter(Boolean);
    return lines.join("\n");
}
export async function setParts(number, limit = 10) {
    const clean = number.trim();
    if (!/^[\w-]+$/.test(clean))
        throw new RebrickableError(`Not a set number: "${number}".`);
    const data = await getJson(`/sets/${encodeURIComponent(clean)}/parts/?page_size=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.results) ? data.results : [];
    return rows.slice(0, limit).map((p) => {
        const part = p.part ?? {};
        return `${String(part.part_num ?? "?")} x${p.quantity ?? "?"} — ${String(part.name ?? "").slice(0, 80)} (${p.color?.name ?? "?"})`;
    });
}
export function formatSet(s, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${s.number}] ${s.name ?? "(unnamed)"}${s.year ? ` (${s.year})` : ""}${s.parts !== undefined ? ` — ${s.parts} parts` : ""}${s.image ? `\n   ${s.image}` : ""}`;
}
// ---- muxF tools:
import { gunzipSync } from "node:zlib";
const DOWNLOADS = "https://cdn.rebrickable.com/media/downloads";
const MAX_CSV_BYTES = 12 * 1024 * 1024;
const MAX_ROWS = 40000;
export class RebrickableDataError extends Error {
}
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i += 1) {
        const c = text[i];
        if (quoted) {
            if (c === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i += 1;
                }
                else
                    quoted = false;
            }
            else
                field += c;
        }
        else if (c === '"')
            quoted = true;
        else if (c === ",") {
            row.push(field);
            field = "";
        }
        else if (c === "\n") {
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
        }
        else if (c !== "\r")
            field += c;
        if (rows.length > MAX_ROWS)
            break;
    }
    if (field !== "" || row.length) {
        row.push(field);
        rows.push(row);
    }
    return rows;
}
const cache = new Map();
async function loadCsv(name) {
    const hit = cache.get(name);
    if (hit)
        return hit;
    const res = await fetch(`${DOWNLOADS}/${name}.csv.gz`, {
        headers: { "User-Agent": "rebrickable-mcp/1.0", Accept: "application/gzip" },
        signal: AbortSignal.timeout(60000),
    });
    if (!res.ok)
        throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz returned ${res.status}`);
    const bytes = new Uint8Array(await res.arrayBuffer());
    if (bytes.byteLength > MAX_CSV_BYTES) {
        throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz is larger than this server will parse`);
    }
    const rows = parseCsv(gunzipSync(Buffer.from(bytes)).toString("utf8"));
    const header = rows.shift() ?? [];
    if (!header.length)
        throw new RebrickableDataError(`Rebrickable download ${name}.csv.gz parsed empty`);
    cache.set(name, rows);
    return rows;
}
function bounded(value, min, max, fallback) {
    const n = Math.floor(Number(value));
    if (!Number.isFinite(n))
        return fallback;
    return Math.max(min, Math.min(n, max));
}
function median(values) {
    if (!values.length)
        return null;
    const sorted = [...values].sort((a, b) => a - b);
    const mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}
function hex(rgb) {
    const clean = (rgb ?? "").trim();
    if (!/^[0-9A-Fa-f]{6}$/.test(clean))
        return "not reported";
    return `#${clean.toUpperCase()}`;
}
let themeIndex = null;
async function themes() {
    if (themeIndex)
        return themeIndex;
    const raw = await loadCsv("themes");
    const map = new Map();
    for (const r of raw) {
        const id = Number(r[0]);
        if (!Number.isFinite(id))
            continue;
        const parent = r[2] ? Number(r[2]) : null;
        map.set(id, { name: (r[1] ?? "").trim() || `theme ${id}`, parent: Number.isFinite(parent) ? parent : null });
    }
    themeIndex = map;
    return map;
}
async function setRows() {
    const raw = await loadCsv("sets");
    const out = [];
    for (const r of raw) {
        if (r.length < 5)
            continue;
        const year = Number(r[2]);
        const theme = Number(r[3]);
        const parts = Number(r[4]);
        out.push({
            setNum: (r[0] ?? "").trim(),
            name: (r[1] ?? "").trim(),
            year: Number.isFinite(year) ? year : 0,
            theme: Number.isFinite(theme) ? theme : -1,
            parts: Number.isFinite(parts) ? parts : 0,
        });
    }
    return out;
}
function label(themes, id) {
    return themes.get(id)?.name ?? `theme ${id}`;
}
function chain(themes, id) {
    const parts = [];
    let cursor = id;
    for (let hop = 0; hop < 8 && cursor != null; hop += 1) {
        parts.unshift(themes.get(cursor)?.name ?? `theme ${cursor}`);
        cursor = themes.get(cursor)?.parent ?? null;
    }
    return parts.join(" > ");
}
/** The colour table Rebrickable publishes: how common each colour is, its hex, and when it was in use. */
export async function colorRoster(args) {
    const limit = bounded(args.limit, 1, 60, 20);
    const minSets = bounded(args.minSets, 0, 1000000, 0);
    const raw = await loadCsv("colors");
    let rows = raw
        .map((r) => ({
        name: (r[1] ?? "").trim(),
        rgb: r[2] ?? "",
        trans: String(r[3] ?? "").toLowerCase() === "true",
        parts: Number(r[4]) || 0,
        sets: Number(r[5]) || 0,
        y1: Number(r[6]) || 0,
        y2: Number(r[7]) || 0,
    }))
        .filter((c) => c.name);
    if (typeof args.transparent === "boolean")
        rows = rows.filter((c) => c.trans === args.transparent);
    if (minSets)
        rows = rows.filter((c) => c.sets >= minSets);
    rows.sort((a, b) => b.sets - a.sets || a.name.localeCompare(b.name));
    if (!rows.length)
        return "No colours in Rebrickable's table match that filter.";
    const rarest = [...rows].sort((a, b) => a.sets - b.sets).slice(0, 3);
    return [
        `Rebrickable colour table: ${raw.length} colours, ${rows.length} after the filter`,
        `Most used (top ${Math.min(limit, rows.length)}):`,
        ...rows.slice(0, limit).map((c) => `- ${c.name} ${hex(c.rgb)}${c.trans ? " (transparent)" : ""}: ${c.sets.toLocaleString()} set(s), ${c.parts.toLocaleString()} part(s)${c.y1 ? `, ${c.y1}-${c.y2}` : ""}`),
        rarest.length ? `Rarest in this filtered set: ${rarest.map((c) => `${c.name} (${c.sets} set(s))`).join(", ")}` : "",
        "Counts are Rebrickable's own tallies from its published colour table.",
    ].filter(Boolean).join("\n");
}
