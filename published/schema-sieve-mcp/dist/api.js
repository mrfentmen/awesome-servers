// ---- muxB tools:
const MAX_CHARS = 400000;
const MAX_PATHS = 60;
const MAX_DEPTH = 12;
const SENSITIVE = /example|default|token|secret|password|api[-_]?key|authorization|cookie|credential|private/i;
const TRACKED_CONSTRAINTS = ["format", "pattern", "minLength", "maxLength", "minimum", "maximum", "exclusiveMinimum", "exclusiveMaximum", "multipleOf", "minItems", "maxItems", "uniqueItems", "minProperties", "maxProperties"];
function pad(label, width = 20) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
function safeName(name) {
    return SENSITIVE.test(name) ? "[sensitive property omitted]" : name.slice(0, 80);
}
function asJson(value, label) {
    if (typeof value === "string") {
        if (value.length > MAX_CHARS)
            throw new Error(`${label} is longer than ${MAX_CHARS} characters`);
        try {
            return JSON.parse(value);
        }
        catch {
            throw new Error(`${label} must be valid JSON`);
        }
    }
    if (value === null || typeof value === "object" || typeof value === "number" || typeof value === "boolean")
        return value;
    throw new Error(`${label} must be a JSON value or a JSON string`);
}
function asSchema(value, label) {
    const parsed = asJson(value, label);
    if (!parsed || typeof parsed !== "object" || Array.isArray(parsed))
        throw new Error(`${label} must be a JSON object`);
    return parsed;
}
function declaredType(schema) {
    const value = schema.type;
    if (typeof value === "string")
        return value;
    if (Array.isArray(value) && value.every((item) => typeof item === "string"))
        return value.join("|");
    if (schema.properties)
        return "object";
    if (schema.items)
        return "array";
    return null;
}
function resolveRef(root, schema, depth) {
    let current = schema;
    for (let i = 0; i < 4 && i < depth; i += 1) {
        const ref = current.$ref;
        if (typeof ref !== "string" || !ref.startsWith("#/"))
            return current;
        const segments = ref.slice(2).split("/").map((part) => part.replace(/~1/g, "/").replace(/~0/g, "~"));
        let node = root;
        for (const segment of segments) {
            if (!node || typeof node !== "object")
                return current;
            node = node[segment];
        }
        if (!node || typeof node !== "object" || Array.isArray(node))
            return current;
        current = node;
    }
    return current;
}
function flatten(root, schema, prefix, depth, into) {
    if (depth > MAX_DEPTH || into.size > 4000)
        return;
    const target = resolveRef(root, schema, depth);
    const bits = [];
    const declared = declaredType(target);
    if (declared)
        bits.push(`type=${declared}`);
    if (Array.isArray(target.enum))
        bits.push(`enum=${target.enum.length}`);
    if ("const" in target)
        bits.push("const");
    for (const key of TRACKED_CONSTRAINTS)
        if (key in target)
            bits.push(`${key}=${String(target[key]).slice(0, 24)}`);
    into.set(prefix, bits.join(" ") || "unconstrained");
    if (Array.isArray(target.required))
        for (const name of target.required)
            if (typeof name === "string")
                into.set(`${prefix}.${safeName(name)}!required`, "required");
    if (target.properties && typeof target.properties === "object" && !Array.isArray(target.properties)) {
        for (const [name, child] of Object.entries(target.properties).slice(0, 300)) {
            if (child && typeof child === "object" && !Array.isArray(child))
                flatten(root, child, `${prefix}.${safeName(name)}`, depth + 1, into);
        }
    }
    if (target.items && typeof target.items === "object" && !Array.isArray(target.items))
        flatten(root, target.items, `${prefix}[]`, depth + 1, into);
}
export async function compareSchemas(args) {
    if (args.before === undefined)
        throw new Error("Provide before as a JSON object or a JSON string");
    if (args.after === undefined)
        throw new Error("Provide after as a JSON object or a JSON string");
    const left = asSchema(args.before, "before");
    const right = asSchema(args.after, "after");
    const beforeMap = new Map();
    const afterMap = new Map();
    flatten(left, left, "$", 0, beforeMap);
    flatten(right, right, "$", 0, afterMap);
    const added = [...afterMap.keys()].filter((key) => !beforeMap.has(key));
    const removed = [...beforeMap.keys()].filter((key) => !afterMap.has(key));
    const changed = [];
    for (const [key, value] of afterMap) {
        const previous = beforeMap.get(key);
        if (previous === undefined)
            continue;
        if (previous === value)
            continue;
        const beforeBits = new Set(previous.split(" ").filter(Boolean));
        const afterBits = new Set(value.split(" ").filter(Boolean));
        const gained = [...afterBits].filter((bit) => !beforeBits.has(bit));
        const lost = [...beforeBits].filter((bit) => !afterBits.has(bit));
        changed.push(`${key}: ${gained.length ? `+${gained.join(",")}` : ""}${gained.length && lost.length ? " " : ""}${lost.length ? `-${lost.join(",")}` : ""}`);
    }
    const out = [];
    out.push(`Schema comparison (${beforeMap.size} tracked nodes in before, ${afterMap.size} in after)`);
    out.push(`${pad("Added")}${added.length}${added.length ? "" : " - nothing new in after"}`);
    for (const key of added.slice(0, MAX_PATHS))
        out.push(`  + ${key}${afterMap.get(key) === "required" ? "" : ` (${afterMap.get(key)})`}`);
    if (added.length > MAX_PATHS)
        out.push(`  +${added.length - MAX_PATHS} more added paths not listed`);
    out.push(`${pad("Removed")}${removed.length}${removed.length ? "" : " - nothing dropped from before"}`);
    for (const key of removed.slice(0, MAX_PATHS))
        out.push(`  - ${key}`);
    if (removed.length > MAX_PATHS)
        out.push(`  +${removed.length - MAX_PATHS} more removed paths not listed`);
    out.push(`${pad("Changed")}${changed.length} node${changed.length === 1 ? "" : "s"} differ in type, enum size or constraints`);
    for (const key of changed.slice(0, MAX_PATHS))
        out.push(`  ~ ${key}`);
    if (changed.length > MAX_PATHS)
        out.push(`  +${changed.length - MAX_PATHS} more changed nodes not listed`);
    out.push(`${pad("Breaking hint")}${removed.length ? `${removed.length} path${removed.length === 1 ? "" : "s"} no longer accepted, which is a compatibility risk for existing documents` : changed.some((row) => row.includes("-type=") || row.includes("type=")) ? "a type declaration changed on at least one path" : "no removed paths and no type changes detected"}`);
    out.push("Examples, defaults, const values, enums and sensitive-like property names are never returned.");
    return out.join("\n");
}
