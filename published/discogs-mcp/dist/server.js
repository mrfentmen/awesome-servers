import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { release, search, masterRelease } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "discogs-mcp", version: "1.0.0" });
    server.registerTool("search", {
        title: "Search",
        description: "Search releases.",
        inputSchema: z.object({ query: z.string().describe("Search terms."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("release", {
        title: "Release",
        description: "Get a release by id.",
        inputSchema: z.object({ id: z.number().describe("Release id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await release(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("artist_profile", {
        title: "Artist profile",
        description: "A Discogs artist in full: real name, written profile, name variations, aliases, group and member credits, links, and their credited catalogue tallied by year, entry type, credit role and format. The release tool reads a release, so an artist's own record and their catalogue are both invisible to it.",
        inputSchema: z.object({ artist_id: z.number().describe("Discogs artist id, like 1.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("master_release", {
        title: "Master release",
        description: "A Discogs master release: the recording with its main release, its tracklist, how many pressings exist and every pressing with its country, date, format, label and catalogue number, tallied by country, label and format. A master cannot be reached from a release id, so no existing tool on this server can return it.",
        inputSchema: z.object({ master_id: z.number().describe("Discogs master release id, like 1660109."), limit: z.number().describe("How many pressings to read, 1 to 100.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await masterRelease(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "discogs-mcp";
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
