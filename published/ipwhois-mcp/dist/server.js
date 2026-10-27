import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ipwhois-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Details for one IP address.",
        inputSchema: z.object({ ip: z.string().describe("IP address.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("rdap_lookup", {
        title: "RDAP lookup",
        description: "The authoritative registration record for an IP network straight from the regional registry, over RDAP: network name, handle, address range, registry whois server, events and registered entities.",
        inputSchema: z.object({ ip: z.string().describe("IPv4 or IPv6 address, e.g. 8.8.8.8.") }),
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
    const serverName = "ipwhois-mcp";
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
