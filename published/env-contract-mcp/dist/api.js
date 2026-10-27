// ---- muxE tools:
// inspect_contract answers one question about one directory and hands back a
// JSON blob. The two new tools answer the two questions that blob leaves open:
// what shape the contract has, read as a report rather than a dump, and how the
// contract changed between two checkouts. Both stay local and both keep the
// value-free promise, because they only ever see the names analyze() returns.
import { analyze } from "./contract.js";
const WARNING = "Only variable names and file paths are read here. Environment values are never read or emitted, and name matching stays heuristic, so this is not a build validation.";
const namesOf = (c, key) => Array.isArray(c?.[key]) ? c[key] : [];
const fileList = (record) => (record && typeof record === "object" ? Object.keys(record) : []);
/** the first underscore separated token, which is how these names group by subsystem */
const stem = (name) => {
    const cut = name.indexOf("_");
    return cut > 0 ? name.slice(0, cut) : "(no prefix)";
};
export async function contractSummary(args) {
    const project = (args?.project ?? "").trim();
    if (!project)
        throw new Error("Provide a local project directory.");
    const c = (await analyze(project));
    const declared = namesOf(c, "declaredNames");
    const referenced = namesOf(c, "referencedNames");
    const missing = namesOf(c, "missing");
    const unused = namesOf(c, "unused");
    const declFiles = fileList(c.declarations);
    const refFiles = fileList(c.references);
    const lines = [
        `Environment contract of ${project}`,
        `  files read: ${typeof c.filesScanned === "number" ? c.filesScanned : "not reported"}`,
        `  files declaring names: ${declFiles.length}${declFiles.length ? ` (${declFiles.slice(0, 8).join(", ")}${declFiles.length > 8 ? `, and ${declFiles.length - 8} more` : ""})` : ""}`,
        `  files referencing names: ${refFiles.length}`,
        `  distinct names declared: ${declared.length}`,
        `  distinct names referenced: ${referenced.length}`,
        `  referenced but never declared: ${missing.length}`,
        `  declared but never referenced: ${unused.length}`,
    ];
    if (declared.length) {
        const stems = new Map();
        for (const name of declared)
            stems.set(stem(name), (stems.get(stem(name)) ?? 0) + 1);
        const ranked = [...stems.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
        lines.push(`  name prefixes in use: ${ranked.length}`);
        for (const [key, n] of ranked.slice(0, 12))
            lines.push(`    ${key}: ${n} name(s)`);
        if (ranked.length > 12)
            lines.push(`    and ${ranked.length - 12} more prefix(es)`);
        const longest = [...declared].sort((a, b) => b.length - a.length)[0];
        const shortest = [...declared].sort((a, b) => a.length - b.length)[0];
        lines.push(`  longest declared name: ${longest} (${longest.length} characters), shortest: ${shortest} (${shortest.length})`);
    }
    else {
        lines.push("  no name was declared anywhere in the allowed file types.");
    }
    if (missing.length) {
        lines.push(`  the first ${Math.min(15, missing.length)} referenced but undeclared name(s): ${missing.slice(0, 15).join(", ")}`);
        if (missing.length > 15)
            lines.push(`    and ${missing.length - 15} more`);
    }
    if (unused.length) {
        lines.push(`  the first ${Math.min(15, unused.length)} declared but unreferenced name(s): ${unused.slice(0, 15).join(", ")}`);
        if (unused.length > 15)
            lines.push(`    and ${unused.length - 15} more`);
    }
    if (missing.length === 0 && unused.length === 0 && declared.length > 0) {
        lines.push("  every declared name is referenced somewhere and every referenced name is declared, so the two sets agree.");
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
export async function contractDiff(args) {
    const before = (args?.before ?? "").trim();
    const after = (args?.after ?? "").trim();
    if (!before || !after)
        throw new Error("Provide both project directories so the contract can be compared.");
    const [a, b] = (await Promise.all([analyze(before), analyze(after)]));
    const aDeclared = new Set(namesOf(a, "declaredNames"));
    const bDeclared = new Set(namesOf(b, "declaredNames"));
    const aRef = new Set(namesOf(a, "referencedNames"));
    const bRef = new Set(namesOf(b, "referencedNames"));
    const added = [...bDeclared].filter((n) => !aDeclared.has(n)).sort();
    const removed = [...aDeclared].filter((n) => !bDeclared.has(n)).sort();
    const stillDeclared = [...bDeclared].filter((n) => aDeclared.has(n)).sort();
    const lostReference = [...aRef].filter((n) => !bRef.has(n)).sort();
    const gainedReference = [...bRef].filter((n) => !aRef.has(n)).sort();
    const lines = [
        `Environment contract change from ${before} to ${after}`,
        `  files read: ${typeof a.filesScanned === "number" ? a.filesScanned : "not reported"} before, ${typeof b.filesScanned === "number" ? b.filesScanned : "not reported"} after`,
        `  distinct names declared: ${aDeclared.size} before, ${bDeclared.size} after`,
        `  distinct names referenced: ${aRef.size} before, ${bRef.size} after`,
        `  names newly declared: ${added.length}`,
        `  names no longer declared: ${removed.length}`,
        `  names declared in both: ${stillDeclared.length}`,
        `  names that lost a reference: ${lostReference.length}`,
        `  names that gained a reference: ${gainedReference.length}`,
    ];
    const show = (label, list) => {
        if (!list.length) {
            lines.push(`  ${label}: none`);
            return;
        }
        lines.push(`  ${label} (${list.length}), first 20: ${list.slice(0, 20).join(", ")}`);
        if (list.length > 20)
            lines.push(`    and ${list.length - 20} more`);
    };
    show("newly declared names", added);
    show("names dropped", removed);
    show("names that lost a reference", lostReference);
    const bMissing = namesOf(b, "missing");
    const aMissing = namesOf(a, "missing");
    const closed = aMissing.filter((n) => !bMissing.includes(n));
    const opened = bMissing.filter((n) => !aMissing.includes(n));
    lines.push(`  undeclared but referenced gaps: ${aMissing.length} before, ${bMissing.length} after`);
    show("gaps closed", closed);
    show("gaps opened", opened);
    if (!added.length && !removed.length && !lostReference.length && !gainedReference.length) {
        lines.push("  the two directories declare and reference exactly the same names.");
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
// ---- gap4e2 tools:
