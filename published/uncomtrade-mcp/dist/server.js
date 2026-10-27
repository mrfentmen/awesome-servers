import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { trade } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "uncomtrade-mcp", version: "1.0.0" });
    server.registerTool("trade", {
        title: "Trade",
        description: "Preview trade data.",
        inputSchema: z.object({ reporter: z.number().describe("Reporter code like 842."), period: z.string().describe("Period like 2023.").optional(), limit: z.number().describe("Max results.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await trade(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("reporter_lookup", {
        title: "Reporter lookup",
        description: "Resolve a country name, ISO code or number into the UN Comtrade reporter code the trade tool needs.",
        inputSchema: z.object({ country: z.string().describe("Country name, ISO code or reporter code, e.g. Japan, JP or 392."), limit: z.number().describe("Max matches.").optional() }),
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
    server.registerTool("commodity_code", {
        title: "Commodity code",
        description: "Look up UN Comtrade HS2022 commodity codes by prefix or name, so you can name a product before querying trade data.",
        inputSchema: z.object({ code: z.string().describe("HS code prefix, e.g. 0901.").optional(), search: z.string().describe("Search the description, e.g. coffee.").optional(), limit: z.number().describe("Max codes.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement code locally (paywall removed)
        try {
            return textError("Not yet implemented: code");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "uncomtrade-mcp";
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
