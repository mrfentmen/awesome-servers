import { readdir, readFile, realpath } from "node:fs/promises";
import path from "node:path";
export class ConfigWeatherError extends Error {
}
;
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage"]);
const configFile = /^(?:\.env(?:\..+)?|docker-compose.*\.ya?ml|compose.*\.ya?ml|.*config.*\.(json|ya?ml|toml|ini|js|ts)|tsconfig.*\.json|.*\.rc)$/i;
async function rootOf(input) { const configured = process.env.CONFIG_WEATHER_ROOT ?? path.join(process.cwd(), ".."); const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured)); const req = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || "."); const target = await realpath(req).catch(() => req); const rel = path.relative(root, target); if (rel.startsWith("..") || path.isAbsolute(rel))
    throw new ConfigWeatherError("Project path must stay inside the configured root"); return target; }
export async function inspectConfigWeather(input) { const root = await rootOf(input.project); let files = 0, lines = 0, envRefs = 0, duplicateKeys = 0; const formats = {}; const keys = new Set(); async function walk(dir, d) { if (d > 5 || files > 500)
    return; for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
    if (SKIP.has(e.name))
        continue;
    const full = path.join(dir, e.name);
    if (e.isDirectory())
        await walk(full, d + 1);
    else if (configFile.test(e.name)) {
        const b = await readFile(full).catch(() => Buffer.alloc(0));
        if (b.byteLength > 1000000)
            continue;
        const t = b.toString();
        files++;
        lines += t.split(/\r?\n/).length;
        const ext = path.extname(e.name) || "[none]";
        formats[ext] = (formats[ext] || 0) + 1;
        for (const m of t.matchAll(/(?:process\.env\.|import\.meta\.env\.|\b[A-Z][A-Z0-9_]{2,})/g)) {
            envRefs++;
            const key = m[0].replace(/^(process\.env\.|import\.meta\.env\.)/, "");
            if (keys.has(key))
                duplicateKeys++;
            keys.add(key);
        }
    }
} } await walk(root, 0); return { configFiles: files, configLines: lines, formatCounts: formats, environmentReferenceCount: envRefs, duplicateKeySignalCount: duplicateKeys, weather: duplicateKeys > 0 || envRefs > 100 ? "stormy" : files > 20 ? "cloudy" : "clear", valueFree: true, warning: "Configuration values, key names, paths, source text, and secrets are not returned. Counts are heuristic." }; }
export function format(v) { return JSON.stringify(v, null, 2).slice(0, 12000); }
const envFile = /^\.env(?:\..+)?$/i;
const layerPatterns = [
    ["production", /(^|[^a-z])(prod|production)([^a-z]|$)/i],
    ["staging", /(^|[^a-z])(stag|staging|preprod)([^a-z]|$)/i],
    ["development", /(^|[^a-z])(dev|develop|development|local)([^a-z]|$)/i],
    ["test", /(^|[^a-z])(test|spec|ci)([^a-z]|$)/i],
    ["container", /(docker|compose|container|k8s|kubernetes|helm)/i],
];
function layersOf(name) { const hits = []; for (const [label, re] of layerPatterns) {
    if (re.test(name))
        hits.push(label);
} return hits.length ? hits : ["unclassified"]; }
export async function inspectEnvContract(input) {
    const root = await rootOf(input.project);
    const defined = new Set();
    const definedIn = new Map();
    const referenced = new Map();
    let files = 0, envFiles = 0, assignments = 0, bracketed = 0, emptyValues = 0;
    async function walk(dir, d) {
        if (d > 5 || files > 1500)
            return;
        for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
            if (SKIP.has(e.name))
                continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory())
                await walk(full, d + 1);
            else {
                const isEnv = envFile.test(e.name);
                if (!isEnv && !configFile.test(e.name)) {
                    // Source files are not configuration, but they are where env keys are
                    // actually referenced, so they still have to be read for references.
                    if (!/\.(ts|tsx|js|jsx|mjs|cjs|py|go|rb|php|java|kt|swift|cs|scala|sh|bash|zsh|ya?ml|toml|ini|properties|env)$/i.test(e.name))
                        continue;
                    const sb = await readFile(full).catch(() => Buffer.alloc(0));
                    if (sb.byteLength > 1000000 || !sb.length)
                        continue;
                    files++;
                    const st = sb.toString();
                    for (const m of st.matchAll(/(?:process\.env\.|import\.meta\.env\.)\s*([A-Za-z_][A-Za-z0-9_]*)/g)) {
                        referenced.set(m[1], (referenced.get(m[1]) ?? 0) + 1);
                    }
                    for (const m of st.matchAll(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*\}/g)) {
                        referenced.set(m[1], (referenced.get(m[1]) ?? 0) + 1);
                    }
                    for (const m of st.matchAll(/\$\{\s*([A-Za-z_][A-Za-z0-9_]*)\s*:/g)) {
                        defined.add(m[1]);
                    }
                    continue;
                }
                const b = await readFile(full).catch(() => Buffer.alloc(0));
                if (b.byteLength > 1000000)
                    continue;
                const t = b.toString();
                files++;
                const rel = path.relative(root, full);
                if (isEnv) {
                    envFiles++;
                    for (const line of t.split(/\r?\n/)) {
                        const m = /^\s*(?:export\s+)?([A-Za-z_][A-Za-z0-9_]*)\s*=\s*(.*)$/.exec(line);
                        if (!m)
                            continue;
                        assignments++;
                        const key = m[1];
                        const value = m[2].trim();
                        if (!value)
                            emptyValues++;
                        if (value.startsWith("${"))
                            bracketed++;
                        defined.add(key);
                        const list = definedIn.get(key) ?? [];
                        list.push(rel);
                        definedIn.set(key, list);
                    }
                }
                for (const m of t.matchAll(/(?:process\.env\.|import\.meta\.env\.)\s*([A-Za-z_][A-Za-z0-9_]*)/g)) {
                    const key = m[1];
                    referenced.set(key, (referenced.get(key) ?? 0) + 1);
                }
            }
        }
    }
    await walk(root, 0);
    const missing = [];
    for (const key of referenced.keys())
        if (!defined.has(key))
            missing.push(key);
    const unused = [];
    for (const key of defined.keys())
        if (!referenced.has(key))
            unused.push(key);
    const multiOrigin = [...definedIn.entries()].filter(([, v]) => v.length > 1).map(([k, v]) => [k, v.length]).sort((a, b) => b[1] - a[1]);
    const totalRefs = [...referenced.values()].reduce((a, b) => a + b, 0);
    return {
        filesScanned: files, envFiles, assignments, bracketedValues: bracketed, emptyValues,
        distinctKeysDefined: defined.size, distinctKeysReferenced: referenced.size, totalReferences: totalRefs,
        referencedButNotDefined: { count: missing.length, keys: missing.slice(0, 30) },
        definedButNotReferenced: { count: unused.length, keys: unused.slice(0, 30) },
        keysDefinedInMultipleFiles: { count: multiOrigin.length, keys: multiOrigin.slice(0, 20).map(([k, n]) => ({ key: k, files: n })) },
        completeness: referenced.size ? Number((((referenced.size - missing.length) / referenced.size) * 100).toFixed(1)) : null,
        valueFree: true,
        warning: "Key names and file names are returned but no values. A key defined only in a .env file that is git ignored will read as referenced but not defined, which is expected rather than a defect."
    };
}
export async function inspectConfigLayers(input) {
    const root = await rootOf(input.project);
    const layers = {};
    const overlapping = [];
    let files = 0, totalLines = 0;
    async function walk(dir, d) {
        if (d > 5 || files > 1000)
            return;
        for (const e of await readdir(dir, { withFileTypes: true }).catch(() => [])) {
            if (SKIP.has(e.name))
                continue;
            const full = path.join(dir, e.name);
            if (e.isDirectory())
                await walk(full, d + 1);
            else if (configFile.test(e.name)) {
                const b = await readFile(full).catch(() => Buffer.alloc(0));
                if (b.byteLength > 1000000)
                    continue;
                const rel = path.relative(root, full);
                const text = b.toString();
                const n = text.split(/\r?\n/).length;
                files++;
                totalLines += n;
                const hits = layersOf(rel);
                if (hits.length > 1)
                    overlapping.push(rel);
                const ext = path.extname(e.name) || "[none]";
                for (const l of hits) {
                    const slot = layers[l] ?? { files: 0, lines: 0, extensions: {} };
                    slot.files++;
                    slot.lines += n;
                    slot.extensions[ext] = (slot.extensions[ext] ?? 0) + 1;
                    layers[l] = slot;
                }
            }
        }
    }
    await walk(root, 0);
    const ranked = Object.entries(layers).sort((a, b) => b[1].files - a[1].files);
    return {
        filesScanned: files, totalLines, layerCount: ranked.length,
        layers: Object.fromEntries(ranked),
        multiLayerFiles: { count: overlapping.length, sample: overlapping.slice(0, 15) },
        layerBalance: ranked.length > 1 && ranked[0][1].files > 0 ? Number((Math.min(...ranked.map(([, v]) => v.files)) / ranked[0][1].files).toFixed(2)) : null,
        valueFree: true,
        warning: "A file can match several layers, for example docker-compose.prod.yml, so layer totals can exceed the file count. Names are returned but no contents."
    };
}
