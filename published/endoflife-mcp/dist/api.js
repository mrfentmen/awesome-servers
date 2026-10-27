const BASE = "https://endoflife.date/api";
const UA = "mrfentmen-endoflife-mcp/1.0 (https://github.com/mrfentmen)";
export class EolError extends Error {
}
async function get(url) {
    const res = await fetch(url, { headers: { "User-Agent": UA, Accept: "application/json" }, signal: AbortSignal.timeout(20000) });
    if (res.status === 429)
        throw new EolError("endoflife.date rate limit hit, wait and retry");
    if (!res.ok)
        throw new EolError(`endoflife.date error ${res.status}`);
    return (await res.json());
}
export async function productCycles(args) {
    const product = (args.product ?? "").trim().toLowerCase();
    if (!product)
        throw new EolError("Provide a product name like nodejs or python");
    const d = await get(`${BASE}/${encodeURIComponent(product)}.json`);
    if (!d?.length)
        return `No data for ${product}`;
    return `Release cycles for ${product}:\n\n${d.map((c) => {
        const eol = c?.eol === true ? "no longer supported" : c?.eol ?? "n/a";
        const lts = c?.lts === true ? "yes" : typeof c?.lts === "string" ? c.lts : "no";
        return `${c.cycle} | released ${c.releaseDate ?? "?"} | latest ${c.latest ?? "?"} | EOL ${eol} | LTS ${lts}`;
    }).join("\n")}`;
}
export async function allProducts(args) {
    const d = await get(`${BASE}/all.json`);
    if (!d?.length)
        return "No products";
    return `Tracked products (${d.length}):\n${d.slice(0, 60).join(", ")}${d.length > 60 ? ", ..." : ""}`;
}
// The v0 routes the existing tools use answer JSON for unknown products, but
// every v1 route answers 404 with an HTML error page, so json() would raise a
// parse error instead of something a caller can read. This wrapper turns each
// miss into a plain message before any body is parsed.
async function eolApi(path, missing) {
    const res = await fetch(`${BASE}/v1${path}`, {
        headers: { "User-Agent": UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new EolError(missing);
    if (res.status === 429)
        throw new EolError("endoflife.date rate limit hit, wait and retry");
    if (!res.ok)
        throw new EolError(`endoflife.date error ${res.status}`);
    return (await res.json());
}
// Day numbers rather than Date objects, so the arithmetic cannot drift with
// the host timezone.
// Products name their own support stages, for instance Node.js calls the EOL
// stage "Security Support" while Ubuntu calls it "Maintenance & Security
// Support", so the label is read from the product instead of assumed.
// The cycle label usually already contains the cycle name, either exactly
// ("25") or with extra words after it ("20 (LTS)"), so the name is only added
// back when the label does not carry it.
export async function productSearch(args) {
    const index = await eolApi("/products", "endoflife.date had no product index to read");
    const all = index.result ?? [];
    if (!all.length)
        return "endoflife.date returned an empty product index.";
    const limit = Math.max(1, Math.min(Math.trunc(args.limit ?? 25) || 25, 100));
    const wanted = (args.query ?? "").trim().toLowerCase();
    const category = (args.category ?? "").trim().toLowerCase();
    const tag = (args.tag ?? "").trim().toLowerCase();
    if (!wanted && !category && !tag) {
        const counts = new Map();
        for (const entry of all) {
            const key = entry.category ?? "uncategorised";
            counts.set(key, (counts.get(key) ?? 0) + 1);
        }
        const rows = [...counts.entries()].sort((a, b) => b[1] - a[1]);
        return [
            `${index.total ?? all.length} tracked products across ${rows.length} categories:`,
            ...rows.map(([name, count]) => `    ${name.padEnd(14)} ${count}`),
            "",
            "  Pass query, category or tag to narrow this down.",
        ].join("\n");
    }
    const matched = all.filter((entry) => {
        if (category && (entry.category ?? "").toLowerCase() !== category)
            return false;
        if (tag && !(entry.tags ?? []).some((value) => value.toLowerCase() === tag))
            return false;
        if (!wanted)
            return true;
        const haystack = [entry.name, entry.label, ...(entry.aliases ?? []), ...(entry.tags ?? [])]
            .filter(Boolean)
            .join(" ")
            .toLowerCase();
        return haystack.includes(wanted);
    });
    if (!matched.length) {
        const filters = [wanted && `"${args.query}"`, category && `category ${category}`, tag && `tag ${tag}`].filter(Boolean);
        return `No product matched ${filters.join(" and ")}. endoflife.date tracks ${index.total ?? all.length} products.`;
    }
    const shown = matched.slice(0, limit);
    const lines = [`Products matching ${[wanted && `"${args.query}"`, category && `category ${category}`, tag && `tag ${tag}`].filter(Boolean).join(" and ")} (${matched.length} of ${index.total ?? all.length}):`];
    for (const entry of shown) {
        const alias = entry.aliases?.length ? `  (${entry.aliases.join(", ")})` : "";
        lines.push(`    ${(entry.name ?? "?").padEnd(24)} ${(entry.label ?? "").padEnd(28)} ${(entry.category ?? "?").padEnd(11)}${alias}`);
    }
    if (matched.length > shown.length)
        lines.push(`  ${matched.length - shown.length} more not shown, raise limit to see them.`);
    lines.push("", "  Filtering happens in this tool: the products endpoint ignores a category or tag query parameter and always returns all products.");
    return lines.join("\n");
}
