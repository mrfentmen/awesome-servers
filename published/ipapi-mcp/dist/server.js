import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { lookup } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ipapi-mcp", version: "1.0.0" });
    server.registerTool("lookup", {
        title: "Lookup",
        description: "Look up an IP address.",
        inputSchema: z.object({ ip: z.string().describe("IP address, defaults to caller.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await lookup(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("network_profile", {
        title: "Network profile",
        description: "Network intelligence for an IP: ISP, organisation, autonomous system, reverse DNS, timezone, currency and the mobile, proxy and hosting flags.",
        inputSchema: z.object({ ip: z.string().describe("IP address. Defaults to the caller's."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement profile locally (paywall removed)
        try {
            return textError("Not yet implemented: profile");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_registration", {
        title: "Ip registration",
        description: "Authoritative RDAP registration record for an IP, CIDR or AS number: range, country, status, whois server and the registrant and abuse contacts.",
        inputSchema: z.object({ ip: z.string().describe("IP address, CIDR or AS number, e.g. 1.1.1.1 or AS15169."), }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement registration locally (paywall removed)
        try {
            return textError("Not yet implemented: registration");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ipapi-mcp";
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
