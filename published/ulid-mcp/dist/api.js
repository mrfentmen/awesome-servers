/**
 * ULID — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "ULID";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "ulid-mcp", accept },
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
const ALPHABET = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const encodeTime = (ms) => {
    let out = "";
    for (let i = 0; i < 10; i++) {
        out = ALPHABET[ms % 32] + out;
        ms = Math.floor(ms / 32);
    }
    return out;
};
const encodeRandom = () => {
    const bytes = new Uint8Array(16);
    crypto.getRandomValues(bytes);
    let bits = 0;
    let value = 0;
    let out = "";
    for (const b of bytes) {
        value = (value << 8) | b;
        bits += 8;
        while (bits >= 5) {
            out += ALPHABET[(value >>> (bits - 5)) & 31];
            bits -= 5;
        }
    }
    return out.slice(0, 16);
};
const decodeTime = (ulid) => {
    let ms = 0;
    for (const ch of ulid.slice(0, 10)) {
        const i = ALPHABET.indexOf(ch.toUpperCase());
        if (i < 0)
            throw new SourceError(`"${ch}" is not a Crockford base32 character`);
        ms = ms * 32 + i;
    }
    return ms;
};
const validate = (ulid) => {
    const v = ulid.trim().toUpperCase();
    if (v.length !== 26)
        throw new SourceError(`a ULID is 26 characters, got ${v.length}`);
    for (const ch of v)
        if (!ALPHABET.includes(ch))
            throw new SourceError(`"${ch}" is not a Crockford base32 character`);
    return v;
};
export async function generateUlid(a) {
    const ts = a.timestamp ?? Date.now();
    if (!Number.isInteger(ts) || ts < 0 || ts > 281474976710655)
        throw new SourceError("timestamp must be a 48-bit Unix millisecond value");
    const out = [];
    for (let i = 0; i < a.count; i++)
        out.push(encodeTime(ts) + encodeRandom());
    return out.length === 1 ? out[0] : [`${out.length} ULIDs:`, ...out.map((u, i) => `${i + 1}. ${u}`)].join("\n");
}
export async function parseUlid(a) {
    const v = validate(a.ulid);
    const ms = decodeTime(v);
    return [
        `ULID: ${v}`,
        `Timestamp: ${new Date(ms).toISOString()} (${ms} ms)`,
        `Randomness: ${v.slice(10)}`,
        `Valid: yes`,
    ].join("\n");
}
export async function compareUlids(a) {
    const x = validate(a.first);
    const y = validate(a.second);
    if (x === y)
        return "Both ULIDs are identical.";
    const first = x < y ? x : y;
    const second = x < y ? y : x;
    return [
        `${first} sorts before ${second}`,
        `Timestamps: ${new Date(decodeTime(first)).toISOString()} then ${new Date(decodeTime(second)).toISOString()}`,
    ].join("\n");
}
