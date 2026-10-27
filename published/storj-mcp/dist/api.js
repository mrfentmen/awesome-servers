/**
 * Storj via S3-compatible gateway (SigV4 signed inline, no extra deps).
 * Needs STORJ_ACCESS_KEY + STORJ_SECRET_KEY (Storj dashboard > Access).
 * Optional STORJ_ENDPOINT (default https://gateway.storjshare.io).
 */
import { createHmac, createHash } from "node:crypto";
const ENDPOINT = (process.env.STORJ_ENDPOINT ?? "https://gateway.storjshare.io").replace(/\/+$/, "");
const HOST = new URL(ENDPOINT).host;
export class StorjError extends Error {
}
function creds() {
    const access = process.env.STORJ_ACCESS_KEY;
    const secret = process.env.STORJ_SECRET_KEY;
    if (!access || !secret)
        throw new StorjError("Set STORJ_ACCESS_KEY and STORJ_SECRET_KEY first.");
    return { access, secret };
}
function hmac(key, data) {
    return createHmac("sha256", key).update(data, "utf8").digest();
}
function sign(method, path, query, payloadHash) {
    const { access, secret } = creds();
    const now = new Date();
    const amz = now.toISOString().replace(/[-:]/g, "").slice(0, 15) + "Z";
    const date = amz.slice(0, 8);
    const headers = { host: HOST, "x-amz-content-sha256": payloadHash, "x-amz-date": amz };
    const signedHeaders = Object.keys(headers).sort().join(";");
    const canonicalHeaders = Object.keys(headers).sort().map((k) => `${k}:${headers[k]}\n`).join("");
    const canonical = [method, path, query, canonicalHeaders, signedHeaders, payloadHash].join("\n");
    const scope = `${date}/us-east-1/s3/aws4_request`;
    const toSign = ["AWS4-HMAC-SHA256", amz, scope, createHash("sha256").update(canonical, "utf8").digest("hex")].join("\n");
    const kDate = hmac(`AWS4${secret}`, date);
    const kRegion = hmac(kDate, "us-east-1");
    const kService = hmac(kRegion, "s3");
    const kSign = hmac(kService, "aws4_request");
    const sig = hmac(kSign, toSign).toString("hex");
    return {
        ...headers,
        Authorization: `AWS4-HMAC-SHA256 Credential=${access}/${scope}, SignedHeaders=${signedHeaders}, Signature=${sig}`,
    };
}
async function s3get(path, query = "") {
    const empty = createHash("sha256").update("", "utf8").digest("hex");
    const res = await fetch(`${ENDPOINT}${path}${query ? `?${query}` : ""}`, {
        headers: sign("GET", path, query, empty),
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new StorjError("Storj refused (401/403). Check keys and endpoint.");
    if (!res.ok)
        throw new StorjError(`Storj error ${res.status}`);
    return await res.text();
}
const tag = (xml, name) => {
    const out = [];
    const re = new RegExp(`<${name}>([^<]*)</${name}>`, "g");
    let m;
    while ((m = re.exec(xml)) !== null)
        out.push(m[1]);
    return out;
};
export async function listBuckets() {
    const xml = await s3get("/");
    return tag(xml, "Name").filter((n) => n.length > 0);
}
export async function listObjects(bucket, prefix = "", limit = 20) {
    if (!bucket.trim())
        throw new StorjError("Bucket is empty.");
    const qs = new URLSearchParams({ "list-type": "2", "max-keys": String(Math.min(Math.max(limit, 1), 100)) });
    if (prefix.trim())
        qs.set("prefix", prefix.trim());
    const xml = await s3get(`/${encodeURIComponent(bucket.trim())}`, qs.toString().replace(/%20/g, "+"));
    const keys = tag(xml, "Key");
    const sizes = tag(xml, "Size");
    const dates = tag(xml, "LastModified");
    return keys.slice(0, limit).map((k, i) => ({
        key: k,
        size: sizes[i] !== undefined ? Number(sizes[i]) : undefined,
        modified: dates[i] ? String(dates[i]).slice(0, 10) : undefined,
    }));
}
export function formatObject(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    const size = o.size !== undefined ? ` (${o.size > 1048576 ? `${(o.size / 1048576).toFixed(1)} MB` : `${(o.size / 1024).toFixed(1)} KB`})` : "";
    return `${prefix}${o.key}${size}${o.modified ? ` — ${o.modified}` : ""}`;
}
// ---- muxB tools:
const STJ_STATUS = "https://status.storj.io/api/v2";
async function stjGet(path) {
    const res = await fetch(`${STJ_STATUS}/${path}`, {
        headers: { "User-Agent": "storj-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (res.status === 404)
        throw new StorjError(`Storj status page has no "${path}".`);
    if (!res.ok)
        throw new StorjError(`Storj status page returned ${res.status} for ${path}.`);
    return await res.json();
}
export async function serviceStatus() {
    const summary = (await stjGet("summary.json"));
    const rows = Array.isArray(summary.components) ? summary.components : [];
    const byId = new Map(rows.map((c) => [String(c.id), c]));
    const out = [
        `${summary.page?.name ?? "Storj DCS"}: ${summary.status?.description ?? "status not reported"} (indicator ${summary.status?.indicator ?? "unknown"}).`,
        `Page timezone ${summary.page?.time_zone ?? "not reported"}; last updated ${(summary.page?.updated_at ?? "not reported").slice(0, 19).replace("T", " ")}.`,
        "",
    ];
    const degraded = [];
    for (const c of rows.filter((r) => r.group !== true)) {
        if (c.status !== "operational") {
            degraded.push(`${c.name ?? "(unnamed)"}: ${c.status ?? "unknown"}${c.description ? ` - ${c.description}` : ""}`);
        }
    }
    const groups = rows.filter((r) => r.group === true);
    out.push(`${rows.length - groups.length} monitored services, ${degraded.length} not fully operational.`);
    if (degraded.length === 0) {
        out.push("Every monitored service reports operational.");
    }
    else {
        out.push(...degraded.slice(0, 10).map((d) => `  - ${d}`));
    }
    if (groups.length) {
        out.push("", "Regions:");
        for (const g of groups.slice(0, 10)) {
            const kids = (g.components ?? []).map((id) => byId.get(String(id))?.status).filter(Boolean);
            const bad = kids.filter((s) => s !== "operational").length;
            out.push(`  - ${g.name ?? "(unnamed)"}: ${kids.length} services, ${bad} degraded`);
        }
    }
    const incidents = Array.isArray(summary.incidents) ? summary.incidents : [];
    const upcoming = Array.isArray(summary.scheduled_maintenances) ? summary.scheduled_maintenances : [];
    out.push("", `Open incidents: ${incidents.length}. Scheduled maintenance: ${upcoming.length}.`);
    for (const i of incidents.slice(0, 5)) {
        out.push(`  ! ${i.name ?? "(untitled)"} [${i.status ?? "?"}, ${i.impact ?? "impact not reported"}] updated ${(i.updated_at ?? "?").slice(0, 10)}`);
    }
    for (const m of upcoming.slice(0, 5)) {
        out.push(`  # ${m.name ?? "(untitled)"} from ${(m.scheduled_for ?? "?").slice(0, 16).replace("T", " ")} to ${(m.scheduled_until ?? "?").slice(0, 16).replace("T", " ")}`);
    }
    return out.join("\n");
}
