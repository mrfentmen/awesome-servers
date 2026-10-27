/**
 * Colour Contrast — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Colour Contrast";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "color-contrast-mcp", accept },
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
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
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
function parseHex(raw) {
    const m = raw.trim().match(/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i);
    if (!m)
        throw new SourceError(`"${raw}" is not a hex colour like #3366ff`);
    const h = m[1].length === 3 ? m[1].split("").map((c) => c + c).join("") : m[1];
    return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
}
const toHex = (c) => "#" + c.map((v) => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, "0")).join("");
function luminance(c) {
    const ch = c.map((v) => {
        const s = v / 255;
        return s <= 0.03928 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
    });
    return 0.2126 * ch[0] + 0.7152 * ch[1] + 0.0722 * ch[2];
}
function ratio(a, b) {
    const la = luminance(a);
    const lb = luminance(b);
    return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}
export async function contrastRatio(a) {
    const fg = parseHex(a.foreground);
    const bg = parseHex(a.background);
    const r = ratio(fg, bg);
    return [
        `Foreground: ${toHex(fg)}`,
        `Background: ${toHex(bg)}`,
        `Contrast ratio: ${r.toFixed(2)}:1`,
        `AA normal text: ${r >= 4.5 ? "pass" : "fail"}`,
        `AAA normal text: ${r >= 7 ? "pass" : "fail"}`,
    ].join("\n");
}
export async function checkWcag(a) {
    const r = ratio(parseHex(a.foreground), parseHex(a.background));
    const mark = (ok) => (ok ? "pass" : "fail");
    return [
        `Ratio: ${r.toFixed(2)}:1`,
        `AA normal (4.5): ${mark(r >= 4.5)}`,
        `AA large (3.0): ${mark(r >= 3)}`,
        `AAA normal (7.0): ${mark(r >= 7)}`,
        `AAA large (4.5): ${mark(r >= 4.5)}`,
        `UI components (3.0): ${mark(r >= 3)}`,
    ].join("\n");
}
export async function suggestAccessible(a) {
    const fg = parseHex(a.foreground);
    const bg = parseHex(a.background);
    if (ratio(fg, bg) >= a.target)
        return `${toHex(fg)} already meets ${a.target}:1 against ${toHex(bg)} at ${ratio(fg, bg).toFixed(2)}:1.`;
    const bgLum = luminance(bg);
    const darken = bgLum > 0.5;
    for (let step = 1; step <= 100; step++) {
        const factor = 1 - step / 100;
        const candidate = darken
            ? fg.map((v) => v * factor)
            : fg.map((v) => v + (255 - v) * (step / 100));
        const r = ratio(candidate, bg);
        if (r >= a.target) {
            return [
                `Suggested: ${toHex(candidate)} (${darken ? "darker" : "lighter"} than ${toHex(fg)})`,
                `Ratio against ${toHex(bg)}: ${r.toFixed(2)}:1`,
                `Target: ${a.target}:1`,
            ].join("\n");
        }
    }
    return `No pure ${darken ? "darkening" : "lightening"} of ${toHex(fg)} reaches ${a.target}:1 against ${toHex(bg)}; use a different hue.`;
}
