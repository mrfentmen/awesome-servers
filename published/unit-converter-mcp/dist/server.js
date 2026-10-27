import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { convert, listUnits } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "unit-converter-mcp", version: "1.0.0" });
    server.registerTool("convert", {
        title: "Convert",
        description: "Convert a value between units.",
        inputSchema: z.object({ value: z.number().describe("The value to convert."), from: z.string().describe("Source unit."), to: z.string().describe("Target unit.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await convert(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("list_units", {
        title: "List units",
        description: "List available units for a category.",
        inputSchema: z.object({ category: z.string().describe("length, weight, temperature, speed, or data.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await listUnits(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("convert_many", {
        title: "Convert many",
        description: "Convert a whole list of values with one unit pair in a single call, which saves a round trip per amount.",
        inputSchema: z.object({ values: z.array(z.number()).describe("Up to 100 numbers to convert."), from: z.string().describe("Source unit."), to: z.string().describe("Target unit."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement many locally (paywall removed)
        try {
            return textError("Not yet implemented: many");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "unit-converter-mcp";
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
