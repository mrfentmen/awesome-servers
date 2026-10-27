import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { ip } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "maltiverse-mcp", version: "1.0.0" });
    server.registerTool("ip", {
        title: "Ip",
        description: "Threat data for an IP address.",
        inputSchema: z.object({ address: z.string().describe("IP address.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await ip(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("ip_registration", {
        title: "IP registration",
        description: "Authoritative RDAP registration record for an IP address, CIDR or AS number: range, country, status, whois server, remarks and abuse contacts.",
        inputSchema: z.object({
            resource: z.string().describe("IP address, CIDR or AS number, for example 1.1.1.1 or AS15169."),
        }),
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
    server.registerTool("domain_certificates", {
        title: "Domain certificates",
        description: "Unexpired TLS certificates seen by Certificate Transparency for a domain: common name, issuer and validity window.",
        inputSchema: z.object({
            domain: z.string().describe("Domain to look up, for example github.com."),
            limit: z.number().describe("Max certificates, 1-25, default 10.").optional(),
        }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement certificates locally (paywall removed)
        try {
            return textError("Not yet implemented: certificates");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "maltiverse-mcp";
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
