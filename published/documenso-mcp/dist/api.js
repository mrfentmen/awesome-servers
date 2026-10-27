/**
 * Documenso API v2 client. Points at any instance via DOCUMENSO_URL
 * (default https://app.documenso.com). Needs DOCUMENSO_API_KEY.
 * Docs: https://docs.documenso.com/developers/api
 */
const BASE = (process.env.DOCUMENSO_URL ?? "https://app.documenso.com").replace(/\/+$/, "");
export class DocumensoError extends Error {
}
function headers() {
    const key = process.env.DOCUMENSO_API_KEY;
    if (!key)
        throw new DocumensoError("Set DOCUMENSO_API_KEY first.");
    return { "User-Agent": "documenso-mcp/1.0", Accept: "application/json", Authorization: `Bearer ${key}` };
}
async function getJson(path) {
    const res = await fetch(`${BASE}${path}`, {
        headers: headers(),
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 401 || res.status === 403)
        throw new DocumensoError("Documenso refused (401/403). Check URL and key.");
    if (res.status === 404)
        throw new DocumensoError("Not found.");
    if (!res.ok)
        throw new DocumensoError(`Documenso error ${res.status}`);
    return (await res.json());
}
export async function listDocuments(limit = 10) {
    const data = await getJson(`/api/v2/documents?perPage=${Math.min(Math.max(limit, 1), 100)}`);
    const rows = Array.isArray(data.documents) ? data.documents : [];
    return rows.slice(0, limit).map((d) => ({
        id: String(d.id),
        title: d.title,
        status: d.status,
        created: d.createdAt ? String(d.createdAt).slice(0, 10) : undefined,
    }));
}
export async function getDocument(id) {
    if (!id.trim())
        throw new DocumensoError("Document id is empty.");
    const d = await getJson(`/api/v2/documents/${encodeURIComponent(id.trim())}`);
    const doc = d.document ?? d;
    const recips = Array.isArray(doc.recipients) ? doc.recipients : [];
    return {
        id: String(doc.id ?? id),
        title: doc.title,
        status: doc.status,
        created: doc.createdAt ? String(doc.createdAt).slice(0, 10) : undefined,
        recipients: recips.map((r) => `${String(r.email ?? "?")}${r.signingStatus ? ` [${r.signingStatus}]` : ""}`),
    };
}
export function formatDocument(d, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const lines = [
        `${prefix}[${d.id}] ${d.title ?? "(untitled)"}${d.status ? ` [${d.status}]` : ""}${d.created ? ` (${d.created})` : ""}`,
    ];
    if ("recipients" in d && d.recipients.length) {
        lines.push(`Recipients:\n- ${d.recipients.join("\n- ")}`);
    }
    return lines.join("\n");
}
// ---- muxB tools:
export async function instanceHealth() {
    const res = await fetch(`${BASE}/api/health`, {
        headers: { "User-Agent": "documenso-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404) {
        return `${BASE} has no /api/health endpoint. That is expected on an older build; check the version with a document call instead.`;
    }
    if (!res.ok)
        throw new DocumensoError(`Health check failed with HTTP ${res.status} against ${BASE}.`);
    const data = (await res.json());
    const checks = data.checks && typeof data.checks === "object" ? data.checks : {};
    const names = Object.keys(checks);
    const out = [
        `${BASE}: ${data.status ?? "no status reported"}${data.timestamp ? `, checked ${String(data.timestamp).replace("T", " ").slice(0, 19)}` : ""}.`,
        names.length === 0 ? "The instance reported no individual checks." : `Checks reported: ${names.length}.`,
    ];
    for (const name of names.slice(0, 12)) {
        const c = checks[name];
        out.push(`  - ${name}: ${c?.status ?? "not reported"}${c?.message ? ` (${c.message})` : ""}`);
    }
    if (data.status === "ok") {
        out.push("", "This is the instance DOCUMENSO_URL points at, so a self-hosted deployment reports its own", "database and certificate state here. A failing certificate check means signatures will not be trusted by signers.");
    }
    else {
        out.push("", `The instance is reporting "${data.status ?? "an unknown state"}", so document calls are likely to fail.`);
    }
    return out.join("\n");
}
const DOC_ROLES = {
    signer: "SIGNER",
    approver: "APPROVER",
    viewer: "VIEWER",
    cc: "CC",
    assistant: "ASSISTANT",
};
const DOC_ACTION_FREE = new Set(["VIEWER", "CC"]);
const DOC_FIELD_TYPES = new Set([
    "SIGNATURE", "FREE_SIGNATURE", "INITIALS", "NAME", "EMAIL", "DATE", "TEXT", "NUMBER", "RADIO", "CHECKBOX", "DROPDOWN",
]);
const DOC_EMAIL = /^[^\s@]+@[^\s@.]+(\.[^\s@.]+)+$/;
