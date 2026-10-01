const BASE = 'https://dummyjson.com';

export interface ListArgs {
  limit?: number;
}

export async function products(args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/products?limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-dummyjson-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DummyJSON returned ${res.status}`);
  const d = (await res.json()) as { products?: Array<Record<string, unknown>> };
  const rows = d.products ?? [];
  if (!rows.length) return 'No products returned.';
  return `Products (${rows.length} shown):\n` +
    rows.map((p, i) => {
      const s = (k: string) => (p[k] != null ? String(p[k]) : '');
      return `${i + 1}. ${s('title')} | $${s('price')} | ${s('category')}`;
    }).join('\n');
}

export async function recipes(args: ListArgs): Promise<string> {
  const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
  const res = await fetch(`${BASE}/recipes?limit=${limit}`, {
    headers: { 'User-Agent': 'mrfentmen-dummyjson-mcp/1.0', Accept: 'application/json' },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`DummyJSON returned ${res.status}`);
  const d = (await res.json()) as { recipes?: Array<Record<string, unknown>> };
  const rows = d.recipes ?? [];
  if (!rows.length) return 'No recipes returned.';
  return `Recipes (${rows.length} shown):\n` +
    rows.map((r, i) => {
      const s = (k: string) => (r[k] != null ? String(r[k]) : '');
      return `${i + 1}. ${s('name')} | ${s('difficulty')} | ${s('prepTimeMinutes')}m prep`;
    }).join('\n');
}

// ---- muxA tools:
// The existing tools list the first page of products and recipes with a hard
// limit. These add real paging with skip and sorting, full text search, and the
// category and tag indexes that nothing here reached.
const DUMMY_BASE = "https://dummyjson.com"
const DUMMY_UA = "mrfentmen-dummyjson-mcp/1.0"

const DUMMY_RESOURCES = ["products", "users", "posts", "quotes", "recipes"] as const
type DummyResource = (typeof DUMMY_RESOURCES)[number]

// sortBy and select are SILENTLY ignored when they name something the API does
// not know: sortBy=bogusColumn returns the default order with HTTP 200 and
// select=nope returns only the id, both verified live. An unknown order falls
// back the same way. So each resource lists the fields that were checked
// working, and a name outside that list is refused here instead of quietly
// returning unsorted data.
const DUMMY_FIELDS: Record<DummyResource, { sortable: string[]; shown: string[] }> = {
  products: { sortable: ["price", "rating", "stock", "title"], shown: ["title", "price", "category", "rating"] },
  users: { sortable: ["age", "firstName", "lastName"], shown: ["firstName", "lastName", "email", "age"] },
  posts: { sortable: ["title", "id"], shown: ["title", "userId"] },
  quotes: { sortable: ["id"], shown: ["quote", "author"] },
  recipes: { sortable: ["name", "id"], shown: ["name", "difficulty", "prepTimeMinutes"] },
}

function dummyStr(value: unknown, fallback = "not provided"): string {
  if (value === null || value === undefined || value === "") return fallback
  return String(value)
}

async function dummyGet<T>(path: string): Promise<T> {
  const res = await fetch(`${DUMMY_BASE}${path}`, {
    headers: { "User-Agent": DUMMY_UA, Accept: "application/json" },
    signal: AbortSignal.timeout(25000),
  })
  const body = (await res.json().catch(() => null)) as unknown
  if (!res.ok) {
    // A missing record answers 404 with the reason in message, verified with
    // products/999999 and users/999999, so that text is shown instead of a code.
    const message =
      body && typeof body === "object" && typeof (body as { message?: unknown }).message === "string"
        ? String((body as { message?: unknown }).message)
        : `DummyJSON returned ${res.status}`
    throw new Error(message)
  }
  if (!body) throw new Error("DummyJSON answered with a body that is not JSON")
  return body as T
}

function dummyOrder(value: string | undefined): string {
  const order = (value ?? "asc").trim().toLowerCase()
  if (order !== "asc" && order !== "desc") {
    throw new Error(`order must be asc or desc, got "${value}". An unknown value is ignored by the API rather than refused.`)
  }
  return order
}

function dummyResource(value: string | undefined): DummyResource {
  const resource = (value ?? "").trim().toLowerCase()
  if (!(DUMMY_RESOURCES as readonly string[]).includes(resource)) {
    throw new Error(`resource must be one of ${DUMMY_RESOURCES.join(", ")}, got "${value}".`)
  }
  return resource as DummyResource
}

function dummyRowLine(resource: DummyResource, row: Record<string, unknown>, index: number): string {
  const id = dummyStr(row.id, "?")
  const fields = DUMMY_FIELDS[resource].shown.map((field) => dummyStr(row[field]))
  const extra = Array.isArray(row.tags) && row.tags.length ? ` | tags ${(row.tags as unknown[]).map(String).join(", ")}` : ""
  return `${index + 1}. [${id}] ${fields.join(" | ")}${extra}`
}

export async function catalogIndex(): Promise<string> {
  const categories = await dummyGet<Array<Record<string, unknown>>>("/products/categories")
  const tags = await dummyGet<string[]>("/recipes/tags")
  const categoryList = Array.isArray(categories) ? categories : []
  const tagList = Array.isArray(tags) ? tags : []
  return [
    `${categoryList.length} product categories. Pass a slug to paged_list with resource products and category set to that slug.`,
    "",
    ...categoryList.map((row, i) => `${i + 1}. ${dummyStr(row.name)} - ${dummyStr(row.slug)}`),
    "",
    `${tagList.length} recipe tags:`,
    tagList.join(", "),
  ].join("\n")
}
