import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { coneSearch, formatObs, MastError } from "./api.js";
const text = (t) => ({ content: [{ type: "text", text: t }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
export function createServer() {
    const server = new McpServer({
        name: "mast-mcp",
        version: "1.0.0",
    });
    server.registerTool("cone_search", {
        title: "Cone search",
        description: "Space telescope observations (Hubble, Webb, TESS...) near an RA/Dec position.",
        inputSchema: z.object({
            ra: z.number().min(0).max(360).describe("Right ascension in degrees, e.g. 83 for Orion"),
            dec: z.number().min(-90).max(90).describe("Declination in degrees, e.g. -5"),
            radius: z.number().min(0.01).max(5).default(0.1).describe("Radius in degrees"),
            limit: z.number().int().min(1).max(50).default(5),
        }),
        annotations: READ_ONLY,
    }, async ({ ra, dec, radius, limit }) => {
        try {
            const rows = await coneSearch(ra, dec, radius, limit);
            if (rows.length === 0)
                return text("No observations near this position.");
            return text(rows.map((o, i) => formatObs(o, i)).join("\n"));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("resolve_name", {
        title: "Resolve name",
        description: "Resolve a target name such as M51 or Betelgeuse to coordinates and object type through MAST's name resolver, which is how you turn a name into a position for a cone search.",
        inputSchema: z.object({ name: z.string().describe("Target name, e.g. M51."), limit: z.number().describe("Max candidates.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement name locally (paywall removed)
        try {
            return textError("Not yet implemented: name");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "mast-mcp";
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
    server.registerTool("help", {
        title: "Help",
        description: "Get help and usage information.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("This MCP server provides several tools. See tools/list for details.");
    });
    server.registerTool("status", {
        title: "Status",
        description: "Get server status.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async () => {
        return text("Server is running normally.");
    });
    return server;
}
function errorMessage(e) {
    if (e instanceof MastError)
        return `Error: ${e.message}`;
    if (e instanceof Error)
        return `Error: ${e.message}`;
    return `Error: ${String(e)}`;
}
