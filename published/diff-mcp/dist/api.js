import { diffLines, createTwoFilesPatch } from "diff";
export class DiffError extends Error {
}
export async function diffText(args) {
    const a = args.a ?? "";
    const b = args.b ?? "";
    const changes = diffLines(a, b);
    const out = [];
    for (const c of changes) {
        const lines = c.value.split("\n").filter(Boolean);
        if (c.added)
            out.push(...lines.map((l) => `+ ${l}`));
        else if (c.removed)
            out.push(...lines.map((l) => `- ${l}`));
        else
            out.push(...lines.map((l) => `  ${l}`));
    }
    return out.slice(0, 200).join("\n");
}
export async function unifiedDiff(args) {
    const ctx = Math.min(Math.max(args.context ?? 3, 0), 10);
    const patch = createTwoFilesPatch("original", "changed", args.a ?? "", args.b ?? "", "", "", { context: ctx });
    return patch.slice(0, 8000);
}
// ---- muxE tools:
// The two existing tools print a line diff and a unified patch and both truncate
// silently, at 200 lines and at 8000 characters. The new tools answer the two
// questions a truncated diff cannot: how big is this change really, and what
// changed in the structure rather than in the lines. Both use only the diff,
// js-yaml and marked copies already in this server's dependencies.
import { diffWordsWithSpace, diffSentences, diffJson, structuredPatch } from "diff";
import { load as loadYaml } from "js-yaml";
const MAX_SCAN = 20000;
function asText(value) {
    return typeof value === "string" ? value.slice(0, MAX_SCAN) : "";
}
const splitLines = (value) => value.split("\n");
function runs(changes) {
    const out = [];
    let added = 0;
    let removed = 0;
    let kept = 0;
    let charsAdded = 0;
    let charsRemoved = 0;
    let lineNo = 1;
    for (const change of changes) {
        const lines = splitLines(change.value);
        // the final split element is the empty string after a trailing newline
        if (lines.length && lines[lines.length - 1] === "")
            lines.pop();
        const kind = change.added ? "added" : change.removed ? "removed" : "unchanged";
        if (!lines.length)
            continue;
        out.push({ kind, count: lines.length, atLine: lineNo });
        if (kind === "added") {
            added += lines.length;
            charsAdded += change.value.length;
            lineNo += lines.length;
        }
        else if (kind === "removed") {
            removed += lines.length;
            charsRemoved += change.value.length;
        }
        else {
            kept += lines.length;
            lineNo += lines.length;
        }
    }
    return { runs: out, added, removed, kept, charsAdded, charsRemoved };
}
const human = (n) => n.toLocaleString("en-US");
export async function diffStats(args) {
    const a = asText(args?.a);
    const b = asText(args?.b);
    if (!a && !b)
        return "Provide the original in a and the new text in b; at least one must be non empty.";
    const aLines = splitLines(a);
    const bLines = splitLines(b);
    if (aLines[aLines.length - 1] === "")
        aLines.pop();
    if (bLines[bLines.length - 1] === "")
        bLines.pop();
    const changes = diffLines(a, b);
    const { runs: list, added, removed, kept, charsAdded, charsRemoved } = runs(changes);
    const total = added + removed;
    const patch = structuredPatch("original", "changed", a, b, "", "", { context: 0 });
    const hunks = patch.hunks ?? [];
    const longest = [...list].filter((r) => r.kind !== "unchanged").sort((x, y2) => y2.count - x.count)[0];
    const unchangedChars = Math.max(0, a.length - charsRemoved);
    const lines = [
        `How big is this change, measured rather than printed:`,
        `  original: ${human(aLines.length)} line(s), ${human(a.length)} character(s)`,
        `  changed: ${human(bLines.length)} line(s), ${human(b.length)} character(s)`,
        `  line delta: ${bLines.length - aLines.length >= 0 ? "+" : ""}${bLines.length - aLines.length}`,
        `  lines added: ${human(added)}, removed: ${human(removed)}, unchanged: ${human(kept)}`,
        `  characters added: ${human(charsAdded)}, removed: ${human(charsRemoved)}`,
        `  diff runs in reading order: ${list.length}`,
    ];
    lines.push(`  hunks at zero context: ${hunks.length}${hunks.length ? `, sizes ${hunks.map((h) => `${h.oldLines}->${h.newLines}`).slice(0, 20).join(', ')}${hunks.length > 20 ? `, and ${hunks.length - 20} more` : ''}` : ''}`);
    if (aLines.length || bLines.length) {
        const common = Math.round((kept / Math.max(1, aLines.length)) * 100);
        lines.push(`  lines carried over unchanged: ${common}% of the original`);
    }
    if (total === 0) {
        lines.push('  the two texts are identical apart from line endings.');
        return lines.join("\n");
    }
    if (longest) {
        lines.push(`  longest single change: ${longest.count} consecutive ${longest.kind} line(s) starting at original line ${longest.atLine}`);
    }
    if (unchangedChars > 0) {
        lines.push(`  share of the original left in place by characters: ${Math.round((unchangedChars / Math.max(1, a.length)) * 100)}%`);
    }
    lines.push('  the diff_text tool caps its output at 200 lines and unified_diff at 8000 characters, so on a large change they show a prefix of this, not the whole picture.');
    return lines.join("\n");
}
/** the dot path of a key inside a parsed document, so a change can be located */
function walk(prefix, before, after, out, depth = 0) {
    if (depth > 8)
        return;
    const isObject = (v) => !!v && typeof v === "object" && !Array.isArray(v);
    if (Array.isArray(before) && Array.isArray(after)) {
        const longest = Math.max(before.length, after.length);
        for (let i = 0; i < longest; i += 1) {
            const path = `${prefix}[${i}]`;
            if (i >= before.length)
                out.push(`added    ${path} = ${JSON.stringify(after[i])}`);
            else if (i >= after.length)
                out.push(`removed  ${path} (was ${JSON.stringify(before[i])})`);
            else if (JSON.stringify(before[i]) !== JSON.stringify(after[i])) {
                if (isObject(before[i]) || isObject(after[i]))
                    walk(path, before[i], after[i], out, depth + 1);
                else
                    out.push(`changed  ${path}: ${JSON.stringify(before[i])} -> ${JSON.stringify(after[i])}`);
            }
        }
        return;
    }
    if (isObject(before) && isObject(after)) {
        for (const key of new Set([...Object.keys(before), ...Object.keys(after)])) {
            const path = prefix ? `${prefix}.${key}` : key;
            if (!(key in before))
                out.push(`added    ${path} = ${JSON.stringify(after[key])}`);
            else if (!(key in after))
                out.push(`removed  ${path} (was ${JSON.stringify(before[key])})`);
            else if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) {
                if (isObject(before[key]) || isObject(after[key]) || Array.isArray(before[key]) || Array.isArray(after[key])) {
                    walk(path, before[key], after[key], out, depth + 1);
                }
                else {
                    out.push(`changed  ${path}: ${JSON.stringify(before[key])} -> ${JSON.stringify(after[key])}`);
                }
            }
        }
        return;
    }
    if (JSON.stringify(before) !== JSON.stringify(after)) {
        out.push(`changed  ${prefix || '(whole value)'}: ${JSON.stringify(before)} -> ${JSON.stringify(after)}`);
    }
}
function parseDocument(text, label) {
    const trimmed = text.trim();
    if (!trimmed)
        return { error: 'the text is empty', format: label };
    if (trimmed.startsWith("{") || trimmed.startsWith("[")) {
        try {
            return { value: JSON.parse(trimmed), format: "JSON" };
        }
        catch (e) {
            return { error: e instanceof Error ? e.message : 'the JSON would not parse', format: "JSON" };
        }
    }
    try {
        const parsed = loadYaml(trimmed);
        if (parsed && typeof parsed === "object")
            return { value: parsed, format: "YAML" };
        return { error: 'the YAML parsed to a plain value rather than a mapping or a sequence', format: "YAML" };
    }
    catch (e) {
        return { error: e instanceof Error ? e.message : 'the YAML would not parse', format: "YAML" };
    }
}
export async function structuredDiff(args) {
    const a = asText(args?.a).trim();
    const b = asText(args?.b).trim();
    if (!a || !b)
        return "Provide the original in a and the changed document in b; both are needed to compare them.";
    const left = parseDocument(a, "text");
    const right = parseDocument(b, "text");
    const lines = [];
    if ("error" in left) {
        if ("error" in right) {
            const words = diffWordsWithSpace(a, b);
            const changed = words.filter((w) => w.added || w.removed);
            lines.push("Neither side is JSON or YAML, so this falls back to a word level diff:", `  words changed: ${changed.length} of ${words.length} token(s)`);
            for (const w of changed.slice(0, 40))
                lines.push(`  ${w.added ? "+" : "-"} ${JSON.stringify(w.value.slice(0, 80))}`);
            if (changed.length > 40)
                lines.push(`  and ${changed.length - 40} more changed token(s)`);
            return lines.join("\n");
        }
        return `The original is not a structured document, the changed side is ${right.format}, so there is nothing to compare structurally.`;
    }
    if ("error" in right) {
        return `The original is ${left.format} but the changed side is not a structured document, so there is nothing to compare structurally.`;
    }
    const format = left.format === right.format ? left.format : `${left.format} against ${right.format}`;
    lines.push(`Structural diff of two ${format} documents, key by key:`);
    const out = [];
    walk("", left.value, right.value, out);
    if (!out.length) {
        lines.push("  the two documents parse and are identical in value, so only their formatting differs.");
    }
    else {
        lines.push(`  differences found: ${out.length}`);
        for (const line of out.slice(0, 60))
            lines.push(`  ${line}`);
        if (out.length > 60)
            lines.push(`  and ${out.length - 60} more difference(s) not listed here`);
    }
    const added = out.filter((l) => l.startsWith("added")).length;
    const removed = out.filter((l) => l.startsWith("removed")).length;
    const changed = out.filter((l) => l.startsWith("changed")).length;
    lines.push(`  keys added: ${added}, removed: ${removed}, changed: ${changed}`);
    const prose = diffSentences(a, b);
    const proseChanged = prose.filter((s) => s.added || s.removed);
    if (proseChanged.length) {
        lines.push(`  sentence level changes in the raw text: ${proseChanged.length}`);
    }
    const jsonRun = diffJson(left.value, right.value);
    lines.push(`  the diff library's own JSON walk produced ${jsonRun.length} segment(s).`);
    lines.push('  the existing tools compare the two documents as raw lines, so a reformatting shows as a wholesale change and a one-character edit inside a long string is one line here rather than a field.');
    return lines.join("\n");
}
/** Split into words, keeping the whitespace attached to the word before it. */
function inlineTokenize(value) {
    return value.match(/\S+\s*/g) ?? [];
}
/**
 * Longest common subsequence over the token lists, walked back into an edit
 * script. A plain LCS is the right size here: token counts stay small even for
 * long paragraphs, and it is the same shape the `diff` package uses.
 */
