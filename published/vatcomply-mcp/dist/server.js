import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { country, rates } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "vatcomply-mcp", version: "1.0.0" });
    server.registerTool("rates", {
        title: "Rates",
        description: "Current VAT rates.",
        inputSchema: z.object({}),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await rates(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("country", {
        title: "Country",
        description: "VAT details for a country.",
        inputSchema: z.object({ code: z.string().describe("ISO country code like DE.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await country(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("validate_vat_number", {
        title: "Validate VAT number",
        description: "Check an EU VAT number against the European Commission VIES service and report validity plus the registered name and address VIES returns.",
        inputSchema: z.object({ country: z.string().describe("Two-letter EU country code like DE."), number: z.string().describe("VAT number digits, e.g. 129274202.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement number locally (paywall removed)
        try {
            return textError("Not yet implemented: number");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "vatcomply-mcp";
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
