export class OwnCloudError extends Error {
    constructor(message) {
        super(message);
        this.name = "OwnCloudError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    return (process.env.OWNCLOUD_BASE_URL ?? "https://demo.owncloud.com").replace(/\/$/, "");
}
function authHeaders() {
    const u = process.env.OWNCLOUD_USERNAME;
    const p = process.env.OWNCLOUD_PASSWORD;
    const base64 = typeof Buffer !== "undefined"
        ? Buffer.from(`${u ?? ""}:${p ?? ""}`).toString("base64")
        : btoa(`${u ?? ""}:${p ?? ""}`);
    return u ? { Authorization: "Basic " + base64 } : {};
}
function pretty(data) {
    const t = typeof data === "string" ? data : JSON.stringify(data, null, 2);
    return t.length > 12000 ? t.slice(0, 12000) + "\n…(truncated)" : t;
}
async function req(path, init = {}) {
    const res = await fetch(base() + path, {
        headers: { ...UA, "OCS-APIRequest": "true", ...authHeaders(), ...(init.headers ?? {}) },
        ...init,
    });
    const ct = res.headers.get("content-type") ?? "";
    const data = ct.includes("json") ? await res.json() : await res.text();
    if (!res.ok) {
        const detail = typeof data === "string" ? data.slice(0, 300) : JSON.stringify(data).slice(0, 300);
        throw new OwnCloudError(`HTTP ${res.status}: ${detail}`);
    }
    return pretty(data);
}
export function getCapabilities() {
    return req("/ocs/v1.php/cloud/capabilities?format=json");
}
export function listShares() {
    return req("/ocs/v1.php/apps/files_sharing/api/v1/shares?format=json");
}
export function getShare(shareId) {
    return req(`/ocs/v1.php/apps/files_sharing/api/v1/shares/${encodeURIComponent(shareId)}?format=json`);
}
export function createShare(filePath, shareType, shareWith) {
    const body = new URLSearchParams({ path: filePath, shareType });
    if (shareWith)
        body.set("shareWith", shareWith);
    return req("/ocs/v1.php/apps/files_sharing/api/v1/shares?format=json", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: body.toString(),
    });
}
// ---- muxC tools:
/**
 * GET /status.php is the one ownCloud endpoint that answers without a login, so
 * it is the only place a new tool can be proven against a real server.
 */
export async function serverStatus() {
    const res = await fetch(`${base()}/status.php`, {
        headers: { ...UA, Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!res.ok)
        throw new OwnCloudError(`HTTP ${res.status} from ${base()}/status.php`);
    const raw = (await res.json());
    const field = (key) => {
        const value = raw[key];
        return value === undefined || value === null || value === "" ? "not reported" : String(value);
    };
    return [
        `Server: ${field("productname")} ${field("productversion")} (${field("product")})`,
        `ownCloud version: ${field("versionstring")} (web ${field("version")}, edition ${field("edition")})`,
        `Installed: ${field("installed")} | Maintenance mode: ${field("maintenance")} | Needs DB upgrade: ${field("needsDbUpgrade")}`,
    ].join("\n");
}
