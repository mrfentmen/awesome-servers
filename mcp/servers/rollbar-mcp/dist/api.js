export class RollbarError extends Error {
    constructor(message) {
        super(message);
        this.name = "RollbarError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function token() {
    const k = process.env.ROLLBAR_ACCESS_TOKEN;
    if (!k)
        throw new RollbarError("Set ROLLBAR_ACCESS_TOKEN (free Rollbar tier).");
    return k;
}
async function get(path) {
    const sep = path.includes("?") ? "&" : "?";
    let res;
    try {
        res = await fetch(`https://api.rollbar.com/api/1${path}${sep}access_token=${encodeURIComponent(token())}`, {
            headers: { ...UA, Accept: "application/json" },
            signal: AbortSignal.timeout(30000),
        });
    }
    catch (e) {
        throw new RollbarError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new RollbarError(`HTTP ${res.status}: ${body}`);
    }
    return res.text();
}
export function listProjects() {
    return get("/projects/");
}
export function listItems(projectId) {
    return get(`/projects/${encodeURIComponent(projectId)}/items/`);
}
export function getItem(projectId, itemId) {
    return get(`/projects/${encodeURIComponent(projectId)}/items/${encodeURIComponent(itemId)}/`);
}
