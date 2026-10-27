import { readdir, readFile, realpath, stat } from "node:fs/promises";
import path from "node:path";
// ---- muxB tools:
const RUNTIME_FAMILIES = ["node", "python", "ruby", "java", "go", "rust", "dotnet", "docker"];
const MANIFEST_FILES = /^(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|Gemfile|composer\.json|requirements\.txt|Pipfile)$/i;
const PIN_FILES = /^\.(nvmrc|python-version|tool-versions|java-version|go-version)$/i;
const CONTAINER_FILES = /^(Dockerfile|docker-compose|compose)/i;
const CI_DIR = /^(?:\.github|\.gitlab|\.circleci|\.buildkite)\//;
const CONSTRAINT_WORDS = /engines|toolchain|rust-version|requires-python|python_requires|runtime|node-version|python-version|jvmTarget|target|go\s+1\.|sdk\s*[=:]/i;
const SKIP_DIRS = new Set([".git", "node_modules", "dist", "build"]);
const ALLOWED_FILE = /^(package\.json|pyproject\.toml|Cargo\.toml|go\.mod|\.nvmrc|\.python-version|Dockerfile.*|.*\.(?:ya?ml))$/i;
const MAX_FILES = 400;
const MAX_DEPTH = 6;
function pad(label, width = 20) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
function categoriesOf(file) {
    const out = [];
    if (MANIFEST_FILES.test(file))
        out.push("manifest");
    if (PIN_FILES.test(file))
        out.push("pin");
    if (CONTAINER_FILES.test(file))
        out.push("container");
    if (CI_DIR.test(file) || /\.ya?ml$/i.test(file))
        out.push("ci");
    return out;
}
function familyRegex(family) {
    if (family === "go")
        return /\b(?:go|golang|go-version)\b/i;
    if (family === "dotnet")
        return /\b(?:dotnet|aspnet|coreclr)\b/i;
    return new RegExp(`\\b${family}\\b`, "i");
}
function majorsIn(line) {
    const out = [];
    for (const match of line.matchAll(/\b(\d{1,3})(?:\.\d{1,4}){1,3}\b/g)) {
        const value = Number(match[1]);
        if (value >= 0 && value <= 999)
            out.push(value);
    }
    for (const match of line.matchAll(/(?:>=|<=|>|<|\^|~|=)\s*(\d{1,3})(?:\.\d+)?\b/g)) {
        const value = Number(match[1]);
        if (value >= 0 && value <= 999)
            out.push(value);
    }
    for (const match of line.matchAll(/\b(?:from|image|FROM)\s+[\w.-]*?[:@](\d{1,3})(?:\.\d+)?/g)) {
        const value = Number(match[1]);
        if (value >= 0 && value <= 999)
            out.push(value);
    }
    return out;
}
export async function runtimeSupportMatrix(args) {
    const base = process.env.RUNTIME_SUPPORT_ROOT ?? path.join(process.cwd(), "..");
    const root = await realpath(path.resolve(base)).catch(() => path.resolve(base));
    const requested = path.isAbsolute(args.project ?? "") ? path.resolve(args.project ?? "") : path.resolve(root, args.project ?? ".");
    const target = await realpath(requested).catch(() => requested);
    const rel = path.relative(root, target);
    if (rel.startsWith("..") || path.isAbsolute(rel))
        throw new Error("Project path must stay inside the configured root");
    const info = await stat(target).catch(() => null);
    if (!info?.isDirectory())
        throw new Error("Project path does not exist");
    const categoryOrder = ["manifest", "pin", "container", "ci", "other"];
    const seen = {};
    const constrained = {};
    const categoryFiles = {};
    let files = 0;
    async function walk(dir, depth) {
        if (depth > MAX_DEPTH || files >= MAX_FILES)
            return;
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            if (SKIP_DIRS.has(entry.name))
                continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full, depth + 1);
                continue;
            }
            if (!ALLOWED_FILE.test(entry.name))
                continue;
            const bytes = await readFile(full).catch(() => Buffer.alloc(0));
            if (bytes.byteLength > 1000000)
                continue;
            files += 1;
            const cats = categoriesOf(entry.name);
            const bucket = cats.length ? cats : ["other"];
            for (const cat of bucket)
                categoryFiles[cat] = (categoryFiles[cat] ?? 0) + 1;
            const content = bytes.toString();
            const hasConstraint = CONSTRAINT_WORDS.test(content);
            for (const family of RUNTIME_FAMILIES) {
                const pattern = familyRegex(family);
                if (!pattern.test(content))
                    continue;
                const row = (seen[family] ??= Object.fromEntries(categoryOrder.map((key) => [key, 0])));
                for (const cat of bucket)
                    row[cat] += 1;
                if (hasConstraint)
                    constrained[family] = (constrained[family] ?? 0) + 1;
            }
        }
    }
    await walk(target, 0);
    const families = RUNTIME_FAMILIES.filter((family) => seen[family]);
    const out = [];
    out.push(`Runtime support matrix (${files} manifest, container or CI files scanned)`);
    out.push(`${pad("File categories")}${categoryOrder.map((key) => `${key}=${categoryFiles[key] ?? 0}`).join("  ")}`);
    if (!families.length) {
        out.push(`${pad("Families")}no runtime family signal found in the scanned files`);
        out.push("Versions, paths, filenames, source text and dependency names are never returned.");
        return out.join("\n");
    }
    out.push(`${pad("Families")}${families.length} of ${RUNTIME_FAMILIES.length} have signal`);
    out.push(`${pad("Family")}`.concat(categoryOrder.map((key) => key.padEnd(9)).join(" ")));
    for (const family of families) {
        const row = seen[family];
        out.push(`${pad("")}${family}  `.padEnd(20) + categoryOrder.map((key) => String(row[key]).padEnd(9)).join(" "));
    }
    const withManifest = families.filter((family) => seen[family].manifest > 0);
    const withPin = families.filter((family) => seen[family].pin > 0);
    const withContainer = families.filter((family) => seen[family].container > 0);
    const withCi = families.filter((family) => seen[family].ci > 0);
    out.push(`${pad("Coverage")}manifest ${withManifest.length}/${families.length}  pin ${withPin.length}/${families.length}  container ${withContainer.length}/${families.length}  ci ${withCi.length}/${families.length}`);
    out.push(`${pad("Constrained")}${families.filter((family) => (constrained[family] ?? 0) > 0).length} of ${families.length} families saw a version-constraint keyword`);
    const gaps = [];
    for (const family of families) {
        const row = seen[family];
        if (row.manifest === 0 && (row.ci > 0 || row.container > 0))
            gaps.push(`${family}: used in ci or container files with no manifest evidence`);
        else if (row.manifest === 0 && row.pin === 0)
            gaps.push(`${family}: mentioned only outside manifests and pin files`);
    }
    out.push(`${pad("Gaps")}${gaps.length ? `${gaps.length} found` : "none"}`);
    for (const gap of gaps.slice(0, 8))
        out.push(`  - ${gap}`);
    const manifestRatio = families.length ? withManifest.length / families.length : 0;
    out.push(`${pad("Verdict")}${manifestRatio === 1 && withPin.length === families.length ? "every declared runtime has a manifest and a pin" : manifestRatio >= 0.5 ? "partially-covered" : "manifest-coverage-low"}`);
    out.push("Versions, paths, filenames, source text and dependency names are never returned.");
    return out.join("\n");
}
export async function runtimeConstraintSpread(args) {
    const base = process.env.RUNTIME_SUPPORT_ROOT ?? path.join(process.cwd(), "..");
    const root = await realpath(path.resolve(base)).catch(() => path.resolve(base));
    const requested = path.isAbsolute(args.project ?? "") ? path.resolve(args.project ?? "") : path.resolve(root, args.project ?? ".");
    const target = await realpath(requested).catch(() => requested);
    const rel = path.relative(root, target);
    if (rel.startsWith("..") || path.isAbsolute(rel))
        throw new Error("Project path must stay inside the configured root");
    const info = await stat(target).catch(() => null);
    if (!info?.isDirectory())
        throw new Error("Project path does not exist");
    const majors = {};
    let files = 0;
    let constraintLines = 0;
    async function walk(dir, depth) {
        if (depth > MAX_DEPTH || files >= MAX_FILES)
            return;
        const entries = await readdir(dir, { withFileTypes: true }).catch(() => []);
        for (const entry of entries) {
            if (SKIP_DIRS.has(entry.name))
                continue;
            const full = path.join(dir, entry.name);
            if (entry.isDirectory()) {
                await walk(full, depth + 1);
                continue;
            }
            if (!ALLOWED_FILE.test(entry.name))
                continue;
            const bytes = await readFile(full).catch(() => Buffer.alloc(0));
            if (bytes.byteLength > 1000000)
                continue;
            files += 1;
            for (const line of bytes.toString().split(/\r?\n/)) {
                if (line.length > 2000)
                    continue;
                const families = RUNTIME_FAMILIES.filter((family) => familyRegex(family).test(line));
                if (!families.length)
                    continue;
                const found = majorsIn(line);
                if (!found.length)
                    continue;
                constraintLines += 1;
                for (const family of families) {
                    const set = (majors[family] ??= new Set());
                    for (const value of found)
                        set.add(value);
                }
            }
        }
    }
    await walk(target, 0);
    const tracked = RUNTIME_FAMILIES.filter((family) => majors[family] && majors[family].size > 0);
    const out = [];
    out.push(`Runtime constraint spread (${files} files, ${constraintLines} family-bearing lines with version tokens)`);
    if (!tracked.length) {
        out.push(`${pad("Result")}no version-constraint tokens found next to a runtime family name`);
        out.push("Exact versions, paths, filenames, source text and dependency names are never returned.");
        return out.join("\n");
    }
    const conflicting = [];
    const allMajors = new Set();
    out.push(`${pad("Family")}distinct majors  spread  verdict`);
    for (const family of tracked) {
        const values = [...majors[family]].sort((a, b) => a - b);
        for (const value of values)
            allMajors.add(value);
        const spread = values.length ? values[values.length - 1] - values[0] : 0;
        const conflict = values.length > 1;
        if (conflict)
            conflicting.push(family);
        out.push(`${pad(family)}${String(values.length).padEnd(16)}${String(spread).padEnd(8)}${conflict ? "multiple majors seen" : "single major seen"}`);
    }
    out.push(`${pad("Distinct majors")}${allMajors.size} across ${tracked.length} tracked families`);
    out.push(`${pad("Contradictions")}${conflicting.length ? `${conflicting.length} families name more than one major` : "none - each tracked family names a single major"}`);
    out.push("Exact versions, paths, filenames, source text and dependency names are never returned.");
    return out.join("\n");
}
