export class CGTraderError extends Error {
    constructor(message) {
        super(message);
        this.name = "CGTraderError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
const BASE = "https://api.cgtrader.com";
function envStrict(name) {
    const v = process.env[name];
    if (!v)
        throw new CGTraderError(`Set the ${name} environment variable.`);
    return v;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path) {
    const res = await fetch(BASE + path, {
        signal: AbortSignal.timeout(30000),
        headers: { ...UA, Authorization: "Bearer " + envStrict("CGTRADER_ACCESS_TOKEN") },
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new CGTraderError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function listModels(page) {
    const q = page ? `?page=${encodeURIComponent(page)}` : "";
    return req(`/v1/models${q}`);
}
export function getModel(modelId) {
    return req(`/v1/models/${encodeURIComponent(modelId)}`);
}
export function listModelFiles(modelId) {
    return req(`/v1/models/${encodeURIComponent(modelId)}/files`);
}
export function getMe() {
    return req("/v1/users/me");
}
async function allCategories() {
    const res = await fetch(`${BASE}/v1/categories`, {
        signal: AbortSignal.timeout(30000),
        headers: { ...UA, Accept: "application/json" },
    });
    if (!res.ok)
        throw new CGTraderError(`HTTP ${res.status} for the CGTrader category list.`);
    const data = (await res.json());
    const rows = Array.isArray(data?.categories) ? data.categories : [];
    if (!rows.length)
        throw new CGTraderError("CGTrader returned an empty category list.");
    return rows;
}
/** Chain of ancestors from the root down to and including this category. */
function pathOf(byId, row) {
    const chain = [row];
    let cur = row;
    const guard = new Set([row.id]);
    while (cur.parent_category_id !== null && cur.parent_category_id !== undefined) {
        const parent = byId.get(cur.parent_category_id);
        if (!parent || guard.has(parent.id))
            break;
        chain.unshift(parent);
        guard.add(parent.id);
        cur = parent;
    }
    return chain;
}
const childrenOf = (rows, id) => rows.filter((r) => r.parent_category_id === id).sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));
/** GET /v1/categories/{id} - one category with its breadcrumb, children and siblings. */
export async function categoryPath(args) {
    const want = (args.category ?? "").trim();
    if (!want)
        throw new CGTraderError("Give a category id or slug, e.g. 1 or aircraft.");
    const rows = await allCategories();
    const byId = new Map(rows.map((r) => [r.id, r]));
    const lower = want.toLowerCase();
    const match = /^\d+$/.test(want)
        ? byId.get(Number(want))
        : rows.find((r) => String(r.slug ?? "").toLowerCase() === lower) ?? rows.find((r) => String(r.title ?? "").toLowerCase() === lower);
    if (!match) {
        const near = rows
            .filter((r) => String(r.title ?? "").toLowerCase().includes(lower) || String(r.slug ?? "").toLowerCase().includes(lower))
            .slice(0, 10);
        return near.length
            ? `No category is called "${want}". Closest: ${near.map((r) => `[${r.id}] ${r.title}`).join(", ")}.`
            : `No category matched "${want}" among the ${rows.length} CGTrader categories.`;
    }
    const chain = pathOf(byId, match);
    const kids = childrenOf(rows, match.id);
    const parent = match.parent_category_id !== null && match.parent_category_id !== undefined ? byId.get(match.parent_category_id) : undefined;
    const siblings = parent ? childrenOf(rows, parent.id).filter((r) => r.id !== match.id) : [];
    const lines = [
        `CGTrader category [${match.id}] ${match.title ?? "(untitled)"}`,
        `Slug: ${match.slug ?? "not reported"} | type: ${match.type ?? "not reported"} | parent id: ${match.parent_category_id ?? "none (root)"}`,
        "",
        `Breadcrumb: ${chain.map((c) => `[${c.id}] ${c.title}`).join(" > ")}`,
        `Depth from a root: ${chain.length - 1}`,
        "",
        `Direct children (${kids.length}):`,
    ];
    if (!kids.length)
        lines.push("  (none - this is a leaf category)");
    else
        for (const k of kids.slice(0, 30))
            lines.push(`  [${k.id}] ${k.title} (${childrenOf(rows, k.id).length} child)`);
    if (kids.length > 30)
        lines.push(`  ...and ${kids.length - 30} more`);
    lines.push("", `Siblings (${siblings.length})${parent ? ` under ${parent.title}` : ""}:`);
    if (!siblings.length)
        lines.push("  (none)");
    else
        for (const s of siblings.slice(0, 30))
            lines.push(`  [${s.id}] ${s.title}`);
    if (siblings.length > 30)
        lines.push(`  ...and ${siblings.length - 30} more`);
    return lines.join("\n");
}
