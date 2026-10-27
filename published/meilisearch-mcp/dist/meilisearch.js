const DEFAULT_HOST = "http://localhost:7575";
function getConfig() {
    return {
        host: process.env.MEILISEARCH_URL || DEFAULT_HOST,
        apiKey: process.env.MEILISEARCH_API_KEY,
    };
}
function getHeaders() {
    const cfg = getConfig();
    const headers = { "Content-Type": "application/json" };
    if (cfg.apiKey)
        headers.Authorization = `Bearer ${cfg.apiKey}`;
    return headers;
}
export async function checkHealth() {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/health`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`Health check failed: ${res.status}`);
    return res.json();
}
export async function listIndexes() {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`List indexes failed: ${res.status}`);
    return res.json();
}
export async function getIndex(uid) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(uid)}`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`Get index failed: ${res.status}`);
    return res.json();
}
export async function searchIndex(indexUid, query, limit = 20, offset, filters) {
    const cfg = getConfig();
    const body = { q: query, limit };
    if (offset !== undefined)
        body.offset = offset;
    if (filters)
        body.filter = filters;
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/search`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`Search failed: ${res.status}`);
    return res.json();
}
export async function getDocuments(indexUid, limit = 20, offset = 0) {
    const cfg = getConfig();
    const params = new URLSearchParams({ limit: String(limit), offset: String(offset) });
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/documents?${params}`, {
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`Get documents failed: ${res.status}`);
    return res.json();
}
export async function getDocument(indexUid, id) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/documents/${encodeURIComponent(id)}`, {
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`Get document failed: ${res.status}`);
    return res.json();
}
export async function addDocuments(indexUid, documents) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/documents?primaryKey=id`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(documents),
    });
    if (!res.ok)
        throw new Error(`Add documents failed: ${res.status}`);
    return res.json();
}
export async function deleteDocument(indexUid, id) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/documents/${encodeURIComponent(id)}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`Delete document failed: ${res.status}`);
    return res.json();
}
export async function updateSettings(indexUid, settings) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/settings`, {
        method: "PATCH",
        headers: getHeaders(),
        body: JSON.stringify(settings),
    });
    if (!res.ok)
        throw new Error(`Update settings failed: ${res.status}`);
    return res.json();
}
export async function getStats() {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/stats`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`Get stats failed: ${res.status}`);
    return res.json();
}
export async function getTask(taskUid) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/tasks/${encodeURIComponent(taskUid)}`, {
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`Get task failed: ${res.status}`);
    return res.json();
}
export async function listKeys() {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/keys`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`List keys failed: ${res.status}`);
    return res.json();
}
export async function createIndex(uid, primaryKey) {
    const cfg = getConfig();
    const body = { uid };
    if (primaryKey)
        body.primaryKey = primaryKey;
    const res = await fetch(`${cfg.host}/indexes`, {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify(body),
    });
    if (!res.ok)
        throw new Error(`Create index failed: ${res.status}`);
    return res.json();
}
export async function deleteIndex(indexUid) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}`, {
        method: "DELETE",
        headers: getHeaders(),
    });
    if (!res.ok)
        throw new Error(`Delete index failed: ${res.status}`);
    return res.json();
}
export async function getIndexStats(indexUid) {
    const cfg = getConfig();
    const res = await fetch(`${cfg.host}/indexes/${encodeURIComponent(indexUid)}/stats`, { headers: getHeaders() });
    if (!res.ok)
        throw new Error(`Get index stats failed: ${res.status}`);
    return res.json();
}
export function formatBytes(bytes) {
    if (bytes < 1024)
        return `${bytes} B`;
    if (bytes < 1024 * 1024)
        return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024)
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
