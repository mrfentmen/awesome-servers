import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { analyze } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ssl-labs-mcp", version: "1.0.0" });
    server.registerTool("analyze", {
        title: "Analyze",
        description: "Grade a host with SSL Labs.",
        inputSchema: z.object({ host: z.string().describe("Host name.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await analyze(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("certificate_log", {
        title: "Certificate log",
        description: "Search the crt.sh Certificate Transparency log for the certificates issued for a domain: names covered, issuer and validity window.",
        inputSchema: z.object({ domain: z.string().describe("Domain like example.org."), limit: z.number().int().min(1).max(25).default(8).describe("Max certificates listed."), include_expired: z.boolean().default(false).describe("Include already expired certificates.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement log locally (paywall removed)
        try {
            return textError("Not yet implemented: log");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("caa_records", {
        title: "CAA records",
        description: "Look up the CAA DNS records that say which certificate authorities are allowed to issue for a domain.",
        inputSchema: z.object({ domain: z.string().describe("Domain like example.org.") }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement records locally (paywall removed)
        try {
            return textError("Not yet implemented: records");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ssl-labs-mcp";
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
