/**
 * Graph Algorithms — keyless public API client.
 */
const BASE = "https://example.invalid";
const SOURCE = "Graph Algorithms";
export class SourceError extends Error {
}
async function request(path, accept = "application/json", timeoutMs = 25000) {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), timeoutMs);
    try {
        const res = await fetch(path.startsWith("http") ? path : BASE + path, {
            signal: ctrl.signal,
            headers: { "user-agent": "graph-algorithms-mcp", accept },
        });
        if (!res.ok)
            throw new SourceError(`${SOURCE} responded ${res.status}`);
        return res;
    }
    catch (e) {
        if (e instanceof SourceError)
            throw e;
        if (e.name === "AbortError")
            throw new SourceError(`${SOURCE} request timed out`);
        throw new SourceError(`${SOURCE} request failed: ${e.message}`);
    }
    finally {
        clearTimeout(timer);
    }
}
export async function getJson(path) {
    const res = await request(path);
    const body = await res.text();
    try {
        return JSON.parse(body);
    }
    catch {
        throw new SourceError(`${SOURCE} returned malformed JSON`);
    }
}
export async function getText(path, accept = "text/plain") {
    const res = await request(path, accept);
    return (await res.text()).trim();
}
export function clampLimit(n, fallback, max) {
    const v = n ?? fallback;
    if (!Number.isInteger(v) || v < 1 || v > max)
        throw new SourceError(`limit must be between 1 and ${max}`);
    return v;
}
export function clean(s) {
    return String(s ?? "").replace(/\s+/g, " ").trim();
}
export function bullet(label, value) {
    const v = value === undefined || value === null || value === "" ? "" : String(value);
    return v ? `${label}: ${v}` : "";
}
export function section(title, rows) {
    return [title, ...rows.filter(Boolean)].join("\n");
}
function adjacency(edges, directed) {
    const g = new Map();
    const ensure = (n) => { if (!g.has(n))
        g.set(n, []); return g.get(n); };
    for (const e of edges) {
        ensure(e.from).push({ to: e.to, weight: e.weight ?? 1 });
        if (!directed)
            ensure(e.to).push({ to: e.from, weight: e.weight ?? 1 });
        else
            ensure(e.to);
    }
    return g;
}
export async function shortestPath(a) {
    const g = adjacency(a.edges, a.directed);
    if (!g.has(a.from))
        throw new SourceError(`node "${a.from}" does not appear in any edge`);
    if (!g.has(a.to))
        throw new SourceError(`node "${a.to}" does not appear in any edge`);
    const dist = new Map([[a.from, 0]]);
    const prev = new Map();
    const done = new Set();
    while (true) {
        let best;
        let bestD = Infinity;
        for (const [n, d] of dist)
            if (!done.has(n) && d < bestD) {
                best = n;
                bestD = d;
            }
        if (best === undefined)
            break;
        if (best === a.to)
            break;
        done.add(best);
        for (const e of g.get(best) ?? []) {
            const nd = bestD + e.weight;
            if (nd < (dist.get(e.to) ?? Infinity)) {
                dist.set(e.to, nd);
                prev.set(e.to, best);
            }
        }
    }
    if (!dist.has(a.to))
        return `No path from ${a.from} to ${a.to} in this ${a.directed ? "directed" : "undirected"} graph.`;
    const path = [];
    for (let n = a.to; n !== undefined; n = prev.get(n))
        path.unshift(n);
    const cost = dist.get(a.to);
    return [
        `Shortest path: ${path.join(" -> ")}`,
        `Total cost: ${Number(cost.toFixed(6))}`,
        `Hops: ${path.length - 1}`,
        `Graph: ${g.size} nodes, ${a.edges.length} edges (${a.directed ? "directed" : "undirected"})`,
    ].join("\n");
}
export async function topologicalSort(a) {
    const g = new Map();
    const indeg = new Map();
    const ensure = (n) => { if (!g.has(n)) {
        g.set(n, []);
        indeg.set(n, 0);
    } };
    for (const e of a.edges) {
        ensure(e.from);
        ensure(e.to);
        g.get(e.from).push(e.to);
        indeg.set(e.to, (indeg.get(e.to) ?? 0) + 1);
    }
    const queue = [...indeg.entries()].filter(([, d]) => d === 0).map(([n]) => n).sort();
    const order = [];
    while (queue.length) {
        const n = queue.shift();
        order.push(n);
        for (const m of g.get(n) ?? []) {
            const d = (indeg.get(m) ?? 1) - 1;
            indeg.set(m, d);
            if (d === 0)
                queue.push(m);
        }
    }
    if (order.length !== indeg.size) {
        const stuck = [...indeg.entries()].filter(([, d]) => d > 0).map(([n]) => n);
        throw new SourceError(`graph has a cycle, so no topological order exists (involving ${stuck.slice(0, 6).join(", ")})`);
    }
    return [`Topological order (${order.length} nodes):`, ...order.map((n, i) => `${i + 1}. ${n}`)].join("\n");
}
export async function connectedComponents(a) {
    const g = adjacency(a.edges.map((e) => ({ ...e })), a.directed);
    const seen = new Set();
    const comps = [];
    for (const start of g.keys()) {
        if (seen.has(start))
            continue;
        const stack = [start];
        const comp = [];
        seen.add(start);
        while (stack.length) {
            const n = stack.pop();
            comp.push(n);
            for (const e of g.get(n) ?? []) {
                if (!seen.has(e.to)) {
                    seen.add(e.to);
                    stack.push(e.to);
                }
            }
        }
        comps.push(comp.sort());
    }
    comps.sort((x, y) => y.length - x.length || x[0].localeCompare(y[0]));
    return [`${comps.length} connected component${comps.length === 1 ? "" : "s"}:`, ...comps.map((c, i) => `${i + 1}. (${c.length}) ${c.join(", ")}`)].join("\n");
}
