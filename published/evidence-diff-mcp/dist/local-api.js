// ---- muxE tools:
// The one existing tool classifies the top level directory entries by name and
// counts the last five commits, then returns a JSON blob. The new tools look
// where it does not: inside the tree, for evidence files counted by their real
// extension, and across the whole commit history rather than its last five
// entries. Both stay local and both keep the value-free promise, because they
// only ever emit counts, extensions, date arithmetic and coarse categories.
import { readdir } from "node:fs/promises";
import { safeRoot, git } from "./evidence.js";
const MAX_FILES = 4000;
const MAX_DEPTH = 6;
const SKIP = new Set([".git", "node_modules", ".next", ".turbo", ".cache", "vendor", "target", ".venv", "venv", "__pycache__"]);
const WARNING = "Only counts, file extensions, coarse categories and date arithmetic are returned. Paths, source diffs, file contents, commit subjects, authors, hashes and secrets are never emitted; this is not a build or test validation.";
/** what kind of evidence a file name suggests, decided on the file's stem and extension */
function evidenceKind(name) {
    const lower = name.toLowerCase();
    if (/\.feature$/.test(lower) || /\.stories?\.|\.storybook\//.test(lower))
        return "test-spec";
    // the stem is the name without its last extension, so test.mjs has the stem test
    const stem = lower.includes(".") ? lower.slice(0, lower.lastIndexOf(".")) : lower;
    const ext = lower.slice(stem.length);
    const code = /\.[cm]?[jt]sx?$/.test(ext) || /\.(py|go|rb|java|rs|php|sh)$/.test(ext);
    const looksLikeTest = stem === "test" ||
        /^test[-_]/.test(stem) ||
        /[-_.]test$/.test(stem) ||
        /\.(spec|test)$/.test(stem) ||
        /_test$/.test(stem);
    if (looksLikeTest && (code || ext === ""))
        return "test-source";
    if (/(^|[.\-/])test_[a-z0-9_]+\.py$/.test(lower))
        return "test-source";
    if (/\.e2e\.[cm]?[jt]sx?$/.test(lower) || /^e2e-/.test(lower))
        return "end-to-end";
    if (/\.(snap|approved)$/.test(lower))
        return "snapshot";
    if (/(^|[.\-/])junit|test-?results?\.xml$|report\.xml$/.test(lower))
        return "test-report";
    if (/lcov\.info$|coverage[-.]/.test(lower) || /\.lcov$/.test(lower))
        return "coverage";
    if (/\.(map|min\.js|min\.css)$/.test(lower) || /^manifest\./.test(lower))
        return "build-output";
    if (/^(junit|vitest|jest)\./.test(lower) || /^playwright-report\./.test(lower))
        return "test-report";
    return null;
}
const suffix = (name) => {
    const parts = name.toLowerCase().split(".");
    return parts.length > 1 ? `.${parts.slice(1).join(".")}` : "(no extension)";
};
export async function testEvidence(args) {
    const input = (args?.project ?? "").trim();
    if (!input)
        throw new Error("Provide a local project directory.");
    const root = await safeRoot(input);
    const cap = Math.max(50, Math.min(Number(args?.max_files ?? MAX_FILES) || MAX_FILES, 20000));
    const kinds = new Map();
    const extensions = new Map();
    const extensionsByKind = new Map();
    let scanned = 0;
    let skipped = 0;
    let stopped = false;
    async function walk(dir, depth) {
        if (depth > MAX_DEPTH || stopped)
            return;
        let entries;
        try {
            entries = await readdir(dir, { withFileTypes: true });
        }
        catch {
            skipped += 1;
            return;
        }
        for (const entry of entries.slice(0, 500)) {
            if (stopped)
                return;
            if (SKIP.has(entry.name))
                continue;
            const full = `${dir}/${entry.name}`;
            if (entry.isDirectory()) {
                await walk(full, depth + 1);
                continue;
            }
            scanned += 1;
            const ext = suffix(entry.name);
            extensions.set(ext, (extensions.get(ext) ?? 0) + 1);
            const kind = evidenceKind(entry.name);
            if (!kind)
                continue;
            kinds.set(kind, (kinds.get(kind) ?? 0) + 1);
            const byExt = extensionsByKind.get(kind) ?? new Map();
            byExt.set(ext, (byExt.get(ext) ?? 0) + 1);
            extensionsByKind.set(kind, byExt);
            if (scanned >= cap) {
                stopped = true;
                return;
            }
        }
    }
    await walk(root, 0);
    const totalEvidence = [...kinds.values()].reduce((a, b) => a + b, 0);
    const topExtensions = [...extensions.entries()].sort((a, b) => b[1] - a[1]).slice(0, 10);
    const lines = [
        `Test and build evidence found by walking the tree of a local project, not by its top level names:`,
        `  files examined: ${scanned.toLocaleString("en-US")}${stopped ? " (the scan cap for this call was reached)" : ""}`,
        `  directories that could not be read: ${skipped}`,
        `  evidence bearing files: ${totalEvidence.toLocaleString("en-US")}`,
        `  evidence by kind:`,
    ];
    for (const [kind, n] of [...kinds.entries()].sort((a, b) => b[1] - a[1])) {
        lines.push(`    ${kind}: ${n}`);
    }
    for (const [kind, byExt] of extensionsByKind) {
        const shown = [...byExt.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5).map(([e, n]) => `${e} (${n})`);
        lines.push(`    ${kind} by extension: ${shown.join(", ")}`);
    }
    lines.push(`  most common extensions anywhere in the tree: ${topExtensions.map(([e, n]) => `${e} (${n.toLocaleString("en-US")})`).join(", ")}`);
    if (!totalEvidence) {
        lines.push("  no file name in the walked tree matched a test or build evidence pattern, so no kind was counted.");
    }
    else {
        const hasTest = (kinds.get("test-source") ?? 0) + (kinds.get("end-to-end") ?? 0) + (kinds.get("test-spec") ?? 0);
        const hasRun = (kinds.get("test-report") ?? 0) + (kinds.get("coverage") ?? 0) + (kinds.get("snapshot") ?? 0);
        lines.push(hasTest && !hasRun
            ? `  there are ${hasTest} test source file(s) and no report, coverage or snapshot file, so nothing here shows a run ever happened.`
            : hasRun
                ? `  ${hasRun} report, coverage or snapshot file(s) were found, which is evidence a run left something behind, not that it passed.`
                : `  there are ${hasTest} test source file(s) and no run evidence.`);
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
const WEEKDAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export async function commitEvidence(args) {
    const input = (args?.project ?? "").trim();
    if (!input)
        throw new Error("Provide a local project directory.");
    const root = await safeRoot(input);
    const inside = await git(root, ["rev-parse", "--is-inside-work-tree"]);
    if (inside !== "true")
        throw new Error("Project is not a Git work tree");
    const limit = Math.max(10, Math.min(Number(args?.limit ?? 1000) || 1000, 10000));
    const raw = await git(root, ["log", `--max-count=${limit}`, "--date=short", "--format=%ad%x09%P%x09%s"]);
    const rows = raw ? raw.split("\n").filter(Boolean) : [];
    if (!rows.length)
        return "This local project has no commits on the current branch, so there is no history evidence to summarise.";
    const weekdays = new Map();
    const months = new Map();
    const stamps = [];
    let merges = 0;
    let byline = 0;
    for (const row of rows) {
        const [date, parents] = row.split("\t");
        if ((parents ?? "").trim().split(/\s+/).filter(Boolean).length > 1)
            merges += 1;
        const at = Date.parse(`${date}T00:00:00Z`);
        if (Number.isFinite(at)) {
            const d = new Date(at);
            stamps.push(at);
            weekdays.set(d.getUTCDay(), (weekdays.get(d.getUTCDay()) ?? 0) + 1);
            const key = `${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
            months.set(key, (months.get(key) ?? 0) + 1);
        }
        if (/^(fix|hotfix|bugfix|revert)\b/i.test(row.split("\t").slice(2).join("\t")))
            byline += 1;
    }
    const earliest = Math.min(...stamps);
    const latest = Math.max(...stamps);
    const spanDays = stamps.length ? Math.max(1, Math.round((latest - earliest) / 86400000)) : 0;
    const ageDays = stamps.length ? Math.max(0, Math.round((Date.now() - latest) / 86400000)) : 0;
    const activeDays = new Set(stamps.map((s) => new Date(s).toISOString().slice(0, 10))).size;
    const lines = [
        `Commit history evidence for a local project, as counts and dates only:`,
        `  commits read: ${rows.length.toLocaleString("en-US")}${rows.length >= limit ? ` (the request limit was ${limit}, so the history is longer)` : ""}`,
        `  merge commits: ${merges}${rows.length ? `, ${Math.round((merges / rows.length) * 100)}% of the commits read` : ""}`,
        `  commits whose subject begins with a fix word: ${byline}, judged on the subject prefix only and no subject is printed`,
        `  oldest commit read: ${new Date(earliest).toISOString().slice(0, 10)}`,
        `  newest commit read: ${new Date(latest).toISOString().slice(0, 10)}`,
        `  span: ${spanDays.toLocaleString("en-US")} day(s) across ${activeDays.toLocaleString("en-US")} distinct date(s) on which something was committed`,
        `  newest commit is ${ageDays.toLocaleString("en-US")} day(s) old`,
        `  average commits per active day: ${activeDays ? (rows.length / activeDays).toFixed(2) : "n/a"}`,
        `  commits by weekday:`,
        `    ${WEEKDAYS.map((w, i) => `${w} ${weekdays.get(i) ?? 0}`).join(", ")}`,
        `  busiest months:`,
        `    ${[...months.entries()].sort((a, b) => b[1] - a[1]).slice(0, 6).map(([m, n]) => `${m} (${n})`).join(", ") || "none"}`,
        `  quietest months in range:`,
        `    ${[...months.entries()].sort((a, b) => a[1] - b[1]).slice(0, 4).map(([m, n]) => `${m} (${n})`).join(", ") || "none"}`,
        `  ${WARNING}`,
    ];
    return lines.join("\n");
}
