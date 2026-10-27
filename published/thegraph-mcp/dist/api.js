export class ThegraphError extends Error {
    constructor(message) {
        super(message);
        this.name = "ThegraphError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function apiKey() {
    const k = process.env.THEGRAPH_API_KEY;
    if (!k)
        throw new ThegraphError("Set the THEGRAPH_API_KEY environment variable.");
    return k;
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
function stripHtml(html) {
    return html.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<style[\s\S]*?<\/style>/gi, " ").replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();
}
async function req(url, init = {}) {
    const res = await fetch(url, { headers: { ...UA, ...(init.headers ?? {}) }, ...init });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new ThegraphError(`HTTP ${res.status}: ${detail}`);
    }
    return data;
}
export async function querySubgraph(subgraphId, query, variables) {
    const key = apiKey();
    let url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${encodeURIComponent(String(subgraphId))}`;
    let parsedVars;
    try {
        parsedVars = variables ? JSON.parse(variables) : undefined;
    }
    catch {
        throw new ThegraphError('variables must be a JSON object string.');
    }
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(parsedVars === undefined ? { query } : { query, variables: parsedVars }) });
    return pretty(data);
}
export async function getSubgraphSchema(subgraphId) {
    const key = apiKey();
    let url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${encodeURIComponent(String(subgraphId))}`;
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "{ __schema { queryType { fields { name } } types { name kind } } }" }) });
    return pretty(data);
}
export async function getLatestBlock(subgraphId) {
    const key = apiKey();
    let url = `https://gateway.thegraph.com/api/${key}/subgraphs/id/${encodeURIComponent(String(subgraphId))}`;
    const data = await req(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query: "{ _meta { block { number hash timestamp } } }" }) });
    return pretty(data);
}
