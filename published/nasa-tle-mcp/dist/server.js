import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { satellite, search, browseCatalog } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "nasa-tle-mcp", version: "1.0.0" });
    server.registerTool("satellite", {
        title: "Satellite",
        description: "Get TLE for a satellite by id.",
        inputSchema: z.object({ satid: z.number().describe("NORAD catalog id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await satellite(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("search", {
        title: "Search",
        description: "Search satellites by name.",
        inputSchema: z.object({ query: z.string().describe("Name search query.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await search(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("browse_catalog", {
        title: "Browse catalog",
        description: "Page through the whole TLE catalog, with sorting and a total object count.",
        inputSchema: z.object({
            page: z.number().int().min(1).optional().describe("1-based page number. Default 1."),
            pageSize: z.number().int().min(1).max(50).optional().describe("Objects per page, 1-50. Default 20."),
            sort: z.enum(["popularity", "name"]).optional().describe("Sort key. Default popularity."),
            direction: z.enum(["asc", "desc"]).optional().describe("Sort direction. Default desc."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await browseCatalog(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("orbital_elements", {
        title: "Orbital elements",
        description: "Decode a satellite's two-line element set into inclination, RAAN, eccentricity, period and the rest.",
        inputSchema: z.object({ satid: z.number().describe("NORAD catalog id.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement elements locally (paywall removed)
        try {
            return textError("Not yet implemented: elements");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("fleet_tles", {
        title: "Fleet TLEs",
        description: "Full two-line element sets for the top name matches, for example every Starlink batch.",
        inputSchema: z.object({
            query: z.string().describe("Satellite name or batch fragment."),
            limit: z.number().int().min(1).max(50).optional().describe("How many element sets to return, 1-50. Default 5."),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement tles locally (paywall removed)
        try {
            return textError("Not yet implemented: tles");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nasa-tle-mcp";
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
