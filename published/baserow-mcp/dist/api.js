export class BaserowError extends Error {
    constructor(message) {
        super(message);
        this.name = "BaserowError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.BASEROW_URL ?? "https://api.baserow.io").replace(/\/$/, "");
}
function headers() {
    const k = process.env.BASEROW_TOKEN;
    if (!k)
        throw new BaserowError("Set BASEROW_TOKEN (database token).");
    return { ...UA, Accept: "application/json", Authorization: `Token ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new BaserowError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new BaserowError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 8000);
}
export function getDashboard() {
    return get("/api/user/dashboard/");
}
export function listTables(databaseId) {
    return get(`/api/database/tables/database/${encodeURIComponent(databaseId)}/`);
}
