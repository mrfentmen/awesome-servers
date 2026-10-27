/**
 * OpenStreetMap notes client. Keyless and read-only. Notes are public reports
 * left by mappers and passers-by: "this road is closed", "wrong name here".
 */
const BASE = "https://api.openstreetmap.org/api/0.6";
export class OsmNotesError extends Error {
}
function toNote(f) {
    const [lon, lat] = f.geometry?.coordinates ?? [0, 0];
    return {
        id: Number(f.properties?.id ?? 0),
        lat,
        lon,
        status: f.properties?.status,
        date_created: f.properties?.date_created,
        comments: f.properties?.comments ?? [],
    };
}
async function get(url) {
    const res = await fetch(url, {
        headers: { "User-Agent": "osm-notes-mcp/1.0 (awesome-servers)" },
        signal: AbortSignal.timeout(25000),
    });
    if (res.status === 404)
        throw new OsmNotesError("note not found");
    if (!res.ok)
        throw new OsmNotesError(`OSM error ${res.status}`);
    return res.json();
}
export async function notesInBbox(minLon, minLat, maxLon, maxLat, limit) {
    const bbox = [minLon, minLat, maxLon, maxLat].join(",");
    const body = (await get(`${BASE}/notes.json?bbox=${bbox}&limit=${limit}`));
    return (body.features ?? []).map(toNote);
}
export async function searchNotes(query, limit) {
    const body = (await get(`${BASE}/notes/search.json?q=${encodeURIComponent(query)}&limit=${limit}`));
    return (body.features ?? []).map(toNote);
}
export async function noteDetail(id) {
    return toNote((await get(`${BASE}/notes/${id}.json`)));
}
export function radiusBbox(lat, lon, km) {
    const dLat = km / 111.32;
    const dLon = km / (111.32 * Math.max(Math.cos((lat * Math.PI) / 180), 0.01));
    return [lon - dLon, lat - dLat, lon + dLon, lat + dLat];
}
export function noteLine(n) {
    const first = n.comments?.[0]?.text?.replace(/\s+/g, " ").slice(0, 160) ?? "(no comment)";
    return `#${n.id} [${n.status ?? "?"}] ${n.lat.toFixed(5)},${n.lon.toFixed(5)} ${first}`;
}
export function noteDetailText(n) {
    const head = `Note #${n.id} — ${n.status ?? "unknown"} — ${n.date_created ?? ""}\n${n.lat}, ${n.lon}\nhttps://www.openstreetmap.org/note/${n.id}`;
    const comments = (n.comments ?? [])
        .map((c, i) => `${i + 1}. ${c.date ?? ""} ${c.user ?? "anon"} (${c.action ?? "comment"}): ${c.text ?? ""}`)
        .join("\n");
    return `${head}\n\n${comments || "No comments."}`;
}
