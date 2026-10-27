// ---- muxE tools:
// The one existing tool compares two snapshots by totalling their nodes per value
// type and stops there, so it says nothing about how deeply or how widely a
// document is shaped and draws no conclusion from a type disappearing. The new
// tools answer those two questions, from the same local JSON files. The
// value-free promise is kept structurally: they emit counts, ratios and
// verdicts, and never a key, a path, a value or a file name.
import { load } from "./diff.js";
const MAX_NODES = 20000;
const MAX_WIDTH = 20;
const WARNING = "Only counts, ratios and verdicts are returned. Schema names, paths, values, descriptions, examples, versions and file paths are never emitted; this is not semantic compatibility analysis.";
function typeOf(value) {
    if (value === null)
        return "null";
    if (Array.isArray(value))
        return "array";
    if (value && typeof value === "object")
        return "object";
    if (typeof value === "number")
        return Number.isInteger(value) ? "integer" : "number";
    if (typeof value === "string")
        return value.length ? "string" : "empty-string";
    return typeof value;
}
function profile(root) {
    const p = {
        total: 0,
        capped: false,
        objects: 0,
        arrays: 0,
        leaves: 0,
        nulls: 0,
        maxDepth: 0,
        byDepth: new Map(),
        widestAt: 0,
        widest: 0,
        longestArray: 0,
        emptyObjects: 0,
        emptyArrays: 0,
        types: new Map(),
    };
    const stack = [{ value: root, depth: 0, children: 0 }];
    while (stack.length) {
        const item = stack.pop();
        p.total += 1;
        if (p.total >= MAX_NODES) {
            p.capped = true;
            break;
        }
        p.byDepth.set(item.depth, (p.byDepth.get(item.depth) ?? 0) + 1);
        if (item.depth > p.maxDepth)
            p.maxDepth = item.depth;
        const kind = typeOf(item.value);
        p.types.set(kind, (p.types.get(kind) ?? 0) + 1);
        if (kind === "null")
            p.nulls += 1;
        if (kind === "array") {
            p.arrays += 1;
            const list = item.value;
            if (list.length > p.longestArray)
                p.longestArray = list.length;
            if (!list.length)
                p.emptyArrays += 1;
            if (list.length > p.widest) {
                p.widest = list.length;
                p.widestAt = item.depth;
            }
            for (const child of list) {
                if (item.depth === 0)
                    p.widestAt = 0;
                stack.push({ value: child, depth: item.depth + 1, children: list.length });
            }
            continue;
        }
        if (kind === "object") {
            p.objects += 1;
            const entries = Object.entries(item.value);
            if (!entries.length)
                p.emptyObjects += 1;
            if (entries.length > p.widest) {
                p.widest = entries.length;
                p.widestAt = item.depth;
            }
            for (const [, child] of entries)
                stack.push({ value: child, depth: item.depth + 1, children: entries.length });
            continue;
        }
        p.leaves += 1;
    }
    return p;
}
const pct = (n, total) => (total > 0 ? `${((n / total) * 100).toFixed(1)}%` : "n/a");
export async function contractShape(args) {
    const file = (args?.snapshot ?? "").trim();
    if (!file)
        throw new Error("Provide the path of one local JSON snapshot.");
    const p = profile(await load(file));
    const lines = [
        "Shape of one local JSON snapshot, as counts only:",
        `  nodes walked: ${p.total.toLocaleString("en-US")}${p.capped ? ` (the walk cap of ${MAX_NODES} was reached, so the figures below are a lower bound)` : ""}`,
        `  maximum nesting depth: ${p.maxDepth}`,
        `  objects: ${p.objects.toLocaleString("en-US")} (${pct(p.objects, p.total)})`,
        `  arrays: ${p.arrays.toLocaleString("en-US")} (${pct(p.arrays, p.total)})`,
        `  scalar leaves: ${p.leaves.toLocaleString("en-US")} (${pct(p.leaves, p.total)})`,
        `  explicit nulls: ${p.nulls.toLocaleString("en-US")}`,
        `  empty objects: ${p.emptyObjects.toLocaleString("en-US")}, empty arrays: ${p.emptyArrays.toLocaleString("en-US")}`,
        `  widest single node: ${p.widest.toLocaleString("en-US")} children at depth ${p.widestAt}`,
        `  longest array: ${p.longestArray.toLocaleString("en-US")}`,
        `  node count by depth, first ${MAX_WIDTH} levels:`,
    ];
    const depths = [...p.byDepth.keys()].sort((a, b) => a - b);
    for (const depth of depths.slice(0, MAX_WIDTH)) {
        lines.push(`    depth ${depth}: ${(p.byDepth.get(depth) ?? 0).toLocaleString("en-US")} node(s)`);
    }
    if (depths.length > MAX_WIDTH)
        lines.push(`    and ${depths.length - MAX_WIDTH} deeper level(s) not listed here`);
    lines.push("  value types present:");
    for (const [kind, n] of [...p.types.entries()].sort((a, b) => b[1] - a[1])) {
        lines.push(`    ${kind}: ${n.toLocaleString("en-US")}`);
    }
    const shallowest = Math.min(...depths);
    const deepestCount = p.byDepth.get(p.maxDepth) ?? 0;
    if (p.maxDepth > shallowest + 1 && deepestCount === 1) {
        lines.push(`  the document narrows to a single node by depth ${p.maxDepth}, so most of it is a chain rather than a wide table.`);
    }
    if (p.arrays > p.objects * 2) {
        lines.push(`  there are more than twice as many arrays as objects, so this document is mostly a list of records.`);
    }
    if (p.nulls > 0) {
        lines.push(`  ${p.nulls.toLocaleString("en-US")} value(s) are an explicit null, which is not the same as the key being absent, and this tool cannot tell the two apart.`);
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
export async function contractRisk(args) {
    const beforeFile = (args?.before ?? "").trim();
    const afterFile = (args?.after ?? "").trim();
    if (!beforeFile || !afterFile)
        throw new Error("Provide both snapshot paths, the earlier one in before and the later one in after.");
    const a = profile(await load(beforeFile));
    const b = profile(await load(afterFile));
    const facts = [];
    const risks = [];
    const nodeDelta = b.total - a.total;
    facts.push(`  nodes: ${a.total.toLocaleString("en-US")} -> ${b.total.toLocaleString("en-US")}, ${nodeDelta >= 0 ? "+" : ""}${nodeDelta.toLocaleString("en-US")}`);
    facts.push(`  depth: ${a.maxDepth} -> ${b.maxDepth}`);
    facts.push(`  objects: ${a.objects.toLocaleString("en-US")} -> ${b.objects.toLocaleString("en-US")}`);
    facts.push(`  arrays: ${a.arrays.toLocaleString("en-US")} -> ${b.arrays.toLocaleString("en-US")}`);
    facts.push(`  scalar leaves: ${a.leaves.toLocaleString("en-US")} -> ${b.leaves.toLocaleString("en-US")}`);
    facts.push(`  explicit nulls: ${a.nulls.toLocaleString("en-US")} -> ${b.nulls.toLocaleString("en-US")}`);
    facts.push(`  widest node: ${a.widest.toLocaleString("en-US")} at depth ${a.widestAt} -> ${b.widest.toLocaleString("en-US")} at depth ${b.widestAt}`);
    facts.push(`  longest array: ${a.longestArray.toLocaleString("en-US")} -> ${b.longestArray.toLocaleString("en-US")}`);
    const kinds = [...new Set([...a.types.keys(), ...b.types.keys()])].sort();
    const disappeared = kinds.filter((k) => (a.types.get(k) ?? 0) > 0 && (b.types.get(k) ?? 0) === 0);
    const appeared = kinds.filter((k) => (a.types.get(k) ?? 0) === 0 && (b.types.get(k) ?? 0) > 0);
    for (const kind of kinds) {
        const from = a.types.get(kind) ?? 0;
        const to = b.types.get(kind) ?? 0;
        facts.push(`  ${kind}: ${from.toLocaleString("en-US")} -> ${to.toLocaleString("en-US")}${to === from ? ", unchanged" : to > from ? `, up ${to - from}` : `, down ${from - to}`}`);
    }
    const lines = [
        "Coarse compatibility risk between two local JSON snapshots, as counts and a verdict:",
        ...facts,
    ];
    if (disappeared.length) {
        risks.push(`${disappeared.length} value type(s) present in the earlier snapshot are gone from the later one: ${disappeared.join(", ")}. A consumer that relied on that shape has no replacement.`);
    }
    if (appeared.length) {
        risks.push(`${appeared.length} value type(s) are new in the later snapshot: ${appeared.join(", ")}. Anything reading the document strictly may reject them.`);
    }
    if (b.maxDepth < a.maxDepth)
        risks.push(`the later snapshot is ${a.maxDepth - b.maxDepth} level(s) shallower, so some nesting is gone.`);
    if (b.maxDepth > a.maxDepth)
        risks.push(`the later snapshot is ${b.maxDepth - a.maxDepth} level(s) deeper than the earlier one.`);
    if (b.objects < a.objects)
        risks.push(`the later snapshot has ${(a.objects - b.objects).toLocaleString("en-US")} fewer object(s).`);
    if (b.arrays < a.arrays)
        risks.push(`the later snapshot has ${(a.arrays - b.arrays).toLocaleString("en-US")} fewer array(s), so something that was a list is no longer one.`);
    if (b.arrays > a.arrays)
        risks.push(`the later snapshot has ${(b.arrays - a.arrays).toLocaleString("en-US")} more array(s), so it can carry more items per record than before.`);
    if (b.nulls > a.nulls)
        risks.push(`explicit nulls grew from ${a.nulls.toLocaleString("en-US")} to ${b.nulls.toLocaleString("en-US")}.`);
    if (b.nulls < a.nulls)
        risks.push(`explicit nulls fell from ${a.nulls.toLocaleString("en-US")} to ${b.nulls.toLocaleString("en-US")}, so a field that used to be nullable no longer is.`);
    if (b.total < a.total)
        risks.push(`the later snapshot has ${(a.total - b.total).toLocaleString("en-US")} fewer node(s) overall.`);
    if (b.widest < a.widest)
        risks.push(`the widest node shrank from ${a.widest.toLocaleString("en-US")} children to ${b.widest.toLocaleString("en-US")}.`);
    if (b.longestArray < a.longestArray)
        risks.push(`the longest array shrank from ${a.longestArray.toLocaleString("en-US")} to ${b.longestArray.toLocaleString("en-US")} items.`);
    const identical = b.total === a.total && b.maxDepth === a.maxDepth && b.objects === a.objects && b.arrays === a.arrays &&
        b.leaves === a.leaves && b.nulls === a.nulls && b.widest === a.widest && b.longestArray === a.longestArray &&
        kinds.every((k) => (a.types.get(k) ?? 0) === (b.types.get(k) ?? 0));
    if (risks.length) {
        lines.push(`  signals worth a human look: ${risks.length}`);
        for (const r of risks)
            lines.push(`    ${r}`);
        lines.push("  these are structural signals, not proof of a break; only a consumer of the document can say for certain.");
    }
    else if (identical) {
        lines.push("  signals worth a human look: none. The node count, the depth, the width, the type mix and the null count are all identical.");
    }
    else {
        lines.push("  signals worth a human look: none, because every figure that moved moved in the direction that adds to the document. A larger document is not a smaller risk, so read the counts above rather than this line.");
    }
    lines.push(`  ${WARNING}`);
    return lines.join("\n");
}
// ---- gap4e2 tools:
async function contractDirectory() {
    const res = await fetch('https://api.apis.guru/v2/list.json', { headers: { 'User-Agent': 'mrfentmen-contract-diff-mcp/1.0', Accept: 'application/json' }, signal: AbortSignal.timeout(20000) });
    if (!res.ok)
        throw new Error(`APIs.guru returned ${res.status}`);
    return await res.json();
}
