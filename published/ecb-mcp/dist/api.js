/**
 * ECB Data — keyless public API client.
 */
const BASE = "https://data-api.ecb.europa.eu/service/data";
const SOURCE = "ECB Data";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ecb-mcp", accept },
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
function parseCsv(text) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else
                    quoted = false;
            }
            else
                field += ch;
            continue;
        }
        if (ch === '"') {
            quoted = true;
            continue;
        }
        if (ch === ",") {
            row.push(field);
            field = "";
            continue;
        }
        if (ch === "\n" || ch === "\r") {
            if (ch === "\r" && text[i + 1] === "\n")
                i++;
            row.push(field);
            rows.push(row);
            row = [];
            field = "";
            continue;
        }
        field += ch;
    }
    if (field || row.length) {
        row.push(field);
        rows.push(row);
    }
    if (rows.length < 2)
        return [];
    const head = rows[0].map((h) => h.replace(/^\uFEFF/, "").trim());
    return rows.slice(1).filter((r) => r.length === head.length).map((r) => Object.fromEntries(head.map((h, i) => [h, r[i]])));
}
const checkCurrency = (raw) => {
    const v = raw.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(v))
        throw new SourceError(`"${raw}" is not a 3-letter currency code`);
    if (v === "EUR")
        throw new SourceError("EUR is the base currency; pick another currency code");
    return v;
};
async function series(key, limit) {
    const csv = await getText(`/${key}?lastNObservations=${limit}&format=csvdata`, "text/csv");
    return parseCsv(csv);
}
export async function exchangeRate(a) {
    const cur = checkCurrency(a.currency);
    const rows = await series(`EXR/D.${cur}.EUR.SP00.A`, 1);
    const r = rows[0];
    if (!r?.OBS_VALUE)
        throw new SourceError(`ECB has no rate for ${cur}`);
    return [
        `EUR/${cur}: ${r.OBS_VALUE}`,
        `Date: ${r.TIME_PERIOD}`,
        `1 EUR = ${r.OBS_VALUE} ${cur}`,
        `1 ${cur} = ${(1 / Number(r.OBS_VALUE)).toFixed(6)} EUR`,
        `Unit: ${r.UNIT ?? "currency"}`,
    ].join("\n");
}
export async function exchangeRateHistory(a) {
    const cur = checkCurrency(a.currency);
    const rows = await series(`EXR/D.${cur}.EUR.SP00.A`, a.limit);
    if (!rows.length)
        throw new SourceError(`ECB has no history for ${cur}`);
    return [`EUR/${cur} last ${rows.length} observations:`, ...rows.map((r) => `${r.TIME_PERIOD}: ${r.OBS_VALUE}`)].join("\n");
}
export async function ecbPolicyRate() {
    const rows = await series("FM/D.U2.EUR.4F.KR.MRR_FR.LEV", 1);
    const r = rows[0];
    if (!r?.OBS_VALUE)
        throw new SourceError("ECB returned no policy rate");
    return [
        `ECB main refinancing operations rate: ${r.OBS_VALUE}%`,
        `Date: ${r.TIME_PERIOD}`,
        `Series: ${r.TITLE ?? "MRR_FR"}`,
    ].join("\n");
}
