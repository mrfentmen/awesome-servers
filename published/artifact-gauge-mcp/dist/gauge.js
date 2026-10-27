import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
const MAX_DEPTH = 6;
const MAX_FILES = 2000;
const MAX_FILE_BYTES = 2 * 1024 * 1024 * 1024;
const MAX_TOTAL_BYTES = 8 * 1024 * 1024 * 1024;
const MAX_OUTPUT = 14000;
const SKIP = new Set([".git", "node_modules", "coverage", ".next", ".cache"]);
const MANIFESTS = new Set(["package.json", "package-lock.json", "pnpm-lock.yaml", "yarn.lock", "Cargo.lock", "go.sum", "requirements.txt", "pyproject.toml"]);
export class GaugeError extends Error {
}
async function boundedRoot(input) {
    const configured = process.env.ARTIFACT_GAUGE_ROOT ?? path.join(process.cwd(), "..");
    const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured));
    const target = await realpath(path.resolve(input || ".")).catch(() => path.resolve(input || "."));
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new GaugeError(`Artifact path must stay inside ${root}`);
    return target;
}
async function collect(root) {
    const result = [];
    let totalBytes = 0;
    async function walk(directory, depth) {
        if (depth > MAX_DEPTH || result.length >= MAX_FILES)
            return;
        let entries;
        try {
            entries = await readdir(directory, { withFileTypes: true });
        }
        catch {
            return;
        }
        for (const entry of entries) {
            if (SKIP.has(entry.name))
                continue;
            const full = path.join(directory, entry.name);
            const resolved = await realpath(full).catch(() => "");
            if (!resolved)
                continue;
            const relative = path.relative(root, resolved);
            if (relative.startsWith("..") || path.isAbsolute(relative))
                continue;
            if (entry.isDirectory())
                await walk(resolved, depth + 1);
            else {
                const info = await stat(resolved).catch(() => null);
                if (!info?.isFile() || info.size > MAX_FILE_BYTES || totalBytes + info.size > MAX_TOTAL_BYTES)
                    continue;
                result.push({ path: relative, bytes: info.size, extension: path.extname(entry.name).toLowerCase() || "[none]" });
                totalBytes += info.size;
            }
            if (result.length >= MAX_FILES)
                return;
        }
    }
    await walk(root, 0);
    return result;
}
export async function inspect(input) {
    const root = await boundedRoot(input);
    const files = await collect(root);
    const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0);
    const byExtension = Object.entries(files.reduce((out, item) => { out[item.extension] ??= { files: 0, bytes: 0 }; out[item.extension].files += 1; out[item.extension].bytes += item.bytes; return out; }, {})).sort((a, b) => b[1].bytes - a[1].bytes).slice(0, 50).map(([extension, value]) => ({ extension, ...value }));
    const largestFiles = [...files].sort((a, b) => b.bytes - a.bytes).slice(0, 50);
    const manifests = files.filter((item) => MANIFESTS.has(path.basename(item.path))).map((item) => ({ path: item.path, bytes: item.bytes }));
    return { root, filesScanned: files.length, totalBytes, byExtension, largestFiles, manifests, valueFree: true, warning: "Only paths, byte counts, extensions, and manifest filenames are returned. File contents and dependency versions are not emitted; this is a size heuristic, not a full bundler analyzer." };
}
export async function manifest(input, relativeFile) {
    const root = await boundedRoot(input);
    const target = await realpath(path.resolve(root, relativeFile)).catch(() => "");
    const relative = path.relative(root, target);
    if (!target || relative.startsWith("..") || path.isAbsolute(relative))
        throw new GaugeError("Manifest path must stay inside the selected root");
    if (!MANIFESTS.has(path.basename(target)))
        throw new GaugeError("Only recognized dependency manifest filenames are supported");
    const bytes = await readFile(target);
    if (bytes.byteLength > 2 * 1024 * 1024)
        throw new GaugeError("Manifest exceeds the 2 MB safety limit");
    const text = bytes.toString("utf8");
    return { path: relative, bytes: bytes.byteLength, lines: text.split(/\r?\n/).length, hasDependenciesWord: /dependencies|requires|requirement/i.test(text), valueFree: true, warning: "Manifest contents are not returned. This reports only bounded metadata." };
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT); }
const ROOT_BUCKET = "[root files]";
const HINT_EXTENSIONS = new Set([".map", ".log", ".tmp", ".bak", ".orig", ".rej", ".gz", ".zip", ".tar", ".tgz", ".old", ".swp"]);
export async function directoryWeights(input) {
    const root = await boundedRoot(input);
    const files = await collect(root);
    const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0);
    const buckets = new Map();
    for (const item of files) {
        const separator = item.path.indexOf(path.sep);
        const top = separator < 0 ? ROOT_BUCKET : item.path.slice(0, separator);
        const bucket = buckets.get(top) ?? { files: 0, bytes: 0 };
        bucket.files += 1;
        bucket.bytes += item.bytes;
        buckets.set(top, bucket);
    }
    const byDirectory = [...buckets.entries()]
        .map(([directory, value]) => ({
        directory,
        files: value.files,
        bytes: value.bytes,
        sharePercent: totalBytes ? Math.round((value.bytes / totalBytes) * 1000) / 10 : 0
    }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 40);
    return {
        root,
        filesScanned: files.length,
        totalBytes,
        directoryCount: buckets.size,
        byDirectory,
        valueFree: true,
        warning: "Only top level directory names, file counts, byte totals and share of the total are returned. File contents and dependency versions are not emitted."
    };
}
export async function sizeBudget(input, budgetBytes) {
    const root = await boundedRoot(input);
    const files = await collect(root);
    const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0);
    const budget = Math.max(1, Math.floor(budgetBytes));
    const perExtension = new Map();
    for (const item of files)
        perExtension.set(item.extension, (perExtension.get(item.extension) ?? 0) + item.bytes);
    const byExtension = [...perExtension.entries()]
        .map(([extension, bytes]) => ({
        extension,
        bytes,
        shareOfTotalPercent: totalBytes ? Math.round((bytes / totalBytes) * 1000) / 10 : 0,
        shareOfBudgetPercent: Math.round((bytes / budget) * 1000) / 10
    }))
        .sort((a, b) => b.bytes - a.bytes)
        .slice(0, 25);
    return {
        root,
        filesScanned: files.length,
        totalBytes,
        budgetBytes: budget,
        overBudget: totalBytes > budget,
        headroomBytes: budget - totalBytes,
        usedPercentOfBudget: Math.round((totalBytes / budget) * 1000) / 10,
        byExtension,
        valueFree: true,
        warning: "Only byte counts, extensions and percentages against the supplied budget are returned. File contents and dependency versions are not emitted."
    };
}
export async function artifactHints(input) {
    const root = await boundedRoot(input);
    const files = await collect(root);
    const totalBytes = files.reduce((sum, item) => sum + item.bytes, 0);
    const flagged = files.filter((item) => HINT_EXTENSIONS.has(item.extension));
    const flaggedBytes = flagged.reduce((sum, item) => sum + item.bytes, 0);
    const buckets = new Map();
    for (const item of flagged) {
        const bucket = buckets.get(item.extension) ?? { files: 0, bytes: 0 };
        bucket.files += 1;
        bucket.bytes += item.bytes;
        buckets.set(item.extension, bucket);
    }
    return {
        root,
        filesScanned: files.length,
        totalBytes,
        flaggedFileCount: flagged.length,
        flaggedBytes,
        flaggedShareOfTotalPercent: totalBytes ? Math.round((flaggedBytes / totalBytes) * 1000) / 10 : 0,
        byExtension: [...buckets.entries()]
            .map(([extension, value]) => ({ extension, files: value.files, bytes: value.bytes }))
            .sort((a, b) => b.bytes - a.bytes)
            .slice(0, 20),
        flaggedExtensions: [...HINT_EXTENSIONS].sort(),
        valueFree: true,
        warning: "Only byte counts and extension tallies are returned. This flags extensions commonly left behind by builds, logs and archives; it is a heuristic hint, not a verdict on whether a file is safe to delete."
    };
}

