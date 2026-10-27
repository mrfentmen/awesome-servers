/**
 * Logseq HTTP APIs plugin client. Talks to Logseq on localhost via the
 * "HTTP APIs" plugin (default http://localhost:12315). Optional
 * LOGSEQ_API_TOKEN if the plugin is configured with one.
 * Plugin: https://github.com/lastnpe/logseq-http-apis (install in Logseq first).
 */
const BASE = (process.env.LOGSEQ_URL ?? "http://localhost:12315").replace(/\/+$/, "");
export class LogseqError extends Error {
}
function headers() {
    const h = { "User-Agent": "logseq-mcp/1.0", "Content-Type": "application/json", Accept: "application/json" };
    if (process.env.LOGSEQ_API_TOKEN)
        h.Authorization = `Bearer ${process.env.LOGSEQ_API_TOKEN}`;
    return h;
}
async function callApi(method, args = {}) {
    let res;
    try {
        res = await fetch(`${BASE}/api`, {
            method: "POST",
            headers: headers(),
            body: JSON.stringify({ method, args }),
            signal: AbortSignal.timeout(20000),
        });
    }
    catch {
        throw new LogseqError(`Logseq is unreachable at ${BASE}. Open Logseq with the HTTP APIs plugin enabled.`);
    }
    if (res.status === 401 || res.status === 403)
        throw new LogseqError("Logseq refused (401/403). Check LOGSEQ_API_TOKEN.");
    if (!res.ok)
        throw new LogseqError(`Logseq error ${res.status}`);
    return (await res.json());
}
export async function listPages() {
    const rows = await callApi("logseq.Editor.getAllPages", {});
    const list = Array.isArray(rows) ? rows : [];
    return list.slice(0, 50).map((p) => ({ name: String(p.name ?? p.originalName ?? "?"), id: p.id ?? p.uuid }));
}
export async function getPage(name) {
    if (!name.trim())
        throw new LogseqError("Page name is empty.");
    const page = await callApi("logseq.Editor.getPage", { pageName: name.trim() });
    return page ?? null;
}
export async function pageBlocks(name, limit = 20) {
    if (!name.trim())
        throw new LogseqError("Page name is empty.");
    const tree = await callApi("logseq.Editor.getPageBlocksTree", { pageName: name.trim() });
    const out = [];
    const walk = (nodes, depth) => {
        for (const n of nodes.slice(0, limit)) {
            const content = String(n.content ?? "").split("\n")[0].slice(0, 160);
            if (content)
                out.push(`${"  ".repeat(Math.min(depth, 4))}- ${content}`);
            if (Array.isArray(n.children) && out.length < limit)
                walk(n.children, depth + 1);
            if (out.length >= limit)
                break;
        }
    };
    walk(Array.isArray(tree) ? tree : [], 0);
    return out.slice(0, limit);
}
export function formatPage(name, page, blocks) {
    const lines = [
        `# ${name}`,
        page?.properties ? `Properties: ${JSON.stringify(page.properties).slice(0, 200)}` : "",
        blocks.length ? `\n${blocks.join("\n")}` : "(no blocks)",
    ].filter(Boolean);
    return lines.join("\n");
}
