export class FigmaError extends Error {
    constructor(message) {
        super(message);
        this.name = "FigmaError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.FIGMA_ACCESS_TOKEN;
    if (!k)
        throw new FigmaError("Set FIGMA_ACCESS_TOKEN (Figma personal token).");
    return { ...UA, Accept: "application/json", "X-Figma-Token": k };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.figma.com/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new FigmaError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new FigmaError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function me() {
    return get("/me");
}
export function getFile(fileKey) {
    return get(`/files/${encodeURIComponent(fileKey)}`);
}
export function projectFiles(projectId) {
    return get(`/projects/${encodeURIComponent(projectId)}/files`);
}
export function teamProjects(teamId) {
    return get(`/teams/${encodeURIComponent(teamId)}/projects`);
}
export function fileComments(fileKey) {
    return get(`/files/${encodeURIComponent(fileKey)}/comments`);
}
export function fileVersions(fileKey) {
    return get(`/files/${encodeURIComponent(fileKey)}/versions`);
}
export function fileComponents(fileKey) {
    return get(`/files/${encodeURIComponent(fileKey)}/components`);
}
export function fileStyles(fileKey) {
    return get(`/files/${encodeURIComponent(fileKey)}/styles`);
}
export function fileNodes(fileKey, nodeIds) {
    return get(`/files/${encodeURIComponent(fileKey)}/nodes?ids=${encodeURIComponent(nodeIds)}`);
}
export function fileImages(fileKey, nodeIds) {
    return get(`/files/${encodeURIComponent(fileKey)}/images?ids=${encodeURIComponent(nodeIds)}&format=png`);
}
// ---- muxD tools:
/**
 * The Figma v1 API rejects an invalid token before it looks at the route, so
 * 401 or 403 means the route exists and 404 means it does not. That made it
 * possible to map the uncovered surface by probing rather than guessing.
 * Verified to exist on 2026-09-27:
 *   /files/{key}/component_sets, /files/{key}/variables/local,
 *   /files/{key}/dev_resources, /files/{key}/styles
 * Verified absent: /files/{key}/{devices,teams,next_vars,connections,
 *   plugin_data,variables,document,children,branches,thumbnail},
 *   /webhooks/{id}/pings, /comments/{id}
 *
 * The three new tools cover the three things the existing ten do not: the
 * design-token layer, component sets and their variant axes, and the document
 * tree. The last matters because getFile truncates at 12000 characters, so on
 * any real file it returns a fragment of the first canvas and nothing else.
 */
async function figJson(path) {
    let res;
    try {
        res = await fetch("https://api.figma.com/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(40000),
        });
    }
    catch (e) {
        throw new FigmaError(`Network error: ${e.message}`);
    }
    const body = await res.text();
    if (!res.ok) {
        let detail = body.slice(0, 250);
        try {
            const j = JSON.parse(body);
            detail = j?.err ?? j?.message ?? detail;
        }
        catch { /* keep the raw body */ }
        const hint = res.status === 404
            ? " A 404 from Figma on a files route usually means the file key is wrong or the token cannot see that file, not that the endpoint is missing."
            : res.status === 403
                ? " A 403 usually means the token is valid but lacks access to this file, or the resource is restricted to the file's organisation."
                : "";
        throw new FigmaError(`HTTP ${res.status}: ${detail}${hint}`);
    }
    try {
        return JSON.parse(body);
    }
    catch {
        throw new FigmaError("Figma returned a body that is not JSON.");
    }
}
const asArray = (v) => (Array.isArray(v) ? v : []);
const asObject = (v) => (v && typeof v === "object" && !Array.isArray(v) ? v : {});
/**
 * The local variables layer: collections, variables, and the modes that give
 * them light and dark variants. This is the design-token layer and it is the
 * part of a Figma file that a design-system audit actually needs; none of the
 * existing ten tools can see any of it.
 */
export async function fileVariables(args) {
    const key = String(args.file_key ?? "").trim();
    if (!key)
        throw new FigmaError("Provide a Figma file key.");
    const data = await figJson(`/files/${encodeURIComponent(key)}/variables/local`);
    const meta = asObject(data?.meta);
    const collections = asArray(data?.variableCollections);
    const variables = asArray(data?.variables);
    const want = String(args.collection ?? "").trim().toLowerCase();
    if (!collections.length && !variables.length) {
        return [
            `No local variables in this file.`,
            "",
            `Figma returned ${Object.keys(meta).length ? "an object" : "an empty body"} with ${collections.length} collection(s) and ${variables.length} variable(s).`,
            "",
            "A file with no variables either genuinely has no token layer, or variables are held in a library the file consumes rather than defines, which Figma does not expose through this endpoint. A file that references tokens from a shared library will look empty here even though it uses them heavily.",
        ].join("\n");
    }
    const filtered = want
        ? collections.filter((c) => String(c?.name ?? "").toLowerCase().includes(want))
        : collections;
    if (want && !filtered.length) {
        return [
            `No variable collection contains "${args.collection}".`,
            "",
            `The ${collections.length} collection(s) in this file are: ${collections.map((c) => String(c?.name ?? "?")).join(", ")}.`,
        ].join("\n");
    }
    const lines = [
        `Local variables in this file: ${variables.length} variable(s) across ${collections.length} collection(s)`,
        "",
        `${"modes".padEnd(8)}${"variables".padEnd(11)}collection`,
    ];
    for (const c of filtered) {
        const modes = asArray(c?.modes);
        lines.push(`${String(modes.length).padEnd(8)}${String(variables.filter((v) => v?.variableCollectionId === c?.id).length).padEnd(11)}${String(c?.name ?? "(unnamed)")}`);
        if (modes.length > 1) {
            lines.push(`${" ".repeat(8)}modes: ${modes.map((m) => String(m?.name ?? "?")).join(", ")}`);
        }
    }
    // Group the variables by type, because a token set is only coherent if the
    // types are known: a colour variable and a number variable are not
    // interchangeable in a code handoff even when they share a name.
    const byType = new Map();
    for (const v of variables) {
        const t = String(v?.resolvedType ?? v?.variableType ?? "unknown");
        if (!byType.has(t))
            byType.set(t, []);
        byType.get(t).push(v);
    }
    lines.push("", `by resolved type: ${[...byType.entries()].map(([t, vs]) => `${t} ${vs.length}`).join(", ")}`);
    const showColl = String(args.collection ?? "").trim();
    const target = showColl ? filtered[0] : null;
    // Mode ids are only unique within a collection: two collections both use
    // m1 for their first mode and name it differently. A single global map let
    // one collection's "Light" be overwritten by another's "Default", so the map
    // is keyed by collection id and then by mode id.
    const modesByCollection = new Map();
    for (const c of collections) {
        const inner = new Map();
        for (const md of asArray(c?.modes)) {
            if (md?.modeId !== undefined)
                inner.set(String(md.modeId), String(md?.name ?? md.modeId));
        }
        modesByCollection.set(String(c?.id ?? ""), inner);
    }
    const listed = target ? variables.filter((v) => v?.variableCollectionId === target?.id) : variables;
    const shown = listed.slice(0, 40);
    if (shown.length) {
        lines.push("", target ? `variables in ${String(target?.name)}:` : `variables (first 40 of ${listed.length}):`);
        for (const v of shown) {
            const vals = asObject(v?.valuesByMode);
            const entries = Object.entries(vals);
            const rendered = entries.map(([modeId, val]) => {
                const modeName = modesByCollection.get(String(v?.variableCollectionId ?? ""))?.get(modeId) ?? modeId;
                return `${modeName}=${formatValue(val)}`;
            });
            lines.push(`  ${String(v?.name ?? "?").padEnd(30)}${String(v?.resolvedType ?? "?").padEnd(10)}${rendered.slice(0, 3).join("  ")}`);
        }
        if (listed.length > shown.length)
            lines.push(`  ...and ${listed.length - shown.length} more; raise collection or narrow by name`);
    }
    const multiMode = collections.filter((c) => asArray(c?.modes).length > 1);
    lines.push("");
    if (multiMode.length) {
        const extraModes = multiMode.reduce((a, c) => a + Math.max(0, asArray(c?.modes).length - 1), 0);
        lines.push(`${multiMode.length} collection(s) have more than one mode, ${extraModes} non-default mode(s) in total. Modes are how one variable name resolves to different values per platform or theme, so a variable with three modes is three different values rather than one value with three aliases. A handoff that exports only the default mode drops all ${extraModes} of them without saying so.`);
    }
    const alias = variables.filter((v) => asObject(v?.valuesByMode) && Object.values(asObject(v?.valuesByMode)).some((x) => x && typeof x === "object" && x.type === "VARIABLE_ALIAS"));
    if (alias.length) {
        lines.push(`${alias.length} variable(s) hold an alias to another variable rather than a literal value. An alias is the only reason a token rename propagates, so breaking one is how a design system's colours drift apart between platforms.`);
    }
    lines.push("These are variables defined in the file itself. Variables consumed from a shared library are not listed here, so a file can use tokens heavily and still show a small set.");
    return lines.join("\n");
}
function formatValue(v) {
    if (v === null || v === undefined)
        return "unset";
    if (typeof v === "object") {
        const o = v;
        if (o.type === "VARIABLE_ALIAS")
            return `->${String(o.id).slice(0, 8)}`;
        if (o.r !== undefined && o.g !== undefined && o.b !== undefined) {
            const a = o.a === undefined ? 1 : o.a;
            return `rgba(${Math.round(o.r * 255)},${Math.round(o.g * 255)},${Math.round(o.b * 255)},${a})`;
        }
        return JSON.stringify(v);
    }
    return String(v);
}
/**
 * Component sets, which is where a component and its variants live. The
 * existing file_components returns the component instances in a file; a component
 * set is the definition of the variant axes, which is the part a design system
 * needs to document and which nothing here could reach before.
 */
export async function componentSets(args) {
    const key = String(args.file_key ?? "").trim();
    if (!key)
        throw new FigmaError("Provide a Figma file key.");
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 30) || 30, 1), 200);
    const data = await figJson(`/files/${encodeURIComponent(key)}/component_sets`);
    const meta = asObject(data?.meta);
    const sets = asArray(data?.component_sets);
    if (!sets.length) {
        return [
            "This file has no component sets.",
            "",
            `Figma returned ${Object.keys(meta).length ? "metadata" : "an empty body"} with no component_sets array.`,
            "",
            "A file with no component sets either has no components at all, or has standalone components and instances but nothing set up as a variant set. Those are different maturity levels for a design system: a set with a size axis is a component that adapts, a standalone component is one that was copied.",
        ].join("\n");
    }
    const totalVariants = sets.reduce((a, s) => a + asArray(s?.node_ids).length, 0);
    const lines = [
        `Component sets: ${sets.length} set(s), ${totalVariants} variant node(s)`,
        "",
    ];
    for (const s of sets.slice(0, limit)) {
        const nodeIds = asArray(s?.node_ids);
        const desc = String(s?.description ?? "").replace(/\s+/g, " ").trim();
        lines.push(`${String(s?.name ?? "(unnamed)")}  (${nodeIds.length} variant${nodeIds.length === 1 ? "" : "s"})`);
        lines.push(`  key: ${s?.key ?? "?"}${s?.key && nodeIds.length ? `  |  variants: ${nodeIds.slice(0, 6).join(", ")}${nodeIds.length > 6 ? ` and ${nodeIds.length - 6} more` : ""}` : ""}`);
        if (desc)
            lines.push(`  ${desc.slice(0, 200)}`);
        if (args.include_properties !== false) {
            const doc = s?.documentation_links;
            if (Array.isArray(doc) && doc.length) {
                lines.push(`  documentation: ${doc.slice(0, 3).map((d) => String(d?.url ?? d)).join(", ")}`);
            }
        }
        if (nodeIds.length === 1) {
            lines.push("  a set with a single variant is a component that was made into a set but never given a second variant, which is a common half-finished state");
        }
        lines.push("");
    }
    if (sets.length > limit)
        lines.push(`...and ${sets.length - limit} more sets; raise limit to see them.`);
    const single = sets.filter((s) => asArray(s?.node_ids).length === 1).length;
    const undocumented = sets.filter((s) => !String(s?.description ?? "").trim()).length;
    lines.push("", `${sets.length} sets covering ${totalVariants} variants, an average of ${(totalVariants / sets.length).toFixed(1)} per set. ${single} set(s) have only one variant, so they cannot actually vary anything yet.`);
    if (undocumented)
        lines.push(`${undocumented} of ${sets.length} sets have no description. A component set without a description is a variant nobody documented, and it is the usual reason a set grows a fourth variant that duplicates the first.`);
    lines.push("node_ids are the variant frames inside the set. Their names carry the axis values, for example a size axis of Small, Medium and Large, and that naming convention is the only place the variant axes are recorded.");
    return lines.join("\n").trimEnd();
}
/**
 * The document tree, summarised. The existing getFile truncates its response at
 * 12000 characters, so on any real file it returns the first canvas and a
 * fragment of it; a file with thousands of nodes cannot be inspected with it at
 * all. This walks the tree and reports the shape instead.
 */
