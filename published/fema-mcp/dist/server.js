import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { declarations, declarationTotals } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "fema-mcp", version: "1.0.0" });
    server.registerTool("declarations", {
        title: "Declarations",
        description: "Disaster declarations for a state.",
        inputSchema: z.object({ state: z.string().describe("State code like CA."), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await declarations(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("declaration_lookup", {
        title: "Declaration lookup",
        description: "One disaster by its FEMA disaster number: the incident period, the programs declared, the region and every designated area under it. The declarations tool can only list a state's recent records.",
        inputSchema: z.object({ disaster_number: z.number().describe("The FEMA disaster number, like 5672.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement lookup locally (paywall removed)
        try {
            return textError("Not yet implemented: lookup");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("declaration_totals", {
        title: "Declaration totals",
        description: "How many disaster declaration records FEMA holds, for one fiscal year or for the whole dataset, with a breakdown of the incident and declaration types over the first hundred records.",
        inputSchema: z.object({ year: z.number().describe("Fiscal year to count, like 2026. Omit for the whole dataset.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await declarationTotals(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "fema-mcp";
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
