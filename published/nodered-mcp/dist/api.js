/**
 * Node-RED Admin HTTP API client. Points at any instance via NODERED_URL
 * (default http://localhost:1880). If adminAuth is on, set NODERED_TOKEN
 * (Bearer) — get one by logging into the editor once.
 * Docs: https://nodered.org/docs/api/admin/methods/
 */
const BASE = (process.env.NODERED_URL ?? "http://localhost:1880").replace(/\/+$/, "");
export class NodeRedError extends Error {
}
function headers() {
    const h = { "User-Agent": "nodered-mcp/1.0", Accept: "application/json" };
    if (process.env.NODERED_TOKEN)
        h.Authorization = `Bearer ${process.env.NODERED_TOKEN}`;
    return h;
}
async function getJson(path) {
    let res;
    try {
        res = await fetch(`${BASE}${path}`, {
            headers: headers(),
            signal: AbortSignal.timeout(20000),
        });
    }
    catch {
        throw new NodeRedError(`Node-RED at ${BASE} is unreachable. Set NODERED_URL.`);
    }
    if (res.status === 401 || res.status === 403)
        throw new NodeRedError("Node-RED refused (401/403). Set NODERED_TOKEN.");
    if (res.status === 404)
        throw new NodeRedError("Not found.");
    if (!res.ok)
        throw new NodeRedError(`Node-RED error ${res.status}`);
    return (await res.json());
}
export async function listFlows() {
    const rows = await getJson("/flows");
    return rows
        .filter((f) => f.type === "tab")
        .map((f) => ({ id: String(f.id), label: f.label, nodes: 0, disabled: f.disabled }));
}
export async function getFlow(id) {
    if (!id.trim())
        throw new NodeRedError("Flow id is empty.");
    const nodes = await getJson(`/flow/${encodeURIComponent(id.trim())}`);
    return Array.isArray(nodes) ? nodes : [];
}
export function formatFlow(id, nodes) {
    if (nodes.length === 0)
        return `Flow ${id}: no nodes.`;
    const kinds = {};
    for (const n of nodes)
        kinds[String(n.type ?? "?")] = (kinds[String(n.type ?? "?")] ?? 0) + 1;
    const top = Object.entries(kinds).sort((a, b) => b[1] - a[1]).slice(0, 8);
    return [`Flow ${id} (${nodes.length} nodes):`, ...top.map(([k, v]) => `- ${k} x${v}`)].join("\n");
}
function parseFlow(text) {
    const clean = (text ?? '').trim();
    if (!clean)
        throw new NodeRedError('Provide a flow as the JSON array Node-RED exports, for example [{"id":"a1b2","type":"inject","z":"tab1","x":100,"y":100,"wires":[["c3d4"]]}].');
    if (clean.length > 4 * 1024 * 1024)
        throw new NodeRedError('That flow is larger than this server will parse.');
    let value;
    try {
        value = JSON.parse(clean);
    }
    catch {
        throw new NodeRedError('The flow is not valid JSON.');
    }
    if (!Array.isArray(value))
        throw new NodeRedError('A Node-RED flow is a JSON array of node objects, not an object.');
    return value;
}
function nodesOf(flow) {
    return flow.filter((n) => typeof n.type === 'string' && n.type !== 'tab' && n.type !== 'comment');
}
function countBy(map, cap) {
    if (!map.size)
        return 'not reported';
    return [...map.entries()]
        .sort((a, b) => b[1] - a[1] || String(a[0]).localeCompare(String(b[0])))
        .slice(0, cap)
        .map(([k, n]) => `${k} x${n}`)
        .join(', ');
}
/** The shape of a flow: node types, layout extent, disabled nodes, wire volume and how much inline code it carries. */
export async function flowGraphAudit(args) {
    const flow = parseFlow(args.flow);
    const nodes = nodesOf(flow);
    const tabs = flow.filter((n) => n.type === 'tab');
    if (!nodes.length)
        return `That flow holds ${tabs.length} tab(s) and no nodes, so there is no graph to audit.`;
    const kinds = new Map();
    const tabsUsed = new Map();
    let disabled = 0;
    let wires = 0;
    let functions = 0;
    let funcChars = 0;
    let withInfo = 0;
    for (const n of nodes) {
        const type = String(n.type);
        kinds.set(type, (kinds.get(type) ?? 0) + 1);
        tabsUsed.set(String(n.z ?? 'no tab'), (tabsUsed.get(String(n.z ?? 'no tab')) ?? 0) + 1);
        if (n.d)
            disabled += 1;
        for (const group of n.wires ?? [])
            wires += group.length;
        if (type === 'function' || type === 'subflow' || type === 'template') {
            functions += 1;
            funcChars += String(n.func ?? '').length;
        }
        if (String(n.info ?? '').trim())
            withInfo += 1;
    }
    const xs = nodes.map((n) => Number(n.x)).filter((n) => Number.isFinite(n));
    const ys = nodes.map((n) => Number(n.y)).filter((n) => Number.isFinite(n));
    return [
        `Flow graph audit of a flow holding ${nodes.length} node(s) and ${tabs.length} tab(s)`,
        `Node types: ${countBy(kinds, 12)}`,
        `Nodes per tab: ${countBy(tabsUsed, 10)}${tabs.length ? ` (tabs: ${tabs.map((t) => String(t.label ?? t.id ?? 'id not reported')).slice(0, 6).join(', ')})` : ''}`,
        `Disabled nodes: ${disabled} of ${nodes.length} (${((disabled / nodes.length) * 100).toFixed(1)}%)`,
        `Wires: ${wires}, so ${(wires / nodes.length).toFixed(2)} per node`,
        `Nodes carrying inline code (function, subflow, template): ${functions}, holding ${funcChars.toLocaleString()} character(s) of code in total`,
        `Nodes carrying an info/comment field: ${withInfo} of ${nodes.length}`,
        xs.length && ys.length
            ? `Layout: x from ${Math.min(...xs)} to ${Math.max(...xs)} (${(Math.max(...xs) - Math.min(...xs)).toLocaleString()} wide), y from ${Math.min(...ys)} to ${Math.max(...ys)} (${(Math.max(...ys) - Math.min(...ys)).toLocaleString()} tall)`
            : 'Layout: not reported, most nodes carry no x/y coordinates',
        'Inline code is measured by length only. Nothing here prints a function body, a credential or a config value.',
    ].join('\n');
}
/** The wiring topology: sources, sinks, the longest chain through the graph and where the fan-out concentrates. */
export async function wiringReport(args) {
    const flow = parseFlow(args.flow);
    const nodes = nodesOf(flow);
    const limit = Math.max(1, Math.min(Math.floor(args.limit ?? 6), 25));
    if (!nodes.length)
        return 'That flow holds no nodes, so there is nothing to trace.';
    const byId = new Map(nodes.map((n) => [String(n.id), n]));
    const outbound = new Map();
    const inbound = new Map();
    for (const n of nodes) {
        for (const group of n.wires ?? []) {
            for (const target of group) {
                if (!outbound.has(String(n.id)))
                    outbound.set(String(n.id), []);
                outbound.get(String(n.id))?.push(String(target));
                if (!inbound.has(String(target)))
                    inbound.set(String(target), []);
                inbound.get(String(target))?.push(String(n.id));
            }
        }
    }
    const sources = nodes.filter((n) => !(inbound.get(String(n.id)) ?? []).length);
    const sinks = nodes.filter((n) => !(outbound.get(String(n.id)) ?? []).length);
    const fanOut = [...outbound.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, limit);
    const fanIn = [...inbound.entries()].sort((a, b) => b[1].length - a[1].length).slice(0, limit).map(([id, from]) => [String(id), from.length]);
    // Breadth first with a visited set: a Node-RED flow can hold a cycle, so
    // depth here is the shortest distance from a source, which stays defined.
    const depth = new Map();
    const seen = new Set();
    const queue = sources.map((n) => String(n.id));
    for (const id of queue) {
        depth.set(id, 1);
        seen.add(id);
    }
    let guard = 0;
    while (queue.length && guard < nodes.length + 1) {
        guard += 1;
        const id = queue.shift();
        const d = depth.get(id) ?? 1;
        for (const next of outbound.get(id) ?? []) {
            if (seen.has(next))
                continue;
            seen.add(next);
            depth.set(next, d + 1);
            queue.push(next);
        }
    }
    const deepest = Math.max(0, ...depth.values());
    const cycles = [...outbound.entries()].filter(([id, targets]) => targets.some((t) => t === id || (outbound.get(t) ?? []).includes(id))).length;
    const dangling = [...outbound.entries()]
        .flatMap(([id, targets]) => targets.map((t) => ({ from: id, to: t })))
        .filter((w) => !byId.has(w.to));
    return [
        `Wiring report for a flow of ${nodes.length} node(s)`,
        `Wires: ${[...outbound.values()].reduce((sum, list) => sum + list.length, 0)}`,
        `Nodes with no inbound wire (sources): ${sources.length}${sources.length ? ` (${sources.slice(0, limit).map((n) => `${n.type} ${n.name ?? n.id}`).join('; ')})` : ''}`,
        `Nodes with no outbound wire (sinks): ${sinks.length}${sinks.length ? ` (${sinks.slice(0, limit).map((n) => `${n.type} ${n.name ?? n.id}`).join('; ')})` : ''}`,
        `Longest shortest path from a source: ${deepest} node(s) deep, over ${seen.size} node(s) reachable from a source`,
        `Node pairs that wire into each other: ${cycles}`,
        `Widest fan-out: ${fanOut.length ? fanOut.map(([id, list]) => `${byId.get(id)?.type ?? id} ${byId.get(id)?.name ?? id} -> ${list.length}`).join('; ') : 'none'}`,
        `Widest fan-in: ${fanIn.length ? fanIn.map(([id, n]) => `${byId.get(id)?.type ?? id} ${byId.get(id)?.name ?? id} <- ${n}`).join('; ') : 'none'}`,
        `Wires pointing at an id that is not in this flow: ${dangling.length}${dangling.length ? ` (${dangling.slice(0, 5).map((w) => `${w.from} -> ${w.to}`).join('; ')})` : ''}`,
        dangling.length ? 'A dangling wire is usually a node that was deleted without updating the wire, which Node-RED will reject on deploy.' : 'Every wire resolves to a node in this flow.',
    ].join('\n');
}
/** Static lint over a flow before it is deployed: the problems Node-RED will complain about at import time. */
export async function flowLint(args) {
    const flow = parseFlow(args.flow);
    const findings = [];
    const seen = new Map();
    for (const n of flow) {
        const id = String(n.id ?? '');
        if (!id) {
            findings.push(`A ${n.type ?? 'node of unknown type'} carries no id.`);
            continue;
        }
        seen.set(id, (seen.get(id) ?? 0) + 1);
    }
    const duplicates = [...seen.entries()].filter(([, n]) => n > 1);
    for (const [id, n] of duplicates)
        findings.push(`Node id ${id} appears ${n} times, which is a duplicate.`);
    const ids = new Set(seen.keys());
    const nodes = nodesOf(flow);
    let missingType = 0;
    let emptyFunc = 0;
    let emptyWires = 0;
    let orphan = 0;
    let dangling = 0;
    for (const n of nodes) {
        if (!String(n.type ?? '').trim())
            missingType += 1;
        const id = String(n.id);
        const wiredOut = (n.wires ?? []).some((g) => g.length);
        if (!String(n.name ?? '').trim() && String(n.type ?? '') === 'function')
            findings.push(`A function node (${id}) has no name.`);
        if (String(n.type ?? '') === 'function' && !String(n.func ?? '').trim())
            emptyFunc += 1;
        for (const group of n.wires ?? []) {
            if (!group.length)
                emptyWires += 1;
            for (const t of group)
                if (!ids.has(String(t)))
                    dangling += 1;
        }
        if (!wiredOut) {
            const hasInbound = flow.some((other) => (other.wires ?? []).some((g) => g.includes(id)));
            if (!hasInbound)
                orphan += 1;
        }
    }
    if (missingType)
        findings.push(`${missingType} node(s) carry no type.`);
    if (emptyFunc)
        findings.push(`${emptyFunc} function node(s) have an empty body.`);
    if (emptyWires)
        findings.push(`${emptyWires} wires array(s) are present but empty.`);
    if (dangling)
        findings.push(`${dangling} wire target(s) name a node id that is not in the flow.`);
    if (orphan)
        findings.push(`${orphan} node(s) are wired to nothing in either direction.`);
    const comments = flow.filter((n) => n.type === 'comment');
    const commentsWithoutInfo = comments.filter((c) => !String(c.info ?? '').trim()).length;
    if (commentsWithoutInfo)
        findings.push(`${commentsWithoutInfo} comment node(s) carry no info text.`);
    return [
        `Lint of a flow holding ${flow.length} object(s), ${nodes.length} of them nodes and ${comments.length} comments`,
        `Distinct node ids: ${seen.size}`,
        findings.length
            ? `Findings (${findings.length}): ${findings.slice(0, 12).join('; ')}${findings.length > 12 ? `; and ${findings.length - 12} more` : ''}`
            : 'No findings: every node has an id and a type, every wire resolves, and no function body is empty.',
        'This is a structural lint of the JSON you supplied. It is not Node-RED own validator and it does not check whether a node type is installed.',
    ].join('\n');
}