export async function fileStructure(args) {
    const key = String(args.file_key ?? "").trim();
    if (!key)
        throw new FigmaError("Provide a Figma file key.");
    const maxNodes = Math.min(Math.max(Math.floor(args.max_nodes ?? 20000) || 20000, 100), 200000);
    const topN = Math.min(Math.max(Math.floor(args.top_n ?? 12) || 12, 1), 60);
    const data = await figJson(`/files/${encodeURIComponent(key)}?depth=3`);
    const doc = asObject(data?.document);
    const name = String(data?.name ?? "(unnamed file)");
    const children = asArray(doc?.children);
    if (!children.length) {
        return [
            `${name}: the document has no pages.`,
            "",
            "Figma returns a file with no children when the key points at a file with no canvases, which is either an empty new file or a branch with nothing on it. Check the key and, if the file was expected to have content, that the token can see this file at all.",
        ].join("\n");
    }
    const stats = { n: 0, byType: new Map(), maxDepth: 0, pages: [] };
    const walk = (nodes, depth, inCanvas) => {
        for (const node of nodes) {
            if (!node || typeof node !== "object")
                continue;
            if (stats.n >= maxNodes)
                return;
            stats.n += 1;
            if (depth > stats.maxDepth)
                stats.maxDepth = depth;
            const t = String(node.type ?? "UNKNOWN");
            stats.byType.set(t, (stats.byType.get(t) ?? 0) + 1);
            if (inCanvas) {
                inCanvas.children += 1;
                if (t === "FRAME" || t === "COMPONENT" || t === "INSTANCE" || t === "GROUP" || t === "SECTION")
                    inCanvas.frames += 1;
            }
            const kids = asArray(node.children);
            if (kids.length)
                walk(kids, depth + 1, inCanvas);
        }
    };
    for (const page of children) {
        const entry = { name: String(page?.name ?? "(unnamed page)"), frames: 0, children: 0 };
        stats.pages.push(entry);
        walk(asArray(page?.children), 1, entry);
    }
    // getNodes is the only way to see past the truncated document response, so the
    // deep structure is described from the document walk and the counts are
    // labelled as what was walked rather than as a claim about the whole file.
    const typeList = [...stats.byType.entries()].sort((a, b) => b[1] - a[1]);
    const lines = [
        `${name}`,
        `${stats.pages.length} page(s), ${stats.n} node(s) walked, deepest nesting ${stats.maxDepth}${stats.n >= maxNodes ? ` (walk stopped at the ${maxNodes} node limit, so the counts below are a floor)` : ""}`,
        "",
        `Pages:`,
    ];
    for (const p of stats.pages) {
        lines.push(`  ${p.name.slice(0, 44).padEnd(46)}${String(p.frames).padStart(5)} top-level container(s), ${p.children} node(s)`);
    }
    lines.push("", `Node types across the file (${typeList.length} distinct):`);
    for (const [t, c] of typeList.slice(0, topN)) {
        lines.push(`  ${String(c).padStart(6)}  ${t}`);
    }
    if (typeList.length > topN)
        lines.push(`         ...and ${typeList.length - topN} rarer types`);
    const get = (t) => stats.byType.get(t) ?? 0;
    lines.push("");
    const notes = [];
    if (get("INSTANCE") > 0 && get("COMPONENT") === 0) {
        notes.push(`There are ${get("INSTANCE")} instance(s) and no component definition in this file. An instance always points at a main component, so the definitions live in a library this file consumes. That file therefore cannot be self-contained: an export or a handoff from it alone is missing every component definition.`);
    }
    else if (get("COMPONENT") > 0) {
        notes.push(`${get("COMPONENT")} component definition(s) and ${get("INSTANCE")} instance(s) are in this file, so at least some of the system is self-contained.`);
    }
    if (get("TEXT"))
        notes.push(`${get("TEXT")} text node(s). Text is the node type most likely to be a hardcoded string rather than a variable, and it is the usual reason a design system and its code drift apart.`);
    if (get("SECTION") > 0)
        notes.push(`${get("SECTION")} section(s), which are Figma's grouping for a variant or state and the only place a screen's states are expected to sit.`);
    if (get("VECTOR"))
        notes.push(`${get("VECTOR")} vector node(s). Vector work is not a component and cannot be a variable, so a token system does not cover it.`);
    if (get("SLICE"))
        notes.push(`${get("SLICE")} slice(s) exist, which means part of this file is arranged for export by slice rather than by component set.`);
    lines.push(...notes);
    lines.push("", "This is a walk of the document tree, not a component or variable audit. The existing getFile and file_nodes tools are still the way to read actual node contents, but a full file response is truncated at 12000 characters, so on a file of this size they return a fragment. Use file_nodes with specific node ids, and this tool to decide which ones matter.");
    return lines.join("\n");
}
