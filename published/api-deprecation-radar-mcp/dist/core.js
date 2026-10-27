import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
export class DeprecationError extends Error {
}
;
const skip = new Set([".git", "node_modules", "dist", "build", "coverage"]);
async function rootOf(input) { const configured = process.env.API_DEPRECATION_ROOT ?? path.join(process.cwd(), ".."); const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured)); const req = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || "."); const target = await realpath(req).catch(() => req); const rel = path.relative(root, target); if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new DeprecationError("Project path must stay inside the configured root"); return target; }
export async function inspectDeprecationRadar(input) { const root = await rootOf(input.project); let files = 0, markers = 0; const severity = {}; async function walk(dir, d) { if (d > 6 || files > 1000)
    return; for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (skip.has(e.name))
        continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory())
        await walk(full, d + 1);
    else if (/\.(json|ya?ml|ts|tsx|js|jsx|py|go|rs|java|md)$/i.test(e.name)) {
        const b = await readFile(full).catch(() => Buffer.alloc(0));
        if (b.byteLength > 1000000)
            continue;
        const t = b.toString();
        files++;
        for (const m of t.matchAll(/deprecated|deprecation|sunset|obsolete/gi)) {
            markers++;
            const around = t.slice(Math.max(0, (m.index || 0) - 80), (m.index || 0) + 120);
            const k = /critical|breaking|sunset/i.test(around) ? "high" : /warning|soon/i.test(around) ? "medium" : "low";
            severity[k] = (severity[k] || 0) + 1;
        }
    }
} } await walk(root, 0); return { filesScanned: files, markerCount: markers, severityBuckets: severity, reviewSignal: markers ? "review" : "clear", valueFree: true, warning: "Marker counts are heuristic. Endpoint names, paths, source text, values, and file names are never returned." }; }
export function format(v) { return JSON.stringify(v, null, 2).slice(0, 12000); }
const manifestFiles = new Set(["package.json", "cargo.toml", "requirements.txt", "pyproject.toml", "go.mod", "gemfile", "pom.xml", "build.gradle", "composer.json", "pubspec.yaml"]);
const codeExt = /\.(ts|tsx|js|jsx|mjs|cjs|py|go|rs|java|kt|rb|php|cs|scala|swift|kt)$/i;
export async function inspectVersionPins(input) {
    const root = await rootOf(input.project);
    const wanted = (input.pin ?? "").trim().toLowerCase();
    const found = [];
    let files = 0;
    async function walk(dir, d) {
        if (d > 6 || files > 2000)
            return;
        for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
            if (skip.has(e.name))
                continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory())
                await walk(full, d + 1);
            else if (manifestFiles.has(e.name)) {
                const t = await readFile(full, "utf8").catch(() => "");
                if (!t)
                    continue;
                files++;
                const rel = path.relative(root, full);
                const ecosystem = e.name === "package.json" ? "npm" : e.name === "cargo.toml" ? "cargo" : e.name === "go.mod" ? "go" : e.name === "requirements.txt" ? "pip" : e.name === "pyproject.toml" ? "pypi" : "other";
                const ranges = [...t.matchAll(/"([@a-zA-Z0-9._/-]+)"\s*:\s*"([^"]+)"|^\s*([a-zA-Z0-9._-]+)\s*=\s*"?([^"\s]+)"?|^([a-zA-Z0-9._-]+)\s*[><=~^]+\s*([0-9][^\s,;#]*)/gm)];
                const entries = ranges.length;
                if (!entries)
                    continue;
                let exact = 0, caret = 0, tilde = 0, wildcard = 0, any = 0, loose = 0;
                const matched = [];
                for (const m of ranges) {
                    const spec = (m[2] ?? m[4] ?? m[6] ?? "").trim();
                    const dep = (m[1] ?? m[3] ?? m[5] ?? "").trim();
                    if (!spec)
                        continue;
                    if (spec === "*" || spec === "latest" || spec === "x")
                        any++;
                    else if (/^\^/.test(spec))
                        caret++;
                    else if (/^~/.test(spec))
                        tilde++;
                    else if (/^[0-9]/.test(spec))
                        exact++;
                    else if (/>|<|=/.test(spec))
                        loose++;
                    else if (/[*xX]/.test(spec))
                        wildcard++;
                    if (wanted && `${dep} ${spec}`.toLowerCase().includes(wanted))
                        matched.push(`${dep} ${spec}`);
                }
                found.push({ manifest: rel, ecosystem, entries, exact, caret, tilde, wildcard, any, loose, matched: matched.slice(0, 12) });
            }
        }
    }
    await walk(root, 0);
    const totals = found.reduce((a, f) => ({ entries: a.entries + f.entries, exact: a.exact + f.exact, caret: a.caret + f.caret, tilde: a.tilde + f.tilde, wildcard: a.wildcard + f.wildcard, any: a.any + f.any, loose: a.loose + f.loose }), { entries: 0, exact: 0, caret: 0, tilde: 0, wildcard: 0, any: 0, loose: 0 });
    return { filesScanned: files, manifests: found.length, totals,
        floatingShare: totals.entries ? Number((((totals.caret + totals.tilde + totals.wildcard + totals.any + totals.loose) / totals.entries) * 100).toFixed(1)) : 0,
        detail: found, filter: wanted || "none", valueFree: true,
        warning: "Version specifiers are read literally from manifests. Caret, tilde, wildcard and unbounded ranges all float and can pull a breaking release on a fresh install." };
}
export async function inspectEndpointInventory(input) {
    const root = await rootOf(input.project);
    const only = (input.scheme ?? "").trim().toLowerCase();
    const endpoints = new Map();
    const insecure = new Map();
    const versions = new Map();
    let files = 0, calls = 0;
    async function walk(dir, d) {
        if (d > 6 || files > 2000)
            return;
        for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
            if (skip.has(e.name))
                continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory())
                await walk(full, d + 1);
            else if (codeExt.test(e.name)) {
                const t = await readFile(full, "utf8").catch(() => "");
                if (!t || t.length > 1000000)
                    continue;
                files++;
                for (const m of t.matchAll(/["'`](https?:\/\/[A-Za-z0-9._~:/?#\[\]@!$&'()*+,;=%-]+)["'`]/g)) {
                    const url = m[1];
                    if (only && !url.toLowerCase().startsWith(only))
                        continue;
                    calls++;
                    let host = "", pathname = url;
                    try {
                        const u = new URL(url);
                        host = u.host;
                        pathname = u.pathname;
                    }
                    catch { }
                    const key = `${host}${pathname.replace(/\/[0-9a-f]{8,}/gi, "/{id}").replace(/\/\d+(?=\/|$)/g, "/{id}")}`;
                    endpoints.set(key, (endpoints.get(key) ?? 0) + 1);
                    if (url.toLowerCase().startsWith("http://"))
                        insecure.set(`${host}${pathname}`, (insecure.get(`${host}${pathname}`) ?? 0) + 1);
                    const vm = pathname.match(/^\/v(\d+)(?=\/|$)/);
                    if (vm)
                        versions.set(`v${vm[1]}`, (versions.get(`v${vm[1]}`) ?? 0) + 1);
                }
            }
        }
    }
    await walk(root, 0);
    const ranked = [...endpoints.entries()].sort((a, b) => b[1] - a[1]);
    return { filesScanned: files, hardCodedUrls: calls, distinctEndpoints: ranked.length, versionedPaths: [...versions.entries()].sort(),
        insecureEndpoints: [...insecure.entries()].sort((a, b) => b[1] - a[1]),
        topEndpoints: ranked.slice(0, 25).map(([k, v]) => ({ endpoint: k, occurrences: v })),
        filter: only || "any scheme", valueFree: true,
        warning: "Counts come from string literals in source. Numeric and hex path segments are collapsed to {id} so resource counts do not inflate the endpoint list." };
}
