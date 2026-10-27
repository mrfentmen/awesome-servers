import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { format, summarize } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const errorText = (error) => text(`Error: ${error instanceof Error ? error.message : String(error)}`);
export function createServer() {
    const server = new McpServer({ name: "police-transparency-mcp", version: "1.0.0" });
    server.registerTool("summarize_complaints", {
        title: "Summarize complaints",
        description: "Return aggregate historical NYPD complaint counts grouped by borough, broad law category, or offense description. No names, addresses, coordinates, demographics, incident rows, live dispatch, or person lookup are exposed.",
        inputSchema: z.object({
            group: z.enum(["borough", "law_category", "offense"]),
            year: z.number().int().min(2006).max(2030).optional().describe("Historical complaint year; this is not real-time data."),
            borough: z.enum(["MANHATTAN", "BRONX", "BROOKLYN", "QUEENS", "STATEN ISLAND"]).optional(),
            limit: z.number().int().min(1).max(100).default(25),
        }),
        annotations: READ_ONLY,
    }, async ({ group, year, borough, limit }) => {
        try {
            return text(`DISCLAIMER: This is aggregated historical public data for research, not a live safety feed or individual lookup.\n\n${format(await summarize(group, year, borough, limit))}`);
        }
        catch (error) {
            return errorText(error);
        }
    });
    server.registerTool("use_of_force_summary", {
        title: "Use of force summary",
        description: "Aggregate NYPD use-of-force incident counts by force type, optionally for one borough, from the NYPD Use of Force Incidents dataset. Aggregate counts only; no names, addresses, coordinates or incident rows.",
        inputSchema: z.object({
            borough: z.enum(["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"]).optional(),
            limit: z.number().int().min(1).max(25).default(10),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement summary locally (paywall removed)
        try {
            return textError("Not yet implemented: summary");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("arrests_by_charge", {
        title: "Arrests by charge",
        description: "Aggregate NYPD arrest counts by charge description, optionally for one borough and one year, from the NYPD Arrests Data (Historic) dataset. Aggregate counts only; no names, ages, demographics or arrest rows.",
        inputSchema: z.object({
            borough: z.enum(["BRONX", "BROOKLYN", "MANHATTAN", "QUEENS", "STATEN ISLAND"]).optional(),
            year: z.number().int().min(2001).max(2030).optional().describe("Arrest year; the dataset only covers 2001 onward."),
            limit: z.number().int().min(1).max(25).default(10),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement charge locally (paywall removed)
        try {
            return textError("Not yet implemented: charge");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "police-transparency-mcp";
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
    return server;
}
