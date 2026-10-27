/**
 * CSV Toolkit — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "CSV Toolkit";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "csv-tools-mcp", accept },
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
const CANDIDATES = [",", ";", "\t", "|"];
function detect(text) {
    const sample = text.split(/\r?\n/).slice(0, 5).join("\n");
    let best = ",";
    let bestCount = -1;
    for (const candidate of CANDIDATES) {
        const count = sample.split(candidate).length - 1;
        if (count > bestCount) {
            bestCount = count;
            best = candidate;
        }
    }
    return best;
}
function parse(text, delimiter) {
    const rows = [];
    let row = [];
    let field = "";
    let quoted = false;
    const pushField = () => {
        row.push(field);
        field = "";
    };
    const pushRow = () => {
        pushField();
        rows.push(row);
        row = [];
    };
    for (let i = 0; i < text.length; i++) {
        const ch = text[i];
        if (quoted) {
            if (ch === '"') {
                if (text[i + 1] === '"') {
                    field += '"';
                    i++;
                }
                else {
                    quoted = false;
                }
            }
            else {
                field += ch;
            }
            continue;
        }
        if (ch === '"' && field === "") {
            quoted = true;
            continue;
        }
        if (ch === delimiter) {
            pushField();
            continue;
        }
        if (ch === "\r")
            continue;
        if (ch === "\n") {
            pushRow();
            continue;
        }
        field += ch;
    }
    if (field !== "" || row.length)
        pushRow();
    if (quoted)
        throw new SourceError("the CSV has an unterminated quoted field");
    return rows.filter((r, idx) => !(idx === rows.length - 1 && r.length === 1 && r[0] === ""));
}
function table(csv, delimiter) {
    const text = csv.replace(/^\uFEFF/, "");
    const sep = delimiter ? (delimiter === "\\t" ? "\t" : clean(delimiter)) : detect(text);
    if (sep.length !== 1)
        throw new SourceError("delimiter must be a single character, e.g. , ; or a tab");
    const parsed = parse(text, sep);
    if (!parsed.length)
        throw new SourceError("the CSV is empty");
    const header = parsed[0].map((h, i) => clean(h) || `column_${i + 1}`);
    if (header.length < 2)
        throw new SourceError("the header row needs at least two columns - is the delimiter right?");
    let ragged = 0;
    const rows = parsed.slice(1).map((r) => {
        if (r.length !== header.length)
            ragged++;
        const copy = r.slice(0, header.length);
        while (copy.length < header.length)
            copy.push("");
        return copy;
    });
    return { header, rows, delimiter: sep, ragged };
}
function looksNumeric(value) {
    return /^-?\d+(\.\d+)?([eE][-+]?\d+)?$/.test(clean(value));
}
function looksDate(value) {
    const text = clean(value);
    if (!/^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?)?$/.test(text) && !/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(text))
        return false;
    return !Number.isNaN(Date.parse(text.replace(/(\d{1,2})\/(\d{1,2})\/(\d{4})/, "$3-$1-$2")));
}
function columnType(rows, index) {
    const values = rows.map((r) => clean(r[index])).filter(Boolean);
    if (!values.length)
        return "empty";
    const numeric = values.filter(looksNumeric).length;
    const dates = values.filter(looksDate).length;
    if (numeric === values.length)
        return Number.isInteger(Number(values[0])) ? "integer" : "number";
    if (numeric >= values.length * 0.8)
        return "mostly numeric";
    if (dates === values.length)
        return "date";
    return "text";
}
export async function csvSummary(a) {
    const t = table(a.csv, a.delimiter);
    const blanks = t.header.map((_, i) => t.rows.filter((r) => !clean(r[i])).length);
    return [
        `CSV with ${t.header.length} column(s) and ${t.rows.length} data row(s), delimiter "${t.delimiter === "\t" ? "\\t" : t.delimiter}"`,
        "",
        "Columns:",
        ...t.header.map((name, i) => {
            const type = columnType(t.rows, i);
            const sample = t.rows.map((r) => clean(r[i])).find(Boolean) ?? "";
            return `- ${name}: ${type}${blanks[i] ? ` · ${blanks[i]} blank` : ""}${sample ? ` · e.g. ${sample.slice(0, 40)}` : ""}`;
        }),
        t.ragged ? `\n${t.ragged} row(s) had a different number of fields than the header and were padded or trimmed.` : "",
    ].filter(Boolean).join("\n");
}
export async function csvToJson(a) {
    const limit = a.limit ?? 20;
    if (!Number.isInteger(limit) || limit < 1 || limit > 100)
        throw new SourceError("limit must be between 1 and 100");
    const t = table(a.csv, a.delimiter);
    const rows = t.rows.slice(0, limit).map((r) => {
        const obj = {};
        t.header.forEach((name, i) => {
            const value = clean(r[i]);
            obj[name] = value === "" ? null : looksNumeric(value) ? Number(value) : value;
        });
        return obj;
    });
    return [
        `${rows.length} of ${t.rows.length} row(s) as JSON${t.rows.length > rows.length ? ` (limit ${limit})` : ""}:`,
        "",
        JSON.stringify(rows, null, 2),
    ].join("\n");
}
export async function csvFilter(a) {
    const limit = a.limit ?? 10;
    if (!Number.isInteger(limit) || limit < 1 || limit > 50)
        throw new SourceError("limit must be between 1 and 50");
    const t = table(a.csv, a.delimiter);
    const name = clean(a.column);
    const index = t.header.findIndex((h) => h.toLowerCase() === name.toLowerCase());
    if (index < 0)
        throw new SourceError(`no column called "${name}" - the CSV has ${t.header.join(", ")}`);
    const needle = clean(a.value).toLowerCase();
    const hits = t.rows.filter((r) => clean(r[index]).toLowerCase().includes(needle));
    if (!hits.length)
        return `No row has "${a.value}" in column ${t.header[index]}.`;
    return [
        `${hits.length} of ${t.rows.length} row(s) match ${t.header[index]} containing "${a.value}" (showing ${Math.min(limit, hits.length)}):`,
        "",
        ...hits.slice(0, limit).map((r, i) => `${i + 1}. ${t.header.map((h, ci) => `${h}=${clean(r[ci]) || "-"}`).join(" · ")}`),
    ].join("\n");
}
