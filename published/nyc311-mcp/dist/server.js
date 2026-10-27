import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { countRequests, format, searchRequests, boroughBreakdown } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
const date = z.string().regex(/^\\d{4}-\\d{2}-\\d{2}/).optional();
export function createServer() {
    const server = new McpServer({ name: "nyc311-mcp", version: "1.0.0" });
    const filters = {
        complaintType: z.string().max(120).optional(),
        borough: z.enum(["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN ISLAND"]).optional(),
        agency: z.string().max(20).optional(),
        start: date,
        end: date,
    };
    server.registerTool("search_requests", {
        title: "Search requests",
        description: "Search recent public NYC 311 requests using non-location-identifying fields. Addresses and coordinates are intentionally excluded.",
        inputSchema: z.object({
            ...filters,
            limit: z.number().int().min(1).max(50).default(20),
        }),
        annotations: READ_ONLY,
    }, async ({ complaintType, borough, agency, start, end, limit }) => {
        try {
            return text(format(await searchRequests(complaintType, borough, agency, start, end, limit)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("count_requests", {
        title: "Count requests",
        description: "Count NYC 311 requests grouped by complaint type with optional date, borough, and agency filters.",
        inputSchema: z.object({
            ...filters,
            limit: z.number().int().min(1).max(100).default(50),
        }),
        annotations: READ_ONLY,
    }, async ({ complaintType, borough, agency, start, end, limit }) => {
        try {
            return text(format(await countRequests(complaintType, borough, agency, start, end, limit)));
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("agency_breakdown", {
        title: "Agency breakdown",
        description: "Count NYC 311 requests grouped by the agency that received them, with an optional date range.",
        inputSchema: z.object({ start: date, end: date, limit: z.number().int().min(1).max(100).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement breakdown locally (paywall removed)
        try {
            return textError("Not yet implemented: breakdown");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("borough_breakdown", {
        title: "Borough breakdown",
        description: "Count NYC 311 requests grouped by borough, with an optional date range.",
        inputSchema: z.object({ start: date, end: date }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await boroughBreakdown(args));
        }
        catch (e) {
            return errorText(e);
        }
    });
    server.registerTool("open_by_type", {
        title: "Open by type",
        description: "Which NYC 311 complaint types have the most requests that were never closed.",
        inputSchema: z.object({ limit: z.number().int().min(1).max(100).default(15) }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement type locally (paywall removed)
        try {
            return textError("Not yet implemented: type");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "nyc311-mcp";
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
