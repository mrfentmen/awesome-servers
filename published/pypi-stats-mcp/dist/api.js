/**
 * pypistats.org client. Keyless. Download counts per package: recent totals,
 * a daily series, Python version split and operating-system split.
 */
const BASE = "https://pypistats.org/api/packages";
export class PyPIStatsError extends Error {
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: { "User-Agent": "pypi-stats-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new PyPIStatsError("package not found on PyPI");
    if (!res.ok)
        throw new PyPIStatsError(`pypistats error ${res.status}`);
    return res.json();
}
export async function recent(pkg) {
    const body = (await getJson(`/${encodeURIComponent(pkg)}/recent`));
    return body.data ?? {};
}
export async function byDate(pkg, days = 30) {
    const body = (await getJson(`/${encodeURIComponent(pkg)}/overall?mirrors=false`));
    const rows = (body.data ?? []).slice().sort((a, b) => String(b.date).localeCompare(String(a.date)));
    return rows.slice(0, days);
}
export async function byPythonMajor(pkg) {
    const body = (await getJson(`/${encodeURIComponent(pkg)}/python_major`));
    return body.data ?? [];
}
export async function byPythonMinor(pkg) {
    const body = (await getJson(`/${encodeURIComponent(pkg)}/python_minor`));
    return body.data ?? [];
}
export async function bySystem(pkg) {
    const body = (await getJson(`/${encodeURIComponent(pkg)}/system`));
    return body.data ?? [];
}
export function number(n) {
    if (n === undefined || n === null)
        return "unknown";
    return n.toLocaleString("en-US");
}
export function totals(r) {
    return [
        `last day:   ${number(r.last_day)}`,
        `last week:  ${number(r.last_week)}`,
        `last month: ${number(r.last_month)}`,
    ].join("\n");
}
export function sliceLines(rows, label, limit = 12) {
    if (!rows.length)
        return `No ${label} data.`;
    const totals = new Map();
    for (const r of rows) {
        const key = r.category ?? r.date ?? "unknown";
        totals.set(key, (totals.get(key) ?? 0) + (r.downloads ?? 0));
    }
    const top = [...totals.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit);
    return top.map(([key, n]) => `${key}: ${number(n)}`).join("\n");
}
