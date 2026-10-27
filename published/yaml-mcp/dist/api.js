import yaml from "js-yaml";
export class YamlError extends Error {
}
export async function parseYaml(args) {
    const input = args.yaml ?? "";
    if (!input.trim())
        throw new YamlError("Provide YAML text");
    let data;
    try {
        data = yaml.load(input);
    }
    catch (e) {
        throw new YamlError(`Invalid YAML: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    }
    return `Parsed YAML\nTop level type: ${Array.isArray(data) ? "array" : typeof data}\n\n${JSON.stringify(data, null, 2).slice(0, 3000)}`;
}
export async function toJson(args) {
    const input = args.yaml ?? "";
    let data;
    try {
        data = yaml.load(input);
    }
    catch (e) {
        throw new YamlError(`Invalid YAML: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
    }
    return JSON.stringify(data, null, 2);
}
// ---- muxB tools:
const GITHUB_API = "https://api.github.com";
const trim = (v, max) => {
    const t = (v ?? "").replace(/\s+/g, " ").trim();
    if (!t)
        return "not reported";
    return t.length > max ? `${t.slice(0, max)}...` : t;
};
const METHODS = ["get", "put", "post", "delete", "options", "head", "patch", "trace"];
async function loadSpec(url) {
    if (!/^https:\/\//.test(url))
        throw new YamlError("The spec URL must be an https URL");
    const res = await fetch(url, {
        headers: { "User-Agent": "yaml-mcp/1.0", Accept: "application/json, application/yaml, text/yaml, text/plain" },
        signal: AbortSignal.timeout(30000),
    });
    if (!res.ok)
        throw new YamlError(`Spec download returned HTTP ${res.status}`);
    const body = (await res.text()).slice(0, 4_000_000);
    let doc;
    try {
        doc = JSON.parse(body);
    }
    catch {
        try {
            doc = yaml.load(body);
        }
        catch (e) {
            throw new YamlError(`That file is neither JSON nor valid YAML: ${e instanceof Error ? e.message.split("\n")[0] : String(e)}`);
        }
    }
    if (!doc || typeof doc !== "object")
        throw new YamlError("The spec did not parse to a mapping");
    return doc;
}
export async function listOperations(args) {
    const url = (args.url ?? "").trim();
    if (!url)
        throw new YamlError("Provide the https URL of an OpenAPI or Swagger spec");
    const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 25) || 25), 200));
    const doc = await loadSpec(url);
    const version = doc.openapi ?? doc.swagger;
    if (!version)
        throw new YamlError("No openapi or swagger version field found, this does not look like an API spec");
    const paths = doc.paths ?? {};
    const rows = [];
    for (const [p, ops] of Object.entries(paths)) {
        if (!ops || typeof ops !== "object")
            continue;
        for (const [method, raw] of Object.entries(ops)) {
            if (!METHODS.includes(method.toLowerCase()))
                continue;
            const op = (raw ?? {});
            const flags = [
                op.deprecated ? "deprecated" : null,
                Array.isArray(op.tags) && op.tags.length ? `tag ${op.tags.join("/")}` : null,
            ].filter(Boolean).join(", ");
            rows.push(`- ${method.toUpperCase()} ${p} | operationId ${trim(op.operationId, 60)} | ${flags || "no tags"}`);
            rows.push(`  ${trim(op.summary ?? op.description, 150)}`);
        }
    }
    if (!rows.length)
        throw new YamlError("The spec declares no operations");
    const head = [
        `API spec at ${url}`,
        `Version: ${version}`,
        `Title: ${trim(doc.info?.title, 100)}`,
        `API version: ${trim(doc.info?.version, 40)}`,
        doc.basePath ? `basePath: ${doc.basePath}` : "basePath: not reported",
        `Operations found: ${Math.ceil(rows.length / 2)}, showing ${Math.min(limit, Math.ceil(rows.length / 2))}`,
        "",
    ].join("\n");
    return head + rows.slice(0, limit * 2).join("\n");
}
export async function listRepoContents(args) {
    const repo = (args.repo ?? "").trim().replace(/^https:\/\/github\.com\//, "").replace(/\.git$/, "").replace(/\/+$/, "");
    if (!/^[\w.-]+\/[\w.-]+$/.test(repo))
        throw new YamlError("Provide a repository as owner/name, for example kubernetes/kubernetes");
    const sub = (args.path ?? "").trim().replace(/^\/+|\/+$/g, "");
    if (sub && /(^|\/)\.\.($|\/)/.test(sub))
        throw new YamlError("Path segments of .. are not allowed");
    const limit = Math.max(1, Math.min(Math.trunc(Number(args.limit ?? 30) || 30), 100));
    const url = `${GITHUB_API}/repos/${repo}/contents/${sub ? encodeURI(sub) : ""}`;
    const res = await fetch(url, {
        headers: { Accept: "application/vnd.github+json", "User-Agent": "yaml-mcp/1.0" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new YamlError(`No such path in ${repo}: ${sub || "(root)"}`);
    if (res.status === 403)
        throw new YamlError("GitHub refused the request, the unauthenticated rate limit may be used up");
    if (!res.ok)
        throw new YamlError(`GitHub returned HTTP ${res.status}`);
    const data = (await res.json());
    if (!Array.isArray(data)) {
        return `${repo}/${data.path ?? sub}\nOne file: ${data.name ?? "not reported"} | type ${data.type ?? "not reported"} | ${data.size ?? 0} bytes`;
    }
    if (!data.length)
        return `${repo}/${sub || "(root)"} is empty.`;
    const rows = data.slice(0, limit).map((c) => `- ${c.type ?? "file"} ${c.name ?? "unnamed"}${c.type === "file" ? ` (${c.size ?? 0} bytes)` : ""}`);
    return `Contents of ${repo}/${sub || "(root)"} (${data.length} entries, showing ${Math.min(limit, data.length)})\n${rows.join("\n")}`;
}
