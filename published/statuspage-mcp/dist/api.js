export class StatuspageError extends Error {
    constructor(message) {
        super(message);
        this.name = "StatuspageError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function headers() {
    const k = process.env.STATUSPAGE_API_KEY;
    if (!k)
        throw new StatuspageError("Set STATUSPAGE_API_KEY (Statuspage API key).");
    return { ...UA, Accept: "application/json", Authorization: `OAuth ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch("https://api.statuspage.io/v1" + path, {
            headers: headers(),
            signal: AbortSignal.timeout(25000),
        });
    }
    catch (e) {
        throw new StatuspageError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new StatuspageError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listPages() {
    return get("/pages");
}
export function getPage(pageId) {
    return get(`/pages/${encodeURIComponent(pageId)}`);
}
export function listIncidents(pageId) {
    return get(`/pages/${encodeURIComponent(pageId)}/incidents?limit=10`);
}
export function incidentDetails(pageId, incidentId) {
    return get(`/pages/${encodeURIComponent(pageId)}/incidents/${encodeURIComponent(incidentId)}`);
}
export function incidentUpdates(pageId, incidentId) {
    return get(`/pages/${encodeURIComponent(pageId)}/incidents/${encodeURIComponent(incidentId)}/incident_updates`);
}
export function components(pageId) {
    return get(`/pages/${encodeURIComponent(pageId)}/components`);
}
export function componentDetails(pageId, componentId) {
    return get(`/pages/${encodeURIComponent(pageId)}/components/${encodeURIComponent(componentId)}`);
}
export function subscribers(pageId) {
    return get(`/pages/${encodeURIComponent(pageId)}/subscribers?limit=20`);
}
export function upcomingMaintenance(pageId) {
    return get(`/pages/${encodeURIComponent(pageId)}/scheduled-maintenances/upcoming`);
}
export function maintenanceDetails(pageId, maintenanceId) {
    return get(`/pages/${encodeURIComponent(pageId)}/scheduled-maintenances/${encodeURIComponent(maintenanceId)}`);
}
