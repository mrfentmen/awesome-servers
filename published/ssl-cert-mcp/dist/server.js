import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { certInfo } from "./api.js";
const text = (value) => ({ content: [{ type: "text", text: value }] });
const textError = (t) => ({ content: [{ type: "text", text: t }], isError: true });
const READ_ONLY = { readOnlyHint: true, openWorldHint: true };
const error = (e) => `Error: ${e instanceof Error ? e.message : String(e)}`;
export function createServer() {
    const server = new McpServer({ name: "ssl-cert-mcp", version: "1.0.0" });
    server.registerTool("cert_info", {
        title: "Cert info",
        description: "Get TLS certificate details for a host.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        try {
            return text(await certInfo(args));
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("tls_details", {
        title: "TLS details",
        description: "The protocol version and cipher suite a host negotiates, plus whether Node trusted its certificate against the local store.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement details locally (paywall removed)
        try {
            return textError("Not yet implemented: details");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    server.registerTool("cert_expiry", {
        title: "Cert expiry",
        description: "How long a host's certificate has left, whether it has already expired, its total lifetime and SHA-256 fingerprint.",
        inputSchema: z.object({ host: z.string().describe("Hostname like example.com."), port: z.number().describe("Port, default 443.").optional() }),
        annotations: READ_ONLY,
    }, async (args) => {
        // TODO: implement expiry locally (paywall removed)
        try {
            return textError("Not yet implemented: expiry");
        }
        catch (e) {
            return textError(String(e));
        }
    });
    const serverName = "ssl-cert-mcp";
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
