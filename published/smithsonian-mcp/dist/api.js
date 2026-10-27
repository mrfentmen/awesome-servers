/**
 * Smithsonian Open Access API client. Needs SMITHSONIAN_API_KEY
 * (free at https://api.data.gov/signup/).
 * Docs: https://api.data.gov/docs/ed-oauth/
 */
const BASE = "https://api.si.edu/openaccess/api/v1.0";
export class SmithsonianError extends Error {
}
function apiKey() {
    const k = process.env.SMITHSONIAN_API_KEY;
    if (!k)
        throw new SmithsonianError("Set SMITHSONIAN_API_KEY first (free at api.data.gov/signup).");
    return k;
}
async function getJson(path) {
    const sep = path.includes("?") ? "&" : "?";
    const res = await fetch(`${BASE}${path}${sep}api_key=${encodeURIComponent(apiKey())}`, {
        headers: { "User-Agent": "smithsonian-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 401 || res.status === 403)
        throw new SmithsonianError("Smithsonian refused (401/403). Check API key.");
    if (res.status === 404)
        throw new SmithsonianError("Not found.");
    if (!res.ok)
        throw new SmithsonianError(`Smithsonian error ${res.status}`);
    return (await res.json());
}
export async function searchObjects(query, limit = 5) {
    if (!query.trim())
        throw new SmithsonianError("Query is empty.");
    const qs = new URLSearchParams({ q: query.trim(), rows: String(Math.min(Math.max(limit, 1), 100)) }).toString();
    const data = await getJson(`/search?${qs}`);
    const resp = data.response ?? {};
    const rows = Array.isArray(resp.rows) ? resp.rows : [];
    return rows.slice(0, limit).map((r) => {
        const content = r.content ?? {};
        const descr = content.descriptiveNonRepeating ?? {};
        const freetext = content.freetext ?? {};
        const media = Array.isArray(content.media) ? content.media : [];
        return {
            id: r.id,
            title: descr.title?.content ?? freetext.title?.content?.[0]?.content,
            type: descr.data_classification?.[0]?.content ?? descr.object_type?.[0]?.content,
            date: freetext.date?.content,
            image: media[0]?.thumbnail ?? media[0]?.content,
        };
    });
}
export function formatObject(o, index) {
    const prefix = index !== undefined ? `${index + 1}. ` : "";
    return `${prefix}[${o.id ?? "?"}] ${o.title ?? "(untitled)"}${o.type ? ` (${o.type})` : ""}${o.date ? ` — ${o.date}` : ""}${o.image ? `\n   ${o.image}` : ""}`;
}
// ---- muxB tools:
// The Smithsonian Open Access metadata archive is published as a public,
// keyless S3 bucket, which is the only route to the same records that does not
// need an api.si.edu key. See https://www.si.edu/openaccess and the
// Smithsonian/OpenAccess README.
const OA_BUCKET = "https://smithsonian-open-access.s3-us-west-2.amazonaws.com";
const OA_PREFIX = "metadata/edan/";
const OA_UA = "smithsonian-mcp/1.0";
// The public S3 bucket occasionally resets a connection mid-download, so a
// transient failure is retried a couple of times before it becomes an error.
async function oaFetch(url, accept, timeoutMs) {
    let lastError;
    for (let attempt = 0; attempt < 3; attempt += 1) {
        if (attempt > 0)
            await new Promise((resolve) => setTimeout(resolve, 400 * attempt));
        try {
            const res = await fetch(url, {
                headers: { "User-Agent": OA_UA, Accept: accept },
                signal: AbortSignal.timeout(timeoutMs),
            });
            if (res.status === 429 || res.status >= 500) {
                lastError = new Error(`Smithsonian Open Access S3 returned ${res.status}`);
                continue;
            }
            return res;
        }
        catch (e) {
            lastError = e;
        }
    }
    throw new SmithsonianError(`Smithsonian Open Access S3 request failed after 3 attempts: ${lastError instanceof Error ? lastError.message : String(lastError)}`);
}
async function oaList(prefix, delimiter) {
    const url = new URL(`${OA_BUCKET}/`);
    url.searchParams.set("list-type", "2");
    url.searchParams.set("prefix", prefix);
    url.searchParams.set("max-keys", "1000");
    if (delimiter)
        url.searchParams.set("delimiter", delimiter);
    const res = await oaFetch(url.toString(), "application/xml", 30000);
    if (!res.ok)
        throw new SmithsonianError(`Smithsonian Open Access S3 returned ${res.status}`);
    const xml = await res.text();
    const prefixes = [...xml.matchAll(/<Prefix>([^<]+)<\/Prefix>/g)].map((m) => m[1]);
    const keys = [...xml.matchAll(/<Key>([^<]+)<\/Key>/g)].map((m) => m[1]);
    const sizes = [...xml.matchAll(/<Size>(\d+)<\/Size>/g)].map((m) => Number(m[1]));
    const modified = [...xml.matchAll(/<LastModified>([^<]+)<\/LastModified>/g)].map((m) => m[1]);
    const shards = [];
    for (let i = 0; i < keys.length; i += 1) {
        const key = keys[i];
        if (!key.endsWith(".txt") || key.endsWith("index.txt"))
            continue;
        shards.push({ key, size: sizes[i] ?? 0, modified: modified[i] ?? "" });
    }
    return { prefixes, shards };
}
const mb = (bytes) => `${(bytes / 1e6).toFixed(1)} MB`;
export async function openAccessCorpus(args) {
    const unit = (args.unit ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!unit) {
        const { prefixes } = await oaList(OA_PREFIX, "/");
        const units = prefixes.map((p) => p.replace(OA_PREFIX, "").replace(/\/$/, "")).filter((p) => p && p !== "edan");
        units.sort();
        if (!units.length)
            return "The Open Access bucket listed no unit folders under metadata/edan/.";
        return [
            `Smithsonian Open Access metadata archive (public S3 bucket, no API key needed): ${units.length} unit folder(s) under ${OA_PREFIX}.`,
            units.map((u) => u.toUpperCase()).join(", "),
            "Pass one of these as the unit to see its shard inventory.",
        ].join("\n");
    }
    const { shards } = await oaList(`${OA_PREFIX}${unit}/`);
    if (!shards.length)
        return `No metadata shards found for unit "${unit}". Call openaccess_corpus with no unit for the list.`;
    const sizes = shards.map((s) => s.size).sort((a, b) => a - b);
    const total = sizes.reduce((a, b) => a + b, 0);
    const oldest = shards.map((s) => s.modified).filter(Boolean).sort()[0] ?? "not reported";
    const newest = shards.map((s) => s.modified).filter(Boolean).sort().pop() ?? "not reported";
    const largest = [...shards].sort((a, b) => b.size - a.size).slice(0, 3);
    const smallest = [...shards].sort((a, b) => a.size - b.size).slice(0, 3);
    return [
        `Smithsonian Open Access metadata for unit ${unit.toUpperCase()}:`,
        `Shards: ${shards.length}, total ${mb(total)} of line-delimited JSON (${total.toLocaleString("en-US")} bytes)`,
        `Shard size: smallest ${mb(sizes[0])}, median ${mb(sizes[Math.floor(sizes.length / 2)])}, largest ${mb(sizes[sizes.length - 1])}`,
        `Last updated between ${oldest} and ${newest}`,
        `Largest shards: ${largest.map((s) => `${s.key.split("/").pop()} (${mb(s.size)})`).join(", ")}`,
        `Smallest shards: ${smallest.map((s) => `${s.key.split("/").pop()} (${mb(s.size)})`).join(", ")}`,
    ].join("\n");
}
const labels = (r, field) => (r.content?.freetext?.[field] ?? []).map((e) => String(e?.content ?? "")).filter(Boolean);
const one = (r, field) => {
    const values = labels(r, field);
    return values.length ? values[0] : null;
};
const strings = (value) => {
    if (Array.isArray(value))
        return value.filter((v) => typeof v === "string");
    return typeof value === "string" ? [value] : [];
};
export async function openAccessDigest(args) {
    const unit = (args.unit ?? "").trim().toLowerCase().replace(/[^a-z0-9_-]/g, "");
    if (!unit)
        return "Provide a unit, e.g. saam. Call openaccess_corpus with no unit for the list.";
    const maxShards = Math.max(1, Math.min(Number(args.maxShards ?? 3) || 3, 25));
    const maxBytes = Math.max(100000, Math.min(Number(args.maxBytes ?? 8000000) || 8000000, 40000000));
    const { shards } = await oaList(`${OA_PREFIX}${unit}/`);
    if (!shards.length)
        return `No metadata shards found for unit "${unit}".`;
    // Shards are partitioned by a content hash, so they differ in size by orders of
    // magnitude. Take the smallest ones so the digest stays inside the byte budget.
    const ascending = [...shards].sort((a, b) => a.size - b.size);
    const chosen = [];
    let budget = 0;
    for (const shard of ascending) {
        if (chosen.length >= maxShards)
            break;
        if (budget + shard.size > maxBytes)
            break;
        chosen.push(shard);
        budget += shard.size;
    }
    if (!chosen.length) {
        return `The smallest shard for ${unit} is ${mb(ascending[0].size)}, over the ${mb(maxBytes)} budget. Raise maxBytes.`;
    }
    const types = new Map();
    const topics = new Map();
    const rights = new Map();
    const years = [];
    const samples = [];
    let records = 0;
    let parsed = 0;
    for (const shard of chosen) {
        const res = await oaFetch(`${OA_BUCKET}/${shard.key}`, "text/plain", 45000);
        if (!res.ok)
            throw new SmithsonianError(`Smithsonian Open Access S3 returned ${res.status} for ${shard.key}`);
        const body = await res.text();
        for (const line of body.split("\n")) {
            if (!line.trim())
                continue;
            records += 1;
            let record;
            try {
                record = JSON.parse(line);
            }
            catch {
                continue;
            }
            parsed += 1;
            const structured = record.content?.indexedStructured ?? {};
            const objectType = strings(structured["object_type"])[0] ?? one(record, "objectType") ?? "not reported";
            types.set(objectType, (types.get(objectType) ?? 0) + 1);
            const rights0 = one(record, "objectRights") ?? "not reported";
            rights.set(rights0, (rights.get(rights0) ?? 0) + 1);
            for (const topic of [...strings(structured["topic"]), ...labels(record, "topic")].slice(0, 4)) {
                topics.set(topic, (topics.get(topic) ?? 0) + 1);
            }
            for (const year of strings(structured["date"])) {
                const y = year.match(/\d{4}/);
                if (y)
                    years.push(Number(y[0]));
            }
            if (samples.length < 8) {
                const dnr = record.content?.descriptiveNonRepeating ?? {};
                const dnrTitle = typeof dnr["title"] === "object" && dnr["title"] !== null
                    ? String(dnr["title"]["content"] ?? "")
                    : typeof dnr["title"] === "string" ? dnr["title"] : "";
                const number = one(record, "identifier") ?? (typeof dnr["record_ID"] === "string" ? dnr["record_ID"] : null);
                const date = one(record, "date") ?? strings(structured["date"])[0] ?? null;
                samples.push(`${(dnrTitle || one(record, "title") || "untitled").slice(0, 90)}${number ? ` [${number}]` : ""} | ${objectType}${date ? ` | ${date}` : ""}`);
            }
        }
    }
    const top = (m, n) => [...m.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0])).slice(0, n).map(([k, v]) => `${k} (${v})`).join(", ") || "none reported";
    return [
        `Smithsonian Open Access digest for ${unit.toUpperCase()}, from ${chosen.length} of ${shards.length} shard(s) (${mb(budget)} of line-delimited JSON).`,
        `Shards read: ${chosen.map((s) => s.key.split("/").pop()).join(", ")}`,
        `${records} line(s) read, ${parsed} parsed as records. This is a sample of one hash partition of the unit, not the whole collection.`,
        `Object types: ${top(types, 8)}`,
        `Topics: ${top(topics, 10)}`,
        `Access rights: ${top(rights, 5)}`,
        `Dated records span ${years.length ? `${Math.min(...years)}-${Math.max(...years)}` : "dates not reported"} (${years.length} with a four-digit year or range start)`,
        "",
        "Sample records:",
        ...samples.map((s, i) => `${i + 1}. ${s}`),
    ].join("\n");
}
