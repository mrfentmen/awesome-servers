// ---- muxB tools:
import { readdir, realpath, stat } from "node:fs/promises";
import path from "node:path";
import { MigrationError } from "./core.js";
const SKIP = new Set([".git", "node_modules", "dist", "build"]);
const MIGRATION_EXT = /\.(sql|js|ts|py|rb|go|rs)$/i;
const SEQUENCE = /(?:^|[_-])(\d{1,8})(?:[_-]|\.|$)/;
const MAX_FILES = 2000;
const MAX_DEPTH = 6;
async function bounded(input) {
    const configured = process.env.MIGRATION_MAP_ROOT ?? path.join(process.cwd(), "..");
    const root = await realpath(path.resolve(configured)).catch(() => path.resolve(configured));
    const requested = path.isAbsolute(input || "") ? path.resolve(input) : path.resolve(root, input || ".");
    const target = await realpath(requested).catch(() => requested);
    const relative = path.relative(root, target);
    if (relative.startsWith("..") || path.isAbsolute(relative)) {
        throw new MigrationError("Project path must stay inside the configured root");
    }
    if (!(await stat(target).catch(() => null)))
        throw new MigrationError("Project path does not exist");
    return target;
}
/**
 * Walk a project the same way inspect_migration_map does, but keep the extra
 * signals the summary tool needs: the number width as written, the direction,
 * and which directory a file was in. No file name, path or content is kept.
 */
