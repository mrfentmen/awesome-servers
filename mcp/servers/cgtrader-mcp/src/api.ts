export class CGTraderError extends Error {
  constructor(message: string) {
    super(message)
    this.name = "CGTraderError"
  }
}

export function errorMessage(e: unknown): string {
  return e instanceof Error ? e.message : String(e)
}

const UA = { "User-Agent": "awesome-mcps/1.0" }
const BASE = "https://api.cgtrader.com"

function envStrict(name: string): string {
  const v = process.env[name]
  if (!v) throw new CGTraderError(`Set the ${name} environment variable.`)
  return v
}

function pretty(data: unknown): string {
  const t = typeof data === "string" ? data : JSON.stringify(data, null, 2)
  return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t
}

async function req(path: string): Promise<string> {
  const res = await fetch(BASE + path, {
    signal: AbortSignal.timeout(30000),
    headers: { ...UA, Authorization: "Bearer " + envStrict("CGTRADER_ACCESS_TOKEN") },
  })
  const ct = res.headers.get("content-type") ?? ""
  const data = ct.includes("json") ? await res.json() : await res.text()
  if (!res.ok) {
    const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300)
    throw new CGTraderError(`HTTP ${res.status}: ${detail}`)
  }
  return pretty(data)
}

export function listModels(page?: string): Promise<string> {
  const q = page ? `?page=${encodeURIComponent(page)}` : ""
  return req(`/v1/models${q}`)
}

export function getModel(modelId: string): Promise<string> {
  return req(`/v1/models/${encodeURIComponent(modelId)}`)
}

export function listModelFiles(modelId: string): Promise<string> {
  return req(`/v1/models/${encodeURIComponent(modelId)}/files`)
}

export function getMe(): Promise<string> {
  return req("/v1/users/me")
}

// ---- muxD tools:

interface Category {
  id: number;
  slug?: string;
  title?: string;
  parent_category_id?: number | null;
  type?: string;
}

async function allCategories(): Promise<Category[]> {
  const res = await fetch(`${BASE}/v1/categories`, {
    signal: AbortSignal.timeout(30000),
    headers: { ...UA, Accept: "application/json" },
  });
  if (!res.ok) throw new CGTraderError(`HTTP ${res.status} for the CGTrader category list.`);
  const data = (await res.json()) as { categories?: Category[] };
  const rows = Array.isArray(data?.categories) ? data.categories : [];
  if (!rows.length) throw new CGTraderError("CGTrader returned an empty category list.");
  return rows;
}

/** Chain of ancestors from the root down to and including this category. */
function pathOf(byId: Map<number, Category>, row: Category): Category[] {
  const chain: Category[] = [row];
  let cur = row;
  const guard = new Set<number>([row.id]);
  while (cur.parent_category_id !== null && cur.parent_category_id !== undefined) {
    const parent = byId.get(cur.parent_category_id);
    if (!parent || guard.has(parent.id)) break;
    chain.unshift(parent);
    guard.add(parent.id);
    cur = parent;
  }
  return chain;
}

const childrenOf = (rows: Category[], id: number): Category[] =>
  rows.filter((r) => r.parent_category_id === id).sort((a, b) => (a.title ?? "").localeCompare(b.title ?? ""));

export interface TreeArgs {
  parent_id?: number;
  depth?: number;
  min_children?: number;
}

/**
 * GET /v1/categories, rebuilt into a tree. The endpoint ignores a
 * parent_category_id filter and always returns the whole list, so the
 * hierarchy is assembled here.
 */
export async function categoryTree(args: TreeArgs): Promise<string> {
  const rows = await allCategories();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const maxDepth = Math.max(1, Math.min(Math.floor(Number(args.depth ?? 2) || 2), 5));
  const minChildren = Math.max(Number(args.min_children ?? 0) || 0, 0);

  const roots = args.parent_id !== undefined
    ? [byId.get(args.parent_id) ?? ({ id: args.parent_id, title: `category ${args.parent_id} (not in the list)` } as Category)]
    : rows.filter((r) => r.parent_category_id === null || r.parent_category_id === undefined);

  const lines = [
    args.parent_id !== undefined
      ? `CGTrader category tree under id ${args.parent_id}`
      : `CGTrader category tree: ${rows.length} categories, ${roots.length} root(s)`,
    "",
  ];
  const walk = (row: Category, depth: number, seen: Set<number>) => {
    if (depth > maxDepth) return;
    const kids = childrenOf(rows, row.id);
    if (minChildren > 0 && kids.length < minChildren && depth > 0) return;
    const dangling = row.parent_category_id !== null && row.parent_category_id !== undefined && !byId.has(row.parent_category_id);
    lines.push(`${"  ".repeat(depth)}- [${row.id}] ${row.title ?? "(untitled)"} (${kids.length} child${kids.length === 1 ? "" : "ren"})${row.type ? ` | type ${row.type}` : ""}${dangling ? " | parent id is not in the list" : ""}`);
    if (seen.has(row.id)) {
      lines.push(`${"  ".repeat(depth + 1)}(cycle, not descending further)`);
      return;
    }
    const next = new Set(seen);
    next.add(row.id);
    for (const k of kids) walk(k, depth + 1, next);
  };
  const visited = new Set<number>();
  for (const r of roots) walk(r, 0, visited);
  if (!lines[2]) lines.push("(no categories matched that parent id)");
  return lines.join("\n");
}

