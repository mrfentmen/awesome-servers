export class DirectusError extends Error {
    constructor(message) {
        super(message);
        this.name = "DirectusError";
    }
}
export function errorMessage(e) {
    return e instanceof Error ? e.message : String(e);
}
const UA = { "User-Agent": "awesome-mcps/1.0" };
function base() {
    const b = process.env.DIRECTUS_URL;
    if (!b)
        throw new DirectusError("Set DIRECTUS_URL (your Directus base URL).");
    return b.replace(/\/$/, "");
}
function headers() {
    const k = process.env.DIRECTUS_TOKEN;
    if (!k)
        throw new DirectusError("Set DIRECTUS_TOKEN (static token or OAuth token).");
    return { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` };
}
async function get(path) {
    let res;
    try {
        res = await fetch(base() + path, { signal: AbortSignal.timeout(30000), headers: headers() });
    }
    catch (e) {
        throw new DirectusError(`Network error: ${e.message}`);
    }
    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        throw new DirectusError(`HTTP ${res.status}: ${body}`);
    }
    return (await res.text()).slice(0, 12000);
}
export function listCollections() {
    return get("/collections");
}
export function listUsers(limit) {
    const n = Math.min(Number(limit ?? 20) || 20, 100);
    return get(`/users?limit=${n}`);
}
// ---- muxD tools:
/**
 * The shared get() truncates bodies to 12 KB, which is fine for a short list but
 * truncates /fields and /permissions on any real instance into unparseable JSON.
 * These tools need the whole body, so they fetch it themselves.
 */
async function getFull(path) {
    const b = process.env.DIRECTUS_URL;
    if (!b)
        throw new DirectusError("Set DIRECTUS_URL (your Directus base URL).");
    const k = process.env.DIRECTUS_TOKEN;
    if (!k)
        throw new DirectusError("Set DIRECTUS_TOKEN (static token or OAuth token).");
    let res;
    try {
        res = await fetch(b.replace(/\/$/, "") + path, {
            signal: AbortSignal.timeout(30000),
            headers: { ...UA, Accept: "application/json", Authorization: `Bearer ${k}` },
        });
    }
    catch (e) {
        throw new DirectusError(`Network error: ${e.message}`);
    }
    const text = await res.text();
    if (!res.ok) {
        throw new DirectusError(`HTTP ${res.status} for ${path}: ${text.slice(0, 300)}`);
    }
    try {
        return JSON.parse(text);
    }
    catch {
        throw new DirectusError(`Directus returned a body for ${path} that is not JSON (${text.length} bytes): ${text.slice(0, 200)}`);
    }
}
/**
 * Directus wraps collections in { data, meta } but returns a bare array for a few
 * system endpoints. Passing a collectionName also handles the keyed-map shape that
 * /fields/{collection} returns, where the map key is the FIELD name and each value
 * uses "name" rather than "field".
 */
function rowsOf(payload, collectionName) {
    if (Array.isArray(payload))
        return payload;
    const d = payload?.data;
    if (Array.isArray(d))
        return d;
    if (collectionName && d && typeof d === "object") {
        return Object.entries(d).map(([fieldName, value]) => {
            const v = (value ?? {});
            return { ...v, collection: collectionName, field: String(v.field ?? v.name ?? fieldName) };
        });
    }
    return [];
}
/** The data model: every field in the project with its type, interface, constraints and relational target. */
export async function collectionFields(args = {}) {
    const collection = String(args.collection ?? "").trim();
    const limit = Math.min(Math.max(Math.floor(args.limit ?? 60) || 60, 1), 500);
    const path = collection ? `/fields/${encodeURIComponent(collection)}` : "/fields";
    const payload = await getFull(path);
    // /fields returns an array of field rows, but /fields/{collection} returns a map
    // keyed by field name. Passing the collection name expands that map into rows.
    const rows = rowsOf(payload, collection || undefined);
    if (!rows.length) {
        return `Directus returned no fields${collection ? ` for collection "${collection}"` : " for this project"}. Check the collection name, and that your token has read access to the fields system collection.`;
    }
    const byCollection = new Map();
    for (const f of rows) {
        const c = String(f?.collection ?? "(unknown)");
        const list = byCollection.get(c) ?? [];
        list.push(f);
        byCollection.set(c, list);
    }
    // System collections are present on every instance and drown out the real model.
    const systemish = /^(directus_|_)/;
    const userCollections = [...byCollection.entries()].filter(([c]) => !systemish.test(c));
    const systemCount = byCollection.size - userCollections.length;
    const lines = [
        `Directus data model: ${rows.length} field(s) across ${byCollection.size} collection(s)` +
            (systemCount > 0 ? `, of which ${systemCount} ${systemCount === 1 ? "is" : "are"} a Directus system collection` : ""),
        collection
            ? `Scoped to collection "${collection}".`
            : `${userCollections.length} non-system collection(s) listed first, since that is the part you build against.`,
        "",
    ];
    const ordered = [...userCollections, ...[...byCollection.entries()].filter(([c]) => systemish.test(c))];
    for (const [c, fields] of ordered) {
        const isSystem = systemish.test(c);
        lines.push(`${c}${isSystem ? "  (system)" : ""} — ${fields.length} field(s)`);
        const shown = fields.slice(0, limit);
        for (const f of shown) {
            const name = String(f?.field ?? "?");
            const type = String(f?.type ?? "?");
            const iface = String(f?.meta?.interface ?? f?.schema?.interface ?? "-");
            const flags = [];
            if (f?.meta?.required === true)
                flags.push("required");
            if (f?.meta?.hidden === true)
                flags.push("hidden");
            if (f?.schema?.readonly === true)
                flags.push("readonly");
            if (f?.meta?.readonly === true)
                flags.push("ui-readonly");
            if (f?.schema?.unique === true)
                flags.push("unique");
            if (f?.meta?.options?.choices)
                flags.push("choices");
            const rel = f?.schema?.foreign_key_table
                ? ` -> ${f.schema.foreign_key_table}.${f.schema.foreign_key_column ?? "?"}`
                : f?.schema?.special?.includes("m2o") || f?.meta?.special?.includes("m2o")
                    ? " (m2o, no foreign key set)"
                    : "";
            lines.push(`  ${name.padEnd(26)} ${type.padEnd(18)} ${iface.slice(0, 22).padEnd(22)}${flags.join(", ")}${rel}`);
        }
        if (fields.length > shown.length)
            lines.push(`  ...and ${fields.length - shown.length} more field(s); raise limit or pass a collection.`);
        lines.push("");
    }
    const noPrimary = userCollections.filter(([, fields]) => !fields.some((f) => f?.meta?.primary_key === true || f?.schema?.is_primary_key === true));
    if (noPrimary.length) {
        lines.push(`${noPrimary.length} non-system collection(s) have no field marked as a primary key, which usually means they are junction or child tables: ${noPrimary.map(([c]) => c).join(", ")}.`);
    }
    return lines.join("\n").trimEnd();
}
/** Who can do what: roles, policies, the permissions attached to them, and the admin or TFA flags that matter. */
export async function accessReview(args = {}) {
    const includePermissions = args.include_permissions !== "false" && args.include_permissions !== "0";
    const [rolesRes, policiesRes, permsRes, meRes] = await Promise.all([
        getFull("/roles").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })),
        getFull("/policies").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })),
        includePermissions ? getFull("/permissions?limit=-1").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })) : Promise.resolve(null),
        getFull("/permissions/me").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })),
    ]);
    const failed = [rolesRes, policiesRes].filter((r) => r?.__error);
    if (failed.length === 2) {
        throw new DirectusError(`Could not read roles or policies: ${failed[0].__error} ${failed[1].__error}`);
    }
    const roles = rowsOf(rolesRes);
    const policies = rowsOf(policiesRes);
    const permissions = permsRes ? rowsOf(permsRes) : [];
    const me = meRes && !meRes.__error ? meRes : null;
    const lines = [
        `Directus access review: ${roles.length} role(s), ${policies.length} policy/policies, ${includePermissions ? `${permissions.length} permission rule(s)` : "permission rules not read"}`,
        `Your own token's access, from /permissions/me, is reported below. Only a collection with at least one permission appears there.`,
        "",
    ];
    if (policies.length) {
        lines.push("Policies:");
        for (const p of policies) {
            const flags = [];
            if (p?.admin_access === true)
                flags.push("ADMIN ACCESS — full permissions to everything");
            if (p?.app_access === true)
                flags.push("Data Studio access");
            if (p?.enforce_tfa === true)
                flags.push("2FA required");
            else
                flags.push("2FA not enforced");
            const ip = p?.ip_access ? `IP allowlist ${Array.isArray(p.ip_access) ? p.ip_access.join(", ") : p.ip_access}` : "no IP restriction";
            lines.push(`  ${String(p?.name ?? p?.id ?? "?").padEnd(24)} ${ip} | roles ${(p?.roles ?? []).length} | users ${(p?.users ?? []).length} | permissions ${(p?.permissions ?? []).length}`);
            lines.push(`      ${flags.join(" | ")}`);
        }
        lines.push("");
    }
    else {
        lines.push("Policies: none readable. On Directus 10 and earlier, permissions attach to roles rather than policies, so check the roles below instead.");
        lines.push("");
    }
    lines.push("Roles:");
    for (const r of roles) {
        const pols = Array.isArray(r?.policies) ? r.policies : [];
        const lines2 = [
            `  ${String(r?.name ?? r?.id ?? "?").padEnd(24)} users ${(r?.users ?? []).length} | policies ${pols.length}${r?.parent ? ` | inherits ${r.parent}` : ""}`,
        ];
        lines.push(...lines2);
        if (!pols.length && !r?.parent) {
            lines.push("      no policy and no parent role, so members of this role have no data access of their own");
        }
    }
    lines.push("");
    if (includePermissions && permissions.length) {
        const byAction = new Map();
        for (const p of permissions)
            byAction.set(String(p?.action ?? "?"), (byAction.get(String(p?.action ?? "?")) ?? 0) + 1);
        const byCollection = new Map();
        for (const p of permissions)
            byCollection.set(String(p?.collection ?? "?"), (byCollection.get(String(p?.collection ?? "?")) ?? 0) + 1);
        const unbounded = permissions.filter((p) => !Array.isArray(p?.permissions) || p.permissions.length === 0);
        const adminActions = permissions.filter((p) => String(p?.action ?? "") === "admin");
        lines.push(`Permissions: ${[...byAction.entries()].sort((a, b) => b[1] - a[1]).map(([a, n]) => `${a} ${n}`).join(", ")}`);
        lines.push(`  covering ${byCollection.size} collection(s); ${unbounded.length} rule(s) grant access with an empty permissions filter, which means every item in that collection.`);
        if (adminActions.length)
            lines.push(`  ${adminActions.length} rule(s) use the admin action, which bypasses item-level filters entirely: ${adminActions.slice(0, 6).map((a) => a.collection).join(", ")}`);
        const top = [...byCollection.entries()].sort((a, b) => b[1] - a[1]).slice(0, 12);
        lines.push(`  most-governed collections: ${top.map(([c, n]) => `${c} (${n})`).join(", ")}`);
    }
    lines.push("");
    if (me) {
        const access = me.data ?? me;
        const collections = Object.entries(access);
        if (collections.length) {
            const counts = { full: 0, partial: 0, none: 0 };
            for (const [, actions] of collections) {
                for (const level of Object.values(actions)) {
                    if (level in counts)
                        counts[level] += 1;
                }
            }
            lines.push(`This token's own access across ${collections.length} collection(s): ${counts.full} full, ${counts.partial} partial, ${counts.none} none.`);
            const writeable = collections.filter(([, actions]) => actions.create || actions.update || actions.delete);
            lines.push(`  It can write on ${writeable.length} collection(s): ${writeable.slice(0, 10).map(([c]) => c).join(", ")}`);
        }
        else {
            lines.push("This token reports no per-collection access at all, which means it can read nothing outside the system collections. That is the expected result for a token scoped to a single read-only role.");
        }
    }
    else {
        lines.push(`/permissions/me was not readable (${meRes?.__error ?? "unknown"}), so this token's own access is not reported.`);
    }
    lines.push("", "Things to look for: a policy with admin_access, a policy where enforce_tfa is false, a role with no policy and no parent, and permission rules with an empty permissions filter, which grant every item rather than a filtered subset.");
    return lines.join("\n");
}
/** The instance's own version and health, which decides which features are available and what is failing. */
export async function instanceHealth(args = {}) {
    const wantDeps = args.check_dependencies !== "false" && args.check_dependencies !== "0";
    // Check the environment up front: otherwise a missing token surfaces as two
    // identical endpoint errors rather than one clear instruction.
    if (!process.env.DIRECTUS_URL)
        throw new DirectusError("Set DIRECTUS_URL (your Directus base URL).");
    if (!process.env.DIRECTUS_TOKEN)
        throw new DirectusError("Set DIRECTUS_TOKEN (static token or OAuth token).");
    const [healthRes, infoRes] = await Promise.all([
        getFull("/server/health").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })),
        getFull("/server/info").catch((e) => ({ __error: e instanceof Error ? e.message : String(e) })),
    ]);
    const health = healthRes;
    const info = infoRes?.data ?? infoRes;
    const lines = ["Directus instance health:"];
    if (health?.__error) {
        lines.push(`  /server/health: ${health.__error}`);
    }
    else {
        const services = health && typeof health === "object" ? health : {};
        const entries = Object.entries(services);
        if (!entries.length) {
            lines.push("  /server/health returned an empty object, which Directus does when the request is unauthenticated and only a top-level status is withheld.");
        }
        else {
            for (const [name, value] of entries) {
                const top = String(value);
                lines.push(`  ${top}  ${name}`);
            }
        }
    }
    lines.push("");
    if (info?.__error) {
        lines.push(`  /server/info: ${info.__error}`);
        lines.push("");
        lines.push("Directus only returns the details of /server/info, including the version, to an admin token. A non-admin token gets a bare 200, so the version below may be unavailable.");
        return lines.join("\n");
    }
    const version = info?.version;
    lines.push(version ? `  version ${version}${info?.release ? ` (release ${info.release})` : ""}` : "  version not reported, which is what a non-admin token gets");
    if (info?.project?.id)
        lines.push(`  project id ${info.project.id}${info.project?.name ? ` (${info.project.name})` : ""}`);
    if (info?.database?.type)
        lines.push(`  database ${info.database.type}${info.database?.version ? ` ${info.database.version}` : ""}`);
    if (info?.database?.host)
        lines.push(`  database host ${info.database.host}${info.database?.port ? `:${info.database.port}` : ""}`);
    if (info?.database?.database)
        lines.push(`  database name ${info.database.database}`);
    if (Array.isArray(info?.storage?.storages) && info.storage.storages.length) {
        lines.push(`  storage adapters: ${info.storage.storages.map((s) => `${s.driver}${s.secure ? " (secure)" : ""}`).join(", ")}`);
    }
    if (Array.isArray(info?.extensions) && info.extensions.length) {
        lines.push(`  extensions installed: ${info.extensions.length} (${info.extensions.slice(0, 8).map((e) => e.name ?? e).join(", ")}${info.extensions.length > 8 ? ", ..." : ""})`);
    }
    if (info?.websocket)
        lines.push("  websockets: enabled");
    if (wantDeps && health && typeof health === "object" && !health.__error) {
        const dep = Object.keys(health).filter((k) => /^(db|cache|storage|email|ip|redis|pg|mysql)/i.test(k));
        if (dep.length) {
            lines.push("");
            lines.push(`Dependency status reported by this token: ${dep.map((k) => `${k} ${String(health[k])}`).join(", ")}`);
            lines.push("Only an admin token sees per-dependency detail such as response times; anything reported here as ok is all a lesser token learns.");
        }
    }
    lines.push("", "The version matters because Directus gates features on it, and because Directus 10 replaced per-role permissions with policies, so an older instance answers /policies with a 404.");
    return lines.join("\n");
}
