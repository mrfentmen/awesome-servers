/**
 * Eurostat — keyless public API client.
 */
const BASE = "https://ec.europa.eu/eurostat/api/dissemination/statistics/1.0";
const SOURCE = "Eurostat";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "eurostat-mcp", accept },
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
function datasetCode(value) {
    const code = clean(value).toLowerCase();
    if (!/^[a-z0-9_]{3,50}$/.test(code))
        throw new SourceError("dataset must be a Eurostat code like nama_10_gdp");
    return code;
}
function filterQuery(value) {
    const raw = clean(value);
    if (!raw)
        return "";
    if (!/^[A-Za-z0-9_=.,&+-]*$/.test(raw))
        throw new SourceError("filters may only contain letters, digits, _ = . , & + -");
    const parts = raw.split("&").filter(Boolean);
    for (const part of parts) {
        if (!/^[A-Za-z0-9_]+\s*=\s*[A-Za-z0-9_,.+:-]+$/.test(part))
            throw new SourceError(`filter "${part}" must look like geo=DE or time=2023`);
    }
    return parts.length ? `&${parts.join("&")}` : "";
}
function parseDims(d) {
    const order = Array.isArray(d?.id) ? d.id : Object.keys(d?.dimension ?? {});
    const size = Array.isArray(d?.size) ? d.size : order.map(() => 1);
    const codes = [];
    const labels = {};
    for (const dim of order) {
        const category = d?.dimension?.[dim]?.category ?? {};
        const index = category.index ?? {};
        const pairs = Object.entries(index);
        const byPos = new Array(pairs.length);
        for (const [code, pos] of pairs)
            byPos[Number(pos)] = code;
        codes.push(byPos);
        labels[dim] = (category.label ?? {});
    }
    return { order, size, codes, labels };
}
function decode(key, dims) {
    let rest = Number(key);
    const coords = [];
    for (let i = 0; i < dims.order.length; i++) {
        const stride = dims.size.slice(i + 1).reduce((a, b) => a * b, 1);
        const pos = Math.floor(rest / stride);
        rest -= pos * stride;
        coords.push(dims.codes[i]?.[pos] ?? "?");
    }
    return coords;
}
function labelFor(dims, dim, code) {
    return dims.labels[dim]?.[code] ?? code;
}
export async function datasetValues(a) {
    const dataset = datasetCode(a.dataset);
    const filters = filterQuery(a.filters ?? "");
    const lastTimePeriod = a.lastTimePeriod ?? 1;
    if (!Number.isInteger(lastTimePeriod) || lastTimePeriod < 1 || lastTimePeriod > 40)
        throw new SourceError("lastTimePeriod must be between 1 and 40");
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 40)
        throw new SourceError("limit must be between 1 and 40");
    const d = await getJson(`/data/${dataset}?format=JSON&lang=EN&lastTimePeriod=${lastTimePeriod}${filters}`);
    if (!d || d.class !== "dataset")
        throw new SourceError(`Eurostat did not return dataset ${dataset}`);
    const dims = parseDims(d);
    const values = d.value ?? {};
    const entries = Object.entries(values);
    if (!entries.length)
        return `Eurostat returned no values for ${dataset} with those filters.`;
    const decoded = entries.map(([key, value]) => ({ key, value: Number(value), coords: decode(key, dims) }))
        .filter((row) => Number.isFinite(row.value))
        .sort((x, y) => y.value - x.value);
    const timeDim = dims.order.includes("time") ? "time" : "";
    return [
        `${d.label || dataset} (${dataset}) - ${entries.length} value(s), showing the ${Math.min(limit, decoded.length)} largest:`,
        "",
        ...decoded.slice(0, limit).map((row) => {
            const parts = row.coords.map((code, i) => `${dims.order[i]}=${labelFor(dims, dims.order[i], code)}`);
            const shown = dims.order.length > 4 ? [...parts.slice(0, 3), parts[parts.length - 1]] : parts;
            return `- ${row.value.toLocaleString("en-US")} · ${shown.join(" · ")}`;
        }),
        "",
        `Dimensions: ${dims.order.join(", ")}`,
        timeDim ? `Time values returned: ${dims.codes[dims.order.indexOf("time")]?.join(", ") ?? "?"}` : "",
        `Source: https://ec.europa.eu/eurostat/databrowser/view/${dataset}`,
    ].filter(Boolean).join("\n");
}
export async function datasetDimensions(a) {
    const dataset = datasetCode(a.dataset);
    const d = await getJson(`/data/${dataset}?format=JSON&lang=EN&lastTimePeriod=1`);
    if (!d || d.class !== "dataset")
        throw new SourceError(`Eurostat did not return dataset ${dataset}`);
    const dims = parseDims(d);
    const blocks = dims.order.map((dim, i) => {
        const codes = dims.codes[i] ?? [];
        const shown = codes.slice(0, 15).map((code) => `${labelFor(dims, dim, code)} (${code})`);
        return [
            `- ${dim}: ${codes.length} category value(s) in the latest slice${dims.size[i] !== codes.length ? ` of ${dims.size[i]}` : ""}`,
            shown.length ? `    ${shown.join(", ")}${codes.length > shown.length ? `, ... ${codes.length - shown.length} more` : ""}` : "",
        ].join("\n");
    });
    return [
        `${d.label || dataset} (${dataset}) - ${dims.order.length} dimensions:`,
        "",
        ...blocks,
        "",
        `Missing categories are not listed here; pass a category code as a filter to dataset_values to fetch them.`,
        `Source: https://ec.europa.eu/eurostat/databrowser/view/${dataset}`,
    ].join("\n");
}