export interface PathArgs {
  category: string;
}

interface PathOut {
  id: number;
  slug?: string;
  title?: string;
  parent_category_id?: number | null;
  type?: string;
}

/** GET /v1/categories/{id} - one category with its breadcrumb, children and siblings. */
export async function categoryPath(args: PathArgs): Promise<string> {
  const want = (args.category ?? "").trim();
  if (!want) throw new CGTraderError("Give a category id or slug, e.g. 1 or aircraft.");
  const rows = await allCategories();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const lower = want.toLowerCase();
  const match =
    /^\d+$/.test(want)
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
  if (!kids.length) lines.push("  (none - this is a leaf category)");
  else for (const k of kids.slice(0, 30)) lines.push(`  [${k.id}] ${k.title} (${childrenOf(rows, k.id).length} child)`);
  if (kids.length > 30) lines.push(`  ...and ${kids.length - 30} more`);
  lines.push("", `Siblings (${siblings.length})${parent ? ` under ${parent.title}` : ""}:`);
  if (!siblings.length) lines.push("  (none)");
  else for (const s of siblings.slice(0, 30)) lines.push(`  [${s.id}] ${s.title}`);
  if (siblings.length > 30) lines.push(`  ...and ${siblings.length - 30} more`);
  return lines.join("\n");
}

export interface ProfileArgs {
  min_descendants?: number;
}

/** Shape of the whole CGTrader taxonomy: roots, breadth, depth and dangling parents. */
export async function taxonomyProfile(args: ProfileArgs): Promise<string> {
  const minDesc = Math.max(Number(args.min_descendants ?? 1) || 1, 1);
  const rows = await allCategories();
  const byId = new Map(rows.map((r) => [r.id, r]));
  const kids = new Map<number, number>();
  for (const r of rows) {
    if (r.parent_category_id !== null && r.parent_category_id !== undefined) {
      kids.set(r.parent_category_id, (kids.get(r.parent_category_id) ?? 0) + 1);
    }
  }
  const countDescendants = (id: number, seen = new Set<number>()): number => {
    if (seen.has(id)) return 0;
    const next = new Set(seen);
    next.add(id);
    let n = 0;
    for (const c of rows) {
      if (c.parent_category_id === id) n += 1 + countDescendants(c.id, next);
    }
    return n;
  };
  const roots = rows.filter((r) => r.parent_category_id === null || r.parent_category_id === undefined);
  const dangling = rows.filter(
    (r) => r.parent_category_id !== null && r.parent_category_id !== undefined && !byId.has(r.parent_category_id),
  );
  const leaves = rows.filter((r) => (kids.get(r.id) ?? 0) === 0);
  const depths = rows.map((r) => pathOf(byId, r).length - 1);
  const maxDepth = depths.length ? Math.max(...depths) : 0;
  const types = new Map<string, number>();
  for (const r of rows) {
    const k = r.type ?? "type not reported";
    types.set(k, (types.get(k) ?? 0) + 1);
  }
  const breadth = [...roots]
    .map((r) => ({ root: r, descendants: countDescendants(r.id) }))
    .filter((r) => r.descendants >= minDesc)
    .sort((a, b) => b.descendants - a.descendants);

  const lines = [
    `CGTrader taxonomy: ${rows.length} categories`,
    `Roots: ${roots.length} | leaf categories: ${leaves.length} | max depth below a root: ${maxDepth}`,
    `Roots shown have at least ${minDesc} descendant(s).`,
    "",
    "By type:",
    ...[...types.entries()].sort((a, b) => b[1] - a[1]).map(([t, n]) => `  ${t}: ${n}`),
    "",
    "Root categories by how much sits underneath them:",
  ];
  if (!breadth.length) lines.push(`  (no root category reaches ${minDesc} descendant(s))`);
  for (const { root, descendants } of breadth) {
    lines.push(`  [${root.id}] ${root.title} — ${descendants} descendant(s), ${kids.get(root.id) ?? 0} direct child(ren)`);
  }
  if (dangling.length) {
    lines.push("", `Categories pointing at a parent id that is not in the list (${dangling.length}):`);
    for (const d of dangling.slice(0, 10)) lines.push(`  [${d.id}] ${d.title} claims parent ${d.parent_category_id}`);
  }
  return lines.join("\n");
}