async function scan(project) {
    const root = await bounded(project);
    const migrations = [];
    let truncated = false;
    let nextBucket = 0;
    async function walk(directory, depth) {
        const bucket = nextBucket++;
        if (depth > MAX_DEPTH || migrations.length > MAX_FILES) {
            truncated = true;
            return;
        }
        for (const entry of await readdir(directory, { withFileTypes: true }).catch(() => [])) {
            if (SKIP.has(entry.name))
                continue;
            const full = path.join(directory, entry.name);
            if (entry.isDirectory()) {
                await walk(full, depth + 1);
                continue;
            }
            if (!MIGRATION_EXT.test(entry.name))
                continue;
            const match = entry.name.match(SEQUENCE);
            if (!match)
                continue;
            migrations.push({
                sequence: Number(match[1]),
                width: match[1].length,
                forward: !/(?:rollback|revert|undo|down)/i.test(entry.name),
                bucket,
            });
            if (migrations.length > MAX_FILES) {
                truncated = true;
                return;
            }
        }
    }
    await walk(root, 0);
    return { migrations, truncated, directories: new Set(migrations.map((m) => m.bucket)).size };
}
const unique = (migrations) => [...new Set(migrations.map((m) => m.sequence))].sort((a, b) => a - b);
function gapsIn(sequences) {
    const gaps = [];
    for (let i = 1; i < sequences.length; i++)
        for (let n = sequences[i - 1] + 1; n < sequences[i]; n++)
            gaps.push(n);
    return gaps;
}
export async function migrationOrdering(args) {
    const project = (args.project ?? ".").trim() || ".";
    const { migrations, truncated, directories } = await scan(project);
    if (!migrations.length)
        return `No migration files found under the project path "${project}".`;
    const sequences = unique(migrations);
    const gaps = gapsIn(sequences);
    const highest = sequences.at(-1);
    const lowest = sequences[0];
    const widths = [...new Set(migrations.map((m) => m.width))].sort((a, b) => a - b);
    // A sequence number used in more than one directory is an ordering conflict:
    // whichever tool sorts those directories decides the order, not the number.
    const bySequence = new Map();
    for (const migration of migrations) {
        const buckets = bySequence.get(migration.sequence) ?? new Set();
        buckets.add(migration.bucket);
        bySequence.set(migration.sequence, buckets);
    }
    const shared = [...bySequence.entries()].filter(([, buckets]) => buckets.size > 1).map(([sequence]) => sequence);
    // Name order and numeric order only agree when every name is padded the same way.
    const padded = widths.length === 1;
    const nameOrderMatches = padded;
    const density = sequences.length / Math.max(1, highest - lowest + 1);
    const advice = [];
    advice.push(`next free sequence number: ${highest + 1}`);
    if (gaps.length) {
        const low = gaps.filter((n) => n < lowest + Math.ceil(sequences.length / 2));
        advice.push(`${gaps.length} gap${gaps.length === 1 ? "" : "s"} inside the range ${lowest}-${highest}${low.length ? ` (${low.slice(0, 20).join(", ")}${low.length > 20 ? ", ..." : ""})` : ""}` +
            (low.length ? ", low enough that they are more likely to be deleted or squashed migrations than a place to insert new work" : ""));
    }
    else {
        advice.push("no gaps: the numbering is contiguous from the lowest to the highest sequence");
    }
    advice.push(shared.length
        ? `${shared.length} sequence number${shared.length === 1 ? "" : "s"} appear in more than one directory (${shared.slice(0, 20).join(", ")}${shared.length > 20 ? ", ..." : ""}), so directory order decides their order`
        : "no sequence number is used in more than one directory");
    advice.push(padded
        ? `every number is written ${widths[0]} digits wide, so alphabetical order and numeric order agree`
        : `numbers are written ${widths.join(", ")} digits wide, so a tool that sorts by file name can order them differently from their numeric order`);
    return [
        `migration ordering signals for "${project}"`,
        `   ${migrations.length} migration files across ${directories} director${directories === 1 ? "y" : "ies"}, sequences ${lowest}-${highest}, ${(density * 100).toFixed(0)}% dense`,
        `   numbering width${widths.length === 1 ? "" : "s"}: ${widths.join(", ")} | name order equals numeric order: ${nameOrderMatches}`,
        truncated ? "   walk stopped early at the file limit, so these counts are a lower bound" : "",
        "",
        ...advice.map((line) => `   - ${line}`),
        "",
        "no migration name, path, SQL or source content is returned",
    ]
        .filter((line) => line !== "")
        .join("\n");
}
export async function compareProjects(args) {
    const first = (args.first ?? ".").trim() || ".";
    const second = (args.second ?? "").trim();
    if (!second)
        throw new MigrationError("Provide two project paths to compare, for example migrations/ and seeds/");
    const a = await scan(first);
    const b = await scan(second);
    if (!a.migrations.length)
        throw new MigrationError(`No migration files found under "${first}"`);
    if (!b.migrations.length)
        throw new MigrationError(`No migration files found under "${second}"`);
    const aSeq = unique(a.migrations);
    const bSeq = unique(b.migrations);
    const aSet = new Set(aSeq);
    const bSet = new Set(bSeq);
    const overlap = aSeq.filter((n) => bSet.has(n));
    const onlyA = aSeq.filter((n) => !bSet.has(n));
    const onlyB = bSeq.filter((n) => !aSet.has(n));
    const aWidths = [...new Set(a.migrations.map((m) => m.width))].sort((a1, b1) => a1 - b1);
    const bWidths = [...new Set(b.migrations.map((m) => m.width))].sort((a1, b1) => a1 - b1);
    const aRollback = a.migrations.filter((m) => !m.forward).length;
    const bRollback = b.migrations.filter((m) => !m.forward).length;
    const findings = [];
    if (overlap.length) {
        findings.push(`${overlap.length} sequence number${overlap.length === 1 ? "" : "s"} appear in both (${overlap.slice(0, 20).join(", ")}${overlap.length > 20 ? ", ..." : ""}) - the two sets cannot both be applied as one ordered list without renumbering one of them`);
    }
    else {
        findings.push("no sequence number is shared, so the two sets do not collide");
    }
    const highA = aSeq.at(-1);
    const highB = bSeq.at(-1);
    if (highA < highB)
        findings.push(`"${first}" tops out at ${highA} and "${second}" at ${highB}, so sequences ${highA + 1} to ${highB} are free to hand out before the second set collides`);
    else if (highB < highA)
        findings.push(`"${second}" tops out at ${highB} and "${first}" at ${highA}, so sequences ${highB + 1} to ${highA} are free to hand out before the first set collides`);
    else
        findings.push(`both sets top out at ${highA}, so anything appended to either one will collide with the other`);
    const aPad = aWidths.length === 1 ? `${aWidths[0]} digits` : `${aWidths.join("/")} digits`;
    const bPad = bWidths.length === 1 ? `${bWidths[0]} digits` : `${bWidths.join("/")} digits`;
    findings.push(aPad === bPad
        ? `both sets number their files ${aPad} wide, so the naming style matches`
        : `the sets number their files differently (${aPad} against ${bPad}), so a merged directory would sort them inconsistently`);
    if (aRollback || bRollback) {
        findings.push(`rollback-named files: ${aRollback} under "${first}", ${bRollback} under "${second}"`);
    }
    const aGaps = gapsIn(aSeq);
    const bGaps = gapsIn(bSeq);
    if (aGaps.length || bGaps.length) {
        findings.push(`gaps: ${aGaps.length} under "${first}"${aGaps.length ? ` (${aGaps.slice(0, 10).join(", ")}${aGaps.length > 10 ? ", ..." : ""})` : ""}, ${bGaps.length} under "${second}"${bGaps.length ? ` (${bGaps.slice(0, 10).join(", ")}${bGaps.length > 10 ? ", ..." : ""})` : ""}`);
    }
    return [
        `comparing "${first}" with "${second}"`,
        `   "${first}": ${a.migrations.length} files, sequences ${aSeq[0]}-${highA}, ${aGaps.length} gaps`,
        `   "${second}": ${b.migrations.length} files, sequences ${bSeq[0]}-${highB}, ${bGaps.length} gaps`,
        `   only in the first: ${onlyA.length}${onlyA.length ? ` (${onlyA.slice(0, 20).join(", ")}${onlyA.length > 20 ? ", ..." : ""})` : ""}`,
        `   only in the second: ${onlyB.length}${onlyB.length ? ` (${onlyB.slice(0, 20).join(", ")}${onlyB.length > 20 ? ", ..." : ""})` : ""}`,
        "",
        ...findings.map((line) => `   - ${line}`),
        "",
        "no migration name, path, SQL or source content is returned",
    ].join("\n");
}
