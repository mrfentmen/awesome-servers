/**
 * JSONPath — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "JSONPath";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "jsonpath-mcp", accept },
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
function parsePath(path) {
    let p = path.trim();
    if (!p.startsWith("$"))
        throw new SourceError('JSONPath must start with $');
    p = p.slice(1);
    const segs = [];
    let i = 0;
    while (i < p.length) {
        if (p.startsWith("..", i)) {
            i += 2;
            const m = p.slice(i).match(/^([A-Za-z_$][\w$-]*|\*)/);
            if (!m)
                throw new SourceError("recursive descent needs a key or * after ..");
            segs.push(m[1] === "*" ? { kind: "descend", key: "*" } : { kind: "descend", key: m[1] });
            i += m[1].length;
            continue;
        }
        if (p[i] === ".") {
            i++;
            const m = p.slice(i).match(/^([A-Za-z_$][\w$-]*|\*)/);
            if (!m)
                throw new SourceError("expected a key after .");
            segs.push(m[1] === "*" ? { kind: "wild" } : { kind: "key", key: m[1] });
            i += m[1].length;
            continue;
        }
        if (p[i] === "[") {
            const end = p.indexOf("]", i);
            if (end < 0)
                throw new SourceError("unclosed [ in JSONPath");
            const inner = p.slice(i + 1, end).trim();
            if (inner === "*")
                segs.push({ kind: "wild" });
            else if (/^-?\d+$/.test(inner))
                segs.push({ kind: "index", index: Number(inner) });
            else if (/^'.*'$/.test(inner) || /^".*"$/.test(inner))
                segs.push({ kind: "key", key: inner.slice(1, -1) });
            else if (/^-?\d*:-?\d*$/.test(inner)) {
                const [s, e] = inner.split(":");
                segs.push({ kind: "slice", start: s ? Number(s) : 0, end: e ? Number(e) : Number.MAX_SAFE_INTEGER });
            }
            else
                throw new SourceError(`unsupported bracket expression [${inner}]`);
            i = end + 1;
            continue;
        }
        throw new SourceError(`unexpected character ${JSON.stringify(p[i])} in JSONPath`);
    }
    return segs;
}
const isObject = (v) => typeof v === "object" && v !== null && !Array.isArray(v);
function walk(node, seg) {
    if (seg.kind === "descend") {
        const out = [];
        const visit = (v) => {
            if (seg.key === "*")
                out.push(v);
            else if (isObject(v) && seg.key in v)
                out.push(v[seg.key]);
            if (isObject(v))
                for (const k of Object.keys(v))
                    visit(v[k]);
            else if (Array.isArray(v))
                for (const item of v)
                    visit(item);
        };
        visit(node);
        return out;
    }
    if (seg.kind === "wild") {
        if (Array.isArray(node))
            return node;
        if (isObject(node))
            return Object.values(node);
        return [];
    }
    if (seg.kind === "key") {
        if (isObject(node) && seg.key in node)
            return [node[seg.key]];
        return [];
    }
    if (seg.kind === "index") {
        if (!Array.isArray(node))
            return [];
        const idx = seg.index < 0 ? node.length + seg.index : seg.index;
        return idx >= 0 && idx < node.length ? [node[idx]] : [];
    }
    if (!Array.isArray(node))
        return [];
    return node.slice(seg.start, seg.end === Number.MAX_SAFE_INTEGER ? undefined : seg.end);
}
function parseJson(text) {
    try {
        return JSON.parse(text);
    }
    catch (e) {
        throw new SourceError(`invalid JSON: ${e.message}`);
    }
}
function evaluate(doc, path) {
    let nodes = [doc];
    for (const seg of parsePath(path))
        nodes = nodes.flatMap((n) => walk(n, seg));
    return nodes;
}
const preview = (v) => {
    const s = typeof v === "string" ? JSON.stringify(v) : JSON.stringify(v);
    return s.length > 400 ? s.slice(0, 400) + "…" : s;
};
export async function queryJsonpath(a) {
    const doc = parseJson(a.json);
    const matches = evaluate(doc, a.path);
    if (matches.length === 0)
        return `No matches for ${a.path}`;
    return [`${matches.length} match${matches.length === 1 ? "" : "es"} for ${a.path}:`, ...matches.slice(0, 50).map((m, i) => `${i + 1}. ${preview(m)}`)].join("\n");
}
export async function listJsonPaths(a) {
    const doc = parseJson(a.json);
    const out = [];
    const walkAll = (v, path, depth) => {
        if (depth > a.maxDepth)
            return;
        if (Array.isArray(v)) {
            if (v.length === 0)
                out.push(`${path} (empty array)`);
            v.forEach((item, i) => walkAll(item, `${path}[${i}]`, depth + 1));
            return;
        }
        if (isObject(v)) {
            const keys = Object.keys(v);
            if (!keys.length)
                out.push(`${path} (empty object)`);
            for (const k of keys)
                walkAll(v[k], `${path}.${k}`, depth + 1);
            return;
        }
        out.push(`${path} = ${preview(v)}`);
    };
    walkAll(doc, "$", 0);
    return [`${out.length} paths:`, ...out.slice(0, 200)].join("\n");
}
export async function countJsonpath(a) {
    const matches = evaluate(parseJson(a.json), a.path);
    return `${a.path} matches ${matches.length} node${matches.length === 1 ? "" : "s"}.`;
}
