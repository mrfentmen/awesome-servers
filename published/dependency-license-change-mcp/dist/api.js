// ---- muxE tools:
// compareLicenseEvidence only reports the categories whose count moved, so a
// category that stayed flat is invisible and a single snapshot has no profile at
// all. The two new tools answer those two questions. They call the file's own
// scan, so the value-free contract is kept structurally: only aggregate licence
// categories ever leave this code, never a name, a path, a text or a source.
import { scan } from "./core.js";
const WARNING = "Only aggregate licence categories are returned. Package names, licence text, paths and source contents are never emitted; this is not legal advice.";
const SHARE = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "n/a");
const COPYLEFT = "gpl-family";
export async function snapshotProfile(args) {
    const input = (args?.path ?? "").trim();
    if (!input)
        throw new Error("Provide the path of one snapshot, relative to the configured root or absolute.");
    const result = await scan(input);
    const counts = result.counts ?? {};
    const keys = Object.keys(counts).sort();
    const total = keys.reduce((a, k) => a + (counts[k] ?? 0), 0);
    const lines = [`Licence profile of one snapshot (${result.files} file(s) scanned):`];
    if (!keys.length || total === 0) {
        lines.push("  no licence bearing file was found in that snapshot, so there is nothing to profile.");
        lines.push(`  ${WARNING}`);
        return lines.join("\n");
    }
    const ranked = keys.slice().sort((a, b) => (counts[b] ?? 0) - (counts[a] ?? 0));
    lines.push(`  licence bearing files classified: ${total}`);
    for (const key of ranked) {
        const n = counts[key] ?? 0;
        lines.push(`    ${key}: ${n} (${SHARE(n, total)})`);
    }
    const dominant = ranked[0];
    lines.push(`  dominant category: ${dominant} with ${counts[dominant] ?? 0} of ${total} file(s)`);
    const copyleft = counts[COPYLEFT] ?? 0;
    lines.push(copyleft > 0
        ? `  strong copyleft is present: ${copyleft} file(s) (${SHARE(copyleft, total)}) fall in ${COPYLEFT}.`
        : `  no file fell in ${COPYLEFT}, so this snapshot shows no strong copyleft by this classifier.`);
    const unknown = counts.unknown ?? 0;
    if (unknown > 0) {
        lines.push(`  ${unknown} file(s) (${SHARE(unknown, total)}) matched no known pattern and are counted as unknown rather than guessed at.`);
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