export async function githubRepoStats(args = {}) {
    const owner = String(args?.owner ?? 'modelcontextprotocol').trim();
    const repo = String(args?.repo ?? 'servers').trim();
    if (!/^[A-Za-z0-9._-]+$/.test(owner) || !/^[A-Za-z0-9._-]+$/.test(repo))
        throw new Error('Owner and repository names may only contain letters, digits, dot, dash and underscore.');
    const res = await fetch(`https://api.github.com/repos/${owner}/${repo}`, {
        headers: { 'User-Agent': 'mrfentmen-artifact-gauge-mcp/1.0', Accept: 'application/vnd.github+json' },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new Error(`GitHub has no repository ${owner}/${repo}`);
    if (res.status === 403)
        throw new Error('GitHub rate-limited this request; try again in a minute.');
    if (!res.ok)
        throw new Error(`GitHub returned ${res.status}`);
    const r = (await res.json());
    return [
        `${r.full_name}`,
        `Size: ${Math.round(Number(r.size ?? 0) / 1024 * 10) / 10} MB of git history`,
        `Stars ${r.stargazers_count ?? 0} · forks ${r.forks_count ?? 0} · watchers ${r.subscribers_count ?? 0} · open issues ${r.open_issues_count ?? 0}`,
        `Language: ${r.language ?? 'none'} · licence ${r.license?.spdx_id ?? 'none'}`,
        `Last push: ${String(r.pushed_at ?? '').slice(0, 10) || '?'} · created ${String(r.created_at ?? '').slice(0, 10) || '?'}`,
        r.default_branch ? `Default branch: ${r.default_branch}` : '',
        r.description ? String(r.description).trim() : '',
        r.html_url ?? '',
    ].filter(Boolean).join('\n');
}
