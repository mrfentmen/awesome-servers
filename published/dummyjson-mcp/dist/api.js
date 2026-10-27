const BASE = 'https://dummyjson.com';
export async function products(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/products?limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-dummyjson-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DummyJSON returned ${res.status}`);
    const d = (await res.json());
    const rows = d.products ?? [];
    if (!rows.length)
        return 'No products returned.';
    return `Products (${rows.length} shown):\n` +
        rows.map((p, i) => {
            const s = (k) => (p[k] != null ? String(p[k]) : '');
            return `${i + 1}. ${s('title')} | $${s('price')} | ${s('category')}`;
        }).join('\n');
}
export async function recipes(args) {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 50));
    const res = await fetch(`${BASE}/recipes?limit=${limit}`, {
        headers: { 'User-Agent': 'mrfentmen-dummyjson-mcp/1.0', Accept: 'application/json' },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new Error(`DummyJSON returned ${res.status}`);
    const d = (await res.json());
    const rows = d.recipes ?? [];
    if (!rows.length)
        return 'No recipes returned.';
    return `Recipes (${rows.length} shown):\n` +
        rows.map((r, i) => {
            const s = (k) => (r[k] != null ? String(r[k]) : '');
            return `${i + 1}. ${s('name')} | ${s('difficulty')} | ${s('prepTimeMinutes')}m prep`;
        }).join('\n');
}
// ---- muxA tools:
// The existing tools list the first page of products and recipes with a hard
// limit. These add real paging with skip and sorting, full text search, and the
// category and tag indexes that nothing here reached.
const DUMMY_BASE = "https://dummyjson.com";
const DUMMY_UA = "mrfentmen-dummyjson-mcp/1.0";
const DUMMY_RESOURCES = ["products", "users", "posts", "quotes", "recipes"];
// sortBy and select are SILENTLY ignored when they name something the API does
// not know: sortBy=bogusColumn returns the default order with HTTP 200 and
// select=nope returns only the id, both verified live. An unknown order falls
// back the same way. So each resource lists the fields that were checked
// working, and a name outside that list is refused here instead of quietly
// returning unsorted data.
const DUMMY_FIELDS = {
    products: { sortable: ["price", "rating", "stock", "title"], shown: ["title", "price", "category", "rating"] },
    users: { sortable: ["age", "firstName", "lastName"], shown: ["firstName", "lastName", "email", "age"] },
    posts: { sortable: ["title", "id"], shown: ["title", "userId"] },
    quotes: { sortable: ["id"], shown: ["quote", "author"] },
    recipes: { sortable: ["name", "id"], shown: ["name", "difficulty", "prepTimeMinutes"] },
};
function dummyStr(value, fallback = "not provided") {
    if (value === null || value === undefined || value === "")
        return fallback;
    return String(value);
}
async function dummyGet(path) {
    const res = await fetch(`${DUMMY_BASE}${path}`, {
        headers: { "User-Agent": DUMMY_UA, Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    const body = (await res.json().catch(() => null));
    if (!res.ok) {
        // A missing record answers 404 with the reason in message, verified with
        // products/999999 and users/999999, so that text is shown instead of a code.
        const message = body && typeof body === "object" && typeof body.message === "string"
            ? String(body.message)
            : `DummyJSON returned ${res.status}`;
        throw new Error(message);
    }
    if (!body)
        throw new Error("DummyJSON answered with a body that is not JSON");
    return body;
}
function dummyOrder(value) {
    const order = (value ?? "asc").trim().toLowerCase();
    if (order !== "asc" && order !== "desc") {
        throw new Error(`order must be asc or desc, got "${value}". An unknown value is ignored by the API rather than refused.`);
    }
    return order;
}
function dummyResource(value) {
    const resource = (value ?? "").trim().toLowerCase();
    if (!DUMMY_RESOURCES.includes(resource)) {
        throw new Error(`resource must be one of ${DUMMY_RESOURCES.join(", ")}, got "${value}".`);
    }
    return resource;
}
function dummyRowLine(resource, row, index) {
    const id = dummyStr(row.id, "?");
    const fields = DUMMY_FIELDS[resource].shown.map((field) => dummyStr(row[field]));
    const extra = Array.isArray(row.tags) && row.tags.length ? ` | tags ${row.tags.map(String).join(", ")}` : "";
    return `${index + 1}. [${id}] ${fields.join(" | ")}${extra}`;
}
export async function catalogIndex() {
    const categories = await dummyGet("/products/categories");
    const tags = await dummyGet("/recipes/tags");
    const categoryList = Array.isArray(categories) ? categories : [];
    const tagList = Array.isArray(tags) ? tags : [];
    return [
        `${categoryList.length} product categories. Pass a slug to paged_list with resource products and category set to that slug.`,
        "",
        ...categoryList.map((row, i) => `${i + 1}. ${dummyStr(row.name)} - ${dummyStr(row.slug)}`),
        "",
        `${tagList.length} recipe tags:`,
        tagList.join(", "),
    ].join("\n");
}
