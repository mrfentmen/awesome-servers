/**
 * Numbers Toolkit — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Numbers Toolkit";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "numbers-mcp", accept },
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
function numbers(values) {
    const list = (values ?? []).filter((v) => typeof v === "number" && Number.isFinite(v));
    if (!list.length)
        throw new SourceError("values must contain at least one finite number");
    if (list.length > 10000)
        throw new SourceError("values accepts at most 10000 numbers");
    return list;
}
function quantile(sorted, q) {
    if (sorted.length === 1)
        return sorted[0];
    const pos = (sorted.length - 1) * q;
    const base = Math.floor(pos);
    const rest = pos - base;
    const next = sorted[base + 1];
    return next === undefined ? sorted[base] : sorted[base] + rest * (next - sorted[base]);
}
function round(value, digits = 6) {
    const factor = 10 ** digits;
    return Math.round(value * factor) / factor;
}
export async function statistics(a) {
    const list = numbers(a.values);
    const sample = a.sample !== false;
    const sorted = [...list].sort((x, y) => x - y);
    const sum = list.reduce((acc, v) => acc + v, 0);
    const mean = sum / list.length;
    const median = quantile(sorted, 0.5);
    const counts = new Map();
    for (const v of list)
        counts.set(v, (counts.get(v) ?? 0) + 1);
    const top = Math.max(...counts.values());
    const modes = [...counts.entries()].filter(([, c]) => c === top && top > 1).map(([v]) => v);
    const denominator = sample ? list.length - 1 : list.length;
    const variance = denominator > 0 ? list.reduce((acc, v) => acc + (v - mean) ** 2, 0) / denominator : 0;
    const stdev = Math.sqrt(variance);
    const q1 = quantile(sorted, 0.25);
    const q3 = quantile(sorted, 0.75);
    return [
        `Summary of ${list.length} number(s)${sample && list.length > 1 ? " (sample statistics)" : list.length === 1 ? " (a single value has no spread)" : " (population statistics)"}:`,
        "",
        `sum ${round(sum)} · mean ${round(mean)}`,
        `min ${sorted[0]} · q1 ${round(q1)} · median ${round(median)} · q3 ${round(q3)} · max ${sorted[sorted.length - 1]}`,
        `range ${round(sorted[sorted.length - 1] - sorted[0])} · iqr ${round(q3 - q1)}`,
        `variance ${round(variance)} · standard deviation ${round(stdev)}`,
        modes.length ? `mode ${modes.map((m) => `${m} (${counts.get(m)} times)`).join(", ")}` : "mode: no value repeats",
        list.length !== (a.values ?? []).length ? `Note: ${(a.values ?? []).length - list.length} value(s) were not finite numbers and were skipped.` : "",
    ].filter(Boolean).join("\n");
}
const ROMAN = [
    [1000, "M"], [900, "CM"], [500, "D"], [400, "CD"], [100, "C"], [90, "XC"],
    [50, "L"], [40, "XL"], [10, "X"], [9, "IX"], [5, "V"], [4, "IV"], [1, "I"],
];
export async function toRoman(a) {
    const value = a.value;
    if (!Number.isInteger(value) || value < 1 || value > 3999)
        throw new SourceError("value must be a whole number from 1 to 3999");
    let remaining = value;
    let out = "";
    for (const [amount, symbol] of ROMAN) {
        while (remaining >= amount) {
            out += symbol;
            remaining -= amount;
        }
    }
    return `${value} in Roman numerals: ${out}\nLength: ${out.length} symbol(s)`;
}
export async function fromRoman(a) {
    const text = clean(a.roman).toUpperCase().replace(/\s+/g, "");
    if (!/^[IVXLCDM]+$/.test(text))
        throw new SourceError("a Roman numeral may only use I, V, X, L, C, D and M");
    const values = { I: 1, V: 5, X: 10, L: 50, C: 100, D: 500, M: 1000 };
    let total = 0;
    for (let i = 0; i < text.length; i++) {
        const current = values[text[i]];
        const next = values[text[i + 1]];
        total += next && next > current ? -current : current;
    }
    if (total < 1 || total > 3999)
        throw new SourceError(`"${text}" is outside the 1-3999 range this tool handles`);
    const canonical = (await toRoman({ value: total })).split(": ")[1].split("\n")[0];
    const valid = canonical === text;
    return [
        `${text} = ${total}`,
        valid ? "This is the standard form." : `Not the standard subtractive form - ${total} is written ${canonical}.`,
    ].join("\n");
}
export async function convertBase(a) {
    const from = a.fromBase;
    const to = a.toBase;
    if (!Number.isInteger(from) || from < 2 || from > 36)
        throw new SourceError("fromBase must be between 2 and 36");
    if (!Number.isInteger(to) || to < 2 || to > 36)
        throw new SourceError("toBase must be between 2 and 36");
    const raw = clean(a.value).toLowerCase().replace(/^0[xbo]/, "").replace(/_/g, "");
    if (!raw)
        throw new SourceError("value must not be empty");
    const digits = "0123456789abcdefghijklmnopqrstuvwxyz";
    let total = 0n;
    const base = BigInt(from);
    for (const ch of raw) {
        const digit = digits.indexOf(ch);
        if (digit < 0 || digit >= from)
            throw new SourceError(`"${ch}" is not a digit in base ${from}`);
        total = total * base + BigInt(digit);
    }
    const out = total.toString(to);
    return [
        `${raw} in base ${from} = ${out} in base ${to}`,
        `decimal: ${total.toString(10)}`,
        `hex: ${total.toString(16)} · binary: ${total.toString(2)}`,
        `digits in the result: ${out.length}`,
    ].join("\n");
}
export async function formatNumber(a) {
    if (!Number.isFinite(a.value))
        throw new SourceError("value must be a finite number");
    const style = clean(a.style || "decimal").toLowerCase();
    if (!["decimal", "percent", "currency", "compact"].includes(style))
        throw new SourceError("style must be decimal, percent, currency or compact");
    const locale = clean(a.locale || "en-US");
    if (!/^[A-Za-z]{2,3}(-[A-Za-z0-9]{2,8})*$/.test(locale))
        throw new SourceError("locale must look like en-US, de-DE or ja-JP");
    const currency = a.currency ? clean(a.currency).toUpperCase() : "";
    if (style === "currency" && !/^[A-Z]{3}$/.test(currency))
        throw new SourceError("the currency style needs a three-letter ISO 4217 code, e.g. USD or EUR");
    if (a.decimals !== undefined && (!Number.isInteger(a.decimals) || a.decimals < 0 || a.decimals > 6))
        throw new SourceError("decimals must be between 0 and 6");
    const options = style === "currency"
        ? { style: "currency", currency }
        : style === "percent"
            ? { style: "percent" }
            : style === "compact"
                ? { notation: "compact" }
                : {};
    if (a.decimals !== undefined) {
        options.minimumFractionDigits = a.decimals;
        options.maximumFractionDigits = a.decimals;
    }
    let formatted;
    let resolved = locale;
    try {
        formatted = new Intl.NumberFormat(locale, options).format(a.value);
        resolved = new Intl.NumberFormat(locale, options).resolvedOptions().locale;
    }
    catch {
        throw new SourceError(`locale "${locale}" is not supported by this Node build`);
    }
    return [
        `${a.value} as ${style} in ${resolved}: ${formatted}`,
        "",
        `Plain: ${a.value}`,
        resolved !== locale ? `Requested locale ${locale} resolved to ${resolved}.` : `Locale ${resolved} used as asked.`,
        style === "percent" ? "Percent values are fractions: 0.42 formats as 42%." : "",
    ].filter(Boolean).join("\n");
}
