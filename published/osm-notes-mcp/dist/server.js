import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { noteDetail, noteDetailText, noteLine, notesInBbox, OsmNotesError, radiusBbox, searchNotes, } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
function errorMessage(e) {
    if (e instanceof OsmNotesError || e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
function list(notes) {
    if (!notes.length)
        return "No notes in that area.";
    return notes.map(noteLine).join("\n");
}
export function createServer() {
    const server = new McpServer({ name: "osm-notes-mcp", version: "1.0.0" });
    server.tool("notes_in_bbox", "OpenStreetMap notes inside a bounding box (west, south, east, north).", {
        min_lon: z.number().describe("West longitude"),
        min_lat: z.number().describe("South latitude"),
        max_lon: z.number().describe("East longitude"),
        max_lat: z.number().describe("North latitude"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max notes"),
    }, async ({ min_lon, min_lat, max_lon, max_lat, limit }) => {
        try {
            return text(list(await notesInBbox(min_lon, min_lat, max_lon, max_lat, limit)));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("notes_near", "OpenStreetMap notes within a radius of a point.", {
        lat: z.number().describe("Latitude"),
        lon: z.number().describe("Longitude"),
        radius_km: z.number().min(0.1).max(50).default(2).describe("Radius in km"),
        limit: z.number().int().min(1).max(100).default(20).describe("Max notes"),
    }, async ({ lat, lon, radius_km, limit }) => {
        try {
            const [w, s, e, n] = radiusBbox(lat, lon, radius_km);
            return text(list(await notesInBbox(w, s, e, n, limit)));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("search_notes", "Search OpenStreetMap notes by their text.", {
        query: z.string().min(1).describe("Words to look for, e.g. pothole"),
        limit: z.number().int().min(1).max(50).default(15).describe("Max notes"),
    }, async ({ query, limit }) => {
        try {
            return text(list(await searchNotes(query, limit)));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("note_detail", "Full thread for one OpenStreetMap note.", { id: z.number().int().positive().describe("Note id") }, async ({ id }) => {
        try {
            return text(noteDetailText(await noteDetail(id)));
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("note_comments", "Just the comments of one note, oldest first.", { id: z.number().int().positive().describe("Note id") }, async ({ id }) => {
        try {
            const n = await noteDetail(id);
            const rows = (n.comments ?? []).map((c, i) => `${i + 1}. ${c.date ?? ""} ${c.user ?? "anon"}: ${c.text ?? ""}`);
            return text(rows.length ? rows.join("\n") : "No comments.");
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    server.tool("notes_stats", "Count open versus resolved notes in a bounding box.", {
        min_lon: z.number().describe("West longitude"),
        min_lat: z.number().describe("South latitude"),
        max_lon: z.number().describe("East longitude"),
        max_lat: z.number().describe("North latitude"),
    }, async ({ min_lon, min_lat, max_lon, max_lat }) => {
        try {
            const notes = await notesInBbox(min_lon, min_lat, max_lon, max_lat, 100);
            const open = notes.filter((n) => n.status === "open").length;
            const closed = notes.filter((n) => n.status === "closed").length;
            const comments = notes.reduce((a, n) => a + (n.comments?.length ?? 0), 0);
            return text(`notes sampled: ${notes.length}\nopen: ${open}\nclosed: ${closed}\ncomments: ${comments}`);
        }
        catch (e) {
            return text(errorMessage(e));
        }
    });
    return server;
}
