/**
 * Matrix Maths — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Matrix Maths";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "matrix-mcp", accept },
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
function validate(m, label) {
    if (!m.length)
        throw new SourceError(`${label} is empty`);
    const w = m[0].length;
    if (!w)
        throw new SourceError(`${label} has no columns`);
    if (m.some((r) => r.length !== w))
        throw new SourceError(`${label} rows have different lengths`);
    if (m.some((r) => r.some((v) => !Number.isFinite(v))))
        throw new SourceError(`${label} contains a non-finite number`);
}
const fmt = (n) => {
    const r = Math.round(n * 1e10) / 1e10;
    return Object.is(r, -0) ? "0" : String(r);
};
const render = (m) => m.map((r) => `[ ${r.map(fmt).join("  ")} ]`).join("\n");
export async function matrixMultiply(a) {
    validate(a.a, "matrix a");
    validate(a.b, "matrix b");
    if (a.a[0].length !== a.b.length)
        throw new SourceError(`cannot multiply ${a.a.length}x${a.a[0].length} by ${a.b.length}x${a.b[0].length}`);
    const out = Array.from({ length: a.a.length }, () => Array(a.b[0].length).fill(0));
    for (let i = 0; i < a.a.length; i++) {
        for (let j = 0; j < a.b[0].length; j++) {
            let sum = 0;
            for (let k = 0; k < a.b.length; k++)
                sum += a.a[i][k] * a.b[k][j];
            out[i][j] = sum;
        }
    }
    return [`${a.a.length}x${a.a[0].length} x ${a.b.length}x${a.b[0].length} = ${out.length}x${out[0].length}`, render(out)].join("\n");
}
export async function matrixDeterminant(a) {
    const m = a.matrix;
    validate(m, "matrix");
    if (m.length !== m[0].length)
        throw new SourceError(`determinant needs a square matrix, got ${m.length}x${m[0].length}`);
    const n = m.length;
    const a2 = m.map((r) => [...r]);
    let det = 1;
    for (let i = 0; i < n; i++) {
        let pivot = i;
        for (let r = i; r < n; r++)
            if (Math.abs(a2[r][i]) > Math.abs(a2[pivot][i]))
                pivot = r;
        if (Math.abs(a2[pivot][i]) < 1e-12)
            return `Determinant: 0 (matrix is singular)`;
        if (pivot !== i) {
            [a2[i], a2[pivot]] = [a2[pivot], a2[i]];
            det *= -1;
        }
        det *= a2[i][i];
        for (let r = i + 1; r < n; r++) {
            const f = a2[r][i] / a2[i][i];
            for (let c = i; c < n; c++)
                a2[r][c] -= f * a2[i][c];
        }
    }
    return [`${n}x${n} determinant: ${fmt(det)}`, `Singular: ${Math.abs(det) < 1e-12 ? "yes" : "no"}`].join("\n");
}
export async function matrixInverse(a) {
    const m = a.matrix;
    validate(m, "matrix");
    const n = m.length;
    if (n !== m[0].length)
        throw new SourceError(`inverse needs a square matrix, got ${n}x${m[0].length}`);
    if (n > 8)
        throw new SourceError("inverse supports matrices up to 8x8");
    const aug = m.map((row, i) => [...row, ...Array.from({ length: n }, (_, j) => (i === j ? 1 : 0))]);
    for (let col = 0; col < n; col++) {
        let pivot = col;
        for (let r = col; r < n; r++)
            if (Math.abs(aug[r][col]) > Math.abs(aug[pivot][col]))
                pivot = r;
        if (Math.abs(aug[pivot][col]) < 1e-12)
            throw new SourceError("matrix is singular and cannot be inverted");
        if (pivot !== col)
            [aug[col], aug[pivot]] = [aug[pivot], aug[col]];
        const p = aug[col][col];
        for (let c = 0; c < 2 * n; c++)
            aug[col][c] /= p;
        for (let r = 0; r < n; r++) {
            if (r === col)
                continue;
            const f = aug[r][col];
            if (f === 0)
                continue;
            for (let c = 0; c < 2 * n; c++)
                aug[r][c] -= f * aug[col][c];
        }
    }
    const inv = aug.map((row) => row.slice(n));
    return [`Inverse (${n}x${n}):`, render(inv)].join("\n");
}
