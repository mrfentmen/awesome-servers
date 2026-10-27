import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { realpath } from "node:fs/promises";
import path from "node:path";
// ---- muxB tools:
const exec = promisify(execFile);
const MAX_FILES = 2000;
const TOP_N = 8;
function pad(label, width = 20) {
    return label.length >= width ? label : label + " ".repeat(width - label.length);
}
async function repoDir(input) {
    const allowedRoot = path.resolve(process.env.REPO_FORENSICS_ROOT ?? path.join(process.cwd(), ".."));
    const configuredRoot = await realpath(allowedRoot).catch(() => allowedRoot);
    const directory = await realpath(path.resolve(input || ".")).catch(() => path.resolve(input || "."));
    const relative = path.relative(configuredRoot, directory);
    if (relative.startsWith("..") || path.isAbsolute(relative))
        throw new Error(`Repository path must stay within the configured local root`);
    return directory;
}
async function git(cwd, args) {
    try {
        const result = await exec("git", args, { cwd: await repoDir(cwd), timeout: 15000, maxBuffer: 2 * 1024 * 1024 });
        return result.stdout.trim();
    }
    catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`Git command failed: ${message.slice(0, 300)}`);
    }
}
function topOf(counts, limit = TOP_N) {
    return [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, limit).map(([key, value]) => `${key || "(top level)"}:${value}`);
}
function giniOf(values) {
    if (values.length < 2)
        return 0;
    const sorted = [...values].sort((a, b) => a - b);
    const total = sorted.reduce((sum, value) => sum + value, 0);
    if (!total)
        return 0;
    let cumulative = 0;
    sorted.forEach((value, index) => { cumulative += (index + 1) * value; });
    const n = sorted.length;
    return (2 * cumulative) / (n * total) - (n + 1) / n;
}
export async function churnProfile(args) {
    const commits = Math.min(1000, Math.max(10, Math.trunc(Number(args.commits ?? 200) || 200)));
    const output = await git(args.cwd ?? ".", ["log", "--all", "--format=", "--name-only", `-n`, String(commits)]);
    const counts = new Map();
    for (const line of output.split("\n").map((value) => value.trim()).filter(Boolean))
        counts.set(line, (counts.get(line) ?? 0) + 1);
    const out = [];
    out.push(`Churn profile over the last ${commits} commits`);
    if (!counts.size) {
        out.push(`${pad("Result")}no file changes found in that window`);
        return out.join("\n");
    }
    const touches = [...counts.values()].sort((a, b) => b - a);
    const totalTouches = touches.reduce((sum, value) => sum + value, 0);
    const directories = new Map();
    const extensions = new Map();
    for (const [file, count] of counts) {
        const parts = file.split("/");
        const dir = parts.length > 1 ? parts[0] : "";
        directories.set(dir, (directories.get(dir) ?? 0) + count);
        const name = parts[parts.length - 1] ?? file;
        const dot = name.lastIndexOf(".");
        extensions.set(dot > 0 ? name.slice(dot).toLowerCase() : "(no extension)", (extensions.get(dot > 0 ? name.slice(dot).toLowerCase() : "(no extension)") ?? 0) + count);
    }
    const shareOf = (n) => (totalTouches ? (touches.slice(0, n).reduce((sum, value) => sum + value, 0) / totalTouches) * 100 : 0);
    const once = touches.filter((value) => value === 1).length;
    const few = touches.filter((value) => value >= 2 && value <= 5).length;
    const many = touches.filter((value) => value > 5).length;
    out.push(`${pad("Touches")}${totalTouches} file-change events across ${counts.size} distinct files`);
    out.push(`${pad("Concentration")}top 10 files hold ${shareOf(10).toFixed(1)}% of touches, Gini ${giniOf(touches).toFixed(2)} (0 even, 1 fully concentrated)`);
    out.push(`${pad("Churn classes")}touched once ${once}, 2-5 times ${few}, more than 5 times ${many}`);
    out.push(`${pad("Long tail")}${((once / counts.size) * 100).toFixed(1)}% of files changed exactly once`);
    out.push(`${pad("Top directories")}${topOf(directories).join("  ") || "not reported"}`);
    out.push(`${pad("Top extensions")}${topOf(extensions).join("  ") || "not reported"}`);
    out.push(`${pad("Reading")}${giniOf(touches) > 0.6 ? "change is highly concentrated, a small file set drives most of the history" : giniOf(touches) > 0.35 ? "change is moderately concentrated" : "change is spread broadly across the tree"}`);
    out.push("This is a bounded churn heuristic over local Git history, not a defect or risk detector.");
    return out.join("\n");
}
export async function contributorConcentration(args) {
    const commits = Math.min(5000, Math.max(10, Math.trunc(Number(args.commits ?? 500) || 500)));
    const output = await git(args.cwd ?? ".", ["log", "--all", `--format=%aN%x09%aE`, `-n`, String(commits)]);
    const rows = output.split("\n").filter((line) => line.includes("\t"));
    if (!rows.length)
        throw new Error("No commits with an author were found in that window");
    const byName = new Map();
    const byEmail = new Map();
    for (const row of rows) {
        const [name, email] = row.split("\t");
        if (!name)
            continue;
        byName.set(name, (byName.get(name) ?? 0) + 1);
        const key = (email ?? "").toLowerCase();
        if (key)
            byEmail.set(key, (byEmail.get(key) ?? 0) + 1);
    }
    const counts = [...byName.values()].sort((a, b) => b - a);
    const total = counts.reduce((sum, value) => sum + value, 0);
    const shareOf = (n) => (total ? (counts.slice(0, n).reduce((sum, value) => sum + value, 0) / total) * 100 : 0);
    let busFactor = 0;
    let running = 0;
    for (const value of counts) {
        running += value;
        busFactor += 1;
        if (running / total >= 0.5)
            break;
    }
    const out = [];
    out.push(`Contributor concentration over the last ${commits} commits`);
    out.push(`${pad("Commits")}${total} attributed commits`);
    out.push(`${pad("Distinct authors")}${byName.size} names, ${byEmail.size} distinct addresses`);
    out.push(`${pad("Top share")}largest ${shareOf(1).toFixed(1)}%, top 3 ${shareOf(3).toFixed(1)}%, top 10 ${shareOf(10).toFixed(1)}%`);
    out.push(`${pad("Bus factor")}${busFactor} contributor${busFactor === 1 ? "" : "s"} cover half of the attributed commits`);
    out.push(`${pad("Gini")}${giniOf(counts).toFixed(2)} (0 even, 1 all commits from one contributor)`);
    out.push(`${pad("Reading")}${shareOf(1) > 60 ? "a single contributor dominates the recent history" : shareOf(3) > 80 ? "a small group dominates the recent history" : "commit authorship is broadly shared"}`);
    out.push("Contributor names, email addresses, commit hashes, subjects, paths and remotes are never returned.");
    return out.join("\n");
}
