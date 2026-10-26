import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { formatEvent, recommendEvents, searchEvents, SeatGeekError, artistBriefing, artistCatalogue } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "seatgeek-mcp",
        version: "1.0.0",
    });
    server.registerTool("search_events", {
        title: "Search events",
        description: "Concerts, sports and theater with venues, dates, ticket prices.",
        inputSchema: z.object({
            query: z.string().describe("Search text, e.g. 'Taylor Swift', 'Yankees'"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ query, limit }) => {
        try {
            const rows = await searchEvents(query, limit);
            if (rows.length === 0)
                return text(`No events for "${query}".`);
            return text(rows.map((e, i) => formatEvent(e, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("recommend_events", {
        title: "Events near me",
        description: "Recommended events near coordinates.",
        inputSchema: z.object({
            lat: z.number().min(-90).max(90).describe("Latitude, e.g. 40.75"),
            lon: z.number().min(-180).max(180).describe("Longitude, e.g. -73.98"),
            limit: z.number().int().min(1).max(100).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ lat, lon, limit }) => {
        try {
            const rows = await recommendEvents(lat, lon, limit);
            if (rows.length === 0)
                return text("No events nearby.");
            return text(rows.map((e, i) => formatEvent(e, i)).join("\n\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_briefing", {
        title: "Artist briefing",
        description: "Who an act actually is, as the music database records it: canonical name, the aliases a promoter has to search under, type, country of origin, active span, members, previous names and database links.",
        inputSchema: z.object({
            artist: z.string().describe("Artist name or a MusicBrainz id"),
            limit: z.number().describe("Max members listed, 1-30. Defaults to 12.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await artistBriefing(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_catalogue", {
        title: "Artist catalogue",
        description: "A performer's recorded catalogue as the database counts it: release-group totals, the split by primary type, a chart by decade of first release, and the most recent releases.",
        inputSchema: z.object({
            artist: z.string().describe("Artist name or a MusicBrainz id"),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await artistCatalogue(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "seatgeek-mcp";
    server.registerTool("health_check", {
        title: "Health check",
        description: "Check if the server is running and responsive.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("OK - server is running");
    });
    server.registerTool("version_info", {
        title: "Version info",
        description: "Get server version and metadata.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(JSON.stringify({ name: serverName, version: "1.0.0" }, null, 2));
    });
    server.registerTool("list_tools", {
        title: "List tools",
        description: "List all available tools on this server.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("See the tools/list response for the full tool list.");
    });
    server.registerTool("echo", {
        title: "Echo",
        description: "Echo back the provided text.",
        inputSchema: z.object({ text: z.string().describe("Text to echo.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        return text(String(args?.text ?? ""));
    });
    server.registerTool("timestamp", {
        title: "Timestamp",
        description: "Get the current UTC timestamp.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text(new Date().toISOString());
    });
    server.registerTool("ping", {
        title: "Ping",
        description: "Ping the server to check connectivity.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("pong");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof SeatGeekError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
