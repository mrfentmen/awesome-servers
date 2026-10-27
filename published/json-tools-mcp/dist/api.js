export class JsonError extends Error {
}
function parse(input) {
    try {
        return JSON.parse(input);
    }
    catch (e) {
        throw new JsonError(`Invalid JSON: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    }
}
export async function validateJson(args) {
    const input = args.json ?? "";
    if (!input.trim())
        throw new JsonError("Provide JSON text");
    const value = parse(input);
    return `Valid JSON\nTop level type: ${Array.isArray(value) ? "array" : typeof value}`;
}
export async function formatJson(args) {
    const input = args.json ?? "";
    const indent = Math.min(Math.max(args.indent ?? 2, 0), 8);
    const value = parse(input);
    return JSON.stringify(value, null, indent);
}
export async function jsonInfo(args) {
    const input = args.json ?? "";
    const value = parse(input);
    const type = Array.isArray(value) ? "array" : typeof value;
    if (Array.isArray(value)) {
        const first = value[0];
        return `Type: array\nLength: ${value.length}\nElement type: ${typeof first}${first && typeof first === "object" ? ` with ${Object.keys(first).length} keys` : ""}`;
    }
    if (value && typeof value === "object") {
        return `Type: object\nKeys (${Object.keys(value).length}): ${Object.keys(value).slice(0, 30).join(", ")}`;
    }
    return `Type: ${type}\nValue: ${String(value).slice(0, 200)}`;
}
// ---- muxB tools:
const SCHEMASTORE_CATALOG = "https://www.schemastore.org/api/json/catalog.json";
const SCHEMASTORE_UA = "mrfentmen-json-tools-mcp/1.0";
async function catalogGet(url) {
    const res = await fetch(url, { headers: { "User-Agent": SCHEMASTORE_UA, Accept: "application/json" }, signal: AbortSignal.timeout(25000) });
    if (!res.ok)
        throw new JsonError(`SchemaStore returned ${res.status} for ${url}`);
    return (await res.json());
}
async function catalog() {
    const data = await catalogGet(SCHEMASTORE_CATALOG);
    return data.schemas ?? [];
}
export async function schemaForFile(args) {
    const filename = (args.filename ?? "").trim().toLowerCase();
    if (!filename)
        throw new JsonError("Provide a file name, e.g. \"package.json\".");
    const rows = await catalog();
    const exact = rows.filter((entry) => (entry.fileMatch ?? []).some((pattern) => pattern.toLowerCase() === filename));
    const partial = exact.length ? exact : rows.filter((entry) => (entry.fileMatch ?? []).some((pattern) => pattern.toLowerCase().includes(filename)));
    const entry = partial[0];
    if (!entry)
        return `No SchemaStore schema is registered for "${filename}". Try find_schema to search the ${rows.length}-entry catalogue by topic.`;
    if (!entry.url)
        return `SchemaStore lists "${entry.name ?? filename}" for ${filename} but publishes no schema URL for it.`;
    const schema = await catalogGet(entry.url);
    const properties = schema.properties && typeof schema.properties === "object" ? schema.properties : {};
    const required = Array.isArray(schema.required) ? schema.required.map(String) : [];
    const defs = schema.$defs && typeof schema.$defs === "object" ? Object.keys(schema.$defs) : [];
    return [
        `JSON Schema for ${filename}: ${entry.name ?? "unnamed"}`,
        `From: ${entry.url}`,
        `Description: ${String(entry.description ?? "not reported").slice(0, 200)}`,
        `Declared type: ${schema.type != null ? String(schema.type) : "not reported"} | draft: ${String(schema.$schema ?? "not reported")}`,
        `Properties (${Object.keys(properties).length}): ${Object.keys(properties).slice(0, 20).join(", ") || "none at top level"}`,
        `Required: ${required.length ? required.join(", ") : "none"}`,
        `$defs sections (${defs.length}): ${defs.slice(0, 12).join(", ") || "none"}`,
        `Versions published: ${entry.versions ? Object.keys(entry.versions).slice(0, 8).join(", ") || "none" : "none"}`,
    ].join("\n");
}
