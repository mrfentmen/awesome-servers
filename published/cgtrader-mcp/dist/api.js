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
// ---- muxF tools:
/** Children grouped by parent id, each list title-sorted, computed once per read. */
function childIndex(rows) {
    const byParent = new Map();
    for (const row of rows) {
        const key = row.parent_category_id ?? null;
        if (!byParent.has(key))
            byParent.set(key, []);
        byParent.get(key).push(row);
    }
    for (const list of byParent.values())
        list.sort((a, b) => String(a.title ?? "").localeCompare(String(b.title ?? "")));
    return byParent;
}
/** Every id reachable below this one, cycle-safe, excluding the node itself. */
function descendantsOf(byParent, id) {
    const seen = new Set();
    const stack = [...(byParent.get(id) ?? [])];
    while (stack.length) {
        const node = stack.pop();
        if (seen.has(node.id))
            continue;
        seen.add(node.id);
        stack.push(...(byParent.get(node.id) ?? []));
    }
    return seen;
}
export async function categoryTree(args) {
    const rows = await allCategories();
    const byParent = childIndex(rows);
    const depth = Math.min(Math.max(Math.trunc(Number(args.depth ?? 2)) || 2, 1), 5);
    const minChildren = Math.max(Math.trunc(Number(args.min_children ?? 0)) || 0, 0);
    const startId = args.parent_id;
    const roots = startId === undefined || startId === null
        ? byParent.get(null) ?? []
        : byParent.get(startId) ?? [];
    if (!roots.length) {
        const known = startId === undefined || startId === null
            ? "the category list came back without any root"
            : `category ${startId} has no children`;
        throw new CGTraderError(`Cannot build a tree: ${known}. Check the id with category_path.`);
    }
    const lines = [
        `CGTrader category tree${startId === undefined || startId === null ? " from the roots" : ` under [${startId}]`}`,
        `Levels: ${depth} | minimum children to show a branch: ${minChildren} | ${rows.length} categories in the taxonomy`,
        "",
    ];
    const seen = new Set();
    let shown = 0;
    let skipped = 0;
    const walk = (node, level) => {
        if (seen.has(node.id))
            return;
        seen.add(node.id);
        const kids = byParent.get(node.id) ?? [];
        if (kids.length < minChildren) {
            skipped += 1;
            return;
        }
        shown += 1;
        lines.push(`${"  ".repeat(level)}[${node.id}] ${node.title ?? "(untitled)"}${node.slug ? ` (${node.slug})` : ""} — ${kids.length} child${kids.length === 1 ? "" : "ren"}`);
        if (level + 1 >= depth)
            return;
        for (const kid of kids)
            walk(kid, level + 1);
    };
    for (const root of roots)
        walk(root, 0);
    if (!shown)
        throw new CGTraderError(`Every branch under this point has fewer than ${minChildren} child categories. Lower min_children or raise depth.`);
    const deeper = roots.reduce((n, r) => n + (byParent.get(r.id) ?? []).length, 0);
    lines.push("", `Showed ${shown} node(s)${skipped ? `, skipped ${skipped} branch(es) under the child threshold` : ""}. ${deeper} child categor${deeper === 1 ? "y" : "ies"} sit directly under the starting point.`);
    if (depth > 1)
        lines.push("Deeper levels are cut at the depth limit; raise depth (max 5) to go further.");
    return lines.join("\n");
}
export async function taxonomyProfile(args) {
    const minDescendants = Math.max(Math.trunc(Number(args.min_descendants ?? 1)) || 1, 1);
    const rows = await allCategories();
    const byId = new Map(rows.map((r) => [r.id, r]));
    const byParent = childIndex(rows);
    const roots = rows.filter((r) => r.parent_category_id === null || r.parent_category_id === undefined);
    const leaves = rows.filter((r) => !(byParent.get(r.id) ?? []).length);
    const dangling = rows.filter((r) => r.parent_category_id !== null && r.parent_category_id !== undefined && !byId.has(r.parent_category_id));
    const depths = rows.map((r) => pathOf(byId, r).length - 1);
    const maxDepth = depths.length ? Math.max(...depths) : 0;
    const types = {};
    for (const row of rows) {
        const key = String(row.type ?? "unreported");
        types[key] = (types[key] ?? 0) + 1;
    }
    const ranked = roots
        .map((r) => ({ id: r.id, title: r.title ?? null, slug: r.slug ?? null, descendants: descendantsOf(byParent, r.id).size }))
        .filter((r) => r.descendants >= minDescendants)
        .sort((a, b) => b.descendants - a.descendants)
        .slice(0, 15);
    return pretty({
        categories: rows.length,
        roots: roots.length,
        leaves: leaves.length,
        max_depth: maxDepth,
        average_children_per_parent: (() => {
            const parents = [...byParent.values()].filter((kids) => kids.length).length;
            const children = rows.length - roots.length;
            return parents ? Math.round((children / parents) * 100) / 100 : null;
        })(),
        by_type: types,
        dangling_parent_references: dangling.length,
        dangling_examples: dangling.slice(0, 10).map((r) => ({ id: r.id, title: r.title ?? null, missing_parent: r.parent_category_id })),
        roots_ranked_by_descendants: ranked,
        min_descendants: minDescendants,
        note: "Counts come from the whole published category list; a dangling parent means the row points at an id that is not in the taxonomy.",
    });
}