function inlineScript(a, b) {
    const n = a.length;
    const m = b.length;
    // Guard against a pathological pair; the table is O(n*m) in memory.
    if (n * m > 4_000_000) {
        return [
            ...a.map((text) => ({ added: false, removed: true, text })),
            ...b.map((text) => ({ added: true, removed: false, text })),
        ];
    }
    const table = Array.from({ length: n + 1 }, () => new Array(m + 1).fill(0));
    for (let i = n - 1; i >= 0; i -= 1) {
        for (let j = m - 1; j >= 0; j -= 1) {
            table[i][j] = a[i] === b[j] ? table[i + 1][j + 1] + 1 : Math.max(table[i + 1][j], table[i][j + 1]);
        }
    }
    const parts = [];
    const push = (text, added, removed) => {
        const last = parts[parts.length - 1];
        if (last && last.added === added && last.removed === removed)
            last.text += text;
        else
            parts.push({ added, removed, text });
    };
    let i = 0;
    let j = 0;
    while (i < n && j < m) {
        if (a[i] === b[j]) {
            push(a[i], false, false);
            i += 1;
            j += 1;
        }
        else if (table[i + 1][j] >= table[i][j + 1]) {
            push(a[i], false, true);
            i += 1;
        }
        else {
            push(b[j], true, false);
            j += 1;
        }
    }
    while (i < n) {
        push(a[i], false, true);
        i += 1;
    }
    while (j < m) {
        push(b[j], true, false);
        j += 1;
    }
    return parts;
}
export async function inlineDiff(args) {
    const a = args?.a ?? '';
    const b = args?.b ?? '';
    if (a === b)
        return 'The two texts are identical, so there is nothing to show inline.';
    const words = Math.max(1, Math.min(Math.floor(Number(args?.context ?? 12) || 12), 200));
    const left = inlineTokenize(a);
    const right = inlineTokenize(b);
    if (!left.length && !right.length)
        return 'Both texts are empty.';
    const parts = inlineScript(left, right);
    // Only the runs that touch a change are worth printing, so each changed run
    // keeps `context` unchanged words either side and the rest is elided.
    const changed = parts.map((p) => p.added || p.removed);
    const keep = new Array(parts.length).fill(false);
    parts.forEach((part, idx) => {
        if (!changed[idx])
            return;
        for (let k = Math.max(0, idx - words); k <= Math.min(parts.length - 1, idx + words); k += 1)
            keep[k] = true;
    });
    const lines = [];
    const legend = '  unchanged | -removed | +added';
    lines.push(legend);
    let gap = false;
    for (let idx = 0; idx < parts.length; idx += 1) {
        if (!keep[idx]) {
            gap = true;
            continue;
        }
        if (gap && lines.length > 1) {
            const elided = parts.slice(idx).filter((_, k) => !keep[idx + k]).length;
            if (elided > 0)
                lines.push(`  ... ${elided} unchanged word(s) elided ...`);
        }
        gap = false;
        const part = parts[idx];
        lines.push(`  ${part.added ? '+' : part.removed ? '-' : ' '}${part.text}`);
    }
    if (gap)
        lines.push('  ... trailing unchanged words elided ...');
    const added = parts.filter((p) => p.added).map((p) => p.text.trim());
    const removed = parts.filter((p) => p.removed).map((p) => p.text.trim());
    lines.push('');
    lines.push(`Words added: ${added.length}${added.length ? ` (${added.slice(0, 15).join(' ')}${added.length > 15 ? ', ...' : ''})` : ''}`);
    lines.push(`Words removed: ${removed.length}${removed.length ? ` (${removed.slice(0, 15).join(' ')}${removed.length > 15 ? ', ...' : ''})` : ''}`);
    lines.push(`Words unchanged: ${parts.filter((p) => !p.added && !p.removed).length}`);
    lines.push(`Original ${left.length} word(s), new ${right.length} word(s).`);
    lines.push('The diff is over words, not characters, so a reworded sentence reads as one removed run and one added run.');
    return lines.join('\n');
}
export async function applyPatchText(args) {
    const source = args?.source ?? '';
    const patch = (args?.patch ?? '').trim();
    if (!patch)
        return 'Provide a unified diff to apply.';
    if (patch.length < 10)
        return 'That patch is too short to be a unified diff.';
    const { applyPatch, parsePatch } = await import('diff');
    let parsed;
    try {
        parsed = parsePatch(patch);
    }
    catch (e) {
        throw new DiffError(`The patch did not parse: ${e instanceof Error ? e.message : String(e)}`);
    }
    if (!parsed.length)
        return 'The patch parsed but held no file sections, so nothing was applied.';
    const hunks = parsed.reduce((total, file) => total + (file.hunks?.length ?? 0), 0);
    if (!hunks)
        return 'The patch parsed but held no hunks, so nothing was applied.';
    const sections = [];
    let appliedTotal = 0;
    let failedTotal = 0;
    for (const file of parsed) {
        let result;
        try {
            result = applyPatch(source, file, { fuzzFactor: 0 });
        }
        catch (e) {
            result = false;
            sections.push(`  ${file.newFileName ?? file.oldFileName ?? 'unnamed file'}: error - ${e instanceof Error ? e.message : String(e)}`);
            failedTotal += file.hunks?.length ?? 0;
            continue;
        }
        if (result === false) {
            sections.push(`  ${file.newFileName ?? file.oldFileName ?? 'unnamed file'}: ${file.hunks?.length ?? 0} hunk(s) did not apply - the source does not match the patch context.`);
            failedTotal += file.hunks?.length ?? 0;
            continue;
        }
        appliedTotal += file.hunks?.length ?? 0;
        sections.push(`  ${file.newFileName ?? file.oldFileName ?? 'unnamed file'}: ${file.hunks?.length ?? 0} hunk(s) applied, ${result.length} char(s) in, ${source.length} out.`);
    }
    return [
        `Applied a unified diff: ${hunks} hunk(s) across ${parsed.length} file section(s).`,
        ...sections,
        `Hunks applied: ${appliedTotal}. Hunks that did not apply: ${failedTotal}.`,
        'Hunks are matched exactly, with no fuzz, so a patch made against different text is reported rather than guessed at.',
    ].join('\n');
}
