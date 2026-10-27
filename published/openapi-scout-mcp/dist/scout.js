import { readFile } from "node:fs/promises";
import { realpath } from "node:fs/promises";
import path from "node:path";
const MAX_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT = 14000;
export class ScoutError extends Error {
}
async function safePath(file) {
    const root = await realpath(path.resolve(process.env.OPENAPI_SCOUT_ROOT ?? path.join(process.cwd(), ".."))).catch(() => path.resolve(process.env.OPENAPI_SCOUT_ROOT ?? path.join(process.cwd(), "..")));
    const target = await realpath(path.resolve(file)).catch(() => path.resolve(file));
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new ScoutError(`Spec path must stay inside ${root}`);
    return target;
}
function redact(value, key = "") {
    if (key.toLowerCase() === "url")
        return safeServerUrl(value);
    const sensitive = /example|default|security|token|secret|password|api[-_]?key|authorization|cookie|credential/i.test(key);
    if (sensitive)
        return "[redacted by openapi-scout]";
    if (Array.isArray(value))
        return value.slice(0, 200).map((item) => redact(item));
    if (value && typeof value === "object")
        return Object.fromEntries(Object.entries(value).slice(0, 500).map(([childKey, childValue]) => [childKey, redact(childValue, childKey)]));
    return value;
}
function safeServerUrl(value) {
    if (typeof value !== "string")
        return null;
    try {
        const url = new URL(value);
        // Origins are useful for inventory, while paths can contain tenant IDs,
        // signed segments, or other credentials copied into an API description.
        return `${url.protocol}//${url.host}`.slice(0, 300);
    }
    catch {
        return "[invalid server URL]";
    }
}
async function load(file) {
    const target = await safePath(file);
    const buffer = await readFile(target);
    if (buffer.byteLength > MAX_BYTES)
        throw new ScoutError(`Spec exceeds ${MAX_BYTES} byte limit`);
    try {
        return JSON.parse(buffer.toString("utf8"));
    }
    catch {
        throw new ScoutError("Only JSON OpenAPI or Swagger files are supported in this release; convert YAML to JSON first");
    }
}
function clip(value) { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT); }
export async function summary(file) {
    const spec = await load(file);
    const paths = spec.paths && typeof spec.paths === "object" ? spec.paths : {};
    const operations = [];
    for (const [route, item] of Object.entries(paths).slice(0, 300)) {
        if (!item || typeof item !== "object")
            continue;
        for (const [method, operation] of Object.entries(item)) {
            if (!["get", "post", "put", "patch", "delete", "head", "options", "trace"].includes(method))
                continue;
            const data = operation && typeof operation === "object" ? operation : {};
            operations.push({ path: route, method: method.toUpperCase(), operationId: typeof data.operationId === "string" ? data.operationId : undefined, summary: typeof data.summary === "string" ? data.summary : undefined, tags: data.tags });
        }
    }
    return redact({ version: spec.openapi ?? spec.swagger ?? null, title: spec.info?.title ?? null, servers: Array.isArray(spec.servers) ? spec.servers.slice(0, 20).map((server) => typeof server === "object" && server ? { url: safeServerUrl(server.url) } : null) : undefined, basePath: typeof spec.basePath === "string" ? spec.basePath.slice(0, 300) : null, operationCount: operations.length, operations, warning: "Examples, defaults, security schemes, credential-like fields, and URLs are redacted. This is an inspection aid, not a complete contract validator." });
}
export async function operation(file, operationId) {
    const spec = await load(file);
    const paths = spec.paths && typeof spec.paths === "object" ? spec.paths : {};
    for (const [route, item] of Object.entries(paths)) {
        if (!item || typeof item !== "object")
            continue;
        for (const [method, value] of Object.entries(item)) {
            if (!value || typeof value !== "object")
                continue;
            const data = value;
            if (data.operationId === operationId)
                return redact({ path: route, method: method.toUpperCase(), operation: data });
        }
    }
    return null;
}
export async function schemas(file) { const spec = await load(file); const components = spec.components && typeof spec.components === "object" ? spec.components : {}; const definitions = components.schemas ?? spec.definitions ?? {}; return redact({ schemas: definitions, count: definitions && typeof definitions === "object" ? Object.keys(definitions).length : 0 }); }
export function format(value) { return clip(value); }
