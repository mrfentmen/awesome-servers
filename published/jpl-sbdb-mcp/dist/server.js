import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { browse, object } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "jpl-sbdb-mcp", version: "1.0.0" });
    server.registerTool("object", {
        title: "Object",
        description: "Small body by designation or name.",
        inputSchema: z.object({ name: z.string().describe("Designation like 1P or 433.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await object(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("browse", {
        title: "Browse",
        description: "Browse small bodies.",
        inputSchema: z.object({ limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await browse(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("object_physical", {
        title: "Object physical",
        description: "Physical parameters of a small body from JPL: diameter, absolute magnitude, albedo, rotation period, spectral type, GM and notes.",
        inputSchema: z.object({ name: z.string().describe("Designation or name, e.g. '433' or '1P'."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement physical locally (paywall removed)
        try {
            return textError("Not yet implemented: physical");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("close_approaches", {
        title: "Close approaches",
        description: "Asteroid and comet close approaches to Earth in a date window, with distance, relative velocity and v-infinity, from the JPL close approach database.",
        inputSchema: z.object({
            date_min: z.string().describe("Start date as YYYY-MM-DD."),
            date_max: z.string().describe("End date as YYYY-MM-DD."),
            dist_max: z.number().describe("Largest approach distance in au, 0-1, default 0.05.").optional(),
            limit: z.number().describe("Max rows, 1-100, default 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement approaches locally (paywall removed)
        try {
            return textError("Not yet implemented: approaches");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("query_group", {
        title: "Query group",
        description: "Query the JPL small body database by orbit group: neo (near-Earth), pha (potentially hazardous) or a class such as amo, apo, ate.",
        inputSchema: z.object({ group: z.string().describe("neo, pha, amo, apo or ate. Defaults to neo.").optional(), limit: z.number().describe("Max rows, 1-50, default 10.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement group locally (paywall removed)
        try {
            return textError("Not yet implemented: group");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "jpl-sbdb-mcp";
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
    return server;
}
