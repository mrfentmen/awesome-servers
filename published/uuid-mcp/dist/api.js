export class UuidError extends Error {
}
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
export async function validateUuid(args) {
    const u = (args.uuid ?? "").trim();
    if (!u)
        throw new UuidError("Provide a UUID string");
    return UUID_RE.test(u) ? `${u} is a valid UUID` : `${u} is not a valid UUID`;
}
// ---- muxC tools:
// ---- gap4b3 tools:
async function remoteUuid(path) {
    const response = await fetch(`https://www.uuidtools.com/api/generate/${path}`, {
        headers: { "User-Agent": "mrfentmen-uuid-mcp/1.0", Accept: "application/json" },
        signal: AbortSignal.timeout(20000),
    });
    if (!response.ok)
        throw new UuidError(`UUIDTools returned ${response.status}`);
    const values = await response.json();
    if (!Array.isArray(values) || typeof values[0] !== "string" || !UUID_RE.test(values[0]))
        throw new UuidError("UUIDTools did not return a valid UUID");
    return values[0];
}
export async function timeUuid(_args) {
    const uuid = await remoteUuid("v1");
    return `Time-based UUID (version 1) from UUIDTools: ${uuid}\nThe timestamp and node identifier belong to the remote generator.`;
}
