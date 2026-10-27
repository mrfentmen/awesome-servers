import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
const MAX_DEPTH = 4;
const MAX_FILES = 80;
const MAX_FILE_BYTES = 2 * 1024 * 1024;
const MAX_OUTPUT = 14000;
const SKIP = new Set([".git", "node_modules", "dist", "build", "coverage", ".next", ".cache"]);
const FILES = new Map([
    ["package.json", "npm"], ["package-lock.json", "npm"], ["npm-shrinkwrap.json", "npm"],
    ["pnpm-lock.yaml", "pnpm"], ["yarn.lock", "yarn"], ["bun.lock", "bun"], ["bun.lockb", "bun"],
    ["Cargo.toml", "cargo"], ["Cargo.lock", "cargo"], ["go.mod", "go"], ["go.sum", "go"],
    ["pyproject.toml", "python"], ["poetry.lock", "python"], ["Pipfile", "python"], ["Pipfile.lock", "python"],
    ["Gemfile", "ruby"], ["Gemfile.lock", "ruby"], ["composer.json", "php"], ["composer.lock", "php"],
]);
export class DriftError extends Error {
}
async function boundedRoot(input) {
    const configured = process.env.DEPENDENCY_DRIFT_ROOT ?? path.join(process.cwd(), "..");
    const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured));
    const requested = path.isAbsolute(input || "") ? path.resolve(input || ".") : path.resolve(root, input || ".");
    const target = await realpath(requested).catch(() => requested);
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new DriftError("Project path must stay inside the configured root");
    const info = await stat(target).catch(() => null);
    if (!info?.isDirectory())
        throw new DriftError("Project must be a readable directory");
    return target;
}
async function collect(root) {
    const found = [];
    async function walk(directory, depth) {
        if (depth > MAX_DEPTH || found.length >= MAX_FILES)
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
            if (entry.isDirectory()) {
                await walk(resolved, depth + 1);
                continue;
            }
            const manager = FILES.get(entry.name);
            if (!manager)
                continue;
            const info = await stat(resolved).catch(() => null);
            if (!info?.isFile() || info.size > MAX_FILE_BYTES)
                continue;
            const bytes = await readFile(resolved).catch(() => Buffer.alloc(0));
            found.push({ name: entry.name, manager, bytes: bytes.byteLength, text: bytes.toString("utf8") });
            if (found.length >= MAX_FILES)
                return;
        }
    }
    await walk(root, 0);
    return found;
}
function countManifestDependencies(text, file) {
    if (file !== "package.json" && file !== "composer.json")
        return 0;
    try {
        const value = JSON.parse(text);
        const sections = ["dependencies", "devDependencies", "peerDependencies", "optionalDependencies", "bundledDependencies", "require"];
        return sections.reduce((sum, key) => {
            const section = value[key];
            return sum + (Array.isArray(section) ? section.length : section && typeof section === "object" ? Object.keys(section).length : 0);
        }, 0);
    }
    catch {
        return 0;
    }
}
function countLockEntries(text, file) {
    if (file === "package-lock.json" || file === "npm-shrinkwrap.json") {
        try {
            const value = JSON.parse(text);
            const packages = value.packages;
            if (packages && typeof packages === "object")
                return Math.max(0, Object.keys(packages).length - 1);
            const dependencies = value.dependencies;
            return dependencies && typeof dependencies === "object" ? Object.keys(dependencies).length : 0;
        }
        catch {
            return 0;
        }
    }
    const markers = file === "pnpm-lock.yaml" ? /(?:^|\n)\s{2,}[^\s:#][^:]*:/g : file === "yarn.lock" ? /(?:^|\n)[^\s#][^\n]*:\n/g : /(?:^|\n)(?:\s{2,})[^\s#][^\n:]*:/g;
    return (text.match(markers) ?? []).length;
}
function marker(text) { if (/lockfileVersion/i.test(text))
    return "lockfile-version"; if (/^lockfileVersion:/m.test(text))
    return "yaml-lockfile-version"; if (/^packages:/m.test(text))
    return "package-map"; if (/^dependencies:/m.test(text))
    return "dependency-map"; return "unmarked"; }
export async function inspectDependencyDrift(input) {
    const root = await boundedRoot(input);
    const found = await collect(root);
    const manifests = found.filter((item) => !/lock$|\.lock$|lock\.json$|lock\.yaml$|shrinkwrap|sum$/.test(item.name));
    const locks = found.filter((item) => !manifests.includes(item));
    const manifestManagers = [...new Set(manifests.map((item) => item.manager))].sort();
    const lockManagers = [...new Set(locks.map((item) => item.manager))].sort();
    const managerMismatchCount = locks.filter((lock) => !manifests.some((manifest) => manifest.manager === lock.manager)).length;
    const declaredDependencyCount = manifests.reduce((sum, item) => sum + countManifestDependencies(item.text, item.name), 0);
    const lockedEntryCount = locks.reduce((sum, item) => sum + countLockEntries(item.text, item.name), 0);
    const lockMarkers = Object.fromEntries([...new Set(locks.map((item) => marker(item.text)))].sort().map((key) => [key, locks.filter((item) => marker(item.text) === key).length]));
    const result = {
        filesScanned: found.length,
        manifestCount: manifests.length,
        lockfileCount: locks.length,
        manifestManagerCounts: Object.fromEntries([...new Set(manifestManagers)].map((manager) => [manager, manifests.filter((item) => item.manager === manager).length])),
        lockfileManagerCounts: Object.fromEntries([...new Set(lockManagers)].map((manager) => [manager, locks.filter((item) => item.manager === manager).length])),
        declaredDependencyCount,
        lockedEntryCount,
        missingLockfileCount: Math.max(0, manifests.filter((manifest) => !locks.some((lock) => lock.manager === manifest.manager)).length),
        orphanLockfileCount: Math.max(0, locks.filter((lock) => !manifests.some((manifest) => manifest.manager === lock.manager)).length),
        managerMismatchCount,
        lockMarkerCounts: lockMarkers,
        driftRisk: managerMismatchCount > 0 || manifests.length > locks.length ? "review" : "low-signal",
        valueFree: true,
        warning: "Only aggregate counts and manager categories are returned. Package names, versions, paths, commands, source text, and environment values are never emitted."
    };
    return result;
}
export function format(value) { return JSON.stringify(value, null, 2).slice(0, MAX_OUTPUT); }
const LIFECYCLE_HOOKS = ["preinstall", "install", "postinstall", "prepublish", "prepublishOnly", "prepare"];
const LOOSE_LOCK = /lock$|\.lock$|lock\.json$|lock\.yaml$|shrinkwrap|sum$/;
export async function inspectInstallScripts(input) {
    const root = await boundedRoot(input);
    const found = await collect(root);
    const manifests = found.filter((item) => item.name === "package.json");
    const hookCounts = {};
    let unreadableManifestCount = 0;
    let manifestsWithLifecycleHooks = 0;
    let totalScriptCount = 0;
    let totalLifecycleHookCount = 0;
    let maxHooksInOneManifest = 0;
    for (const manifest of manifests) {
        let parsed;
        try {
            parsed = JSON.parse(manifest.text);
        }
        catch {
            unreadableManifestCount += 1;
            continue;
        }
        const scripts = parsed.scripts;
        const names = scripts && typeof scripts === "object" ? Object.keys(scripts) : [];
        totalScriptCount += names.length;
        const hooks = names.filter((name) => LIFECYCLE_HOOKS.includes(name));
        if (hooks.length)
            manifestsWithLifecycleHooks += 1;
        totalLifecycleHookCount += hooks.length;
        if (hooks.length > maxHooksInOneManifest)
            maxHooksInOneManifest = hooks.length;
        for (const hook of hooks)
            hookCounts[hook] = (hookCounts[hook] ?? 0) + 1;
    }
    return {
        manifestsScanned: manifests.length,
        unreadableManifestCount,
        totalScriptCount,
        manifestsWithLifecycleHooks,
        totalLifecycleHookCount,
        maxHooksInOneManifest,
        lifecycleHookCounts: Object.fromEntries(Object.entries(hookCounts).sort((a, b) => a[0].localeCompare(b[0]))),
        risk: totalLifecycleHookCount > 0 ? "review" : "low-signal",
        valueFree: true,
        warning: "Only aggregate counts and hook categories are returned. Package names, script bodies, versions, paths, commands, and environment values are never emitted."
    };
}
export async function inspectLockIntegrity(input) {
    const root = await boundedRoot(input);
    const found = await collect(root);
    const locks = found.filter((item) => LOOSE_LOCK.test(item.name));
    const jsonLocks = locks.filter((item) => item.name === "package-lock.json" || item.name === "npm-shrinkwrap.json");
    let parsedLockfileCount = 0;
    let unreadableLockfileCount = 0;
    let entriesWithIntegrity = 0;
    let entriesWithoutIntegrity = 0;
    let entriesWithResolved = 0;
    let entriesWithoutResolved = 0;
    for (const lock of jsonLocks) {
        let parsed;
        try {
            parsed = JSON.parse(lock.text);
        }
        catch {
            unreadableLockfileCount += 1;
            continue;
        }
        parsedLockfileCount += 1;
        const packages = parsed.packages;
        let entries = [];
        if (packages && typeof packages === "object") {
            entries = Object.entries(packages)
                .filter(([key]) => key !== "")
                .map(([, value]) => (value && typeof value === "object" ? value : {}));
        }
        else if (parsed.dependencies && typeof parsed.dependencies === "object") {
            entries = Object.values(parsed.dependencies)
                .map((value) => (value && typeof value === "object" ? value : {}));
        }
        for (const entry of entries) {
            if (typeof entry.integrity === "string" && entry.integrity)
                entriesWithIntegrity += 1;
            else
                entriesWithoutIntegrity += 1;
            if (typeof entry.resolved === "string" && entry.resolved)
                entriesWithResolved += 1;
            else
                entriesWithoutResolved += 1;
        }
    }
    const entriesAnalysed = entriesWithIntegrity + entriesWithoutIntegrity;
    return {
        lockfilesScanned: locks.length,
        jsonLockfileCount: jsonLocks.length,
        parsedLockfileCount,
        unreadableLockfileCount,
        otherLockfileCount: locks.length - jsonLocks.length,
        entriesAnalysed,
        entriesWithIntegrity,
        entriesWithoutIntegrity,
        entriesWithResolved,
        entriesWithoutResolved,
        integrityCoveragePercent: entriesAnalysed ? Math.round((entriesWithIntegrity / entriesAnalysed) * 1000) / 10 : null,
        risk: entriesWithoutIntegrity > 0 ? "review" : "low-signal",
        valueFree: true,
        warning: "Only aggregate counts are returned. Package names, versions, integrity hashes, resolved URLs, paths, and file contents are never emitted. Only npm JSON lockfiles are parsed; other lockfile formats are counted but not analysed."
    };
}
